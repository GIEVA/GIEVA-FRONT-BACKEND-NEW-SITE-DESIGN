// services/tutorSessionService.js
//
// Tutor-facing service for live class session management.
// These hit /api/session (the main classSessionRoutes) using the
// tutor's auth token — same controller, different privilege level
// from the admin routes.

import API from "./api";

const BASE = "/api/session";

// ── Existing (carried through unchanged) ──────────────────────

export const getTutorSessions = () =>
  API.get(`${BASE}/tutor/my-sessions`).then((r) => r.data);

export const scheduleClassSession = (body) =>
  API.post(`${BASE}/schedule`, body).then((r) => r.data);

export const joinTutorSession = (sessionId) =>
  API.get(`${BASE}/tutor/join/${sessionId}`).then((r) => r.data);

export const endSession = (sessionId) =>
  API.patch(`${BASE}/${sessionId}/end`).then((r) => r.data);

export const cancelSession = (sessionId, reason = "") =>
  API.patch(`${BASE}/${sessionId}/cancel`, { reason }).then((r) => r.data);

export const getSessionById = (sessionId) =>
  API.get(`${BASE}/${sessionId}`).then((r) => r.data);

// ── NEW: Reschedule ───────────────────────────────────────────
// PATCH /api/session/:sessionId/reschedule
// Body: { scheduledAt, durationMinutes, reason? }
export const rescheduleSession = (sessionId, body) =>
  API.patch(`${BASE}/${sessionId}/reschedule`, body).then((r) => r.data);

// ── NEW: Force end (tutor version of admin force-end) ─────────
// PATCH /api/session/:sessionId/end  (same endpoint, tutor-gated
// in the controller via isSessionHostOrAdmin check)
export const forceEndSession = (sessionId, reason = "") =>
  API.patch(`${BASE}/${sessionId}/end`, { reason }).then((r) => r.data);

// ── NEW: Full session detail with attendance ──────────────────
export const getSessionDetail = (sessionId) =>
  API.get(`${BASE}/${sessionId}`).then((r) => r.data);

export const getSessionAttendance = (sessionId) =>
  API.get(`${BASE}/${sessionId}/attendance`).then((r) => r.data);

export const getWaitingRoom = (sessionId) =>
  API.get(`${BASE}/${sessionId}/waiting-room`).then((r) => r.data);

export const admitParticipant = (sessionId, userId) =>
  API.post(`${BASE}/${sessionId}/admit/${userId}`).then((r) => r.data);

export const denyParticipant = (sessionId, userId, reason = "") =>
  API.post(`${BASE}/${sessionId}/deny/${userId}`, { reason }).then((r) => r.data);
