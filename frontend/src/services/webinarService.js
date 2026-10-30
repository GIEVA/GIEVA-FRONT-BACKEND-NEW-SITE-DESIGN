// services/webinarService.js
// ⚠️ Same axios instance as your other services. Set API to "" if its baseURL already ends in /api.
import api from "./api";

const API = "/api";
const base = `${API}/webinars`;
const d = (r) => r.data;

// Schedule + manage (admin)
export const createWebinar = (body) => api.post(base, body).then(d);
export const updateWebinar = (id, body) => api.put(`${base}/${id}`, body).then(d);
export const cancelWebinar = (id) => api.delete(`${base}/${id}`).then(d);
export const listWebinars = (scope = "upcoming") => api.get(base, { params: { scope } }).then(d);
export const getWebinar = (id) => api.get(`${base}/${id}`).then(d);
export const searchWebinarUsers = (q) => api.get(`${base}/users/search`, { params: { q } }).then(d);

// Join / end
export const joinWebinar = (id) => api.post(`${base}/${id}/join`).then(d);
export const endWebinar = (id) => api.post(`${base}/${id}/end`).then(d);

// In the room
export const getWebinarInfo = (sessionId) => api.get(`${base}/info/${sessionId}`).then(d);
export const getMyWebinarRole = (sessionId) => api.get(`${base}/sessions/${sessionId}/me`).then(d);
export const updateWebinarSettings = (sessionId, body) => api.put(`${base}/sessions/${sessionId}/settings`, body).then(d);

export const getWebinarTeam = (sessionId) => api.get(`${base}/sessions/${sessionId}/team`).then(d);
export const assignWebinarTeamMember = (sessionId, userId, role) => api.post(`${base}/sessions/${sessionId}/team`, { userId, role }).then(d);
export const removeWebinarTeamMember = (sessionId, userId) => api.delete(`${base}/sessions/${sessionId}/team/${userId}`).then(d);

export const promoteToPanelist = (sessionId, userId) => api.post(`${base}/sessions/${sessionId}/promote/${userId}`).then(d);
export const demoteToAttendee = (sessionId, userId) => api.post(`${base}/sessions/${sessionId}/demote/${userId}`).then(d);

// Q&A
export const listQuestions = (sessionId) => api.get(`${base}/sessions/${sessionId}/questions`).then(d);
export const askQuestion = (sessionId, text, anonymous) => api.post(`${base}/sessions/${sessionId}/questions`, { text, anonymous }).then(d);
export const voteQuestion = (questionId) => api.post(`${base}/questions/${questionId}/vote`).then(d);
export const updateQuestion = (questionId, body) => api.patch(`${base}/questions/${questionId}`, body).then(d);
export const deleteQuestion = (questionId) => api.delete(`${base}/questions/${questionId}`).then(d);
export const exportQuestionsCsv = (sessionId) => api.get(`${base}/sessions/${sessionId}/questions/export`, { responseType: "blob" }).then(d);

// Live stream out (YouTube / Facebook / Twitch / any RTMP)
export const getStreamStatus = (sessionId) => api.get(`${base}/sessions/${sessionId}/stream`).then(d);
export const startLiveStream = (sessionId, urls) => api.post(`${base}/sessions/${sessionId}/stream/start`, { urls }).then(d);
export const stopLiveStream = (sessionId) => api.post(`${base}/sessions/${sessionId}/stream/stop`).then(d);



/* Guest registration and waiting room — public routes */

// Public webinar information
// export const getPublicWebinarInfo = (id) =>
//   api.get(`${base}/info/${id}`).then(d);

// Register a guest
export const registerWebinarGuest = (id, guestData) =>
  api.post(`${base}/${id}/guest-register`, guestData).then(d);

// Check guest admission status
export const getWebinarGuestStatus = (id, accessKey) =>
  api.post(`${base}/${id}/guest-status`, { accessKey }).then(d);

/* Host/admin guest management — protected routes */

// List guest registrations
export const getWebinarGuests = (id) =>
  api.get(`${base}/${id}/guests`).then(d);

// Admit or reject a guest
export const moderateWebinarGuest = (id, guestId, action) =>
  api.patch(`${base}/${id}/guests/${guestId}`, { action }).then(d);

// Export guest registrations
export const exportWebinarGuests = (id) =>
  api
    .get(`${base}/${id}/guests/export.csv`, {
      responseType: "blob",
    })
    .then(d);


    
export const listGuestWebinarQuestions = (sessionId, accessKey) =>
  api.post(`${base}/${sessionId}/guest-questions/list`, { accessKey }).then(d);
export const askGuestWebinarQuestion = (sessionId, accessKey, text, anonymous) =>
  api.post(`${base}/${sessionId}/guest-questions`, { accessKey, text, anonymous }).then(d);
export const voteGuestWebinarQuestion = (questionId, accessKey) =>
  api.post(`${base}/questions/${questionId}/guest-vote`, { accessKey }).then(d);