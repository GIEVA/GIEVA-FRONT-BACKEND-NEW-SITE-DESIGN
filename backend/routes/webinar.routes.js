// routes/webinar.routes.js
// Mount:  app.use("/api/webinars", webinarRoutes);

import express from "express";
import { authenticate } from "../middleware/auth.js";
import {
  createWebinar, updateWebinar, cancelWebinar, listWebinars, getWebinar, joinWebinar, endWebinar,
} from "../controllers/webinarSession.controller.js";
import {
  getMyWebinarRole, updateWebinarSettings, listTeam, searchUsers, assignTeamMember, removeTeamMember,
  promoteToPanelist, demoteToAttendee, listQuestions, askQuestion, voteQuestion, updateQuestion,
  deleteQuestion, exportQuestionsCsv, startLiveStream, stopLiveStream, liveStreamStatus, getPublicWebinarInfo,
} from "../controllers/webinar.controller.js";

const router = express.Router();

router.get("/info/:sessionId", getPublicWebinarInfo); // no login: the room needs it to pick its layout

router.use(authenticate);

// Schedule / manage (admin)
router.post("/", createWebinar);
router.get("/", listWebinars);                  // ?scope=all (admin) | mine | upcoming (default)
router.get("/users/search", authenticate, searchUsers);       // admin people picker
router.get("/:id", getWebinar);
router.put("/:id", updateWebinar);
router.delete("/:id", cancelWebinar);

// Run it
router.post("/:id/join", joinWebinar);
router.post("/:id/end", endWebinar);

// Per-session tools (the room uses sessionId)
router.get("/sessions/:sessionId/me", getMyWebinarRole);
router.put("/sessions/:sessionId/settings", updateWebinarSettings);

router.get("/sessions/:sessionId/team", listTeam);
router.post("/sessions/:sessionId/team", assignTeamMember);
router.delete("/sessions/:sessionId/team/:userId", removeTeamMember);

router.post("/sessions/:sessionId/promote/:userId", promoteToPanelist);
router.post("/sessions/:sessionId/demote/:userId", demoteToAttendee);

router.get("/sessions/:sessionId/questions", listQuestions);
router.post("/sessions/:sessionId/questions", askQuestion);
router.get("/sessions/:sessionId/questions/export", exportQuestionsCsv);
router.post("/questions/:questionId/vote", voteQuestion);
router.patch("/questions/:questionId", updateQuestion);
router.delete("/questions/:questionId", deleteQuestion);

router.get("/sessions/:sessionId/stream", liveStreamStatus);
router.post("/sessions/:sessionId/stream/start", startLiveStream);
router.post("/sessions/:sessionId/stream/stop", stopLiveStream);

export default router;
