// services/guestMeetingService.js
//
// Guest-facing calls for unauthenticated public-meeting attendees.
//
// IMPORTANT: these intentionally do NOT use the `API` instance from
// services/api.js — that instance's request interceptor attaches
// whatever's in localStorage as a Bearer token, and its response
// interceptor treats any 401 as "your session expired, redirect to
// /login". A guest has no token and should NEVER be redirected to
// login — these calls use a separate plain axios instance with no
// interceptors at all.

import axios from "axios";

const GUEST_API = axios.create({
  baseURL: "http://localhost:5000",
  headers: { "Content-Type": "application/json" },
});

const BASE = "/api/session";

/**
 * Guest requests to join a public meeting. No account needed.
 * Returns a lobby token + a guestId the frontend must persist
 * (sessionStorage, NOT localStorage — a guest identity should not
 * survive closing the tab/browser the way a real login would) and
 * reuse for all subsequent polling/admission calls.
 */
export const guestJoinPublicMeeting = (sessionId, displayName) =>
  GUEST_API.post(`${BASE}/public-meetings/${sessionId}/guest-join`, { displayName })
    .then((r) => r.data);

/**
 * Cheap poll — checks waiting/admitted/denied status for this guest.
 */
export const guestCheckAdmissionStatus = (sessionId, guestId) =>
  GUEST_API.get(`${BASE}/public-meetings/${sessionId}/guest-admission-status`, {
    params: { guestId },
  }).then((r) => r.data);

/**
 * Called once status flips to "admitted" — returns a full participant
 * token so the guest can reconnect with publish rights.
 */
export const guestGetParticipantToken = (sessionId, guestId) =>
  GUEST_API.post(`${BASE}/public-meetings/${sessionId}/guest-participant-token`, { guestId })
    .then((r) => r.data);