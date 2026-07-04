// services/publicMeetingService.js
//
// FIX: resolvePublicMeetingLink and listPublicMeetings now use a plain
// unauthenticated axios instance instead of the main `API` instance.
//
// WHY: The main API instance attaches "Authorization: Bearer <token>"
// from localStorage. A guest in a fresh browser has no token, so
// the request arrives at the server with no Bearer header, the
// authenticate() middleware fires and returns 401, and then the
// response interceptor redirects to /login — the guest never
// reaches the meeting. Using a separate plain axios instance for
// these two public endpoints sidesteps all of that.

import API from "./api";
import axios from "axios";

// Plain unauthenticated instance — no interceptors, no token.
// Used only for the two publicly accessible discovery endpoints.
const PUBLIC_API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000",
  headers: { "Content-Type": "application/json" },
});

const BASE = "/api/session";

// ── Public endpoints (no auth required) ───────────────────────

/**
 * Resolve a shared join link's roomName → sessionId.
 * Used by PublicMeetingRedirect when someone pastes a shared link.
 * Uses PUBLIC_API — guests have no token.
 */
export const resolvePublicMeetingLink = (roomName) =>
  PUBLIC_API.get(`${BASE}/public-meetings/resolve/${roomName}`)
    .then((r) => r.data);

/**
 * Browse open public meetings (no login needed — public listings).
 * Uses PUBLIC_API — guests have no token.
 */
export const listPublicMeetings = (status) =>
  PUBLIC_API.get(`${BASE}/public-meetings`, {
    params: status ? { status } : {},
  }).then((r) => r.data);

// ── Authenticated endpoints (require login) ────────────────────

export const joinPublicMeetingAsHost = (sessionId) =>
  API.get(`${BASE}/public-meetings/${sessionId}/join-host`).then((r) => r.data);

export const getWaitingRoom = (sessionId) =>
  API.get(`${BASE}/${sessionId}/waiting-room`).then((r) => r.data);

export const admitParticipant = (sessionId, userId) =>
  API.post(`${BASE}/${sessionId}/admit/${userId}`).then((r) => r.data);

export const denyParticipant = (sessionId, userId, reason = "") =>
  API.post(`${BASE}/${sessionId}/deny/${userId}`, { reason }).then((r) => r.data);

export const getParticipantToken = (sessionId) =>
  API.post(`${BASE}/${sessionId}/participant-token`).then((r) => r.data);

export const leaveAttendance = (sessionId) =>
  API.patch(`${BASE}/${sessionId}/leave`).then((r) => r.data);

export const endSession = (sessionId) =>
  API.patch(`${BASE}/${sessionId}/end`).then((r) => r.data);

export const cancelSession = (sessionId, reason = "") =>
  API.patch(`${BASE}/${sessionId}/cancel`, { reason }).then((r) => r.data);

export const getSessionById = (sessionId) =>
  API.get(`${BASE}/${sessionId}`).then((r) => r.data);