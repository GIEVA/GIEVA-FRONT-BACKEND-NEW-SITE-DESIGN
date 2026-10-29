// services/sessionLifecycle.js
// The three hooks the LiveKit webhook controller calls. Keeps the webhook patch tiny.

import {
  getActiveRecording,
  startSessionRecording,
  stopSessionRecording,
  handleEgressEnded,
} from "./recording.service.js";
import { sendPostSessionSurvey } from "../controllers/sessionPoll.controller.js";

export { handleEgressEnded };

// Host connected → auto-start recording. DEFAULT IS ON: it only stays off when the session was
// scheduled with recordingEnabled === false (the tutor switched "Record this class" off).
// Sessions created before the column existed have no value, so they record too.
export const onHostJoined = async (session) => {
  if (session.recordingEnabled === false) return;
  if (await getActiveRecording(session.id)) return;

  const aiNotes = process.env.RECORDING_AI_NOTES_DEFAULT !== "false";
  const result = await startSessionRecording(session, session.scheduledBy, { aiNotes });
  if (result.error) console.error("[lifecycle] auto-record failed:", result.error);
};

// Session ended → stop any active recording and send post-session surveys.
export const onSessionEnded = async (session) => {
  await stopSessionRecording(session).catch((err) => console.error("[lifecycle] stop recording:", err));
  await sendPostSessionSurvey(session).catch((err) => console.error("[lifecycle] survey:", err));
};
