// controllers/sessionPoll.controller.js
// Live polls (in-meeting, with realtime results) and post-session surveys.
//
// Realtime: the server broadcasts small signals on the LiveKit data channel (topic "poll")
// so every client re-fetches instantly; clients also refresh on an interval as a fallback.

import { fn, col } from "sequelize";
import models from "../models/index.js";
import sendEmail from "../utils/sendMail.js";
import { broadcast } from "../services/liveRoomSignals.js";
import { loadSession, canManageSession, isAttendee } from "../services/sessionAccess.js";

const { SessionPoll, SessionPollResponse, SessionAttendance, User, Notification, ActivityLog } = models;

const QUESTION_TYPES = ["single", "multiple", "rating", "text"];
const MAX_QUESTIONS = { poll: 5, survey: 20 };

// ─────────────────────────────────────────────────────────────
// VALIDATION
// ─────────────────────────────────────────────────────────────
const normalizeQuestions = (kind, raw) => {
  if (!Array.isArray(raw) || raw.length === 0) return { error: "Add at least one question" };
  if (raw.length > MAX_QUESTIONS[kind]) {
    return { error: `A ${kind} can have at most ${MAX_QUESTIONS[kind]} questions` };
  }

  const questions = [];
  for (let i = 0; i < raw.length; i++) {
    const q = raw[i] || {};
    const text = String(q.text || "").trim().slice(0, 500);
    if (!text) return { error: `Question ${i + 1} needs text` };
    if (!QUESTION_TYPES.includes(q.type)) return { error: `Question ${i + 1} has an invalid type` };

    const out = { id: `q${i + 1}`, type: q.type, text, required: q.required !== false };

    if (q.type === "single" || q.type === "multiple") {
      const options = [
        ...new Set((q.options || []).map((o) => String(o).trim().slice(0, 200)).filter(Boolean)),
      ];
      if (options.length < 2 || options.length > 10) {
        return { error: `Question ${i + 1} needs between 2 and 10 options` };
      }
      out.options = options;
    }
    questions.push(out);
  }
  return { questions };
};

const validateAnswers = (questions, answers) => {
  if (!answers || typeof answers !== "object") return { error: "Answers are required" };

  const clean = {};
  for (const q of questions) {
    const v = answers[q.id];
    const empty = v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0);

    if (empty) {
      if (q.required) return { error: `Please answer: ${q.text}` };
      continue;
    }

    if (q.type === "single") {
      if (!q.options.includes(v)) return { error: `Invalid choice for: ${q.text}` };
      clean[q.id] = v;
    } else if (q.type === "multiple") {
      if (!Array.isArray(v) || !v.every((x) => q.options.includes(x))) {
        return { error: `Invalid choice for: ${q.text}` };
      }
      clean[q.id] = [...new Set(v)];
    } else if (q.type === "rating") {
      const n = Number(v);
      if (!Number.isInteger(n) || n < 1 || n > 5) return { error: `Rating must be 1 to 5: ${q.text}` };
      clean[q.id] = n;
    } else {
      clean[q.id] = String(v).trim().slice(0, 2000);
    }
  }
  return { answers: clean };
};

// ─────────────────────────────────────────────────────────────
// AGGREGATION
// ─────────────────────────────────────────────────────────────
const aggregate = (poll, responses) =>
  poll.questions.map((q) => {
    const answered = responses.map((r) => r.answers?.[q.id]).filter((v) => v !== undefined);
    const base = { id: q.id, type: q.type, text: q.text, answered: answered.length };

    if (q.type === "single" || q.type === "multiple") {
      const counts = new Map(q.options.map((o) => [o, 0]));
      answered.flat().forEach((v) => counts.has(v) && counts.set(v, counts.get(v) + 1));
      return { ...base, options: q.options.map((o) => ({ label: o, count: counts.get(o) })) };
    }

    if (q.type === "rating") {
      const distribution = [1, 2, 3, 4, 5].map((n) => ({
        label: String(n),
        count: answered.filter((v) => v === n).length,
      }));
      const average = answered.length
        ? +(answered.reduce((a, b) => a + b, 0) / answered.length).toFixed(2)
        : 0;
      return { ...base, distribution, average };
    }

    return { ...base, answers: answered.slice(-200) };
  });

const loadResults = async (poll) => {
  const responses = await SessionPollResponse.findAll({ where: { pollId: poll.id } });
  return { responseCount: responses.length, results: aggregate(poll, responses), responses };
};

const serialize = (poll, extra = {}, { manager = false } = {}) => ({
  id: poll.id,
  classSessionId: poll.classSessionId,
  kind: poll.kind,
  title: poll.title,
  questions: poll.questions,
  status: poll.status,
  isAnonymous: poll.isAnonymous,
  showResultsToParticipants: poll.showResultsToParticipants,
  ...(manager ? { autoSendOnEnd: poll.autoSendOnEnd } : {}),
  launchedAt: poll.launchedAt,
  closedAt: poll.closedAt,
  ...extra,
});

// ─────────────────────────────────────────────────────────────
// LAUNCH (shared by the endpoint, "launch now" on create, and auto-send on session end)
// ─────────────────────────────────────────────────────────────
const surveyLink = (poll) => `${process.env.FRONTEND_URL}/session-survey/${poll.id}`;

const notifySurvey = async (session, poll) => {
  const attendees = await SessionAttendance.findAll({
    where: { classSessionId: session.id, role: "student", wasPresent: true },
    include: [{ model: User, attributes: ["id", "fullName", "email"] }],
  });

  for (const a of attendees) {
    if (!a.User) continue;

    await Notification.create({
      userId: a.User.id,
      title: "Share your feedback",
      message: `Please complete a short survey for "${session.title}"`,
      type: "live_class",
      entityId: session.id,
      entityType: "class_session",
    }).catch(() => {});

    if (a.User.email) {
      await sendEmail(
        a.User.email,
        `Feedback requested: ${session.title}`,
        `<div style="font-family:sans-serif">
          <h2>How was the session?</h2>
          <p>Hello ${a.User.fullName || ""},</p>
          <p>Thanks for joining <strong>${session.title}</strong>. It takes about a minute to share your feedback.</p>
          <a href="${surveyLink(poll)}" style="display:inline-block;padding:12px 24px;background:#0B1F3A;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;">Open survey</a>
          <p>GIEVA Learning Team</p>
        </div>`
      ).catch(console.error);
    }
  }
};

const doLaunch = async (session, poll) => {
  if (poll.status === "live") return { error: "Already live", status: 400 };
  if (poll.status === "closed") return { error: "This has already been closed. Create a new one to run it again.", status: 400 };

  if (poll.kind === "poll") {
    const other = await SessionPoll.findOne({
      where: { classSessionId: session.id, kind: "poll", status: "live" },
    });
    if (other) return { error: "Close the poll that is currently live first", status: 409 };
  }

  await poll.update({ status: "live", launchedAt: new Date() });

  if (poll.kind === "poll") {
    await broadcast(session.roomName, "poll", { type: "launched", pollId: poll.id, title: poll.title });
  } else {
    notifySurvey(session, poll).catch(console.error); // don't make the host wait on emails
  }
  return { poll };
};

// Called when a session ends: launch every survey the host marked "send when the session ends".
export const sendPostSessionSurvey = async (session) => {
  const surveys = await SessionPoll.findAll({
    where: { classSessionId: session.id, kind: "survey", status: "draft", autoSendOnEnd: true },
  });
  for (const survey of surveys) {
    await doLaunch(session, survey).catch((err) => console.error("[survey] auto-send failed", err));
  }
};

// ─────────────────────────────────────────────────────────────
// HANDLERS
// ─────────────────────────────────────────────────────────────
export const createPoll = async (req, res) => {
  try {
    const session = await loadSession(req.params.sessionId);
    if (!session) return res.status(404).json({ message: "Session not found" });
    if (!canManageSession(req.user, session)) {
      return res.status(403).json({ message: "Only the host can create polls" });
    }

    const kind = req.body.kind === "survey" ? "survey" : "poll";
    const { questions, error } = normalizeQuestions(kind, req.body.questions);
    if (error) return res.status(400).json({ message: error });

    const title = String(req.body.title || "").trim().slice(0, 255) || (kind === "poll" ? "Quick poll" : "Session feedback");

    const poll = await SessionPoll.create({
      classSessionId: session.id,
      createdBy: req.user.id,
      kind,
      title,
      questions,
      isAnonymous: !!req.body.isAnonymous,
      showResultsToParticipants: req.body.showResultsToParticipants !== false,
      autoSendOnEnd: kind === "survey" && !!req.body.autoSendOnEnd,
    });

    await ActivityLog.create({
      userId: req.user.id,
      action: "SESSION_POLL_CREATED",
      meta: { sessionId: session.id, pollId: poll.id, kind },
    }).catch(() => {});

    if (req.body.launchNow) {
      const launched = await doLaunch(session, poll);
      if (launched.error) return res.status(launched.status).json({ message: launched.error });
    }

    res.status(201).json({ poll: serialize(poll, { responseCount: 0 }, { manager: true }) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create poll" });
  }
};

export const listPolls = async (req, res) => {
  try {
    const session = await loadSession(req.params.sessionId);
    if (!session) return res.status(404).json({ message: "Session not found" });

    const manager = canManageSession(req.user, session);
    if (!manager && !(await isAttendee(req.user.id, session.id))) {
      return res.status(403).json({ message: "You are not part of this session" });
    }

    const where = { classSessionId: session.id };
    if (!manager) where.status = ["live", "closed"];

    const polls = await SessionPoll.findAll({ where, order: [["createdAt", "DESC"]] });
    const ids = polls.map((p) => p.id);

    const mine = manager
      ? []
      : await SessionPollResponse.findAll({ where: { pollId: ids, userId: req.user.id }, attributes: ["pollId"] });
    const respondedIds = new Set(mine.map((m) => m.pollId));

    const out = [];
    for (const poll of polls) {
      const showResults =
        poll.status !== "draft" && (manager || (poll.status === "closed" && poll.showResultsToParticipants));

      if (showResults) {
        const { responseCount, results } = await loadResults(poll);
        out.push(serialize(poll, { responseCount, results, hasResponded: respondedIds.has(poll.id) }, { manager }));
      } else {
        out.push(serialize(poll, { hasResponded: respondedIds.has(poll.id) }, { manager }));
      }
    }

    res.json({ polls: out, canManage: manager });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load polls" });
  }
};

// Single poll/survey — used by the standalone survey page.
export const getPoll = async (req, res) => {
  try {
    const poll = await SessionPoll.findByPk(req.params.pollId);
    if (!poll) return res.status(404).json({ message: "Not found" });

    const session = await loadSession(poll.classSessionId);
    const manager = canManageSession(req.user, session);
    if (!manager && !(await isAttendee(req.user.id, session.id))) {
      return res.status(403).json({ message: "You are not part of this session" });
    }
    if (!manager && poll.status === "draft") return res.status(404).json({ message: "Not found" });

    const hasResponded = !!(await SessionPollResponse.findOne({
      where: { pollId: poll.id, userId: req.user.id },
      attributes: ["id"],
    }));

    const extra = { hasResponded, session: { id: session.id, title: session.title } };
    if (manager || (poll.status === "closed" && poll.showResultsToParticipants)) {
      const { responseCount, results } = await loadResults(poll);
      Object.assign(extra, { responseCount, results });
    }

    res.json({ poll: serialize(poll, extra, { manager }) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load" });
  }
};

export const launchPoll = async (req, res) => {
  try {
    const poll = await SessionPoll.findByPk(req.params.pollId);
    if (!poll) return res.status(404).json({ message: "Not found" });

    const session = await loadSession(poll.classSessionId);
    if (!canManageSession(req.user, session)) return res.status(403).json({ message: "Only the host can do this" });

    const result = await doLaunch(session, poll);
    if (result.error) return res.status(result.status).json({ message: result.error });

    res.json({ poll: serialize(poll, {}, { manager: true }) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to launch" });
  }
};

export const closePoll = async (req, res) => {
  try {
    const poll = await SessionPoll.findByPk(req.params.pollId);
    if (!poll) return res.status(404).json({ message: "Not found" });

    const session = await loadSession(poll.classSessionId);
    if (!canManageSession(req.user, session)) return res.status(403).json({ message: "Only the host can do this" });
    if (poll.status !== "live") return res.status(400).json({ message: "It is not live" });

    await poll.update({ status: "closed", closedAt: new Date() });
    await broadcast(session.roomName, "poll", { type: "closed", pollId: poll.id });

    res.json({ poll: serialize(poll, {}, { manager: true }) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to close" });
  }
};

export const respondToPoll = async (req, res) => {
  try {
    const poll = await SessionPoll.findByPk(req.params.pollId);
    if (!poll || poll.status !== "live") {
      return res.status(400).json({ message: "This is no longer open for responses" });
    }

    const session = await loadSession(poll.classSessionId);
    const manager = canManageSession(req.user, session);
    if (!manager && !(await isAttendee(req.user.id, session.id))) {
      return res.status(403).json({ message: "You are not part of this session" });
    }

    const { answers, error } = validateAnswers(poll.questions, req.body.answers);
    if (error) return res.status(400).json({ message: error });

    try {
      await SessionPollResponse.create({ pollId: poll.id, userId: req.user.id, answers });
    } catch (err) {
      if (err.name === "SequelizeUniqueConstraintError") {
        return res.status(409).json({ message: "You have already responded" });
      }
      throw err;
    }

    if (poll.kind === "poll") {
      const count = await SessionPollResponse.count({ where: { pollId: poll.id } });
      await broadcast(session.roomName, "poll", { type: "response", pollId: poll.id, count });
    }

    res.status(201).json({ message: "Response recorded" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to submit response" });
  }
};

export const getPollResults = async (req, res) => {
  try {
    const poll = await SessionPoll.findByPk(req.params.pollId);
    if (!poll) return res.status(404).json({ message: "Not found" });

    const session = await loadSession(poll.classSessionId);
    if (!canManageSession(req.user, session)) return res.status(403).json({ message: "Only the host can do this" });

    const { responseCount, results, responses } = await loadResults(poll);

    let respondents = null;
    if (!poll.isAnonymous) {
      const users = await User.findAll({
        where: { id: responses.map((r) => r.userId) },
        attributes: ["id", "fullName"],
      });
      const names = new Map(users.map((u) => [u.id, u.fullName]));
      respondents = responses.map((r) => ({
        userId: r.userId,
        fullName: names.get(r.userId) || "Unknown",
        submittedAt: r.createdAt,
      }));
    }

    res.json({ poll: serialize(poll, { responseCount, results, respondents }, { manager: true }) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load results" });
  }
};

// Spreadsheet apps run text starting with = + - @ as formulas. Neutralise it.
const csvCell = (v) => {
  let s = Array.isArray(v) ? v.join("; ") : v === undefined || v === null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};

export const exportPollCSV = async (req, res) => {
  try {
    const poll = await SessionPoll.findByPk(req.params.pollId);
    if (!poll) return res.status(404).json({ message: "Not found" });

    const session = await loadSession(poll.classSessionId);
    if (!canManageSession(req.user, session)) return res.status(403).json({ message: "Only the host can do this" });

    const responses = await SessionPollResponse.findAll({
      where: { pollId: poll.id },
      include: poll.isAnonymous ? [] : [{ model: User, attributes: ["fullName", "email"] }],
      order: [["createdAt", "ASC"]],
    });

    const headers = [
      ...(poll.isAnonymous ? [] : ["Name", "Email"]),
      "Submitted",
      ...poll.questions.map((q) => q.text),
    ];
    const rows = responses.map((r) => [
      ...(poll.isAnonymous ? [] : [r.User?.fullName, r.User?.email]),
      r.createdAt.toISOString(),
      ...poll.questions.map((q) => r.answers?.[q.id]),
    ]);

    const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
    const filename = `${poll.kind}-${poll.id}-results.csv`;

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to export" });
  }
};

export const deletePoll = async (req, res) => {
  try {
    const poll = await SessionPoll.findByPk(req.params.pollId);
    if (!poll) return res.status(404).json({ message: "Not found" });

    const session = await loadSession(poll.classSessionId);
    if (!canManageSession(req.user, session)) return res.status(403).json({ message: "Only the host can do this" });

    const wasLive = poll.status === "live";
    await SessionPollResponse.destroy({ where: { pollId: poll.id } });
    await poll.destroy();

    if (wasLive && poll.kind === "poll") {
      await broadcast(session.roomName, "poll", { type: "closed", pollId: poll.id });
    }
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete" });
  }
};
