// services/publicMeetingService.js

import API from "./api";
import axios from "axios";

// ── PUBLIC_API: same baseURL as the main API instance, but with
//    NO request/response interceptors so unauthenticated guests
//    can call public endpoints without triggering the "session
//    expired → redirect to /login" interceptor.
//
//    We derive the baseURL directly from the API instance so there
//    is ONE place to update the backend URL (api.js), and both
//    instances always stay in sync automatically.
const PUBLIC_API = axios.create({
  baseURL: API.defaults.baseURL,          // ← mirrors api.js exactly
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

const BASE = "/api/session";

// ── Public endpoints (no auth, no token needed) ────────────────

export const resolvePublicMeetingLink = (roomName) =>
  PUBLIC_API.get(`${BASE}/public-meetings/resolve/${roomName}`)
    .then((r) => r.data);

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