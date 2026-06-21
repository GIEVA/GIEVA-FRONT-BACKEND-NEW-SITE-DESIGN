// routes/adminClassSessionRoutes.js
// All routes require authentication + admin/superadmin/operational_admin role.
// Mount in your main router as:  app.use("/api/admin/sessions", adminSessionRouter)

import express from "express";
import { authenticate } from "../middleware/auth.js"; // your existing JWT middleware
import {
  adminScheduleSession,
  adminGetAllSessions,
  adminGetSessionDetail,
  adminGetSessionAttendance,
  adminExportAttendanceCSV,
  adminGetTutorHours,
  adminGetSessionAnalytics,
  adminGetSessionLink,
  adminJoinAsObserver,
  adminForceEndSession,
  adminCancelSession,
  adminRescheduleSession,
  adminDeleteSession,
  adminUpdateRecordingStatus,
  adminOverrideAttendance,
  adminGetSessionsByCourse,
  adminGetLiveSessions,
} from "../controllers/adminClassSessionController.js";

const router = express.Router();

// ─────────────────────────────────────────────────────────────
// All routes require a valid JWT + admin role.
// The controller functions call requireAdmin() internally,
// but authenticate() is still needed to populate req.user.
// ─────────────────────────────────────────────────────────────

router.use(authenticate);

// ──────────────────────────────────────────────────────────────
// SCHEDULE & MANAGE
// ──────────────────────────────────────────────────────────────

/**
 * POST /api/admin/sessions/schedule
 * Schedule a session on behalf of any tutor.
 * Body: { title, description, courseId, tutorProfileId, scheduledAt,
 *         durationMinutes, visibility?, notifyStudents? }
 */
router.post("/schedule", adminScheduleSession);

/**
 * GET /api/admin/sessions
 * List all sessions (paginated).
 * Query: page, limit, status, courseId, tutorProfileId, search, from, to
 */
router.get("/", adminGetAllSessions);

/**
 * GET /api/admin/sessions/live
 * All sessions currently live RIGHT NOW.
 */
router.get("/live", adminGetLiveSessions);

/**
 * GET /api/admin/sessions/analytics
 * Platform-wide session analytics overview.
 * Query: from?, to?
 */
router.get("/analytics", adminGetSessionAnalytics);

/**
 * GET /api/admin/sessions/tutor-hours
 * Lecture hours breakdown per tutor.
 * Query: from?, to?, tutorProfileId?
 */
router.get("/tutor-hours", adminGetTutorHours);

/**
 * GET /api/admin/sessions/course/:courseId
 * All sessions for a specific course.
 * Query: status?
 */
router.get("/course/:courseId", adminGetSessionsByCourse);

// ──────────────────────────────────────────────────────────────
// SINGLE SESSION OPERATIONS
// ──────────────────────────────────────────────────────────────

/**
 * GET /api/admin/sessions/:sessionId
 * Full detail for one session including attendance summary.
 */
router.get("/:sessionId", adminGetSessionDetail);

/**
 * GET /api/admin/sessions/:sessionId/attendance
 * Detailed attendance roster for a session.
 */
router.get("/:sessionId/attendance", adminGetSessionAttendance);

/**
 * GET /api/admin/sessions/:sessionId/attendance/export
 * Download attendance roster as CSV.
 */
router.get("/:sessionId/attendance/export", adminExportAttendanceCSV);

/**
 * POST /api/admin/sessions/:sessionId/attendance/override
 * Manually mark a student present/absent.
 * Body: { userId, wasPresent, totalMinutes? }
 */
router.post("/:sessionId/attendance/override", adminOverrideAttendance);

/**
 * GET /api/admin/sessions/:sessionId/link
 * Get join link + generate admin observer token for a session.
 */
router.get("/:sessionId/link", adminGetSessionLink);

/**
 * GET /api/admin/sessions/:sessionId/observe
 * Admin joins a live session as read-only observer.
 */
router.get("/:sessionId/observe", adminJoinAsObserver);

/**
 * PATCH /api/admin/sessions/:sessionId/reschedule
 * Reschedule a session and notify students.
 * Body: { scheduledAt, durationMinutes?, notifyStudents? }
 */
router.patch("/:sessionId/reschedule", adminRescheduleSession);

/**
 * PATCH /api/admin/sessions/:sessionId/force-end
 * Force-end a running or scheduled session.
 * Body: { reason? }
 */
router.patch("/:sessionId/force-end", adminForceEndSession);

/**
 * PATCH /api/admin/sessions/:sessionId/cancel
 * Cancel a session with reason + notify all parties.
 * Body: { reason? }
 */
router.patch("/:sessionId/cancel", adminCancelSession);

/**
 * PATCH /api/admin/sessions/:sessionId/recording
 * Override recording status / set recording URL manually.
 * Body: { recordingStatus, recordingUrl?, recordingDuration? }
 */
router.patch("/:sessionId/recording", adminUpdateRecordingStatus);

/**
 * DELETE /api/admin/sessions/:sessionId
 * Permanently delete a session and all its attendance records.
 * (Blocked if session is live.)
 */
router.delete("/:sessionId", adminDeleteSession);

export default router;
