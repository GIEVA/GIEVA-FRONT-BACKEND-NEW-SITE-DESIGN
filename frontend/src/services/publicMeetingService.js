// services/publicMeetingService.js
//
// Student/attendee-facing service for PUBLIC meetings.
// These hit the same /api/session base as classSessionService.js
// (NOT the /admin/live-session base used by adminSessionService.js).
//
// Scheduling a public meeting is an ADMIN action — see
// adminSessionService.js → use `scheduleAdminPublicMeeting` there.
// This file is for everyone else: browsing, requesting to join,
// and polling admission status.

import API from "./api";

const BASE = "/api/session";

// ── Discovery ──────────────────────────────────────────────────

/**
 * Browse open public meetings (no enrollment needed).
 * @param {"scheduled"|"live"|"ended"|undefined} status
 */
export const listPublicMeetings = (status) =>
  API.get(`${BASE}/public-meetings`, { params: status ? { status } : {} }).then((r) => r.data);

/**
 * Resolve a shared join link's roomName back to a sessionId,
 * for "paste a meeting link" flows.
 */
export const resolvePublicMeetingLink = (roomName) =>
  API.get(`${BASE}/public-meetings/resolve/${roomName}`).then((r) => r.data);

// ── Joining ─────────────────────────────────────────────────────

/**
 * Request to join a public meeting (or course session) as an attendee.
 * Returns a LOBBY token — the attendee waits until admitted.
 */
export const joinClassSession = (sessionId) =>
  API.get(`${BASE}/join/${sessionId}`).then((r) => r.data);

/**
 * Organizer / admin claims the host token for a public meeting.
 */
export const joinPublicMeetingAsHost = (sessionId) =>
  API.get(`${BASE}/public-meetings/${sessionId}/join-host`).then((r) => r.data);

// ── Waiting room (shared with course sessions) ──────────────────

export const getWaitingRoom = (sessionId) =>
  API.get(`${BASE}/${sessionId}/waiting-room`).then((r) => r.data);

export const admitParticipant = (sessionId, userId) =>
  API.post(`${BASE}/${sessionId}/admit/${userId}`).then((r) => r.data);

export const denyParticipant = (sessionId, userId, reason = "") =>
  API.post(`${BASE}/${sessionId}/deny/${userId}`, { reason }).then((r) => r.data);

export const getParticipantToken = (sessionId) =>
  API.post(`${BASE}/${sessionId}/participant-token`).then((r) => r.data);

// ── Status polling (lobby screen) ────────────────────────────────

/**
 * Cheap poll — does NOT mint a token, just checks the waiting-room
 * row's current status. Use this in the lobby screen; once it
 * returns "admitted", call getParticipantToken() once to get the
 * real LiveKit token and reconnect.
 */
export const checkAdmissionStatus = (sessionId) =>
  API.get(`${BASE}/${sessionId}/admission-status`).then((r) => r.data);

// ── Session actions shared with course sessions ──────────────────

export const leaveAttendance = (sessionId) =>
  API.patch(`${BASE}/${sessionId}/leave`).then((r) => r.data);

export const endSession = (sessionId) =>
  API.patch(`${BASE}/${sessionId}/end`).then((r) => r.data);

export const cancelSession = (sessionId, reason = "") =>
  API.patch(`${BASE}/${sessionId}/cancel`, { reason }).then((r) => r.data);

export const getSessionById = (sessionId) =>
  API.get(`${BASE}/${sessionId}`).then((r) => r.data);
