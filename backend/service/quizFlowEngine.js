// services/quizFlowEngine.js
//
// Drives the question lifecycle (open → lock → reveal → next) without
// waiting for admin clicks. Two triggers cause a step to fire:
//   1. The per-question timer expires (scheduled when a question opens).
//   2. Every eligible participant has submitted an answer before the
//      timer runs out (checked after each submitAnswer call).
// Manual admin actions (the existing PATCH endpoints) still work —
// they just also go through this module now, so a manual click and
// an auto-trigger can never both fire for the same question.

import { Op } from "sequelize";
import models from "../models/index.js";

const {
  QuizEvent, QuizParticipant, QuizQuestion, QuizRound,
  QuizRoundQuestion, QuizEventAnswer, QuizScore, QuizAuditEvent,
} = models;

// Tune these to taste — how long participants see "locked" before the
// answer reveals, and how long they see the reveal before the next
// question opens.
const REVEAL_DELAY_MS  = 4000;
const ADVANCE_DELAY_MS = 6000;

// One pending timeout per event at a time. Keyed by eventId so multiple
// concurrent events never interfere with each other's timers.
const timers = new Map();

const clearTimer = (eventId) => {
  const t = timers.get(eventId);
  if (t) { clearTimeout(t); timers.delete(eventId); }
};

const setTimer = (eventId, fn, delayMs) => {
  clearTimer(eventId);
  const t = setTimeout(() => { timers.delete(eventId); fn().catch(console.error); }, delayMs);
  timers.set(eventId, t);
};

// Stop all pending auto-advance for an event — call this from pause,
// void, or anywhere the normal flow is being manually interrupted.
export const cancelAutoFlow = (eventId) => clearTimer(Number(eventId));

const audit = async (eventId, userId, action, extras = {}) => {
  try {
    await QuizAuditEvent.create({ eventId, userId, action, ...extras });
  } catch (err) {
    console.error("audit() failed:", err);
  }
};

const broadcast = (io, eventId, type, payload) => {
  if (io) io.to(`event:${eventId}`).emit(type, payload);
};

const scoreAnswer = (selectedOption, correctAnswer, marks, negativeMarkValue, negativeMarking) => {
  if (!selectedOption) return { isCorrect: false, marksEarned: 0 };
  if (selectedOption === correctAnswer) return { isCorrect: true, marksEarned: Number(marks) };
  return { isCorrect: false, marksEarned: negativeMarking ? -Math.abs(Number(negativeMarkValue)) : 0 };
};

// ── OPEN NEXT QUESTION ──────────────────────────────────────────
// userId is null when triggered automatically (vs. an admin's id on
// a manual click) — audit rows record which happened.
export const openNextQuestion = async (io, eventId, userId = null) => {
  cancelAutoFlow(eventId);

  const event = await QuizEvent.findByPk(eventId);
  if (!event) return { ok: false, message: "Event not found" };

  const validStates = ["round1_intro","round1_result_revealed","round2_intro","round2_result_revealed","tiebreak_active"];
  if (!validStates.includes(event.status))
    return { ok: false, message: `Cannot open next question from state: ${event.status}` };

  const round = await QuizRound.findOne({ where: { eventId: event.id, roundNumber: event.activeRound } });
  const nextIdx = event.currentQuestionIdx || 0;
  const rq = await QuizRoundQuestion.findOne({
    where: { roundId: round.id, sequenceNumber: nextIdx + 1 },
    include: [{ model: QuizQuestion }],
  });
  if (!rq) return { ok: false, message: "No more questions in this round", noMoreQuestions: true };

  await QuizRoundQuestion.update(
    { status: "locked", lockedAt: new Date() },
    { where: { roundId: round.id, status: "open" } }
  );

  rq.status = "open";
  rq.openedAt = new Date();
  await rq.save();

  event.currentQuestionIdx = nextIdx + 1;
  event.status = event.activeRound === 1
    ? "round1_question_open"
    : (event.activeRound === 99 ? "tiebreak_active" : "round2_question_open");
  await event.save();

  await audit(event.id, userId, "question_opened", {
    relatedQuestionId: rq.questionId,
    relatedRoundId: round.id,
    description: `Q${nextIdx + 1} opened${userId ? "" : " (auto)"}`,
  });

  const { correctAnswer, ...safeQuestion } = rq.QuizQuestion.dataValues;
  broadcast(io, event.id, "quiz:question_open", {
    roundQuestionId: rq.id,
    sequenceNumber: rq.sequenceNumber,
    question: safeQuestion,
    timerSeconds: event.questionTimerSeconds,
    openedAt: rq.openedAt,
  });
  broadcast(io, event.id, "event:state_change", { status: event.status, activeRound: event.activeRound });

  // Schedule the auto-lock for whenever the timer runs out. If everyone
  // answers first, submitAnswer's checkEarlyLock cancels this and fires
  // lockQuestion immediately instead.
  setTimer(event.id, () => lockQuestion(io, event.id, null), event.questionTimerSeconds * 1000);

  return { ok: true, roundQuestion: rq };
};

// ── LOCK QUESTION ────────────────────────────────────────────────
export const lockQuestion = async (io, eventId, userId = null) => {
  cancelAutoFlow(eventId);

  const event = await QuizEvent.findByPk(eventId);
  if (!event) return { ok: false, message: "Event not found" };

  const round = await QuizRound.findOne({ where: { eventId: event.id, roundNumber: event.activeRound } });
  const rq = await QuizRoundQuestion.findOne({
    where: { roundId: round.id, status: "open" },
    include: [{ model: QuizQuestion }],
  });
  if (!rq) return { ok: false, message: "No open question to lock" };

  rq.status = "locked";
  rq.lockedAt = new Date();
  await rq.save();

  const participantWhere = { eventId: event.id };
  if (event.activeRound === 99) {
    participantWhere.id = { [Op.in]: round.tiebreakParticipants || [] };
  } else {
    participantWhere.status = { [Op.in]: ["active","qualified_round2","tiebreak"] };
  }
  const activeParticipants = await QuizParticipant.findAll({ where: participantWhere });

  for (const p of activeParticipants) {
    let answer = await QuizEventAnswer.findOne({ where: { participantId: p.id, roundQuestionId: rq.id } });
    if (!answer) {
      answer = await QuizEventAnswer.create({
        participantId: p.id, questionId: rq.questionId, roundQuestionId: rq.id, eventId: event.id,
        selectedOption: null, isCorrect: false, marksEarned: 0, lockedAt: new Date(), lockReason: "timer_expired",
      });
    } else {
      const scored = scoreAnswer(answer.selectedOption, rq.QuizQuestion.correctAnswer, rq.QuizQuestion.marks, event.negativeMarkValue, event.negativeMarking);
      answer.isCorrect = scored.isCorrect;
      answer.marksEarned = scored.marksEarned;
      answer.lockedAt = new Date();
      answer.lockReason = answer.submittedAt ? "submitted" : "timer_expired";
      await answer.save();
    }

    const [score] = await QuizScore.findOrCreate({
      where: { eventId: event.id, roundId: round.id, participantId: p.id },
      defaults: { totalMarks: 0, correctCount: 0, incorrectCount: 0, unansweredCount: 0 },
    });
    if (answer.isCorrect) {
      score.correctCount++;
      score.totalMarks = Number(score.totalMarks) + Number(answer.marksEarned);
    } else if (answer.selectedOption) {
      score.incorrectCount++;
      score.totalMarks = Number(score.totalMarks) + Number(answer.marksEarned);
    } else {
      score.unansweredCount++;
    }
    await score.save();
  }

  const stateMap = { 1: "round1_question_locked", 2: "round2_question_locked", 99: "tiebreak_active" };
  event.status = stateMap[event.activeRound] || "round1_question_locked";
  await event.save();

  await audit(event.id, userId, "question_locked", {
    relatedQuestionId: rq.questionId,
    description: `Q${rq.sequenceNumber} locked and scored${userId ? "" : " (auto)"}`,
  });

  broadcast(io, event.id, "quiz:question_locked", { roundQuestionId: rq.id });
  broadcast(io, event.id, "event:state_change", { status: event.status, activeRound: event.activeRound });

  // Auto-reveal shortly after lock — gives everyone a moment to see
  // "time's up" before the answer appears.
  setTimer(event.id, () => revealResult(io, event.id, null), REVEAL_DELAY_MS);

  return { ok: true };
};

// ── REVEAL RESULT ────────────────────────────────────────────────
export const revealResult = async (io, eventId, userId = null) => {
  cancelAutoFlow(eventId);

  const event = await QuizEvent.findByPk(eventId);
  if (!event) return { ok: false, message: "Event not found" };

  const round = await QuizRound.findOne({ where: { eventId: event.id, roundNumber: event.activeRound } });
  const rq = await QuizRoundQuestion.findOne({
    where: { roundId: round.id, status: "locked" },
    include: [{ model: QuizQuestion }],
    order: [["sequenceNumber","DESC"]],
  });
  if (!rq) return { ok: false, message: "No locked question to reveal" };

  rq.status = "revealed";
  rq.revealedAt = new Date();
  await rq.save();

  const stateMap = { 1: "round1_result_revealed", 2: "round2_result_revealed" };
  event.status = stateMap[event.activeRound] || "round1_result_revealed";
  await event.save();

  const scores = await QuizScore.findAll({
    where: { eventId: event.id, roundId: round.id },
    include: [{ model: QuizParticipant }],
    order: [["totalMarks","DESC"]],
  });

  await audit(event.id, userId, "result_revealed", {
    relatedQuestionId: rq.questionId,
    description: userId ? undefined : "(auto)",
  });

  broadcast(io, event.id, "quiz:result_revealed", {
    roundQuestionId: rq.id,
    correctAnswer: rq.QuizQuestion.correctAnswer,
    explanation: rq.QuizQuestion.explanation,
    scores,
  });
  broadcast(io, event.id, "event:state_change", { status: event.status, activeRound: event.activeRound });

  // Auto-advance to the next question. If there isn't one, this just
  // returns noMoreQuestions and the flow stops here — the admin picks
  // up with "Complete Round" / elimination review manually, since those
  // are judgment calls this engine shouldn't make on its own.
  setTimer(event.id, async () => {
    const res = await openNextQuestion(io, event.id, null);
    if (!res.ok && res.noMoreQuestions) {
      cancelAutoFlow(event.id); // nothing more to schedule — round is done
    }
  }, ADVANCE_DELAY_MS);

  return { ok: true, correctAnswer: rq.QuizQuestion.correctAnswer, explanation: rq.QuizQuestion.explanation, scores };
};

// ── EARLY LOCK CHECK ─────────────────────────────────────────────
// Called from submitAnswer after every save. If every eligible
// participant has now answered the currently open question, lock
// immediately instead of waiting out the timer.
export const checkEarlyLock = async (io, eventId, roundQuestionId) => {
  const rq = await QuizRoundQuestion.findByPk(roundQuestionId, {
    include: [{ model: QuizRound, attributes: ["id","eventId","roundNumber","tiebreakParticipants"] }],
  });
  if (!rq || rq.status !== "open") return;

  const event = await QuizEvent.findByPk(eventId);
  if (!event) return;

  const participantWhere = { eventId: Number(eventId) };
  if (rq.QuizRound.roundNumber === 99) {
    participantWhere.id = { [Op.in]: rq.QuizRound.tiebreakParticipants || [] };
  } else {
    participantWhere.status = { [Op.in]: ["active","qualified_round2","tiebreak"] };
  }
  const eligibleCount = await QuizParticipant.count({ where: participantWhere });
  if (eligibleCount === 0) return;

  const answeredCount = await QuizEventAnswer.count({
    where: { roundQuestionId, eventId: Number(eventId), submittedAt: { [Op.ne]: null } },
  });

  if (answeredCount >= eligibleCount) {
    await lockQuestion(io, Number(eventId), null);
  }
};

// ── RECOVER TIMERS ON SERVER STARTUP ─────────────────────────────
// Call this once, from server.js, right after initQuizSocket(io).
// Any question that was left "open" when the process died gets its
// remaining time recalculated from openedAt — if the timer had
// already fully elapsed while the server was down, it locks
// immediately instead of leaving the question stuck open forever.
export const recoverPendingTimers = async (io) => {
  const openEvents = await QuizEvent.findAll({
    where: {
      status: {
        [Op.in]: [
          "round1_question_open", "round2_question_open", "tiebreak_active",
          "round1_question_locked", "round2_question_locked",
          "round1_result_revealed", "round2_result_revealed",
        ],
      },
    },
  });

  for (const event of openEvents) {
    const round = await QuizRound.findOne({ where: { eventId: event.id, roundNumber: event.activeRound } });
    if (!round) continue;

    const openRq = await QuizRoundQuestion.findOne({ where: { roundId: round.id, status: "open" } });
    if (openRq) {
      const elapsedMs = Date.now() - new Date(openRq.openedAt).getTime();
      const remainingMs = (event.questionTimerSeconds * 1000) - elapsedMs;
      if (remainingMs <= 0) {
        await lockQuestion(io, event.id, null); // timer already ran out while server was down
      } else {
        setTimer(event.id, () => lockQuestion(io, event.id, null), remainingMs);
      }
      continue;
    }

    const lockedRq = await QuizRoundQuestion.findOne({ where: { roundId: round.id, status: "locked" } });
    if (lockedRq) {
      // Lost track of exactly how long it was sitting locked — reveal
      // promptly rather than leaving it stuck.
      setTimer(event.id, () => revealResult(io, event.id, null), 1000);
      continue;
    }

    const revealedRq = await QuizRoundQuestion.findOne({
      where: { roundId: round.id, status: "revealed" },
      order: [["sequenceNumber", "DESC"]],
    });
    if (revealedRq) {
      setTimer(event.id, async () => {
        const res = await openNextQuestion(io, event.id, null);
        if (!res.ok && res.noMoreQuestions) cancelAutoFlow(event.id);
      }, 1000);
    }
  }
};