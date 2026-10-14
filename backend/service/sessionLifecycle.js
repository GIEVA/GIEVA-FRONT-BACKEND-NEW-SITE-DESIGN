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

// Host connected → auto-start recording if the meeting was scheduled with "Recording: Enabled".
// (`recordingEnabled` is the field your Public Meeting form already sends. If your course-session
//  flow doesn't store it, hosts can still start recording manually from the room.)
export const onHostJoined = async (session) => {
  if (session.recordingEnabled !== true) return;
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
