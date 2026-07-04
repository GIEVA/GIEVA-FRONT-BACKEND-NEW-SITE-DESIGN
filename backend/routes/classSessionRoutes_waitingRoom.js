// // routes/classSessionRoutes.js  — ADD THESE ROUTES to your existing file
// // (shown as a standalone file for clarity; merge into your router)

// import express from "express";
// import { authenticate } from "../middleware/auth.js";
// import {
//   // existing
//   scheduleClassSession,
//   getTutorSessions,
//   getStudentSessions,
//   getSessionById,
//   cancelSession,
//   endSession,
//   getSessionAttendance,
//   getSessionRecording,
//   markAttendance,
//   leaveSession,
//   getSessionParticipants,
//   raiseHand,
//   sendReaction,
//   startRecording,
//   stopRecording,
//   // new waiting-room functions
//   joinClassSession,
//   joinAsTutor,
//   admitParticipant,
//   denyParticipant,
//   getWaitingRoom,
//   getParticipantToken,
//   resolvePublicMeetingLink,


// } from "../controllers/classSessionController.js";

// const router = express.Router();

// router.use(authenticate);

// // ── Schedule ──────────────────────────────────────────────────────
// router.post("/schedule",              scheduleClassSession);

// // ── Session listings ─────────────────────────────────────────────
// router.get("/tutor/my-sessions",      getTutorSessions);
// router.get("/student/my-sessions",    getStudentSessions);

// // ── Join ─────────────────────────────────────────────────────────
// /**
//  * GET  /api/session/join/:sessionId
//  * Student joins → receives a LOBBY token (waiting room).
//  * The frontend should then listen for the ADMITTED data message
//  * and call /participant-token to swap to a full token.
//  */
// router.get("/join/:sessionId",        joinClassSession);

// /**
//  * GET  /api/session/tutor/join/:sessionId
//  * Tutor joins → receives a HOST token immediately.
//  */
// router.get("/tutor/join/:sessionId",  joinAsTutor);

// /**
//  * POST /api/session/:sessionId/participant-token
//  * Called by the student AFTER they receive the ADMITTED data message.
//  * Returns a full participant token (canPublish: true).
//  */
// router.post("/:sessionId/participant-token", getParticipantToken);

// // ── Waiting room ─────────────────────────────────────────────────
// /**
//  * GET  /api/session/:sessionId/waiting-room
//  * Returns the list of users currently waiting (host / admin only).
//  */
// router.get("/:sessionId/waiting-room", getWaitingRoom);

// /**
//  * POST /api/session/:sessionId/admit/:userId
//  * Host admits a waiting participant.
//  */
// router.post("/:sessionId/admit/:userId", admitParticipant);

// /**
//  * POST /api/session/:sessionId/deny/:userId
//  * Host denies a waiting participant.
//  * Body: { reason? }
//  */
// router.post("/:sessionId/deny/:userId", denyParticipant);

// // ── Session management ───────────────────────────────────────────
// router.get("/:sessionId",             getSessionById);
// router.patch("/:sessionId/cancel",    cancelSession);
// router.patch("/:sessionId/end",       endSession);

// // ── Attendance ───────────────────────────────────────────────────
// router.get("/:sessionId/attendance",  getSessionAttendance);
// router.post("/:id/attendance",        markAttendance);
// router.patch("/:id/leave",            leaveSession);
// router.get("/:id/participants",       getSessionParticipants);

// // ── Recording ────────────────────────────────────────────────────
// router.get("/:sessionId/recording",   getSessionRecording);
// router.post("/:id/recording/start",   startRecording);
// router.post("/:id/recording/stop",    stopRecording);

// // ── Reactions / events ───────────────────────────────────────────
// router.post("/:id/raise-hand",        raiseHand);
// router.post("/:id/reaction",          sendReaction);

// router.get("/public-meetings/resolve/:roomName", resolvePublicMeetingLink); 

// export default router;
