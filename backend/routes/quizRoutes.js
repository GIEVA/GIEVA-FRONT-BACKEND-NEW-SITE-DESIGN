// routes/quizRoutes.js

import express from "express";
import { authenticate } from "../middleware/auth.js";

import {
  createEvent,
  listEvents,
  getEvent,
  updateEvent,
  publishEvent,
  addParticipant,
  addQuestion,
  approveQuestion,
  assignQuestionsToRound,
  startEvent,
  openNextQuestion,
  lockQuestion,
  revealResult,
  completeRound,
  getEliminationReview,
  confirmElimination,
  startTiebreak,
  pauseEvent,
  resumeEvent,
  voidQuestion,
  adjustScore,
  completeEvent,
  getPanelistDashboard,
  exportResults,
  addPanelist,
  logIncident,
  getEventByCode,
  getFinalRankingReview,
 restartEvent, updateQuestion, deleteQuestion, updateParticipant, deleteParticipant,
  deleteEvent, startRound1Tiebreak, getRound1TiebreakReview, getFinalLeaderboard
} from "../controllers/adminQuizEventController.js";

import {
  joinEvent,
  getEventState,
  submitAnswer,
  getMyResults,
  heartbeat,
  getAudienceState,
} from "../controllers/quizParticipantController.js";

const router = express.Router();

// ══════════════════════════════════════════════════════════════
// ADMIN — Event management
// ══════════════════════════════════════════════════════════════
router.post(  "/events",                           authenticate, createEvent);
router.get(   "/events",                           authenticate, listEvents);
router.get(   "/events/:id",                       authenticate, getEvent);
router.put(   "/events/:id",                       authenticate, updateEvent);
router.patch( "/events/:id/publish",               authenticate, publishEvent);

// Participants
router.post(  "/events/:id/participants",           authenticate, addParticipant);

// Questions
router.post(  "/events/:id/questions",             authenticate, addQuestion);
router.patch( "/events/:id/questions/:qid/approve",authenticate, approveQuestion);

// Round question assignment
router.post(  "/events/:id/rounds/:roundId/assign-questions", authenticate, assignQuestionsToRound);

// Live event control
router.patch( "/events/:id/start",                 authenticate, startEvent);
router.patch( "/events/:id/next-question",         authenticate, openNextQuestion);
router.patch( "/events/:id/lock-question",         authenticate, lockQuestion);
router.patch( "/events/:id/reveal-result",         authenticate, revealResult);
router.patch( "/events/:id/complete-round",        authenticate, completeRound);
router.patch( "/events/:id/pause",                 authenticate, pauseEvent);
router.patch( "/events/:id/resume",                authenticate, resumeEvent);
router.patch( "/events/:id/complete",              authenticate, completeEvent);

// Elimination & tiebreak
router.get(   "/events/:id/elimination-review",    authenticate, getEliminationReview);
router.post(  "/events/:id/confirm-elimination",   authenticate, confirmElimination);
router.post(  "/events/:id/start-tiebreak",        authenticate, startTiebreak);

// Score & question management
router.patch( "/events/:id/void-question/:rqId",   authenticate, voidQuestion);
router.patch( "/events/:id/adjust-score",          authenticate, adjustScore);

// Panelist & dashboard
router.post(  "/events/:id/panelists",             authenticate, addPanelist);
router.get(   "/events/:id/dashboard",             authenticate, getPanelistDashboard);


router.get("/:id/final-leaderboard", authenticate, getFinalLeaderboard);

router.delete("/events/:id",                          authenticate, deleteEvent);
router.post  ("/events/:id/start-round1-tiebreak",     authenticate, startRound1Tiebreak);
router.get   ("/events/:id/round1-tiebreak-review",    authenticate, getRound1TiebreakReview);

// Incidents & export
router.post(  "/events/:id/incidents",             authenticate, logIncident);
router.get(   "/events/:id/export",                authenticate, exportResults);

// routes/quizRoutes.js — add alongside your other authenticated admin routes
router.get("/events/by-code/:eventCode", authenticate, getEventByCode);

router.get("/events/:id/final-ranking-review", authenticate, getFinalRankingReview);

router.patch ("/events/:id/restart",                    authenticate, restartEvent);
router.patch ("/events/:id/questions/:qid",              authenticate, updateQuestion);
router.delete("/events/:id/questions/:qid",              authenticate, deleteQuestion);
router.patch ("/events/:id/participants/:pid",           authenticate, updateParticipant);
router.delete("/events/:id/participants/:pid",           authenticate, deleteParticipant);

// ══════════════════════════════════════════════════════════════
// PARTICIPANT — No auth (join by code)
// ══════════════════════════════════════════════════════════════
router.post("/join",                                             joinEvent);
router.get( "/events/:eventId/state/:participantId",            getEventState);
router.post("/events/:eventId/answer",                          submitAnswer);
router.get( "/events/:eventId/my-results/:participantId",       getMyResults);
router.post("/events/:eventId/heartbeat",                       heartbeat);

// ══════════════════════════════════════════════════════════════
// AUDIENCE — Public read (no auth, no answers exposed)
// ══════════════════════════════════════════════════════════════
router.get("/audience/:eventCode",                              getAudienceState);

export default router;

// ── Add to server.js ──────────────────────────────────────────
// import quizRoutes from "./routes/quizRoutes.js";
// app.use("/api/quiz", quizRoutes);