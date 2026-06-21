import express from "express";
import {
  scheduleClassSession,
  joinClassSession,
  joinAsTutor,
  admitParticipant,
  denyParticipant,
  getWaitingRoom,
  getParticipantToken,
  getTutorSessions,
  getStudentSessions,
  getSessionById,
  cancelSession,
  endSession,
  getSessionAttendance,
  getSessionRecording,
  getSessionParticipants,
  markAttendance,
  sendReaction,
  raiseHand,
  startRecording,
  stopRecording,
  leaveSession,

} from "../controllers/classSessionController.js";

import {
  authenticate,
} from "../middleware/auth.js";

const router =
  express.Router();



// ======================================================
// SCHEDULE CLASS
// ======================================================

router.post(
  "/schedule",
  authenticate,
  scheduleClassSession
);



// ======================================================
// JOIN AS STUDENT
// ======================================================

router.get(
  "/join/:sessionId",
  authenticate,
  joinClassSession
);



// ======================================================
// JOIN AS TUTOR
// ======================================================

router.get(
  "/tutor/join/:sessionId",
  authenticate,
  joinAsTutor
);


/**
 * POST /api/session/:sessionId/participant-token
 * Called by the student AFTER they receive the ADMITTED data message.
 * Returns a full participant token (canPublish: true).
 */
router.post("/:sessionId/participant-token",authenticate, getParticipantToken);

// ── Waiting room ─────────────────────────────────────────────────
/**
 * GET  /api/session/:sessionId/waiting-room
 * Returns the list of users currently waiting (host / admin only).
 */
router.get("/:sessionId/waiting-room", authenticate, getWaitingRoom);

/**
 * POST /api/session/:sessionId/admit/:userId
 * Host admits a waiting participant.
 */
router.post("/:sessionId/admit/:userId", authenticate, admitParticipant);

/**
 * POST /api/session/:sessionId/deny/:userId
 * Host denies a waiting participant.
 * Body: { reason? }
 */
router.post("/:sessionId/deny/:userId", authenticate, denyParticipant);

// ======================================================
// GET TUTOR SESSIONS
// ======================================================

router.get(
  "/tutor/my-sessions",
  authenticate,
  getTutorSessions
);


// ======================================================
// GET STUDENT SESSIONS
// ======================================================

router.get(
  "/student/my-sessions",
  authenticate,
  getStudentSessions
);


// ======================================================
// GET SINGLE SESSION
// ======================================================

router.get(
  "/:sessionId",
  authenticate,
  getSessionById
);


// ======================================================
// CANCEL SESSION
// ======================================================

router.patch(
  "/:sessionId/cancel",
  authenticate,
  cancelSession
);


// ======================================================
// END SESSION
// ======================================================

router.patch(
  "/:sessionId/end",
  authenticate,
  endSession
);


// ======================================================
// SESSION ATTENDANCE
// ======================================================

router.get(
  "/:sessionId/attendance",
  authenticate,
  getSessionAttendance
);


// ======================================================
// SESSION RECORDINGS
// ======================================================

router.get(
  "/:sessionId/recording",
  authenticate,
  getSessionRecording
);

router.post(
  "/:id/attendance",
  authenticate,
  markAttendance
);

router.patch(
  "/:id/leave",
  authenticate,
  leaveSession
);

router.get(
  "/:id/participants",
  authenticate,
  getSessionParticipants
);

router.post(
  "/:id/raise-hand",
  authenticate,
  raiseHand
);

router.post(
  "/:id/reaction",
  authenticate,
  sendReaction
);

router.post(
  "/:id/recording/start",
  authenticate,
  startRecording
);

router.post(
  "/:id/recording/stop",
  authenticate,
  stopRecording
);

export default router;