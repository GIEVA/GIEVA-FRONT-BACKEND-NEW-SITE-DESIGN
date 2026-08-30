// services/adminContactService.js
//
// All calls hit /api/admin/contact (app.use("/api/admin/contact", adminContactMessageRoutes))
// Uses the authenticated API instance — admin only.

import API from "./api";

const BASE = "/api/admin/contacts";

export const getContactSummary     = ()              => API.get(`${BASE}/summary`).then((r) => r.data);
export const listContactMessages   = (params = {})   => API.get(`${BASE}`, { params }).then((r) => r.data);
export const getContactMessage     = (id)            => API.get(`${BASE}/${id}`).then((r) => r.data);
export const updateContactStatus   = (id, status)    => API.patch(`${BASE}/${id}/status`, { status }).then((r) => r.data);
export const assignContactMessage  = (id, adminId)   => API.patch(`${BASE}/${id}/assign`, { adminId }).then((r) => r.data);
export const replyToContact        = (id, body)      => API.post(`${BASE}/${id}/reply`, body).then((r) => r.data);
export const addInternalNote       = (id, note)      => API.patch(`${BASE}/${id}/note`, { note }).then((r) => r.data);
export const deleteContactMessage  = (id)            => API.delete(`${BASE}/${id}`).then((r) => r.data);
