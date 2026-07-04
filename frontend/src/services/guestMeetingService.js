// services/guestMeetingService.js
//
// Guest-facing calls for unauthenticated public-meeting attendees.
//
// Uses a plain axios instance with NO interceptors so guests with
// no token are never redirected to /login. The baseURL is derived
// from the main API instance so there is one place to update it.

import API from "./api";
import axios from "axios";

const GUEST_API = axios.create({
  baseURL:     API.defaults.baseURL,   // ← mirrors api.js exactly
  headers:     { "Content-Type": "application/json" },
  withCredentials: true,
});

const BASE = "/api/session";

export const guestJoinPublicMeeting = (sessionId, displayName) =>
  GUEST_API.post(`${BASE}/public-meetings/${sessionId}/guest-join`, { displayName })
    .then((r) => r.data);

export const guestCheckAdmissionStatus = (sessionId, guestId) =>
  GUEST_API.get(`${BASE}/public-meetings/${sessionId}/guest-admission-status`, {
    params: { guestId },
  }).then((r) => r.data);

export const guestGetParticipantToken = (sessionId, guestId) =>
  GUEST_API.post(`${BASE}/public-meetings/${sessionId}/guest-participant-token`, { guestId })
    .then((r) => r.data);