// services/adminExamTypeService.js
//
// Admin-only service — all calls require a valid admin JWT.
// Maps to:  app.use("/api/exam-types", examTypeRoutes)
//   with the admin sub-routes defined as:
//
//   GET    /api/exam-types/admin/all          → adminListExams
//   POST   /api/exam-types/admin              → adminCreateExam
//   PUT    /api/exam-types/admin/:id          → adminUpdateExam
//   PATCH  /api/exam-types/admin/:id/status   → adminSetExamStatus
//   DELETE /api/exam-types/admin/:idc:\Users\Admin\Downloads\examTypeService.js          → adminDeleteExam

import API from "./api";

const BASE = "/api/exam-types/admin";

// ── Types (for IDE autocompletion reference) ──────────────────
//
// ExamType {
//   id, examType, title, description, imageUrl,
//   pricingType: "flat" | "variants",
//   flatPrice: number,
//   priceVariants: { key, label, price }[],
//   fieldSchema: FieldDef[],
//   sortOrder: number,
//   status: "draft" | "published" | "archived",
//   createdBy: number,
//   creator: { id, fullName },
//   createdAt, updatedAt
// }
//
// FieldDef {
//   key: string,        // unique field identifier, e.g. "firstName"
//   label: string,      // display label, e.g. "First Name"
//   type: "text" | "email" | "tel" | "date" | "number" | "select" | "textarea",
//   required: boolean,
//   section?: string,   // groups fields under a heading, e.g. "Personal Details"
//   placeholder?: string,
//   helperText?: string,
//   options?: string[], // only for type: "select"
// }

// ── List ──────────────────────────────────────────────────────

/**
 * Fetch all exam types (draft + published + archived).
 * Used by: AdminExamTypes.jsx list view
 *
 * Returns: { exams: ExamType[] }
 */
export const adminListExams = () =>
  API.get(`${BASE}/all`).then((r) => r.data);

// ── Create ────────────────────────────────────────────────────

/**
 * Create a new exam type (saved as "draft").
 *
 * @param {object} payload
 * @param {string}   payload.examType       - slug key e.g. "SAT" (unique, uppercased by backend)
 * @param {string}   payload.title          - display name e.g. "SAT Exam Registration"
 * @param {string}   payload.description    - short description shown on catalog card
 * @param {string=}  payload.imageUrl       - optional cover image URL
 * @param {"flat"|"variants"} payload.pricingType
 * @param {number=}  payload.flatPrice      - used when pricingType === "flat"
 * @param {Array=}   payload.priceVariants  - used when pricingType === "variants"
 *                                            each: { key, label, price }
 * @param {FieldDef[]=} payload.fieldSchema - can be added later via adminUpdateExam
 * @param {number=}  payload.sortOrder      - display order in catalog (lower = first)
 *
 * Returns: { message, exam: ExamType }
 */
export const adminCreateExam = (payload) =>
  API.post(BASE, payload).then((r) => r.data);

// ── Update ────────────────────────────────────────────────────

/**
 * Update an existing exam type by numeric ID.
 * You cannot change the examType slug — only all other fields.
 *
 * @param {number|string} id
 * @param {Partial<ExamType>} payload - any subset of updatable fields
 *
 * Returns: { message, exam: ExamType }
 */
export const adminUpdateExam = (id, payload) =>
  API.put(`${BASE}/${id}`, payload).then((r) => r.data);

// ── Status ────────────────────────────────────────────────────

/**
 * Publish, archive, or revert an exam to draft.
 * Publishing requires at least one field in fieldSchema.
 *
 * @param {number|string} id
 * @param {"draft"|"published"|"archived"} status
 *
 * Returns: { message, exam: ExamType }
 */
export const adminSetExamStatus = (id, status) =>
  API.patch(`${BASE}/${id}/status`, { status }).then((r) => r.data);

// ── Convenience wrappers ──────────────────────────────────────

/** Publish an exam (shorthand for adminSetExamStatus(id, "published")) */
export const adminPublishExam = (id) => adminSetExamStatus(id, "published");

/** Archive an exam (shorthand for adminSetExamStatus(id, "archived")) */
export const adminArchiveExam = (id) => adminSetExamStatus(id, "archived");

/** Revert a published/archived exam back to draft */
export const adminUnpublishExam = (id) => adminSetExamStatus(id, "draft");

// ── Delete ────────────────────────────────────────────────────

/**
 * Permanently delete an exam type.
 * Backend blocks deletion if the exam is published AND has registrations.
 * Archive it instead in that case.
 *
 * @param {number|string} id
 *
 * Returns: { message }
 */
export const adminDeleteExam = (id) =>
  API.delete(`${BASE}/${id}`).then((r) => r.data);

// ── Field schema helpers (client-side utilities) ──────────────

/**
 * Create a blank FieldDef template for use in the schema builder UI.
 * Fills in required fields so the backend validator won't reject it.
 */
export const blankField = (overrides = {}) => ({
  key:         "",
  label:       "",
  type:        "text",
  required:    false,
  section:     "Details",
  placeholder: "",
  helperText:  "",
  options:     [],
  ...overrides,
});

/**
 * Validate a fieldSchema array on the client before sending to the API.
 * Returns an array of error strings (empty = valid).
 *
 * @param {FieldDef[]} schema
 * @returns {string[]}
 */
export const validateFieldSchema = (schema = []) => {
  const errors  = [];
  const seenKeys = new Set();

  schema.forEach((field, i) => {
    const prefix = `Field #${i + 1}`;

    if (!field.key?.trim())
      errors.push(`${prefix}: "key" is required`);
    else if (seenKeys.has(field.key))
      errors.push(`${prefix}: duplicate key "${field.key}"`);
    else
      seenKeys.add(field.key);

    if (!field.label?.trim())
      errors.push(`${prefix} (${field.key || "unnamed"}): "label" is required`);

    const validTypes = ["text","email","tel","date","number","select","textarea"];
    if (!validTypes.includes(field.type))
      errors.push(`${prefix} (${field.key}): invalid type "${field.type}". Must be one of: ${validTypes.join(", ")}`);

    if (field.type === "select" && (!field.options || field.options.length === 0))
      errors.push(`${prefix} (${field.key}): select fields need at least one option`);
  });

  return errors;
};
