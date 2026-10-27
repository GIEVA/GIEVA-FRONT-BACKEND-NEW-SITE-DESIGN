// routes/sessionTools.routes.js
// Mount with:  app.use("/api/session-tools", sessionToolsRoutes);

import express from "express";

// ⚠️ CHANGE THIS to whatever middleware your other routes use to set req.user ({ id, role, ... }).
import { authenticate } from "../middleware/auth.js";

import {
  createPoll,
  listPolls,
  getPoll,
  launchPoll,
  closePoll,
  respondToPoll,
  getPollResults,
  exportPollCSV,
  deletePoll,
} from "../controllers/sessionPoll.controller.js";

import {
  startRecording,
  stopRecording,
  getRecording,
  getRecordingStatus,
  regenerateRecordingNotes,
} from "../controllers/sessionRecording.controller.js";

import { muteAllParticipants, askToUnmute } from "../controllers/roomControls.controller.js";

const router = express.Router();
router.use(authenticate);

// ── Polls & surveys ──
router.post("/sessions/:sessionId/polls", createPoll);
router.get("/sessions/:sessionId/polls", listPolls);
router.get("/polls/:pollId", getPoll);
router.post("/polls/:pollId/launch", launchPoll);
router.post("/polls/:pollId/close", closePoll);
router.post("/polls/:pollId/respond", respondToPoll);
router.get("/polls/:pollId/results", getPollResults);
router.get("/polls/:pollId/export", exportPollCSV);
router.delete("/polls/:pollId", deletePoll);

// ── Recording & AI notes ──
router.post("/sessions/:sessionId/recording/start", startRecording);
router.post("/sessions/:sessionId/recording/stop", stopRecording);
router.get("/sessions/:sessionId/recording/status", getRecordingStatus);
router.get("/sessions/:sessionId/recording", getRecording);
router.post("/recordings/:recordingId/notes/regenerate", regenerateRecordingNotes);

// ── Room moderation ──
router.post("/sessions/:sessionId/room/mute-all", muteAllParticipants);
router.post("/sessions/:sessionId/room/ask-unmute/:identity", askToUnmute);

export default router;
