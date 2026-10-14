// services/recording.service.js
// Orchestrates recording state: start, stop, and the LiveKit "egress_ended" webhook.

import { Op } from "sequelize";
import models from "../models/index.js";
import { startRoomRecording, stopEgress } from "./livekitEgress.service.js";
import { processRecording } from "./aiNotes.service.js";
import { broadcast } from "./liveRoomSignals.js";

const { SessionRecording, ClassSession } = models;

const FAILED_STATUSES = ["EGRESS_FAILED", "EGRESS_ABORTED", "EGRESS_LIMIT_REACHED", 4, 5, 6];

export const getActiveRecording = (sessionId) =>
  SessionRecording.findOne({
    where: { classSessionId: sessionId, status: "recording" },
    order: [["id", "DESC"]],
  });

export const startSessionRecording = async (session, userId, { aiNotes = true } = {}) => {
  if (await getActiveRecording(session.id)) {
    return { error: "A recording is already in progress", status: 409 };
  }

  const rec = await SessionRecording.create({
    classSessionId: session.id,
    startedBy: userId,
    status: "recording",
    aiNotesEnabled: aiNotes,
    transcriptStatus: aiNotes ? "pending" : "none",
    startedAt: new Date(),
  });

  try {
    const out = await startRoomRecording(session.roomName, session.id, rec.id, { audio: aiNotes });
    await rec.update({
      videoEgressId: out.videoEgressId,
      videoKey: out.videoKey,
      audioEgressId: out.audioEgressId,
      audioKey: out.audioKey,
      // audio egress may have been skipped after a failure
      transcriptStatus: out.audioKey ? "pending" : "none",
      aiNotesEnabled: !!out.audioKey,
    });
  } catch (err) {
    console.error("[recording] start failed:", err);
    await rec.update({ status: "failed", errorMessage: String(err.message).slice(0, 500) });
    return {
      error: "Could not start recording. Check LiveKit Egress and the storage settings.",
      status: 502,
    };
  }

  await broadcast(session.roomName, "recording", { type: "started", startedAt: rec.startedAt });
  return { recording: rec };
};

export const stopSessionRecording = async (session) => {
  const rec = await getActiveRecording(session.id);
  if (!rec) return { error: "No recording in progress", status: 404 };

  await rec.update({ status: "processing", endedAt: new Date() });

  for (const id of [rec.videoEgressId, rec.audioEgressId].filter(Boolean)) {
    // Fails harmlessly if the egress already ended (e.g. the room closed).
    await stopEgress(id).catch((err) => console.error("[recording] stopEgress", id, err.message));
  }

  await broadcast(session.roomName, "recording", { type: "stopped" });
  return { recording: rec };
};

// Called from the LiveKit webhook for event === "egress_ended".
export const handleEgressEnded = async (event) => {
  const info = event.egressInfo;
  if (!info?.egressId) return;

  const rec = await SessionRecording.findOne({
    where: { [Op.or]: [{ videoEgressId: info.egressId }, { audioEgressId: info.egressId }] },
  });
  if (!rec) return;

  const failed = !!info.error || FAILED_STATUSES.includes(info.status);
  const file = info.fileResults?.[0] || info.file;
  // Egress durations are nanoseconds (may arrive as a string in JSON).
  const seconds = file?.duration ? Math.round(Number(file.duration) / 1e9) : null;

  if (rec.videoEgressId === info.egressId) {
    if (failed) {
      await rec.update({ status: "failed", errorMessage: info.error || "Recording failed" });
    } else {
      await rec.update({
        status: "ready",
        durationSeconds: seconds ?? rec.durationSeconds,
        endedAt: rec.endedAt || new Date(),
      });
    }

    // Keep the legacy ClassSession columns in sync (the admin override endpoint reads them).
    await ClassSession.update(
      {
        recordingStatus: failed ? "failed" : "ready",
        recordingUrl: failed ? null : file?.location || null,
        recordingDuration: seconds ? Math.round(seconds / 60) : null,
      },
      { where: { id: rec.classSessionId } }
    );
  } else if (rec.audioEgressId === info.egressId) {
    if (failed) {
      await rec.update({ transcriptStatus: "failed", errorMessage: info.error || "Audio capture failed" });
    } else {
      // Don't block the webhook response on transcription.
      setImmediate(() => processRecording(rec.id).catch((e) => console.error("[aiNotes]", e)));
    }
  }
};
