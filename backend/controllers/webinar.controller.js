// controllers/webinar.controller.js
// Webinar mode: roles, promote/demote, raise hand, Q&A, live-stream.

import { Op } from "sequelize";
import models from "../models/index.js";
import {
  loadSession, sessionRoleOf, canManageSession, canHostSession, ADMIN_ROLES,
} from "../service/sessionAccess.js";
import { broadcast } from "../service/liveRoomSignals.js";
import { setPublishPermission, identityOf } from "../service/webinarPermissions.js";
import { validateRtmpUrls, startStream, stopStream, streamActive } from "../service/webinarStream.js";
import { SESSION_ROLES } from "../models/SessionRole.js";
import sendEmail from "../utils/sendMail.js";

const { SessionRole, SessionQuestion, User, ClassSession } = models;

const isAdmin = (u) => ADMIN_ROLES.includes(u.role);
const displayName = (u) =>
  u.fullName || u.name || [u.firstName, u.lastName].filter(Boolean).join(" ") || (u.email ? u.email.split("@")[0] : `User ${u.id}`);

// Pick whichever name columns your User model really has.
const NAME_COLS = ["fullName", "name", "firstName", "lastName"].filter((c) => User?.rawAttributes?.[c]);
const USER_ATTRS = ["id", "email", "role", ...NAME_COLS];

const load = async (req, res, check) => {
  const session = await loadSession(req.params.sessionId);
  if (!session) { res.status(404).json({ message: "Session not found" }); return null; }
  if (check && !check(req.user, session)) { res.status(403).json({ message: "You do not have permission to do this" }); return null; }
  return session;
};
const adminOnly = (u) => isAdmin(u);

// ── Public: the room needs to know whether it is a webinar, even for guests (no login) ──
export const getPublicWebinarInfo = async (req, res) => {
  try {
    const s = await ClassSession.findByPk(req.params.sessionId, { attributes: ["id", "isWebinar", "qaEnabled"] });
    if (!s) return res.status(404).json({ message: "Session not found" });
    res.json({ isWebinar: !!s.isWebinar, qaEnabled: s.qaEnabled !== false });
  } catch (err) {
    res.status(500).json({ message: "Could not load webinar info" });
  }
};

// ── Me: my role in this session ──
export const getMyWebinarRole = async (req, res) => {
  try {
    const session = await load(req, res);
    if (!session) return;
    const role = sessionRoleOf(req.user, session);
    res.json({
      isWebinar: !!session.isWebinar,
      qaEnabled: session.qaEnabled !== false,
      role,
      canManage: canManageSession(req.user, session),
      canHost: canHostSession(req.user, session),
      canSpeak: role !== "attendee" || !session.isWebinar,
    });
  } catch (err) {
    console.error("[webinar] me", err);
    res.status(500).json({ message: "Could not load your role" });
  }
};

// ── Settings: webinar on/off is admin-only; Q&A on/off is for hosts ──
export const updateWebinarSettings = async (req, res) => {
  try {
    const session = await load(req, res, canHostSession);
    if (!session) return;
    const patch = {};
    if (req.body.isWebinar !== undefined) {
      if (!isAdmin(req.user)) return res.status(403).json({ message: "Only an admin can turn webinar mode on or off" });
      patch.isWebinar = !!req.body.isWebinar;
    }
    if (req.body.qaEnabled !== undefined) patch.qaEnabled = !!req.body.qaEnabled;
    await session.update(patch);
    broadcast(session.roomName, "webinar", { type: "settings", ...patch });
    res.json({ message: "Saved", isWebinar: !!session.isWebinar, qaEnabled: session.qaEnabled !== false });
  } catch (err) {
    console.error("[webinar] settings", err);
    res.status(500).json({ message: "Could not save settings" });
  }
};

// ── Team (admin assigns) ──
export const listTeam = async (req, res) => {
  try {
    const session = await load(req, res, (u, s) => isAdmin(u) || canManageSession(u, s));
    if (!session) return;
    const rows = await SessionRole.findAll({ where: { classSessionId: session.id }, order: [["createdAt", "ASC"]] });
    const users = await User.findAll({ where: { id: rows.map((r) => r.userId) }, attributes: USER_ATTRS });
    const byId = new Map(users.map((u) => [u.id, u]));
    res.json({
      team: rows.map((r) => {
        const u = byId.get(r.userId);
        return { userId: r.userId, role: r.role, name: u ? displayName(u) : `User ${r.userId}`, email: u?.email || null };
      }),
    });
  } catch (err) {
    console.error("[webinar] team", err);
    res.status(500).json({ message: "Could not load the team" });
  }
};

export const searchUsers = async (req, res) => {
  try {
    // Only admins can search people for webinar assignments.
    if (!req.user || !ADMIN_ROLES.includes(req.user.role)) {
      return res.status(403).json({
        message: "Only admins can search webinar team members",
      });
    }

    const q = String(req.query.q || "").trim().slice(0, 60);

    if (q.length < 2) {
      return res.json({ users: [] });
    }

    const like = `%${q}%`;

    const users = await User.findAll({
      where: {
        [Op.or]: [
          { fullName: { [Op.like]: like } },
          { email: { [Op.like]: like } },
        ],
        // Exclude inactive accounts from team assignment.
        isActive: true,
      },
      attributes: ["id", "fullName", "email", "role"],
      order: [["fullName", "ASC"]],
      limit: 20,
    });

    return res.json({
      users: users.map((user) => ({
        id: user.id,
        name: user.fullName || user.email?.split("@")[0] || `User ${user.id}`,
        email: user.email,
        role: user.role,
      })),
    });
  } catch (err) {
    console.error("[webinar] searchUsers error:", err);

    return res.status(500).json({
      message: "Failed to search webinar team members",
    });
  }
};

export const assignTeamMember = async (req, res) => {
  try {
    const session = await load(req, res, adminOnly);
    if (!session) return;
    const userId = Number(req.body.userId);
    const role = String(req.body.role || "");
    if (!Number.isInteger(userId) || userId <= 0) return res.status(400).json({ message: "Pick a user" });
    if (!SESSION_ROLES.includes(role)) return res.status(400).json({ message: `Role must be one of: ${SESSION_ROLES.join(", ")}` });
    const user = await User.findByPk(userId, { attributes: USER_ATTRS });
    if (!user) return res.status(404).json({ message: "User not found" });

    // One designated host: assigning a new one moves the previous one to alt host.
    if (role === "host") {
      await SessionRole.update({ role: "alt_host" }, { where: { classSessionId: session.id, role: "host", userId: { [Op.ne]: userId } } });
    }
    const [row, created] = await SessionRole.findOrCreate({
      where: { classSessionId: session.id, userId }, defaults: { role, addedBy: req.user.id },
    });
    if (!created) await row.update({ role, addedBy: req.user.id });

    // Tell them (never blocks the assignment)
    if (user.email) {
      const label = { host: "Host", alt_host: "Alternative host", cohost: "Co-host", panelist: "Panelist" }[role];
      const title = session.title || session.topic || session.name || "a live session";
      sendEmail(
        user.email,
        `You are a ${label} for ${title}`,
        `<p>Hello ${displayName(user)},</p><p>You have been added as <b>${label}</b> for <b>${title}</b> on GIEVA.</p>` +
        `<p>Open your live classes at <a href="${process.env.FRONTEND_URL}">${process.env.FRONTEND_URL}</a> and join at the scheduled time.</p>`
      ).catch((e) => console.error("[webinar] role email failed:", e.message));
    }
    res.json({ message: `${displayName(user)} is now ${role}`, userId, role });
  } catch (err) {
    console.error("[webinar] assign", err);
    res.status(500).json({ message: "Could not assign the role" });
  }
};

export const removeTeamMember = async (req, res) => {
  try {
    const session = await load(req, res, adminOnly);
    if (!session) return;
    const n = await SessionRole.destroy({ where: { classSessionId: session.id, userId: Number(req.params.userId) } });
    res.json({ message: n ? "Removed" : "Not on the team" });
  } catch (err) {
    console.error("[webinar] remove", err);
    res.status(500).json({ message: "Could not remove" });
  }
};

// ── Promote / demote an attendee while live (host and alt host) ──
const changePanelist = (makePanelist) => async (req, res) => {
  try {
    const session = await load(req, res, canHostSession);
    if (!session) return;
    const userId = Number(req.params.userId);
    if (!Number.isInteger(userId) || userId <= 0) return res.status(400).json({ message: "Only signed-in participants can be promoted" });
    await setPublishPermission(session, userId, makePanelist, req.user.id);
    res.json({ message: makePanelist ? "Promoted to panelist" : "Moved back to attendees" });
  } catch (err) {
    console.error("[webinar] promote/demote", err);
    res.status(500).json({ message: "Could not change the role" });
  }
};
export const promoteToPanelist = changePanelist(true);
export const demoteToAttendee = changePanelist(false);

// ── Q&A ──
const view = (q, user, manager) => {
  const mine = q.userId === user.id;
  return {
    id: q.id,
    text: q.text,
    status: q.status,
    answer: q.answer,
    asker: q.isAnonymous && !manager ? "Anonymous" : q.askerName || "Attendee",
    isMine: mine,
    votes: (q.voters || []).length,
    voted: (q.voters || []).includes(user.id),
    createdAt: q.createdAt,
    ...(manager ? { userId: q.userId, anonymous: q.isAnonymous } : {}),
  };
};

export const listQuestions = async (req, res) => {
  try {
    const session = await load(req, res);
    if (!session) return;
    const manager = canManageSession(req.user, session);
    const rows = await SessionQuestion.findAll({
      where: { classSessionId: session.id, ...(manager ? {} : { status: { [Op.ne]: "dismissed" } }) },
      order: [["createdAt", "ASC"]],
    });
    const items = rows.map((q) => view(q, req.user, manager));
    items.sort((a, b) => b.votes - a.votes || new Date(a.createdAt) - new Date(b.createdAt));
    res.json({ questions: items, qaEnabled: session.qaEnabled !== false });
  } catch (err) {
    console.error("[webinar] qa list", err);
    res.status(500).json({ message: "Could not load questions" });
  }
};

export const askQuestion = async (req, res) => {
  try {
    const session = await load(req, res);
    if (!session) return;
    if (session.qaEnabled === false) return res.status(403).json({ message: "Q&A is turned off for this session" });
    const text = String(req.body.text || "").trim().slice(0, 600);
    if (text.length < 3) return res.status(400).json({ message: "Type your question" });

    const open = await SessionQuestion.count({ where: { classSessionId: session.id, userId: req.user.id, status: "open" } });
    if (open >= 5) return res.status(429).json({ message: "You have 5 unanswered questions. Please wait for answers." });

    const q = await SessionQuestion.create({
      classSessionId: session.id, userId: req.user.id, askerName: displayName(req.user),
      text, isAnonymous: !!req.body.anonymous, voters: [],
    });
    broadcast(session.roomName, "qa", { type: "changed" });
    res.status(201).json({ question: view(q, req.user, false) });
  } catch (err) {
    console.error("[webinar] ask", err);
    res.status(500).json({ message: "Could not send your question" });
  }
};

export const voteQuestion = async (req, res) => {
  try {
    const q = await SessionQuestion.findByPk(req.params.questionId);
    if (!q) return res.status(404).json({ message: "Question not found" });
    const session = await loadSession(q.classSessionId);
    const voters = new Set(q.voters || []);
    if (voters.has(req.user.id)) voters.delete(req.user.id); else voters.add(req.user.id);
    await q.update({ voters: [...voters] });
    broadcast(session.roomName, "qa", { type: "changed" });
    res.json({ votes: voters.size, voted: voters.has(req.user.id) });
  } catch (err) {
    res.status(500).json({ message: "Could not vote" });
  }
};

// Host / alt host / co-host: answer, mark live, dismiss, reopen
export const updateQuestion = async (req, res) => {
  try {
    const q = await SessionQuestion.findByPk(req.params.questionId);
    if (!q) return res.status(404).json({ message: "Question not found" });
    const session = await loadSession(q.classSessionId);
    if (!canManageSession(req.user, session)) return res.status(403).json({ message: "Only the hosting team can do this" });

    const patch = {};
    if (req.body.status !== undefined) {
      if (!["open", "live", "answered", "dismissed"].includes(req.body.status)) return res.status(400).json({ message: "Bad status" });
      patch.status = req.body.status;
    }
    if (req.body.answer !== undefined) {
      patch.answer = String(req.body.answer).trim().slice(0, 3000) || null;
      patch.answeredBy = req.user.id;
      if (patch.answer && !patch.status) patch.status = "answered";
    }
    await q.update(patch);
    broadcast(session.roomName, "qa", { type: "changed" });
    res.json({ question: view(q, req.user, true) });
  } catch (err) {
    console.error("[webinar] qa update", err);
    res.status(500).json({ message: "Could not update the question" });
  }
};

export const deleteQuestion = async (req, res) => {
  try {
    const q = await SessionQuestion.findByPk(req.params.questionId);
    if (!q) return res.status(404).json({ message: "Question not found" });
    const session = await loadSession(q.classSessionId);
    if (!canManageSession(req.user, session) && q.userId !== req.user.id) return res.status(403).json({ message: "Not allowed" });
    await q.destroy();
    broadcast(session.roomName, "qa", { type: "changed" });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: "Could not delete" });
  }
};

export const exportQuestionsCsv = async (req, res) => {
  try {
    const session = await load(req, res, canManageSession);
    if (!session) return;
    const rows = await SessionQuestion.findAll({ where: { classSessionId: session.id }, order: [["createdAt", "ASC"]] });
    const cell = (v) => {
      let s = String(v ?? "");
      if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; // spreadsheet formula injection
      return `"${s.replace(/"/g, '""')}"`;
    };
    const lines = [["Asked at", "Asker", "Question", "Status", "Upvotes", "Answer"].map(cell).join(",")];
    rows.forEach((q) => lines.push([q.createdAt.toISOString(), q.askerName, q.text, q.status, (q.voters || []).length, q.answer].map(cell).join(",")));
    res.set({ "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="webinar-qa-${session.id}.csv"` });
    res.send(`﻿${lines.join("\r\n")}`);
  } catch (err) {
    res.status(500).json({ message: "Export failed" });
  }
};

// ── Live-stream out (host and alt host) ──
export const startLiveStream = async (req, res) => {
  try {
    const session = await load(req, res, canHostSession);
    if (!session) return;
    const v = validateRtmpUrls(req.body.urls);
    if (v.error) return res.status(400).json({ message: v.error });
    const r = await startStream(session.roomName, v.urls);
    if (r.error) return res.status(409).json({ message: r.error });
    broadcast(session.roomName, "webinar", { type: "stream", live: true });
    res.json({ message: "Live stream started" });
  } catch (err) {
    console.error("[webinar] stream start:", err.message);
    res.status(502).json({ message: "Could not start the stream. Check the URL/key and that the room is live." });
  }
};

export const stopLiveStream = async (req, res) => {
  try {
    const session = await load(req, res, canHostSession);
    if (!session) return;
    const n = await stopStream(session.roomName);
    broadcast(session.roomName, "webinar", { type: "stream", live: false });
    res.json({ message: n ? "Live stream stopped" : "No stream was running" });
  } catch (err) {
    console.error("[webinar] stream stop:", err.message);
    res.status(502).json({ message: "Could not stop the stream" });
  }
};

export const liveStreamStatus = async (req, res) => {
  try {
    const session = await load(req, res, canManageSession);
    if (!session) return;
    res.json({ live: await streamActive(session.roomName) });
  } catch (err) {
    res.json({ live: false });
  }
};
