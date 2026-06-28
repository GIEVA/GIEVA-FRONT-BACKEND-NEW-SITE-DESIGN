// services/adminSessionService.js
// All calls map to app.use("/admin/live-session", adminClassSessionRoutes)

import API from "./api";

const BASE = "/admin/live-session";

// ── Analytics & Overview ──────────────────────────────────────

export const getSessionAnalytics = (params = {}) =>
  API.get(`${BASE}/analytics`, { params }).then((r) => r.data);

export const getLiveSessions = () =>
  API.get(`${BASE}/live`).then((r) => r.data);

export const getTutorHours = (params = {}) =>
  API.get(`${BASE}/tutor-hours`, { params }).then((r) => r.data);

// ── Session List ──────────────────────────────────────────────

export const getAllSessions = (params = {}) =>
  API.get(`${BASE}/`, { params }).then((r) => r.data);

export const getSessionsByCourse = (courseId, params = {}) =>
  API.get(`${BASE}/course/${courseId}`, { params }).then((r) => r.data);

// ── Single Session ────────────────────────────────────────────

export const getSessionDetail = (sessionId) =>
  API.get(`${BASE}/${sessionId}`).then((r) => r.data);

export const getSessionAttendance = (sessionId) =>
  API.get(`${BASE}/${sessionId}/attendance`).then((r) => r.data);

export const exportAttendanceCSV = (sessionId) =>
  API.get(`${BASE}/${sessionId}/attendance/export`, { responseType: "blob" }).then((r) => r.data);

export const overrideAttendance = (sessionId, body) =>
  API.post(`${BASE}/${sessionId}/attendance/override`, body).then((r) => r.data);

export const getSessionLink = (sessionId) =>
  API.get(`${BASE}/${sessionId}/link`).then((r) => r.data);

export const joinAsObserver = (sessionId) =>
  API.get(`${BASE}/${sessionId}/observe`).then((r) => r.data);

// ── Session Actions ───────────────────────────────────────────

export const adminScheduleSession = (body) =>
  API.post(`${BASE}/schedule`, body).then((r) => r.data);

export const rescheduleSession = (sessionId, body) =>
  API.patch(`${BASE}/${sessionId}/reschedule`, body).then((r) => r.data);

export const forceEndSession = (sessionId, reason = "") =>
  API.patch(`${BASE}/${sessionId}/force-end`, { reason }).then((r) => r.data);

export const cancelSession = (sessionId, reason = "") =>
  API.patch(`${BASE}/${sessionId}/cancel`, { reason }).then((r) => r.data);

export const deleteSession = (sessionId) =>
  API.delete(`${BASE}/${sessionId}`).then((r) => r.data);

export const updateRecordingStatus = (sessionId, body) =>
  API.patch(`${BASE}/${sessionId}/recording`, body).then((r) => r.data);


// ── Public Meetings (NEW) ──────────────────────────────────────
//
// Public meetings live on the main session API (/api/session/...),
// NOT the /admin/live-session analytics API, because they reuse the
// exact same join/waiting-room/admit machinery as course sessions.
// Scheduling them, however, is still an admin-only action, so it's
// grouped here alongside the other admin scheduling calls.

const SESSION_BASE = "/api/session";

/**
 * Admin schedules a public meeting — no course, no enrollment.
 * Anyone can later browse it via listPublicMeetings() and request
 * to join through the normal waiting-room flow.
 */
export const scheduleAdminPublicMeeting = (body) =>
  API.post(`${SESSION_BASE}/admin/public-meetings`, body).then((r) => r.data);

/**
 * Browse public meetings (used in the admin dashboard to show
 * "your scheduled public meetings" alongside course sessions).
 */
export const listPublicMeetings = (status) =>
  API.get(`${SESSION_BASE}/public-meetings`, { params: status ? { status } : {} }).then((r) => r.data);

/**
 * Admin/organizer claims the host token to start/run a public meeting.
 */
export const joinPublicMeetingAsHost = (sessionId) =>
  API.get(`${SESSION_BASE}/public-meetings/${sessionId}/join-host`).then((r) => r.data);
