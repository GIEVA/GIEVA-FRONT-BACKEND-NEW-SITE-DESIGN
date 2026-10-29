// services/visaService.js
// ⚠️ CHANGE the import below to your configured axios instance (base URL + auth header),
//    the same one your other services use. Paths below are relative to its baseURL (".../api").
import api from "./api";

// Your other services call "/api/...", so the prefix is part of the path here.
// If your axios baseURL already ends in /api, change API to "".
const API = "/api";
const d = (r) => r.data;

// ── Applicant ──
export const getVisaSettings = () => api.get(`${API}/visa/settings`).then(d);
export const startVisaApplication = () => api.post(`${API}/visa/applications`).then(d);
export const listMyVisaApplications = () => api.get(`${API}/visa/applications`).then(d);
export const getMyVisaApplication = (id) => api.get(`${API}/visa/applications/${id}`).then(d);
export const saveVisaDraft = (id, body) => api.patch(`${API}/visa/applications/${id}`, body).then(d);
export const deleteVisaDraft = (id) => api.delete(`${API}/visa/applications/${id}`).then(d);

export const uploadVisaDocument = (id, type, file, onProgress) => {
  const fd = new FormData();
  fd.append("file", file);
  return api
    .post(`${API}/visa/applications/${id}/documents/${type}`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (e) => e.total && onProgress?.(Math.round((e.loaded / e.total) * 100)),
    })
    .then(d);
};
export const removeVisaDocument = (id, type) => api.delete(`${API}/visa/applications/${id}/documents/${type}`).then(d);
export const getVisaDocumentUrl = (id, type) => api.get(`${API}/visa/applications/${id}/documents/${type}/url`).then(d);
export const resubmitVisaApplication = (id, message) => api.post(`${API}/visa/applications/${id}/resubmit`, { message }).then(d);

export const initializeVisaPayment = (applicationId) => api.post(`${API}/visa/payments/initialize`, { applicationId }).then(d);
export const verifyVisaPayment = (reference) => api.post(`${API}/visa/payments/verify`, { reference }).then(d);

// PDF: fetched as a blob so the auth header is sent, then saved
const saveBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
};
export const downloadVisaPdf = async (id, filename = "visa-application.pdf") => {
  const res = await api.get(`${API}/visa/applications/${id}/pdf`, { responseType: "blob" });
  saveBlob(res.data, filename);
};

// ── Admin ──
const A = `${API}/visa/admin`;
export const adminVisaStats = () => api.get(`${A}/stats`).then(d);
export const adminListVisaApplications = (params) => api.get(`${A}/applications`, { params }).then(d);
export const adminGetVisaApplication = (id) => api.get(`${A}/applications/${id}`).then(d);
export const adminUpdateVisaStatus = (id, body) => api.patch(`${A}/applications/${id}/status`, body).then(d);
export const adminAddVisaNote = (id, body) => api.post(`${A}/applications/${id}/notes`, { body }).then(d);
export const adminGetVisaDocumentUrl = (id, type) => api.get(`${A}/applications/${id}/documents/${type}/url`).then(d);
export const adminResendVisaEmail = (id) => api.post(`${A}/applications/${id}/resend-email`).then(d);
export const adminListVisaPayments = (params) => api.get(`${A}/payments`, { params }).then(d);
export const adminGetVisaFee = () => api.get(`${A}/settings/fee`).then(d);
export const adminUpdateVisaFee = (body) => api.put(`${A}/settings/fee`, body).then(d);
export const adminGetVisaAvailability = () => api.get(`${A}/settings/availability`).then(d);
export const adminUpdateVisaAvailability = (body) => api.put(`${A}/settings/availability`, body).then(d);
export const adminDownloadVisaPdf = async (id, filename = "visa-application.pdf") => {
  const res = await api.get(`${A}/applications/${id}/pdf`, { responseType: "blob" });
  saveBlob(res.data, filename);
};
export const adminExportVisaCsv = async (params) => {
  const res = await api.get(`${A}/export.csv`, { params, responseType: "blob" });
  saveBlob(res.data, `visa-applications-${new Date().toISOString().slice(0, 10)}.csv`);
};
