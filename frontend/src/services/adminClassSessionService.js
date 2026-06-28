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
