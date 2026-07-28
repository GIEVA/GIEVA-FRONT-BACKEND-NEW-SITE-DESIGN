// services/consultationService.js

import API from "./api";
import axios from "axios";

// Public calls use a no-auth instance — guests can book without a token
const PUBLIC_API = axios.create({
  baseURL:         API.defaults.baseURL,
  headers:         { "Content-Type": "application/json" },
  withCredentials: true,
});

const BASE = "/api/consultations";

// ── Public ────────────────────────────────────────────────────

export const bookConsultation = (body) =>
  PUBLIC_API.post(BASE, body).then((r) => r.data);

export const getAvailableSlots = (date) =>
  PUBLIC_API.get(`${BASE}/available-slots`, { params: { date } }).then((r) => r.data);

// ── Authenticated user ─────────────────────────────────────────

export const getMyBookings   = ()        => API.get(`${BASE}/my`).then((r) => r.data);
export const cancelMyBooking = (id, reason = "") =>
  API.patch(`${BASE}/${id}/cancel`, { reason }).then((r) => r.data);

// ── Admin ──────────────────────────────────────────────────────

export const adminGetSummary    = ()              => API.get(`${BASE}/admin/summary`).then((r) => r.data);
export const adminListBookings  = (params = {})   => API.get(`${BASE}/admin`, { params }).then((r) => r.data);
export const adminGetBooking    = (id)            => API.get(`${BASE}/admin/${id}`).then((r) => r.data);
export const adminUpdateStatus  = (id, body)      => API.patch(`${BASE}/admin/${id}/status`, body).then((r) => r.data);
export const adminReply         = (id, body)      => API.post(`${BASE}/admin/${id}/reply`, body).then((r) => r.data);
export const adminAddNote       = (id, note)      => API.patch(`${BASE}/admin/${id}/note`, { note }).then((r) => r.data);
export const adminDeleteBooking = (id)            => API.delete(`${BASE}/admin/${id}`).then((r) => r.data);
