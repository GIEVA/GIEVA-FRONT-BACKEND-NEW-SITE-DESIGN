// services/quizService.js
//
// Frontend API calls for the quiz system.
// Admin calls use the authenticated API instance.
// Participant/audience calls use PUBLIC_API (no token needed).

import API from "./api";
import axios from "axios";

const PUBLIC_API = axios.create({
  baseURL:         API.defaults.baseURL,
  headers:         { "Content-Type": "application/json" },
  withCredentials: true,
});

const BASE = "/api/live/quiz";

// ── Admin — Event management ───────────────────────────────────
export const createEvent           = (body)        => API.post(`${BASE}/events`, body).then((r) => r.data);
export const listEvents            = ()            => API.get(`${BASE}/events`).then((r) => r.data);
export const getEvent              = (id)          => API.get(`${BASE}/events/${id}`).then((r) => r.data);
export const updateEvent           = (id, body)    => API.put(`${BASE}/events/${id}`, body).then((r) => r.data);
export const publishEvent          = (id)          => API.patch(`${BASE}/events/${id}/publish`).then((r) => r.data);
export const addParticipant        = (id, body)    => API.post(`${BASE}/events/${id}/participants`, body).then((r) => r.data);
export const addQuestion           = (id, body)    => API.post(`${BASE}/events/${id}/questions`, body).then((r) => r.data);
export const approveQuestion       = (id, qid)     => API.patch(`${BASE}/events/${id}/questions/${qid}/approve`).then((r) => r.data);
export const assignQuestions       = (id, rId, questionIds) =>
  API.post(`${BASE}/events/${id}/rounds/${rId}/assign-questions`, { questionIds }).then((r) => r.data);

// Live control
export const startEvent            = (id)          => API.patch(`${BASE}/events/${id}/start`).then((r) => r.data);
export const openNextQuestion      = (id)          => API.patch(`${BASE}/events/${id}/next-question`).then((r) => r.data);
export const lockQuestion          = (id)          => API.patch(`${BASE}/events/${id}/lock-question`).then((r) => r.data);
export const revealResult          = (id)          => API.patch(`${BASE}/events/${id}/reveal-result`).then((r) => r.data);
export const completeRound         = (id)          => API.patch(`${BASE}/events/${id}/complete-round`).then((r) => r.data);
export const pauseEvent            = (id, reason)  => API.patch(`${BASE}/events/${id}/pause`, { reason }).then((r) => r.data);
export const resumeEvent           = (id)          => API.patch(`${BASE}/events/${id}/resume`).then((r) => r.data);
export const completeEvent         = (id)          => API.patch(`${BASE}/events/${id}/complete`).then((r) => r.data);

// Elimination & tiebreak
export const getEliminationReview  = (id)          => API.get(`${BASE}/events/${id}/elimination-review`).then((r) => r.data);
export const confirmElimination    = (id, body)    => API.post(`${BASE}/events/${id}/confirm-elimination`, body).then((r) => r.data);
export const startTiebreak         = (id, tiedParticipantIds) =>
  API.post(`${BASE}/events/${id}/start-tiebreak`, { tiedParticipantIds }).then((r) => r.data);

// Score & questions
export const voidQuestion          = (id, rqId, reason) =>
  API.patch(`${BASE}/events/${id}/void-question/${rqId}`, { reason }).then((r) => r.data);
export const adjustScore           = (id, body)    => API.patch(`${BASE}/events/${id}/adjust-score`, body).then((r) => r.data);

// Dashboard, panelist, incidents, export
export const getPanelistDashboard  = (id)          => API.get(`${BASE}/events/${id}/dashboard`).then((r) => r.data);
export const addPanelist           = (id, body)    => API.post(`${BASE}/events/${id}/panelists`, body).then((r) => r.data);
export const logIncident           = (id, body)    => API.post(`${BASE}/events/${id}/incidents`, body).then((r) => r.data);
export const exportResults         = (id)          => API.get(`${BASE}/events/${id}/export`).then((r) => r.data);

// ── Participant — no auth ──────────────────────────────────────
export const joinEvent             = (participantCode) =>
  PUBLIC_API.post(`${BASE}/join`, { participantCode }).then((r) => r.data);

export const getEventState         = (eventId, participantId) =>
  PUBLIC_API.get(`${BASE}/events/${eventId}/state/${participantId}`).then((r) => r.data);

export const submitAnswer          = (eventId, body) =>
  PUBLIC_API.post(`${BASE}/events/${eventId}/answer`, body).then((r) => r.data);

export const getMyResults          = (eventId, participantId) =>
  PUBLIC_API.get(`${BASE}/events/${eventId}/my-results/${participantId}`).then((r) => r.data);

export const sendHeartbeat         = (eventId, participantId) =>
  PUBLIC_API.post(`${BASE}/events/${eventId}/heartbeat`, { participantId }).then((r) => r.data);

// ── Audience — public ──────────────────────────────────────────
export const getAudienceState      = (eventCode, accessCode) =>
  PUBLIC_API.get(`${BASE}/audience/${eventCode}`, {
    params: accessCode ? { accessCode } : {},
  }).then((r) => r.data);
