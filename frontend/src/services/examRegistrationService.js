// services/examRegistrationService.js
//
// This is the service file that DynamicExamRegistrationForm.jsx imports from.
// It wraps your existing examService.js functions under the names the new
// form expects, while keeping full backward compatibility with the old form.
//
// Imported by:
//   - DynamicExamRegistrationForm.jsx  → submitExamRegistration
//   - anywhere that used examService.js → all old exports re-exported here

import API from "./api";

// ─────────────────────────────────────────────────────────────
// NEW — used by DynamicExamRegistrationForm.jsx
// POST /api/exam-registrations
// Body: { examType, examTypeId, formData, priceVariant?, amount }
//
// This replaces the old createRegistration(examType, data) call.
// The new backend stores the full fieldSchema answers in `formData`
// and records the amount + priceVariant directly on the registration.
// ─────────────────────────────────────────────────────────────
export const submitExamRegistration = async (payload) => {
  const response = await API.post("/api/exam-registrations", {
    examType:     payload.examType,
    examTypeId:   payload.examTypeId,
    formData:     payload.formData,
    priceVariant: payload.priceVariant || null,
    amount:       payload.amount,
  });
  return response.data;
  // returns: { message, registration: { id, registrationCode, examType, status, ... } }
};

// ─────────────────────────────────────────────────────────────
// RE-EXPORTED from old examService.js
// Keeps old form pages / other components working without changes
// ─────────────────────────────────────────────────────────────

/**
 * Old-style registration used by the legacy static form.
 * Kept for backward compatibility — prefer submitExamRegistration
 * for any new code.
 */
export const createRegistration = async (examType, data) => {
  const response = await API.post("/api/exam-registrations", {
    examType,
    data,
  });
  return response.data;
};

/** Fetch the current user's registrations (paginated). */
export const getMyRegistrations = async (page = 1, limit = 20) => {
  const response = await API.get("/api/exam-registrations/my", {
    params: { page, limit },
  });
  return response.data;
};

/** Fetch a single registration by ID. */
export const getRegistrationById = async (id) => {
  const response = await API.get(`/api/exam-registrations/${id}`);
  return response.data;
};

/** Delete a registration by ID. */
export const deleteRegistration = async (id) => {
  const response = await API.delete(`/api/exam-registrations/${id}`);
  return response.data;
};

/** Initialize Paystack payment for a registration. */
export const initializeExamPayment = async (registrationId) => {
  const response = await API.post("/api/exam-payments/initialize", {
    registrationId,
  });
  return response.data;
};

/** Verify a Paystack payment by reference. */
export const verifyExamPayment = async (reference) => {
  const response = await API.post("/api/exam-payments/verify", {
    reference,
  });
  return response.data;
};

/** Download a receipt PDF as a Blob. */
export const downloadReceipt = async (paymentId) => {
  const response = await API.get(
    `/api/exam-payments/receipt/${paymentId}`,
    { responseType: "blob" }
  );
  return response.data;
};

/**
 * Download receipt and trigger browser save-file dialog.
 * @param {number|string} paymentId
 * @param {string} filename
 */
export const downloadReceiptFile = async (
  paymentId,
  filename = "exam-receipt.pdf"
) => {
  const blob = await downloadReceipt(paymentId);
  const url  = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href     = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
