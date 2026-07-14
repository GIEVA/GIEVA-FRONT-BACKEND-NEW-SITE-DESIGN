// services/contactService.js

import API from "./api";
import axios from "axios";

// Public submissions use a no-auth instance so the form works
// for guests who aren't logged in, and avoids the api.js
// interceptor redirecting to /login on a 401.
const PUBLIC_API = axios.create({
  baseURL:         API.defaults.baseURL,
  withCredentials: true,
});

const BASE = "/api/contact";

// ── Public ─────────────────────────────────────────────────────

/**
 * Submit the contact form.
 * When category === "complaint" and a file is provided, sends as
 * multipart/form-data so the backend's multer middleware can
 * pick up the "complaintAttachment" field.
 */
export const submitContactForm = async ({
  fullName, email, phone, subject, message,
  category = "general", attachmentFile = null,
}) => {
  // Complaint with attachment → multipart/form-data
  if (category === "complaint" && attachmentFile) {
    const form = new FormData();
    form.append("fullName",  fullName);
    form.append("email",     email);
    form.append("phone",     phone     || "");
    form.append("subject",   subject);
    form.append("message",   message);
    form.append("category",  category);
    // Field name must match the route's upload.single("complaintAttachment")
    form.append("complaintAttachment", attachmentFile);

    return PUBLIC_API.post(BASE, form, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => r.data);
  }

  // All other categories → plain JSON
  return PUBLIC_API.post(BASE, {
    fullName, email, phone, subject, message, category,
  }).then((r) => r.data);
};

// ── Admin ───────────────────────────────────────────────────────

export const getContactSummary = () =>
  API.get(`${BASE}/admin/summary`).then((r) => r.data);

export const listContactMessages = (params = {}) =>
  API.get(`${BASE}/admin`, { params }).then((r) => r.data);

export const getContactMessage = (id) =>
  API.get(`${BASE}/admin/${id}`).then((r) => r.data);

export const updateContactStatus = (id, status) =>
  API.patch(`${BASE}/admin/${id}/status`, { status }).then((r) => r.data);

export const assignContactMessage = (id, adminId) =>
  API.patch(`${BASE}/admin/${id}/assign`, { adminId }).then((r) => r.data);

export const replyToContactMessage = (id, reply, internalNote = "") =>
  API.post(`${BASE}/admin/${id}/reply`, { reply, internalNote }).then((r) => r.data);

export const addInternalNote = (id, note) =>
  API.patch(`${BASE}/admin/${id}/note`, { note }).then((r) => r.data);

export const deleteContactMessage = (id) =>
  API.delete(`${BASE}/admin/${id}`).then((r) => r.data);
