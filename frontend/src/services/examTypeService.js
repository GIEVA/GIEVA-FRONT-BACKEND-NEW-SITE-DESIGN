// services/examTypeService.js
//
// Public-facing service — no auth required.
// Maps to:  app.use("/api/exam-types", examTypeRoutes)
//
//   GET /api/exam-types          → listPublishedExams
//   GET /api/exam-types/:examType → getExamType

import API from "./api";

const BASE = "/api/exam-types";

/**
 * Fetch all published exams for the student catalog page.
 * Used by: ExamCatalog.jsx
 *
 * Returns: { exams: ExamType[] }
 */
export const listPublishedExams = () =>
  API.get(BASE).then((r) => r.data);

/**
 * Fetch a single exam by its slug (e.g. "SAT", "IELTS").
 * Returns the full fieldSchema needed to render the dynamic form.
 * Used by: DynamicExamRegistrationForm.jsx
 *
 * Returns: { exam: ExamType }
 */
export const getExamType = (examType) =>
  API.get(`${BASE}/${examType}`).then((r) => r.data);
