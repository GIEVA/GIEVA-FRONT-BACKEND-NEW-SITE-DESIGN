// services/examTypeService.js

import API from "./api";
import axios from "axios";

// Public reads use a no-auth instance so the catalog is visible
// to unauthenticated visitors browsing from the landing page.
const PUBLIC_API = axios.create({
  baseURL: API.defaults.baseURL,
  headers: { "Content-Type": "application/json" },
});

const BASE = "/api/exam-types";

// ── Public (no auth) ──────────────────────────────────────────

/** Student catalog — returns published exams only */
export const listPublishedExams = () =>
  PUBLIC_API.get(BASE).then((r) => r.data);

/** Single exam with full fieldSchema — used by the dynamic form */
export const getExamType = (examType) =>
  PUBLIC_API.get(`${BASE}/${examType}`).then((r) => r.data);

// ── Admin ─────────────────────────────────────────────────────

export const adminListExams = () =>
  API.get(`${BASE}/admin/all`).then((r) => r.data);

export const adminCreateExam = (body) =>
  API.post(`${BASE}/admin`, body).then((r) => r.data);

export const adminUpdateExam = (id, body) =>
  API.put(`${BASE}/admin/${id}`, body).then((r) => r.data);

export const adminSetExamStatus = (id, status) =>
  API.patch(`${BASE}/admin/${id}/status`, { status }).then((r) => r.data);

export const adminDeleteExam = (id) =>
  API.delete(`${BASE}/admin/${id}`).then((r) => r.data);