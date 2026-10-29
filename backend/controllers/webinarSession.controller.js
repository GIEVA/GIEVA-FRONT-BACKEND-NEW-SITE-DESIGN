// controllers/webinarSession.controller.js
// Webinar as a third session type (course · public · webinar): schedule, list, join, end.
//
// A webinar is a ClassSession with isWebinar = true and a room named "webinar-<random>".
// It has no course and no waiting room. Everyone joins with a LiveKit token whose permissions
// match their role, so attendees physically cannot publish audio or video.

import crypto from "crypto";
import { Op } from "sequelize";
import { AccessToken, RoomServiceClient } from "livekit-server-sdk";
import models from "../models/index.js";
import { loadSession, sessionRoleOf, canHostSession, ADMIN_ROLES } from "../services/sessionAccess.js";
import { webinarGrantFor, identityOf } from "../service/webinarPermissions.js";
import { onHostJoined, onSessionEnded } from "../service/sessionLifecycle.js";
import { broadcast } from "../service/liveRoomSignals.js";
import { stopStream } from "../service/webinarStream.js";
import sendEmail from "../utils/sendMail.js";

const { ClassSession, SessionRole, User } = models;

const isAdmin = (u) => ADMIN_ROLES.includes(u.role);
const NAME_COLS = ["fullName", "name", "firstName", "lastName"].filter((c) => User?.rawAttributes?.[c]);
const PIC_COL = ["profilePicUrl", "profilePicture", "avatar"].find((c) => User?.rawAttributes?.[c]);
const USER_ATTRS = ["id", "email", "role", ...NAME_COLS, ...(PIC_COL ? [PIC_COL] : [])];
const nameOf = (u) => u.fullName || u.name || [u.firstName, u.lastName].filter(Boolean).join(" ") || (u.email ? u.email.split("@")[0] : `User ${u.id}`);

const TEAM_LABEL = { host: "Host", alt_host: "Alternative host", cohost: "Co-host", panelist: "Panelist" };
const ids = (v) => [...new Set((Array.isArray(v) ? v : []).map(Number).filter((n) => Number.isInteger(n) && n > 0))];

let svc;
const rooms = () => {
  if (!svc) svc = new RoomServiceClient(process.env.LIVEKIT_URL, process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET);
  return svc;
};

// Only set columns your ClassSession model really has, and say clearly when a required one is missing.
const buildPayload = (candidate) => {
  const attrs = ClassSession.rawAttributes;
  const payload = {};
  for (const [k, v] of Object.entries(candidate)) if (attrs[k] && v !== undefined) payload[k] = v;
  const missing = Object.entries(attrs)
    .filter(([k, a]) => a.allowNull === false && a.defaultValue === undefined && !a.primaryKey && !a.autoIncrement && payload[k] === undefined &&
      !["createdAt", "updatedAt"].includes(k))
    .map(([k]) => k);
  return { payload, missing };
};

const serialize = async (s, withTeam = true) => {
  const out = {
    id: s.id, title: s.title, description: s.description, roomName: s.roomName, status: s.status,
    scheduledAt: s.scheduledAt, durationMinutes: s.durationMinutes, capacity: s.webinarCapacity,
    qaEnabled: s.qaEnabled !== false, recordingEnabled: s.recordingEnabled !== false, isWebinar: true,
  };
  if (withTeam) {
    const rows = await SessionRole.findAll({ where: { classSessionId: s.id } });
    const users = await User.findAll({ where: { id: rows.map((r) => r.userId) }, attributes: USER_ATTRS });
    const by = new Map(users.map((u) => [u.id, u]));
    out.team = rows.map((r) => ({ userId: r.userId, role: r.role, name: by.get(r.userId) ? nameOf(by.get(r.userId)) : `User ${r.userId}` }));
  }
  return out;
};

// ── ADMIN: schedule a webinar ──
export const createWebinar = async (req, res) => {
  try {
    if (!isAdmin(req.user)) return res.status(403).json({ message: "Only admins can schedule webinars" });
    const b = req.body || {};
    const title = String(b.title || "").trim().slice(0, 255);
    const when = new Date(b.scheduledAt);
    const hostUserId = Number(b.hostUserId);
    if (title.length < 3) return res.status(400).json({ message: "Enter a webinar title" });
    if (Number.isNaN(when.getTime())) return res.status(400).json({ message: "Pick a date and time" });
    if (when.getTime() < Date.now() - 5 * 60 * 1000) return res.status(400).json({ message: "The date and time must be in the future" });
    if (!Number.isInteger(hostUserId) || hostUserId <= 0) return res.status(400).json({ message: "Choose the webinar host" });
    const duration = Math.min(Math.max(parseInt(b.durationMinutes, 10) || 60, 15), 480);
    const capacity = Math.min(Math.max(parseInt(b.capacity, 10) || 500, 10), 5000);

    // Team: one host, optional alt hosts, co-hosts and panelists. A person gets one role (highest wins).
    const order = ["host", "alt_host", "cohost", "panelist"];
    const wanted = new Map();
    const put = (userId, role) => {
      const cur = wanted.get(userId);
      if (!cur || order.indexOf(role) < order.indexOf(cur)) wanted.set(userId, role);
    };
    put(hostUserId, "host");
    ids(b.altHostIds).forEach((i) => put(i, "alt_host"));
    ids(b.cohostIds).forEach((i) => put(i, "cohost"));
    ids(b.panelistIds).forEach((i) => put(i, "panelist"));

    const users = await User.findAll({ where: { id: [...wanted.keys()] }, attributes: USER_ATTRS });
    if (users.length !== wanted.size) return res.status(400).json({ message: "One of the selected people no longer exists" });

    const roomName = `webinar-${crypto.randomBytes(6).toString("hex")}`;
    const { payload, missing } = buildPayload({
      title, description: String(b.description || "").slice(0, 4000) || null,
      roomName, scheduledAt: when, durationMinutes: duration, status: "scheduled",
      scheduledBy: hostUserId, isWebinar: true, qaEnabled: b.qaEnabled !== false,
      recordingEnabled: b.recordingEnabled !== false, webinarCapacity: capacity,
      visibility: "public",
    });
    if (missing.length) {
      return res.status(500).json({
        message: `Your ClassSession model requires ${missing.join(", ")}. Send me the model so I can fill these for webinars.`,
      });
    }

    const session = await ClassSession.create(payload);
    await SessionRole.bulkCreate([...wanted].map(([userId, role]) => ({ classSessionId: session.id, userId, role, addedBy: req.user.id })));

    // Tell the team (never blocks scheduling)
    const link = `${process.env.FRONTEND_URL}/webinar/${session.id}`;
    for (const u of users) {
      if (!u.email) continue;
      sendEmail(
        u.email, `You are the ${TEAM_LABEL[wanted.get(u.id)]} for: ${title}`,
        `<p>Hello ${nameOf(u)},</p><p>You have been added as <b>${TEAM_LABEL[wanted.get(u.id)]}</b> for the webinar <b>${title}</b>.</p>` +
        `<p>When: <b>${when.toUTCString()}</b> (${duration} minutes)</p><p><a href="${link}">Open the webinar page</a></p>`
      ).catch((e) => console.error("[webinar] team email failed:", e.message));
    }
    res.status(201).json({ message: "Webinar scheduled", webinar: await serialize(session), link });
  } catch (err) {
    console.error("[webinar] create", err);
    res.status(500).json({ message: "Could not schedule the webinar" });
  }
};

// ── ADMIN: edit details (team is edited through /sessions/:id/team) ──
export const updateWebinar = async (req, res) => {
  try {
    if (!isAdmin(req.user)) return res.status(403).json({ message: "Only admins can edit webinars" });
    const s = await ClassSession.findOne({ where: { id: req.params.id, isWebinar: true } });
    if (!s) return res.status(404).json({ message: "Webinar not found" });
    if (["live", "ended"].includes(s.status)) return res.status(400).json({ message: "A live or finished webinar cannot be edited" });
    const b = req.body || {};
    const patch = {};
    if (b.title !== undefined) patch.title = String(b.title).trim().slice(0, 255);
    if (b.description !== undefined) patch.description = String(b.description).slice(0, 4000) || null;
    if (b.scheduledAt !== undefined) {
      const d = new Date(b.scheduledAt);
      if (Number.isNaN(d.getTime())) return res.status(400).json({ message: "Bad date" });
      patch.scheduledAt = d;
    }
    if (b.durationMinutes !== undefined) patch.durationMinutes = Math.min(Math.max(parseInt(b.durationMinutes, 10) || 60, 15), 480);
    if (b.capacity !== undefined) patch.webinarCapacity = Math.min(Math.max(parseInt(b.capacity, 10) || 500, 10), 5000);
    if (b.qaEnabled !== undefined) patch.qaEnabled = !!b.qaEnabled;
    if (b.recordingEnabled !== undefined) patch.recordingEnabled = !!b.recordingEnabled;
    await s.update(patch);
    res.json({ message: "Saved", webinar: await serialize(s) });
  } catch (err) {
    console.error("[webinar] update", err);
    res.status(500).json({ message: "Could not save" });
  }
};

export const cancelWebinar = async (req, res) => {
  try {
    if (!isAdmin(req.user)) return res.status(403).json({ message: "Only admins can cancel webinars" });
    const s = await ClassSession.findOne({ where: { id: req.params.id, isWebinar: true } });
    if (!s) return res.status(404).json({ message: "Webinar not found" });
    if (s.status === "live") return res.status(400).json({ message: "End the live webinar first" });
    await s.update({ status: "cancelled" });
    res.json({ message: "Webinar cancelled" });
  } catch (err) {
    res.status(500).json({ message: "Could not cancel" });
  }
};

// ── Lists ──
// admins: every webinar · team members: the ones they run · everyone else: upcoming and live
export const listWebinars = async (req, res) => {
  try {
    const scope = req.query.scope === "all" && isAdmin(req.user) ? "all" : req.query.scope === "mine" ? "mine" : "upcoming";
    const where = { isWebinar: true };
    if (scope === "upcoming") {
      where.status = { [Op.in]: ["scheduled", "live"] };
      where.scheduledAt = { [Op.gte]: new Date(Date.now() - 6 * 3600 * 1000) };
    }
    if (scope === "mine") {
      const mine = await SessionRole.findAll({ where: { userId: req.user.id }, attributes: ["classSessionId"] });
      where.id = mine.map((r) => r.classSessionId);
    }
    const rows = await ClassSession.findAll({ where, order: [["scheduledAt", scope === "all" ? "DESC" : "ASC"]], limit: 100 });
    const webinars = [];
    for (const s of rows) webinars.push({ ...(await serialize(s, scope !== "upcoming")), myRole: undefined });
    res.json({ webinars });
  } catch (err) {
    console.error("[webinar] list", err);
    res.status(500).json({ message: "Could not load webinars" });
  }
};

export const getWebinar = async (req, res) => {
  try {
    const s = await loadSession(req.params.id);
    if (!s || !s.isWebinar) return res.status(404).json({ message: "Webinar not found" });
    const role = sessionRoleOf(req.user, s);
    res.json({ webinar: await serialize(s, true), myRole: role, canHost: canHostSession(req.user, s) });
  } catch (err) {
    res.status(500).json({ message: "Could not load the webinar" });
  }
};

// ── Join: mints a LiveKit token whose permissions match the person's role ──
export const joinWebinar = async (req, res) => {
  try {
    const s = await loadSession(req.params.id);
    if (!s || !s.isWebinar) return res.status(404).json({ message: "Webinar not found" });
    if (s.status === "cancelled") return res.status(410).json({ message: "This webinar was cancelled" });
    if (s.status === "ended") return res.status(410).json({ message: "This webinar has ended" });

    const role = sessionRoleOf(req.user, s);
    const isTeam = role !== "attendee";
    const runsIt = ["host", "alt_host", "cohost"].includes(role);

    let participants = [];
    try { participants = await rooms().listParticipants(s.roomName); } catch { /* room does not exist yet */ }

    if (!isTeam) {
      const teamHere = participants.some((p) => /^user-\d+$/.test(p.identity) && (p.permissions?.canPublish));
      if (!teamHere && s.status !== "live") {
        return res.status(425).json({ message: "The webinar has not started yet. Please wait for the host.", code: "NOT_STARTED" });
      }
      if (participants.length >= (s.webinarCapacity || 500)) {
        return res.status(429).json({ message: "This webinar is full.", code: "FULL" });
      }
    }

    const user = await User.findByPk(req.user.id, { attributes: USER_ATTRS });
    const fullName = user ? nameOf(user) : `User ${req.user.id}`;
    const profilePicUrl = (PIC_COL && user?.[PIC_COL]) || null;

    const at = new AccessToken(process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET, {
      identity: identityOf(req.user.id),
      name: fullName,
      ttl: "6h",
      // The room reads { role, fullName, profilePicUrl } from participant metadata.
      metadata: JSON.stringify({ role: runsIt ? "host" : "student", webinarRole: role, fullName, profilePicUrl }),
    });
    at.addGrant({ room: s.roomName, roomJoin: true, ...webinarGrantFor(role) });
    const token = await at.toJwt();

    // The team starting the webinar flips it live and starts auto-recording.
    if (runsIt && s.status !== "live") {
      await s.update({ status: "live" });
      onHostJoined(s).catch((e) => console.error("[webinar] auto-record:", e.message));
    }

    res.json({
      token, serverUrl: process.env.LIVEKIT_URL, phase: "live",
      currentUser: { id: req.user.id, fullName, profilePicUrl },
      webinarRole: role, qaEnabled: s.qaEnabled !== false,
    });
  } catch (err) {
    console.error("[webinar] join", err);
    res.status(500).json({ message: "Could not join the webinar" });
  }
};

// ── Host / alt host: end for everyone ──
export const endWebinar = async (req, res) => {
  try {
    const s = await loadSession(req.params.id);
    if (!s || !s.isWebinar) return res.status(404).json({ message: "Webinar not found" });
    if (!canHostSession(req.user, s)) return res.status(403).json({ message: "Only the host can end the webinar" });
    await broadcast(s.roomName, "webinar", { type: "ended" });
    await stopStream(s.roomName).catch(() => {});
    await s.update({ status: "ended" });
    await onSessionEnded(s);
    await rooms().deleteRoom(s.roomName).catch(() => {});
    res.json({ message: "Webinar ended" });
  } catch (err) {
    console.error("[webinar] end", err);
    res.status(500).json({ message: "Could not end the webinar" });
  }
};
