// controllers/quizEventController.js
//
// Admin-facing: create/edit event, manage questions, control rounds,
// handle elimination, tiebreak, scoring, audit, export.
import sequelize from "../config/db.js";
import { Op }  from "sequelize";
import models  from "../models/index.js";
import { nanoid } from "nanoid";
import { openNextQuestion as engineOpenNext, lockQuestion as engineLock, revealResult as engineReveal, cancelAutoFlow } from "../service/quizFlowEngine.js";



const {
  QuizEvent, QuizParticipant, QuizQuestion, QuizRound,
  QuizRoundQuestion, QuizEventAnswer, QuizScore, QuizPanelist,
  QuizAuditEvent, TechnicalIncident, User,
} = models;

const ADMIN_ROLES = ["admin", "superadmin", "operational_admin"];
const isAdmin = (u) => u && ADMIN_ROLES.includes(u.role);

// ── Helpers ────────────────────────────────────────────────────

const audit = async (eventId, userId, action, extras = {}) => {
  try {
    await QuizAuditEvent.create({ eventId, userId, action, ...extras });
  } catch (err) {
    console.error("audit() failed:", err);
  }
};

// Broadcast current event state to all connected sockets in the event room.
// Called after every state change. The socket.io instance is attached to
// req.app in server.js: const io = require("./socket").getIo();
const broadcast = (req, eventId, type, payload) => {
  try {
    const io = req.app.get("io");
    if (io) io.to(`event:${eventId}`).emit(type, payload);
  } catch { /* socket not available in test env */ }
};

// Score a single answer server-side
const scoreAnswer = (selectedOption, correctAnswer, marks, negativeMarkValue, negativeMarking) => {
  if (!selectedOption) return { isCorrect: false, marksEarned: 0 };
  if (selectedOption === correctAnswer) return { isCorrect: true, marksEarned: Number(marks) };
  return {
    isCorrect:   false,
    marksEarned: negativeMarking ? -Math.abs(Number(negativeMarkValue)) : 0,
  };
};

// Rebuild QuizScore rows for a round from scratch, based on the
// current set of non-voided QuizAnswer rows. Call this any time
// historical answers change after scores were first computed —
// e.g. after voiding a question — so totals never drift from reality.
const recalculateScores = async (eventId, roundId) => {
  const round = await QuizRound.findByPk(roundId);
  if (!round) return;

  // Eligible participant set differs for tiebreak rounds (roundNumber 99),
  // which only ever cover the tied subset, not every active participant.
  const participantWhere = { eventId };
  if (round.roundNumber === 99) {
    participantWhere.id = { [Op.in]: round.tiebreakParticipants || [] };
  } else {
    participantWhere.status = {
      [Op.in]: ["active", "qualified_round2", "tiebreak", "completed"],
    };
  }
  const participants = await QuizParticipant.findAll({ where: participantWhere });

  // Only count answers against round questions that haven't been voided.
  const roundQuestionIds = (
    await QuizRoundQuestion.findAll({
      where: { roundId, status: { [Op.ne]: "voided" } },
      attributes: ["id"],
    })
  ).map((rq) => rq.id);

  for (const p of participants) {
    const answers = roundQuestionIds.length
      ? await QuizEventAnswer.findAll({
          where: { participantId: p.id, roundQuestionId: { [Op.in]: roundQuestionIds } },
        })
      : [];

    let totalMarks = 0, correctCount = 0, incorrectCount = 0, unansweredCount = 0;
    for (const a of answers) {
      totalMarks += Number(a.marksEarned) || 0;
      if (a.isCorrect)          correctCount++;
      else if (a.selectedOption) incorrectCount++;
      else                        unansweredCount++;
    }

    const [score] = await QuizScore.findOrCreate({
      where:    { eventId, roundId, participantId: p.id },
      defaults: { totalMarks: 0, correctCount: 0, incorrectCount: 0, unansweredCount: 0 },
    });

    // Don't silently clobber a manual adjustment — flag it instead so an
    // admin re-reviews rather than losing the override without knowing.
    if (score.adjustmentNote) {
      console.warn(
        `[recalculateScores] participant ${p.id} in round ${roundId} has a manual ` +
        `adjustment ("${score.adjustmentNote}") — skipping auto-recalc for this row.`
      );
      continue;
    }

    score.totalMarks      = totalMarks;
    score.correctCount    = correctCount;
    score.incorrectCount  = incorrectCount;
    score.unansweredCount = unansweredCount;
    await score.save();
  }
};

// ======================================================
// CREATE EVENT
// POST /api/quiz/events
// ======================================================
export const createEvent = async (req, res) => {
  try {
    if (!isAdmin(req.user)) return res.status(403).json({ message: "Unauthorized" });

    const {
      name, description, venue, eventDate, startTime, category,
      round1ParticipantLimit, round1QuestionCount,
      round2ParticipantLimit, round2QuestionCount,
      questionsPerSubject, eliminateAfterRound1,
      marksPerCorrect, negativeMarking, negativeMarkValue,
      questionTimerSeconds, immediateFeedback,
      finalScoreRule, round2Weight,
      tiebreakSubject, tiebreakQuestionCount,
      subjectOrder, audienceScreenMode,
    } = req.body;

    if (!name?.trim()) return res.status(400).json({ message: "Event name is required." });

    const eventCode = nanoid(8).toUpperCase();

    const event = await QuizEvent.create({
      name: name.trim(),
      description, venue, eventDate, startTime,
      category:              category              || "SS2_SS3",
      round1ParticipantLimit:round1ParticipantLimit|| 10,
      round1QuestionCount:   round1QuestionCount   || 12,
      round2ParticipantLimit:round2ParticipantLimit|| 5,
      round2QuestionCount:   round2QuestionCount   || 12,
      questionsPerSubject:   questionsPerSubject   || 3,
      eliminateAfterRound1:  eliminateAfterRound1  || 5,
      marksPerCorrect:       marksPerCorrect       || 1,
      negativeMarking:       negativeMarking       || false,
      negativeMarkValue:     negativeMarkValue      || 0,
      questionTimerSeconds:  questionTimerSeconds  || 60,
      immediateFeedback:     immediateFeedback !== false,
      finalScoreRule:        finalScoreRule        || "sum",
      round2Weight:          round2Weight          || 1,
      tiebreakSubject:       tiebreakSubject       || null,
      tiebreakQuestionCount: tiebreakQuestionCount || 10,
      subjectOrder:          subjectOrder          || ["Biology","Physics","Chemistry","Mathematics"],
      audienceScreenMode:    audienceScreenMode    || "public",
      eventCode,
      participantLink: `${process.env.FRONTEND_URL}/quiz/join/${eventCode}`,
      audienceLink:    `${process.env.FRONTEND_URL}/quiz/audience/${eventCode}`,
      panelistLink:    `${process.env.FRONTEND_URL}/quiz/panel/${eventCode}`,
      status:    "draft",
      createdBy: req.user.id,
    });

    // Create Round 1 and Round 2 placeholders
    await QuizRound.bulkCreate([
      { eventId: event.id, roundNumber: 1, label: "Round One",
        participantLimit: event.round1ParticipantLimit,
        questionCount:    event.round1QuestionCount },
      { eventId: event.id, roundNumber: 2, label: "Round Two",
        participantLimit: event.round2ParticipantLimit,
        questionCount:    event.round2QuestionCount },
    ]);

    await audit(event.id, req.user.id, "event_created", { description: `Event "${name}" created` });

    res.status(201).json({ message: "Event created", event });
  } catch (err) {
    console.error("createEvent:", err);
    res.status(500).json({ message: "Failed to create event" });
  }
};

// ======================================================
// LIST / GET EVENTS
// ======================================================
export const listEvents = async (req, res) => {
  try {
    if (!isAdmin(req.user)) return res.status(403).json({ message: "Unauthorized" });
    const events = await QuizEvent.findAll({
      include: [{ model: User, as: "creator", attributes: ["id","fullName"] }],
      order: [["createdAt","DESC"]],
    });
    res.json({ events });
  } catch (err) { res.status(500).json({ message: "Failed to fetch events" }); }
};

export const getEvent = async (req, res) => {
  try {
    const event = await QuizEvent.findByPk(req.params.id, {
      include: [
        { model: QuizRound, as: "rounds",
          include: [{ model: QuizRoundQuestion, as: "roundQuestions",
                      include: [{ model: QuizQuestion }] }] },
        { model: QuizParticipant, as: "participants" },
        { model: QuizPanelist,    as: "panelists",
          include: [{ model: User, attributes: ["id","fullName","email"] }] },
        { model: QuizQuestion, as: "questions" },
      ],
    });
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.json({ event });
  } catch (err) { res.status(500).json({ message: "Failed to fetch event" }); }
};

export const updateEvent = async (req, res) => {
  try {
    if (!isAdmin(req.user)) return res.status(403).json({ message: "Unauthorized" });
    const event = await QuizEvent.findByPk(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    if (!["draft","published"].includes(event.status))
      return res.status(400).json({ message: "Cannot edit a started event" });
    await event.update(req.body);
    res.json({ message: "Event updated", event });
  } catch (err) { res.status(500).json({ message: "Failed to update event" }); }
};

// ======================================================
// PUBLISH EVENT
// PATCH /api/quiz/events/:id/publish
// ======================================================
export const publishEvent = async (req, res) => {
  try {
    if (!isAdmin(req.user)) return res.status(403).json({ message: "Unauthorized" });
    const event = await QuizEvent.findByPk(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    if (event.status !== "draft")
      return res.status(400).json({ message: "Event is already published or started" });

    event.status = "published";
    await event.save();
    await audit(event.id, req.user.id, "event_published");
    res.json({ message: "Event published", event });
  } catch (err) { res.status(500).json({ message: "Failed to publish event" }); }
};

// ======================================================
// ADD PARTICIPANT
// POST /api/quiz/events/:id/participants
// ======================================================
export const addParticipant = async (req, res) => {
  try {
    if (!isAdmin(req.user)) return res.status(403).json({ message: "Unauthorized" });
    const event = await QuizEvent.findByPk(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const { name, school, classLevel, photoUrl, userId } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: "Participant name is required" });

    const count = await QuizParticipant.count({ where: { eventId: event.id } });
    const participantCode = `${event.eventCode}-P${String(count + 1).padStart(2,"0")}`;

    // controllers/quizEventController.js — addParticipant, replace the final response
const participant = await QuizParticipant.create({
  eventId: event.id,
  userId:  userId || null,
  name:    name.trim(),
  school, classLevel, photoUrl,
  displayNumber:   count + 1,
  participantCode,
  status: "registered",
});

res.status(201).json({
  message: "Participant added",
  participant: {
    ...participant.toJSON(),
    joinLink: `${process.env.FRONTEND_URL}/quiz/join/${participantCode}`,
  },
});

    // res.status(201).json({ message: "Participant added", participant });
  } catch (err) { res.status(500).json({ message: "Failed to add participant" }); }
};

// ======================================================
// ADD QUESTION
// POST /api/quiz/events/:id/questions
// ======================================================
export const addQuestion = async (req, res) => {
  try {
    if (!isAdmin(req.user)) return res.status(403).json({ message: "Unauthorized" });

    const {
      subject, classLevel, roundAssignment, questionText,
      options, correctAnswer, explanation, difficulty, marks,
    } = req.body;

    if (!subject || !questionText || !options || !correctAnswer)
      return res.status(400).json({ message: "subject, questionText, options, and correctAnswer are required" });

    if (!["A","B","C","D"].includes(correctAnswer))
      return res.status(400).json({ message: "correctAnswer must be A, B, C, or D" });

    const question = await QuizQuestion.create({
      eventId:        req.params.id,
      subject, classLevel, roundAssignment,
      questionText:   questionText.trim(),
      options,
      correctAnswer,
      explanation,
      difficulty:     difficulty || "medium",
      marks:          marks || 1,
      status:         "draft",
      createdBy:      req.user.id,
    });

    res.status(201).json({ message: "Question added", question });
  } catch (err) { res.status(500).json({ message: "Failed to add question" }); }
};

// ======================================================
// APPROVE QUESTION
// PATCH /api/quiz/events/:id/questions/:qid/approve
// ======================================================
export const approveQuestion = async (req, res) => {
  try {
    if (!isAdmin(req.user)) return res.status(403).json({ message: "Unauthorized" });
    const question = await QuizQuestion.findByPk(req.params.qid);
    if (!question) return res.status(404).json({ message: "Question not found" });
    question.status = "approved";
    await question.save();
    res.json({ message: "Question approved", question });
  } catch (err) { res.status(500).json({ message: "Failed to approve question" }); }
};

// ======================================================
// ASSIGN QUESTIONS TO ROUND
// POST /api/quiz/events/:id/rounds/:roundId/assign-questions
// Body: { questionIds: [1,2,3,...] }
// ======================================================
export const assignQuestionsToRound = async (req, res) => {
  try {
    if (!isAdmin(req.user)) return res.status(403).json({ message: "Unauthorized" });

    const round = await QuizRound.findByPk(req.params.roundId);
    if (!round) return res.status(404).json({ message: "Round not found" });
    if (round.status !== "pending")
      return res.status(400).json({ message: "Cannot reassign questions to an active/completed round" });

    const { questionIds } = req.body;
    if (!Array.isArray(questionIds) || questionIds.length === 0)
      return res.status(400).json({ message: "questionIds array is required" });

    // Validate all are approved
    const questions = await QuizQuestion.findAll({
      where: { id: { [Op.in]: questionIds }, status: "approved" },
    });
    if (questions.length !== questionIds.length)
      return res.status(400).json({ message: "All questions must be approved before assignment" });

    // Remove existing assignments for this round
    await QuizRoundQuestion.destroy({ where: { roundId: round.id } });

    // Create ordered assignments
    const assignments = questionIds.map((qId, idx) => ({
      roundId:        round.id,
      questionId:     qId,
      sequenceNumber: idx + 1,
      status: "pending",
    }));
    await QuizRoundQuestion.bulkCreate(assignments);

    res.json({ message: `${questionIds.length} questions assigned to round`, count: questionIds.length });
  } catch (err) { res.status(500).json({ message: "Failed to assign questions" }); }
};

// ======================================================
// START EVENT (move to ready → round1_intro)
// PATCH /api/quiz/events/:id/start
// ======================================================
export const startEvent = async (req, res) => {
  try {
    if (!isAdmin(req.user)) return res.status(403).json({ message: "Unauthorized" });

    const event = await QuizEvent.findByPk(req.params.id, {
      include: [{ model: QuizParticipant, as: "participants" }],
    });
    if (!event) return res.status(404).json({ message: "Event not found" });
    if (!["published","ready"].includes(event.status))
      return res.status(400).json({ message: "Event must be published before starting" });

    // Verify participant count
    const activeParticipants = event.participants.filter((p) => p.status === "registered");
    if (activeParticipants.length < event.round1ParticipantLimit)
      return res.status(400).json({
        message: `Need ${event.round1ParticipantLimit} participants. Currently have ${activeParticipants.length}.`,
      });

    // Verify Round 1 questions are assigned
    const round1 = await QuizRound.findOne({ where: { eventId: event.id, roundNumber: 1 } });
    const r1Questions = await QuizRoundQuestion.count({ where: { roundId: round1.id } });
    if (r1Questions < event.round1QuestionCount)
      return res.status(400).json({
        message: `Round 1 needs ${event.round1QuestionCount} questions. Currently assigned: ${r1Questions}.`,
      });

    // Activate all registered participants
    await QuizParticipant.update(
      { status: "active" },
      { where: { eventId: event.id, status: "registered" } }
    );

    event.status      = "round1_intro";
    event.activeRound = 1;
    event.currentQuestionIdx = 0;
    event.startedAt   = new Date();
    await event.save();

    round1.status    = "active";
    round1.startedAt = new Date();
    await round1.save();

    await audit(event.id, req.user.id, "event_started", { description: "Round 1 intro started" });
    broadcast(req, event.id, "event:state_change", { status: event.status, activeRound: 1 });

    res.json({ message: "Event started — Round 1 intro", event });
  } catch (err) {
    console.error("startEvent:", err);
    res.status(500).json({ message: "Failed to start event" });
  }
};





export const openNextQuestion = async (req, res) => {
  try {
    if (!isAdmin(req.user)) return res.status(403).json({ message: "Unauthorized" });
    const io = req.app.get("io");
    const result = await engineOpenNext(io, req.params.id, req.user.id);
    if (!result.ok) return res.status(400).json({ message: result.message });
    res.json({ message: "Question opened", roundQuestion: result.roundQuestion });
  } catch (err) {
    console.error("openNextQuestion:", err);
    res.status(500).json({ message: "Failed to open question" });
  }
};

export const lockQuestion = async (req, res) => {
  try {
    if (!isAdmin(req.user)) return res.status(403).json({ message: "Unauthorized" });
    const io = req.app.get("io");
    const result = await engineLock(io, req.params.id, req.user.id);
    if (!result.ok) return res.status(400).json({ message: result.message });
    res.json({ message: "Question locked and scored" });
  } catch (err) {
    console.error("lockQuestion:", err);
    res.status(500).json({ message: "Failed to lock question" });
  }
};

export const revealResult = async (req, res) => {
  try {
    if (!isAdmin(req.user)) return res.status(403).json({ message: "Unauthorized" });
    const io = req.app.get("io");
    const result = await engineReveal(io, req.params.id, req.user.id);
    if (!result.ok) return res.status(400).json({ message: result.message });
    res.json({ message: "Result revealed", correctAnswer: result.correctAnswer, explanation: result.explanation, scores: result.scores });
  } catch (err) {
    console.error("revealResult:", err);
    res.status(500).json({ message: "Failed to reveal result" });
  }
};

// ======================================================
// COMPLETE ROUND
// PATCH /api/quiz/events/:id/complete-round
// ======================================================
export const completeRound = async (req, res) => {
  try {
    if (!isAdmin(req.user)) return res.status(403).json({ message: "Unauthorized" });

    const event = await QuizEvent.findByPk(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const round = await QuizRound.findOne({
      where: { eventId: event.id, roundNumber: event.activeRound },
    });

    round.status      = "completed";
    round.completedAt = new Date();
    await round.save();

    // Compute round rankings
    const scores = await QuizScore.findAll({
      where:   { eventId: event.id, roundId: round.id },
      order:   [["totalMarks","DESC"]],
      include: [{ model: QuizParticipant }],
    });

    for (let i = 0; i < scores.length; i++) {
      scores[i].roundRank = i + 1;
      await scores[i].save();
    }

    const stateMap = { 1: "round1_completed", 2: "round2_completed" };
    event.status = stateMap[event.activeRound] || "round1_completed";
    await event.save();

    await audit(event.id, req.user.id, "round_completed", {
      relatedRoundId: round.id,
      description:    `Round ${event.activeRound} completed`,
    });

    broadcast(req, event.id, "quiz:round_completed", {
      roundNumber: event.activeRound,
      scores,
    });

    res.json({ message: `Round ${event.activeRound} completed`, scores });
  } catch (err) {
    console.error("completeRound:", err);
    res.status(500).json({ message: "Failed to complete round" });
  }
};




// ======================================================
// ELIMINATION REVIEW  (Round 1 → Round 2)
// GET  /api/quiz/events/:id/elimination-review
// POST /api/quiz/events/:id/confirm-elimination
// ======================================================
export const getEliminationReview = async (req, res) => {
  try {
    if (!isAdmin(req.user)) return res.status(403).json({ message: "Unauthorized" });

    const event = await QuizEvent.findByPk(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const round1 = await QuizRound.findOne({ where: { eventId: event.id, roundNumber: 1 } });
    const scores = await QuizScore.findAll({
      where:   { eventId: event.id, roundId: round1.id },
      order:   [["totalMarks","DESC"]],
      include: [{ model: QuizParticipant }],
    });

    const baseQualify = event.round1ParticipantLimit - event.eliminateAfterRound1;

    // Round 1 never needs a tiebreak — everyone tied at the cutoff
    // score advances together, so the qualifying count expands to
    // include them rather than arbitrarily cutting the tie.
    const boundaryScore = scores[baseQualify - 1]?.totalMarks;
    let qualifyCount = baseQualify;
    if (boundaryScore !== undefined) {
      qualifyCount = scores.filter((s) => Number(s.totalMarks) >= Number(boundaryScore)).length;
    }

    res.json({
      scores,
      qualifyCount,
      baseQualifyCount: baseQualify,
      expanded: qualifyCount > baseQualify,
      boundaryScore: boundaryScore ?? null,
    });
  } catch (err) {
    console.error("getEliminationReview:", err);
    res.status(500).json({ message: "Failed to get elimination review" });
  }
};

export const confirmElimination = async (req, res) => {
  try {
    if (!isAdmin(req.user)) return res.status(403).json({ message: "Unauthorized" });

    const event = await QuizEvent.findByPk(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    if (event.status !== "round1_completed" && event.status !== "elimination_review" && event.status !== "tiebreak_completed")
      return res.status(400).json({ message: "Not in elimination review phase" });

    // qualifiedIds must be sent by admin after reviewing
    const { qualifiedParticipantIds, eliminatedParticipantIds } = req.body;

    if (!Array.isArray(qualifiedParticipantIds) || qualifiedParticipantIds.length === 0)
      return res.status(400).json({ message: "qualifiedParticipantIds array is required" });

    // Mark qualified
    await QuizParticipant.update(
      { status: "qualified_round2" },
      { where: { id: { [Op.in]: qualifiedParticipantIds }, eventId: event.id } }
    );

    // Mark eliminated
    if (Array.isArray(eliminatedParticipantIds) && eliminatedParticipantIds.length > 0) {
      await QuizParticipant.update(
        {
          status:                  "eliminated",
          eliminatedAfterRound:    1,
          eliminatedAt:            new Date(),
          eliminationConfirmedBy:  req.user.id,
        },
        { where: { id: { [Op.in]: eliminatedParticipantIds }, eventId: event.id } }
      );
    }

    event.status      = "round2_intro";
    event.activeRound = 2;
    event.currentQuestionIdx = 0;
    await event.save();

    // Activate Round 2
    const round2 = await QuizRound.findOne({ where: { eventId: event.id, roundNumber: 2 } });
    round2.status    = "active";
    round2.startedAt = new Date();
    await round2.save();

    await audit(event.id, req.user.id, "elimination_confirmed", {
      description:  `${qualifiedParticipantIds.length} qualified for Round 2`,
      afterValue:   { qualified: qualifiedParticipantIds, eliminated: eliminatedParticipantIds },
    });

    broadcast(req, event.id, "quiz:elimination_confirmed", {
      qualifiedParticipantIds,
      eliminatedParticipantIds,
    });

    res.json({ message: "Elimination confirmed. Round 2 starting." });
  } catch (err) {
    console.error("confirmElimination:", err);
    res.status(500).json({ message: "Failed to confirm elimination" });
  }
};

// ======================================================
// START TIEBREAK  (supplementary 10-question quiz)
// POST /api/quiz/events/:id/start-tiebreak
// Body: { tiedParticipantIds: [1,2,...] }
// ======================================================
export const startTiebreak = async (req, res) => {
  try {
    if (!isAdmin(req.user)) return res.status(403).json({ message: "Unauthorized" });

    const event = await QuizEvent.findByPk(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const { tiedParticipantIds } = req.body;
    if (!Array.isArray(tiedParticipantIds) || tiedParticipantIds.length < 2)
      return res.status(400).json({ message: "Need at least 2 tied participant IDs" });

    // Get tiebreak questions — approved questions assigned to "tiebreak"
    const tbQuestions = await QuizQuestion.findAll({
      where: {
        eventId: event.id,
        status:  "approved",
        roundAssignment: "tiebreak",
      },
      limit: event.tiebreakQuestionCount,
      order: sequelize.random(),
    });

    if (tbQuestions.length < event.tiebreakQuestionCount)
      return res.status(400).json({
        message: `Need ${event.tiebreakQuestionCount} approved tiebreak questions. Found ${tbQuestions.length}.`,
      });

    // Create tiebreak round (roundNumber = 99)
    const tbRound = await QuizRound.create({
      eventId:     event.id,
      roundNumber: 99,
      label:       "Tiebreak",
      participantLimit: tiedParticipantIds.length,
      questionCount:    event.tiebreakQuestionCount,
      status:      "active",
      startedAt:   new Date(),
      tiebreakParticipants: tiedParticipantIds,
    });

    // Assign questions
    await QuizRoundQuestion.bulkCreate(
      tbQuestions.map((q, idx) => ({
        roundId:        tbRound.id,
        questionId:     q.id,
        sequenceNumber: idx + 1,
        status:         "pending",
      }))
    );

    // Mark tied participants as tiebreak status
    await QuizParticipant.update(
      { status: "tiebreak" },
      { where: { id: { [Op.in]: tiedParticipantIds } } }
    );

    event.status      = "tiebreak_active";
    event.activeRound = 99;
    event.currentQuestionIdx = 0;
    await event.save();

    await audit(event.id, req.user.id, "tiebreak_started", {
      description: `Tiebreak started for ${tiedParticipantIds.length} participants`,
      afterValue:  { tiedParticipantIds },
    });

    broadcast(req, event.id, "quiz:tiebreak_started", {
      tiedParticipantIds,
      questionCount: event.tiebreakQuestionCount,
    });

    res.json({ message: "Tiebreak started", tiebreakRound: tbRound });
  } catch (err) {
    console.error("startTiebreak:", err);
    res.status(500).json({ message: "Failed to start tiebreak" });
  }
};

// ======================================================
// PAUSE / RESUME EVENT
// ======================================================
export const pauseEvent = async (req, res) => {
  try {
    if (!isAdmin(req.user)) return res.status(403).json({ message: "Unauthorized" });
    const event = await QuizEvent.findByPk(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    if (event.status === "paused") return res.status(400).json({ message: "Already paused" });

    cancelAutoFlow(event.id); // stop any pending auto-lock/reveal/advance while paused

    event.pausedFromStatus = event.status;
    event.status = "paused";
    await event.save();
   

    // Also pause any open question timer — scoped to this event's active
    // round only, so pausing one event can't touch another event's timers.
    const activeRound = await QuizRound.findOne({
      where: { eventId: event.id, roundNumber: event.activeRound },
    });
    if (activeRound) {
      await QuizRoundQuestion.update(
        { pausedAt: new Date() },
        { where: { roundId: activeRound.id, status: "open" } }
      );
    }

    await audit(event.id, req.user.id, "event_paused", {
      reason: req.body.reason || "Administrator paused the event",
    });
    broadcast(req, event.id, "quiz:paused", { reason: req.body.reason });

    res.json({ message: "Event paused" });
  } catch (err) { res.status(500).json({ message: "Failed to pause event" }); }
};

export const resumeEvent = async (req, res) => {
  try {
    if (!isAdmin(req.user)) return res.status(403).json({ message: "Unauthorized" });
    const event = await QuizEvent.findByPk(req.params.id);
    if (!event || event.status !== "paused")
      return res.status(400).json({ message: "Event is not paused" });

    event.status = event.pausedFromStatus || "round1_question_open";
    event.pausedFromStatus = null;
    await event.save();

    await audit(event.id, req.user.id, "event_resumed");
    broadcast(req, event.id, "quiz:resumed", { status: event.status });

    res.json({ message: "Event resumed", status: event.status });
  } catch (err) { res.status(500).json({ message: "Failed to resume event" }); }
};

// ======================================================
// VOID QUESTION
// PATCH /api/quiz/events/:id/void-question/:rqId
// ======================================================
export const voidQuestion = async (req, res) => {
  try {
    if (!isAdmin(req.user)) return res.status(403).json({ message: "Unauthorized" });

    const { reason } = req.body;
    if (!reason?.trim()) return res.status(400).json({ message: "Reason is required to void a question" });

    const rq = await QuizRoundQuestion.findByPk(req.params.rqId, {
      include: [{ model: QuizQuestion }],
    });
    if (!rq) return res.status(404).json({ message: "Round question not found" });
    if (!["open","locked"].includes(rq.status))
      return res.status(400).json({ message: "Only open or locked questions can be voided" });

    // Void the round question
    rq.status   = "voided";
    rq.lockedAt = new Date();
    await rq.save();

    // Void the question itself
    await QuizQuestion.update(
      { status: "voided", voidReason: reason, voidedBy: req.user.id, voidedAt: new Date() },
      { where: { id: rq.questionId } }
    );

    // Remove all answers for this question (everyone gets 0 — fair)
      // Remove all answers for this question (everyone gets 0 — fair)
    await QuizEventAnswer.destroy({ where: { roundQuestionId: rq.id } });

    // Rebuild scores for the round now that this question's answers are gone
    await recalculateScores(Number(req.params.id), rq.roundId);
    // (full score recalculation happens via the recalculateScores helper below)

    await audit(Number(req.params.id), req.user.id, "question_voided", {
      relatedQuestionId: rq.questionId,
      reason,
    });

    broadcast(req, req.params.id, "quiz:question_voided", {
      roundQuestionId: rq.id,
      reason,
    });

    res.json({ message: "Question voided — all participants receive 0 for this question" });
  } catch (err) {
    console.error("voidQuestion:", err);
    res.status(500).json({ message: "Failed to void question" });
  }
};

// ======================================================
// MANUAL SCORE ADJUSTMENT
// PATCH /api/quiz/events/:id/adjust-score
// Body: { participantId, roundId, newTotal, reason }
// ======================================================
export const adjustScore = async (req, res) => {
  try {
    if (!isAdmin(req.user)) return res.status(403).json({ message: "Unauthorized" });

    const { participantId, roundId, newTotal, reason } = req.body;
    if (!reason?.trim()) return res.status(400).json({ message: "Reason is required for score adjustment" });

    const score = await QuizScore.findOne({
      where: { eventId: req.params.id, participantId, roundId },
    });
    if (!score) return res.status(404).json({ message: "Score record not found" });

    const before = score.totalMarks;
    score.totalMarks     = newTotal;
    score.adjustmentNote = reason;
    score.adjustedBy     = req.user.id;
    await score.save();

    await audit(Number(req.params.id), req.user.id, "score_adjusted", {
      relatedParticipantId: participantId,
      relatedRoundId:       roundId,
      reason,
      beforeValue: { totalMarks: before },
      afterValue:  { totalMarks: newTotal },
    });

    res.json({ message: "Score adjusted", score });
  } catch (err) { res.status(500).json({ message: "Failed to adjust score" }); }
};

// ======================================================
// CONFIRM FINAL RESULT & COMPLETE EVENT
// PATCH /api/quiz/events/:id/complete
// ======================================================
export const completeEvent = async (req, res) => {
  try {
    if (!isAdmin(req.user)) return res.status(403).json({ message: "Unauthorized" });

    const event = await QuizEvent.findByPk(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const participants = await QuizParticipant.findAll({
      where: { eventId: event.id, status: { [Op.in]: ["active","qualified_round2","completed"] } },
    });

    const rounds = await QuizRound.findAll({
      where: { eventId: event.id, roundNumber: { [Op.in]: [1,2] } },
    });

    // Pull any tiebreak-round scores so a genuine ranking tie can be
    // broken by tiebreak performance rather than left arbitrary.
    const tiebreakRounds = await QuizRound.findAll({ where: { eventId: event.id, roundNumber: 99 } });
    const tiebreakScoreByParticipant = {};
    for (const tbRound of tiebreakRounds) {
      const tbScores = await QuizScore.findAll({ where: { eventId: event.id, roundId: tbRound.id } });
      for (const s of tbScores) {
        tiebreakScoreByParticipant[s.participantId] = Number(s.totalMarks);
      }
    }

    const finalScores = [];
    for (const p of participants) {
      let total = 0;
      for (const round of rounds) {
        const score = await QuizScore.findOne({ where: { participantId: p.id, roundId: round.id } });
        if (score) {
          if (event.finalScoreRule === "round2_only" && round.roundNumber === 1) continue;
          const weight = event.finalScoreRule === "weighted" && round.roundNumber === 2
            ? Number(event.round2Weight) : 1;
          total += Number(score.totalMarks) * weight;
        }
      }
      finalScores.push({
        participant: p,
        finalScore: total,
        tiebreakScore: tiebreakScoreByParticipant[p.id] ?? null,
      });
    }

    // Detect unresolved ties: a genuine score tie where neither
    // participant has a differentiating tiebreak score.
    const byScore = {};
    finalScores.forEach((f) => {
      const key = f.finalScore;
      (byScore[key] ||= []).push(f);
    });
    const unresolved = Object.values(byScore).some((group) => {
      if (group.length < 2) return false;
      const tbScores = group.map((g) => g.tiebreakScore);
      // Unresolved if any two tied participants share the same tiebreak
      // score (including both being null — no tiebreak run yet).
      return new Set(tbScores).size < tbScores.length;
    });

    if (unresolved) {
      return res.status(400).json({
        message: "There are unresolved score ties in the final ranking. Run a tiebreak for the tied group(s) before completing the event.",
      });
    }

    finalScores.sort((a, b) => {
      if (b.finalScore !== a.finalScore) return b.finalScore - a.finalScore;
      return (b.tiebreakScore || 0) - (a.tiebreakScore || 0);
    });

    for (let i = 0; i < finalScores.length; i++) {
      finalScores[i].participant.finalRank = i + 1;
      finalScores[i].participant.status = "completed";
      await finalScores[i].participant.save();
    }

    event.status = "completed";
    event.completedAt = new Date();
    await event.save();

    await audit(event.id, req.user.id, "event_completed", { description: "Final results confirmed" });
    broadcast(req, event.id, "quiz:event_completed", { finalScores });

    res.json({ message: "Event completed", finalScores });
  } catch (err) {
    console.error("completeEvent:", err);
    res.status(500).json({ message: "Failed to complete event" });
  }
};

// ======================================================
// FINAL RANKING REVIEW (Round 2 → Complete)
// GET /api/quiz/events/:id/final-ranking-review
// Finds every group of participants tied on Round 2 score —
// these are genuine ranking ties (1st, 2nd, etc.) and are the
// only place a real tiebreak belongs.
// ======================================================
export const getFinalRankingReview = async (req, res) => {
  try {
    if (!isAdmin(req.user)) return res.status(403).json({ message: "Unauthorized" });

    const event = await QuizEvent.findByPk(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const round2 = await QuizRound.findOne({ where: { eventId: event.id, roundNumber: 2 } });
    if (!round2) return res.status(404).json({ message: "Round 2 not found" });

    const scores = await QuizScore.findAll({
      where:   { eventId: event.id, roundId: round2.id },
      order:   [["totalMarks","DESC"]],
      include: [{ model: QuizParticipant }],
    });

    const tiedGroups = [];
    let i = 0;
    while (i < scores.length) {
      let j = i + 1;
      while (j < scores.length && Number(scores[j].totalMarks) === Number(scores[i].totalMarks)) j++;
      if (j - i > 1) {
        tiedGroups.push({
          rankStart: i + 1,
          rankEnd: j,
          score: scores[i].totalMarks,
          participants: scores.slice(i, j),
        });
      }
      i = j;
    }

    res.json({ scores, tiedGroups, hasTies: tiedGroups.length > 0 });
  } catch (err) {
    console.error("getFinalRankingReview:", err);
    res.status(500).json({ message: "Failed to get final ranking review" });
  }
};

// ======================================================
// GET PANELIST DASHBOARD DATA
// GET /api/quiz/events/:id/dashboard
// ======================================================
export const getPanelistDashboard = async (req, res) => {
  try {
    const event = await QuizEvent.findByPk(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const round = await QuizRound.findOne({
      where: { eventId: event.id, roundNumber: event.activeRound },
    });

    const scores = await QuizScore.findAll({
      where:   { eventId: event.id, roundId: round?.id },
      include: [{ model: QuizParticipant }],
      order:   [["totalMarks","DESC"]],
    });

    const currentRQ = await QuizRoundQuestion.findOne({
      where:   { roundId: round?.id, status: { [Op.in]: ["open","locked","revealed"] } },
      include: [{ model: QuizQuestion, attributes: { exclude: ["correctAnswer"] } }],
      order:   [["sequenceNumber","DESC"]],
    });

    // Per-question results for the current question (after locked/revealed)
    let questionResults = null;
    if (currentRQ && ["locked","revealed"].includes(currentRQ.status)) {
      const answers = await QuizEventAnswer.findAll({
          where:   { roundQuestionId: currentRQ.id },
          include: [{ model: QuizParticipant, attributes: ["id","name","displayNumber"] }],
        });
        questionResults = answers.map((a) => ({
        participantId:   a.participantId,
        participantName: a.QuizParticipant?.name,
        displayNumber:   a.QuizParticipant?.displayNumber,
        selectedOption:  a.selectedOption,
        isCorrect:       a.isCorrect,
        marksEarned:     a.marksEarned,
        submittedAt:     a.submittedAt,
      }));
    }

    res.json({
      event:           { id: event.id, name: event.name, status: event.status, activeRound: event.activeRound },
      currentQuestion: currentRQ,
      questionResults,
      scores,
      lastUpdated:     new Date(),
    });
  } catch (err) { res.status(500).json({ message: "Failed to get dashboard" }); }
};

// ======================================================
// EXPORT RESULTS
// GET /api/quiz/events/:id/export
// ======================================================
export const exportResults = async (req, res) => {
  try {
    if (!isAdmin(req.user)) return res.status(403).json({ message: "Unauthorized" });

    const event = await QuizEvent.findByPk(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const participants = await QuizParticipant.findAll({
      where:   { eventId: event.id },
      order:   [["finalRank","ASC"]],
    });

    const rounds = await QuizRound.findAll({
      where:   { eventId: event.id },
      include: [{ model: QuizRoundQuestion,
                  include: [{ model: QuizQuestion }] }],
    });

    const allAnswers = await QuizEventAnswer.findAll({
      where:   { eventId: event.id },
      include: [
        { model: QuizParticipant, attributes: ["id","name","school"] },
        { model: QuizQuestion,    attributes: ["id","subject","questionText","correctAnswer"] },
      ],
    });

    const auditLog = await QuizAuditEvent.findAll({
      where: { eventId: event.id },
      order: [["createdAt","ASC"]],
    });

    res.json({
      event,
      participants,
      rounds,
      answers: allAnswers,
      auditLog,
      exportedAt: new Date(),
    });
  } catch (err) { res.status(500).json({ message: "Failed to export results" }); }
};

// ======================================================
// ADD PANELIST
// POST /api/quiz/events/:id/panelists
// ======================================================
export const addPanelist = async (req, res) => {
  try {
    if (!isAdmin(req.user)) return res.status(403).json({ message: "Unauthorized" });
    const { userId, canAdjustScores } = req.body;
    if (!userId) return res.status(400).json({ message: "userId is required" });

    const panelist = await QuizPanelist.create({
      eventId: req.params.id,
      userId,
      canAdjustScores: canAdjustScores || false,
    });
    res.status(201).json({ message: "Panelist added", panelist });
  } catch (err) { res.status(500).json({ message: "Failed to add panelist" }); }
};

// ======================================================
// LOG TECHNICAL INCIDENT
// POST /api/quiz/events/:id/incidents
// ======================================================
export const logIncident = async (req, res) => {
  try {
    const { participantId, type, description, actionTaken } = req.body;
    if (!description?.trim()) return res.status(400).json({ message: "Description is required" });

    const incident = await TechnicalIncident.create({
      eventId: req.params.id,
      participantId: participantId || null,
      type:          type          || "other",
      description:   description.trim(),
      actionTaken:   actionTaken || null,
      occurredAt:    new Date(),
    });

    await audit(Number(req.params.id), req.user.id, "manual_incident_recorded", {
      description,
      relatedParticipantId: participantId,
    });

    res.status(201).json({ message: "Incident logged", incident });
  } catch (err) { res.status(500).json({ message: "Failed to log incident" }); }
};


// controllers/adminQuizEventController.js — add near getEvent
export const getEventByCode = async (req, res) => {
  try {
    const event = await QuizEvent.findOne({
      where: { eventCode: req.params.eventCode },
      attributes: ["id", "name", "status", "eventCode"],
    });
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.json({ event });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch event" });
  }
};