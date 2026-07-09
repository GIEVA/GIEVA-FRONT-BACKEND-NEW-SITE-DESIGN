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
  guestJoinPublicMeeting,
  guestCheckAdmissionStatus,
  guestGetParticipantToken,
  admitParticipantGuestAware,   // ← replaces admitParticipant in route wiring below
  denyParticipantGuestAware,
  rescheduleSession,
  muteParticipant, 
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
router.get("/public-meetings", listPublicMeetings);

// Resolve a shared join link (roomName) → session info, for "paste a link" flows
router.get("/public-meetings/resolve/:roomName", resolvePublicMeetingLink);

// The meeting organizer (or any admin) claims the host token
router.get("/public-meetings/:sessionId/join-host", authenticate, joinAsHost);

router.post("/:sessionId/mute/:identity", authenticate, muteParticipant);
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





// ══════════════════════════════════════════════════════════════
// GUEST ROUTES — CRITICAL: no `authenticate` middleware on these.
// These are the ONLY three endpoints in the entire app that should
// be reachable without a valid Bearer token, and ONLY because the
// controller internally re-validates that the target session is
// sessionType === "public" before doing anything else.
// ══════════════════════════════════════════════════════════════
 
router.post("/public-meetings/:sessionId/guest-join", guestJoinPublicMeeting);
router.get("/public-meetings/:sessionId/guest-admission-status", guestCheckAdmissionStatus);
router.post("/public-meetings/:sessionId/guest-participant-token", guestGetParticipantToken);
 
// ══════════════════════════════════════════════════════════════
// UPDATE existing admit/deny routes to use the guest-aware versions
// ══════════════════════════════════════════════════════════════
// Replace your existing two lines:
//   router.post("/:sessionId/admit/:userId", authenticate, admitParticipant);
//   router.post("/:sessionId/deny/:userId", authenticate, denyParticipant);
// WITH:
 
router.post("/:sessionId/admit/:userId", authenticate, admitParticipantGuestAware);
router.post("/:sessionId/deny/:userId", authenticate, denyParticipantGuestAware);
 
// (admitParticipant / denyParticipant — the originals — are no longer
// referenced by any route once this change is applied; you can leave
// them defined and unused in the controller, or remove them.)
 


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

 router.patch("/:sessionId/reschedule", authenticate, rescheduleSession);

//router.get("/public-meetings/resolve/:roomName", resolvePublicMeetingLink);

export default router;