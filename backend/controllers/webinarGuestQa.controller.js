// controllers/webinarGuestQa.controller.js
// Q&A for webinar GUESTS (people who registered with the public link and have no GIEVA account).
// They prove who they are with the private access key they received at registration, exactly like
// guest-status does, and only an ADMITTED guest may ask or vote.
// Imports use your "../service/" folder name (same as webinarGuests.controller.js).

import crypto from "crypto";
import { Op } from "sequelize";
import models from "../models/index.js";
import { broadcast } from "../service/liveRoomSignals.js";

const { ClassSession, WebinarRegistration, SessionQuestion } = models;

const hashKey = (key) => crypto.createHash("sha256").update(key).digest("hex");
const voterId = (guest) => `g${guest.id}`; // guests share the voters list with users as "g<id>"

// Returns { session, guest } or sends the error and returns null.
const authGuest = async (req, res) => {
  const session = await ClassSession.findByPk(req.params.id);
  if (!session?.isWebinar) { res.status(404).json({ message: "Webinar not found" }); return null; }
  if (["ended", "cancelled"].includes(session.status)) { res.status(410).json({ message: "This webinar has ended" }); return null; }

  const accessKey = String(req.body?.accessKey || "");
  if (!/^[a-f0-9]{64}$/i.test(accessKey)) { res.status(401).json({ message: "Invalid guest access key" }); return null; }

  const guest = await WebinarRegistration.findOne({ where: { classSessionId: session.id, accessKeyHash: hashKey(accessKey) } });
  if (!guest) { res.status(401).json({ message: "Registration not found" }); return null; }
  if (guest.status !== "admitted") { res.status(403).json({ message: "You can ask questions once the host has admitted you" }); return null; }
  return { session, guest };
};

const view = (q, guest) => ({
  id: q.id,
  text: q.text,
  status: q.status,
  answer: q.answer,
  asker: q.isAnonymous ? "Anonymous" : q.askerName || "Attendee",
  isMine: q.registrationId === guest.id,
  votes: (q.voters || []).length,
  voted: (q.voters || []).includes(voterId(guest)),
  createdAt: q.createdAt,
});

export const listGuestQuestions = async (req, res) => {
  try {
    const ctx = await authGuest(req, res);
    if (!ctx) return;
    const rows = await SessionQuestion.findAll({
      where: { classSessionId: ctx.session.id, status: { [Op.ne]: "dismissed" } },
      order: [["createdAt", "ASC"]],
    });
    const items = rows.map((q) => view(q, ctx.guest));
    items.sort((a, b) => b.votes - a.votes || new Date(a.createdAt) - new Date(b.createdAt));
    res.json({ questions: items, qaEnabled: ctx.session.qaEnabled !== false });
  } catch (err) {
    console.error("[webinar guest qa] list", err);
    res.status(500).json({ message: "Could not load questions" });
  }
};

export const askGuestQuestion = async (req, res) => {
  try {
    const ctx = await authGuest(req, res);
    if (!ctx) return;
    const { session, guest } = ctx;
    if (session.qaEnabled === false) return res.status(403).json({ message: "Q&A is turned off for this session" });

    const text = String(req.body.text || "").trim().slice(0, 600);
    if (text.length < 3) return res.status(400).json({ message: "Type your question" });

    const open = await SessionQuestion.count({ where: { classSessionId: session.id, registrationId: guest.id, status: "open" } });
    if (open >= 5) return res.status(429).json({ message: "You have 5 unanswered questions. Please wait for answers." });

    const q = await SessionQuestion.create({
      classSessionId: session.id, userId: null, registrationId: guest.id,
      askerName: guest.fullName, text, isAnonymous: !!req.body.anonymous, voters: [],
    });
    broadcast(session.roomName, "qa", { type: "changed" });
    res.status(201).json({ question: view(q, guest) });
  } catch (err) {
    console.error("[webinar guest qa] ask", err);
    res.status(500).json({ message: "Could not send your question" });
  }
};

export const voteGuestQuestion = async (req, res) => {
  try {
    const q = await SessionQuestion.findByPk(req.params.questionId);
    if (!q) return res.status(404).json({ message: "Question not found" });
    req.params.id = q.classSessionId; // authGuest checks the key against THIS question's webinar
    const ctx = await authGuest(req, res);
    if (!ctx) return;

    const voters = new Set(q.voters || []);
    const id = voterId(ctx.guest);
    if (voters.has(id)) voters.delete(id); else voters.add(id);
    await q.update({ voters: [...voters] });
    broadcast(ctx.session.roomName, "qa", { type: "changed" });
    res.json({ votes: voters.size, voted: voters.has(id) });
  } catch (err) {
    res.status(500).json({ message: "Could not vote" });
  }
};
