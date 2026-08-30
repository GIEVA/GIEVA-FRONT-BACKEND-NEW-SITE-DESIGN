// controllers/quizParticipantController.js
//
// Participant-facing: join event, get live state, submit answer,
// get own scores. Correct answers are NEVER returned to participants.

import { Op }  from "sequelize";
import models  from "../models/index.js";

const {
  QuizEvent, QuizParticipant, QuizQuestion, QuizRound,
  QuizRoundQuestion, QuizEventAnswer, QuizScore, QuizAuditEvent,
} = models;

const audit = async (eventId, userId, action, extras = {}) => {
  try {
    await QuizAuditEvent.create({ eventId, userId, action, ...extras });
  } catch (err) {
    console.error("audit() failed:", err);
  }
};

const broadcast = (req, eventId, type, payload) => {
  try {
    const io = req.app.get("io");
    if (io) io.to(`event:${eventId}`).emit(type, payload);
  } catch { /* no-op */ }
};

// ======================================================
// JOIN EVENT BY CODE
// POST /api/quiz/join
// Body: { participantCode }
// No auth required — participants join by their unique code
// ======================================================
export const joinEvent = async (req, res) => {
  try {
    const { participantCode } = req.body;
    if (!participantCode?.trim())
      return res.status(400).json({ message: "Participant code is required" });

    const participant = await QuizParticipant.findOne({
      where: { participantCode: participantCode.trim().toUpperCase() },
      include: [{
        model: QuizEvent,
        attributes: [
          "id","name","status","category","eventCode",
          "questionTimerSeconds","immediateFeedback",
          "activeRound","currentQuestionIdx","subjectOrder",
        ],
      }],
    });

    if (!participant)
      return res.status(404).json({ message: "Invalid participant code. Please check and try again." });

    const event = participant.QuizEvent;
    if (!event)
      return res.status(404).json({ message: "Event not found for this code." });

    if (["cancelled","completed"].includes(event.status))
      return res.status(400).json({ message: "This event has already ended." });

    if (!["published","ready","round1_intro","round1_question_open",
          "round1_question_locked","round1_result_revealed","round1_completed",
          "elimination_review","tiebreak_active","round2_intro",
          "round2_question_open","round2_question_locked",
          "round2_result_revealed","round2_completed",
          "final_review","paused"].includes(event.status))
      return res.status(400).json({ message: "Event is not accepting participants yet." });

    if (["eliminated","disqualified"].includes(participant.status))
      return res.status(403).json({ message: "You have been eliminated from this event." });

    // Update connection state
    participant.connectionStatus = "connected";
    participant.lastSeenAt       = new Date();
    if (!participant.joinedAt) participant.joinedAt = new Date();
    await participant.save();

    // Join the socket room
    broadcast(req, event.id, "quiz:participant_joined", {
      participantId: participant.id,
      name:          participant.name,
      displayNumber: participant.displayNumber,
    });

    await audit(event.id, participant.userId, "participant_joined", {
      relatedParticipantId: participant.id,
    });

    res.json({
      participant: {
        id:              participant.id,
        name:            participant.name,
        school:          participant.school,
        displayNumber:   participant.displayNumber,
        status:          participant.status,
        participantCode: participant.participantCode,
      },
      event: {
        id:                   event.id,
        name:                 event.name,
        status:               event.status,
        category:             event.category,
        questionTimerSeconds: event.questionTimerSeconds,
        activeRound:          event.activeRound,
        subjectOrder:         event.subjectOrder,
      },
    });
  } catch (err) {
    console.error("joinEvent:", err);
    res.status(500).json({ message: "Failed to join event" });
  }
};

// ======================================================
// GET LIVE EVENT STATE (participant polls this)
// GET /api/quiz/events/:eventId/state/:participantId
// ======================================================

export const getEventState = async (req, res) => {
  try {
    const { eventId, participantId } = req.params;

       const [event, participant] = await Promise.all([
      QuizEvent.findByPk(eventId, {
        attributes: [
          "id","name","status","activeRound","currentQuestionIdx",
          "questionTimerSeconds","immediateFeedback","subjectOrder",
        ],
      }),
      // Scoped to eventId so a participant from one event can't poll
      // state under a different event's id and get back a participantStatus/
      // myScore that was never actually computed against that event.
      QuizParticipant.findOne({ where: { id: participantId, eventId } }),
    ]);

    if (!event)       return res.status(404).json({ message: "Event not found" });
    if (!participant) return res.status(404).json({ message: "Participant not found" });

    // Update heartbeat
    participant.lastSeenAt = new Date();
    await participant.save();

    // Get current open/locked question — NEVER include correctAnswer
    let currentQuestion = null;
    let myAnswer        = null;
    let timerInfo       = null;

    if (event.activeRound) {
      const round = await QuizRound.findOne({
        where: { eventId, roundNumber: event.activeRound },
      });

      if (round) {
        const rq = await QuizRoundQuestion.findOne({
          where:   { roundId: round.id, status: { [Op.in]: ["open","locked","revealed"] } },
          include: [{
            model: QuizQuestion,
            attributes: {
              // CRITICAL: correctAnswer never sent to participant
              exclude: ["correctAnswer"],
            },
          }],
          order: [["sequenceNumber","DESC"]],
        });

        if (rq) {
          currentQuestion = {
            roundQuestionId: rq.id,
            sequenceNumber:  rq.sequenceNumber,
            status:          rq.status,
            openedAt:        rq.openedAt,
            lockedAt:        rq.lockedAt,
            question: rq.status === "revealed"
              // After reveal, include explanation but still no correctAnswer from DB
              // correctAnswer will be broadcast separately via socket
              ? rq.QuizQuestion
              : { ...rq.QuizQuestion.dataValues, correctAnswer: undefined },
          };

          if (rq.status === "open") {
            const elapsed    = (Date.now() - new Date(rq.openedAt).getTime()) / 1000;
            const remaining  = Math.max(0,
              event.questionTimerSeconds +
              (rq.timerExtendedSeconds || 0) -
              (rq.pauseDurationSeconds || 0) -
              elapsed
            );
            timerInfo = { elapsed: Math.floor(elapsed), remaining: Math.floor(remaining) };
          }

          // Participant's answer for this question
          myAnswer = await QuizEventAnswer.findOne({
            where: { participantId, roundQuestionId: rq.id },
            attributes: ["id","selectedOption","submittedAt","isCorrect","marksEarned","lockReason"],
          });
        }
      }
    }

    // Participant's cumulative score for active round
    let myScore = null;
    if (event.activeRound) {
      const round = await QuizRound.findOne({
        where: { eventId, roundNumber: event.activeRound },
      });
      if (round) {
        myScore = await QuizScore.findOne({
          where: { eventId, roundId: round.id, participantId },
          attributes: ["totalMarks","correctCount","incorrectCount","unansweredCount","roundRank"],
        });
      }
    }

    res.json({
      eventStatus:  event.status,
      activeRound:  event.activeRound,
      participantStatus: participant.status,
      currentQuestion,
      timerInfo,
      myAnswer,
      myScore,
    });
  } catch (err) {
    console.error("getEventState:", err);
    res.status(500).json({ message: "Failed to get event state" });
  }
};

// ======================================================
// SUBMIT ANSWER
// POST /api/quiz/events/:eventId/answer
// Body: { participantId, roundQuestionId, selectedOption }
//
// CRITICAL SECURITY RULES:
//   - Only accepted when roundQuestion.status === "open"
//   - selectedOption validated as A/B/C/D
//   - Correct answer never referenced here — scoring happens server-side on lock
//   - Duplicate submissions update the existing answer (change allowed while open)
// ======================================================
export const submitAnswer = async (req, res) => {
  try {
    const { eventId }           = req.params;
    const { participantId, roundQuestionId, selectedOption } = req.body;

    if (!participantId || !roundQuestionId || !selectedOption)
      return res.status(400).json({ message: "participantId, roundQuestionId, and selectedOption are required" });

    if (!["A","B","C","D"].includes(selectedOption))
      return res.status(400).json({ message: "selectedOption must be A, B, C, or D" });

    // Verify participant belongs to this event and is active
    const participant = await QuizParticipant.findOne({
      where: {
        id:      participantId,
        eventId,
        status:  { [Op.in]: ["active","qualified_round2","tiebreak"] },
      },
    });
    if (!participant)
      return res.status(403).json({ message: "Participant not found or not active in this event" });

      // Verify the question exists AND belongs to this event's round — without
    // this join, a valid roundQuestionId from a *different* event (or a
    // stale round in this one) would be accepted as long as participantId
    // checked out, since QuizRoundQuestion has no eventId of its own.
    const rq = await QuizRoundQuestion.findOne({
      where: { id: roundQuestionId },
      include: [
        { model: QuizQuestion, attributes: ["id","marks"] },
        { model: QuizRound,    attributes: ["id","eventId"] },
      ],
    });
    if (!rq || rq.QuizRound?.eventId !== Number(eventId))
      return res.status(404).json({ message: "Question not found" });
    if (rq.status !== "open")
      return res.status(409).json({ message: "This question is no longer accepting answers" });


    // Check if already answered (allow change while open)
    const existing = await QuizEventAnswer.findOne({
      where: { participantId, roundQuestionId },
    });

    if (existing) {
      // Record the change
      existing.previousOption = existing.selectedOption;
      existing.selectedOption = selectedOption;
      existing.changedAnswer  = existing.previousOption !== selectedOption;
      existing.submittedAt    = new Date();
      existing.connectionStatusAtSubmit = participant.connectionStatus;
      await existing.save();

      // Broadcast to admin/panelist that participant answered (no option revealed)
      broadcast(req, eventId, "quiz:answer_received", {
        participantId,
        roundQuestionId,
        displayNumber: participant.displayNumber,
        hasAnswered:   true,
        changedAnswer: existing.changedAnswer,
      });

      return res.json({ message: "Answer updated", answerId: existing.id });
    }

    // First submission
    const answer = await QuizEventAnswer.create({
      participantId,
      questionId:      rq.questionId,
      roundQuestionId: rq.id,
      eventId,
      selectedOption,
      submittedAt:     new Date(),
      connectionStatusAtSubmit: participant.connectionStatus,
    });

    broadcast(req, eventId, "quiz:answer_received", {
      participantId,
      roundQuestionId,
      displayNumber: participant.displayNumber,
      hasAnswered:   true,
    });

    res.json({ message: "Answer submitted", answerId: answer.id });
  } catch (err) {
    console.error("submitAnswer:", err);
    res.status(500).json({ message: "Failed to submit answer" });
  }
};

// ======================================================
// GET MY RESULTS (after round completion)
// GET /api/quiz/events/:eventId/my-results/:participantId
// ======================================================
export const getMyResults = async (req, res) => {
  try {
    const { eventId, participantId } = req.params;

    const participant = await QuizParticipant.findOne({
      where: { id: participantId, eventId },
    });
    if (!participant) return res.status(404).json({ message: "Participant not found" });

    const rounds = await QuizRound.findAll({
      where: { eventId },
      order: [["roundNumber","ASC"]],
    });

    const results = [];
    for (const round of rounds) {
      const score = await QuizScore.findOne({
        where: { eventId, roundId: round.id, participantId },
      });
      const answers = await QuizEventAnswer.findAll({
        where: { eventId, participantId },
        include: [{
          model: QuizRoundQuestion,
          where: { roundId: round.id },
          include: [{
            model: QuizQuestion,
            // Reveal correct answer only if question status is "revealed"
            // This is controlled by includeCorrectAnswer flag in the round question
          }],
        }],
      });

      results.push({
        roundNumber:  round.roundNumber,
        roundLabel:   round.label,
        roundStatus:  round.status,
        score,
        answers: answers.map((a) => ({
          questionId:     a.questionId,
          selectedOption: a.selectedOption,
          isCorrect:      a.isCorrect,
          marksEarned:    a.marksEarned,
          subject:        a.QuizRoundQuestion?.QuizQuestion?.subject,
          // correctAnswer shown only after reveal
          correctAnswer:  a.QuizRoundQuestion?.status === "revealed"
            ? a.QuizRoundQuestion?.QuizQuestion?.correctAnswer
            : undefined,
        })),
      });
    }

    res.json({
      participant: {
        name:        participant.name,
        school:      participant.school,
        finalRank:   participant.finalRank,
        status:      participant.status,
      },
      results,
    });
  } catch (err) {
    console.error("getMyResults:", err);
    res.status(500).json({ message: "Failed to get results" });
  }
};

// ======================================================
// PARTICIPANT HEARTBEAT (connection keep-alive)
// POST /api/quiz/events/:eventId/heartbeat
// Body: { participantId }
// ======================================================
export const heartbeat = async (req, res) => {
  try {
    const { participantId } = req.body;
    await QuizParticipant.update(
      { lastSeenAt: new Date(), connectionStatus: "connected" },
      { where: { id: participantId, eventId: req.params.eventId } }
    );
    res.json({ ok: true, serverTime: new Date() });
  } catch (err) {
    res.status(500).json({ message: "Heartbeat failed" });
  }
};

// ======================================================
// AUDIENCE STATE (public read — no auth, no answers)
// GET /api/quiz/audience/:eventCode
// ======================================================
export const getAudienceState = async (req, res) => {
  try {
    const event = await QuizEvent.findOne({
      where: { eventCode: req.params.eventCode },
      attributes: [
        "id","name","status","category","activeRound",
        "currentQuestionIdx","audienceScreenMode",
      ],
    });
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (event.audienceScreenMode === "private")
      return res.status(403).json({ message: "This event is not public" });

    if (event.audienceScreenMode === "link") {
      const { accessCode } = req.query;
      if (accessCode !== event.audienceAccessCode)
        return res.status(403).json({ message: "Invalid access code" });
    }

    // Return sanitised state (no correct answers, no participant answers)
    const round = event.activeRound
      ? await QuizRound.findOne({ where: { eventId: event.id, roundNumber: event.activeRound } })
      : null;

    let currentQuestion = null;
    if (round) {
      const rq = await QuizRoundQuestion.findOne({
        where:   { roundId: round.id, status: { [Op.in]: ["open","revealed"] } },
        include: [{
          model: QuizQuestion,
          attributes: { exclude: ["correctAnswer"] },
        }],
        order: [["sequenceNumber","DESC"]],
      });
      if (rq) {
        currentQuestion = {
          sequenceNumber: rq.sequenceNumber,
          status:         rq.status,
          question:       rq.QuizQuestion,
          openedAt:       rq.openedAt,
        };
      }
    }

    // Leaderboard (scores, no individual answers)
    const scores = round
      ? await QuizScore.findAll({
          where:   { eventId: event.id, roundId: round.id },
          include: [{ model: QuizParticipant, attributes: ["id","name","school","displayNumber","photoUrl"] }],
          order:   [["totalMarks","DESC"]],
        })
      : [];

    res.json({
      event:           { id: event.id, name: event.name, status: event.status, category: event.category },
      activeRound:     event.activeRound,
      currentQuestion,
      leaderboard:     scores.map((s, i) => ({
        rank:          i + 1,
        name:          s.QuizParticipant?.name,
        school:        s.QuizParticipant?.school,
        displayNumber: s.QuizParticipant?.displayNumber,
        photoUrl:      s.QuizParticipant?.photoUrl,
        totalMarks:    s.totalMarks,
        correctCount:  s.correctCount,
      })),
    });
  } catch (err) {
    console.error("getAudienceState:", err);
    res.status(500).json({ message: "Failed to get audience state" });
  }
};
