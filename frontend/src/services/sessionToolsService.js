// services/sessionToolsService.js
// ⚠️ CHANGE the import below to your configured axios instance (the one that adds the auth
// header and base URL, as used by adminSessionService / adminClassSessionService).
import api from "./api";

const base = "/session-tools";
const data = (res) => res.data;

// ── Polls & surveys ──
export const createPoll = (sessionId, body) =>
  api.post(`${base}/sessions/${sessionId}/polls`, body).then(data);

export const listPolls = (sessionId) =>
  api.get(`${base}/sessions/${sessionId}/polls`).then(data);

export const getPoll = (pollId) => api.get(`${base}/polls/${pollId}`).then(data);

export const launchPoll = (pollId) => api.post(`${base}/polls/${pollId}/launch`).then(data);

export const closePoll = (pollId) => api.post(`${base}/polls/${pollId}/close`).then(data);

export const respondToPoll = (pollId, answers) =>
  api.post(`${base}/polls/${pollId}/respond`, { answers }).then(data);

export const getPollResults = (pollId) => api.get(`${base}/polls/${pollId}/results`).then(data);

export const exportPollCSV = (pollId) =>
  api.get(`${base}/polls/${pollId}/export`, { responseType: "blob" }).then(data);

export const deletePoll = (pollId) => api.delete(`${base}/polls/${pollId}`).then(data);

// ── Recording & AI notes ──
export const startRecording = (sessionId, aiNotes = true) =>
  api.post(`${base}/sessions/${sessionId}/recording/start`, { aiNotes }).then(data);

export const stopRecording = (sessionId) =>
  api.post(`${base}/sessions/${sessionId}/recording/stop`).then(data);

export const getRecordingStatus = (sessionId) =>
  api.get(`${base}/sessions/${sessionId}/recording/status`).then(data);

export const getRecording = (sessionId) =>
  api.get(`${base}/sessions/${sessionId}/recording`).then(data);

export const regenerateNotes = (recordingId) =>
  api.post(`${base}/recordings/${recordingId}/notes/regenerate`).then(data);

// ── Room moderation (host only) ──
export const muteAllParticipants = async (sessionId) =>
  (await api.post(`/session-tools/sessions/${sessionId}/room/mute-all`)).data;

export const askParticipantToUnmute = async (sessionId, identity) =>
  (await api.post(`/session-tools/sessions/${sessionId}/room/ask-unmute/${encodeURIComponent(identity)}`)).data;
