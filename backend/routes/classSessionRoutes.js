import express from "express";
import {
  scheduleClassSession,
  schedulePublicMeeting,
  listPublicMeetings,
  resolvePublicMeetingLink,
  joinClassSession,
  joinAsTutor,
  joinAsHost,
  admitParticipant,
  denyParticipant,
  getWaitingRoom,
  getParticipantToken,
  checkAdmissionStatus,
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

import { authenticate, authorizeRoles } from "../middleware/auth.js";
// NOTE: the routes file you pasted called `authorize(...)` but never
// imported it — that would throw "authorize is not defined" at module
// load time and crash the server on boot. Fixed above.

const router = express.Router();


// ======================================================
// SCHEDULE CLASS  (tutor, course-bound)
// ======================================================

router.post("/schedule", authenticate, scheduleClassSession);


// ======================================================
// PUBLIC MEETINGS  (admin-created, no course/enrollment needed)
// ======================================================

// Admin creates a public meeting
router.post(
  "/admin/public-meetings",
  authenticate,
  authorizeRoles("admin", "superadmin", "operational_admin"),
  schedulePublicMeeting
);

// Anyone authenticated can browse open public meetings
router.get("/public-meetings", authenticate, listPublicMeetings);

// Resolve a shared join link (roomName) → session info, for "paste a link" flows
router.get("/public-meetings/resolve/:roomName", authenticate, resolvePublicMeetingLink);

// The meeting organizer (or any admin) claims the host token
router.get("/public-meetings/:sessionId/join-host", authenticate, joinAsHost);


// ======================================================
// JOIN AS STUDENT / ATTENDEE  (works for BOTH course sessions
// and public meetings — controller branches on sessionType)
// ======================================================

router.get("/join/:sessionId", authenticate, joinClassSession);


// ======================================================
// JOIN AS TUTOR  (course sessions only)
// ======================================================

router.get("/tutor/join/:sessionId", authenticate, joinAsTutor);


/**
 * POST /api/session/:sessionId/participant-token
 * Called once the waiting-room status flips to "admitted".
 * Works for both course sessions and public meetings.
 */
router.post("/:sessionId/participant-token", authenticate, getParticipantToken);
router.get("/:sessionId/admission-status", authenticate, checkAdmissionStatus);


// ── Waiting room (host / admin) — works for both session types ──

router.get("/:sessionId/waiting-room", authenticate, getWaitingRoom);
router.post("/:sessionId/admit/:userId", authenticate, admitParticipant);
router.post("/:sessionId/deny/:userId", authenticate, denyParticipant);


// ======================================================
// GET TUTOR SESSIONS
// ======================================================

router.get("/tutor/my-sessions", authenticate, getTutorSessions);


// ======================================================
// GET STUDENT SESSIONS
// ======================================================

router.get("/student/my-sessions", authenticate, getStudentSessions);


// ======================================================
// GET SINGLE SESSION
// ======================================================

router.get("/:sessionId", authenticate, getSessionById);


// ======================================================
// CANCEL / END SESSION  (host or admin — works for both types)
// ======================================================

router.patch("/:sessionId/cancel", authenticate, cancelSession);
router.patch("/:sessionId/end", authenticate, endSession);


// ======================================================
// SESSION ATTENDANCE / RECORDINGS
// ======================================================

router.get("/:sessionId/attendance", authenticate, getSessionAttendance);
router.get("/:sessionId/recording", authenticate, getSessionRecording);

router.post("/:id/attendance", authenticate, markAttendance);
router.patch("/:id/leave", authenticate, leaveSession);
router.get("/:id/participants", authenticate, getSessionParticipants);
router.post("/:id/raise-hand", authenticate, raiseHand);
router.post("/:id/reaction", authenticate, sendReaction);
router.post("/:id/recording/start", authenticate, startRecording);
router.post("/:id/recording/stop", authenticate, stopRecording);

export default router;