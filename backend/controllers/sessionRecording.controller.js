// controllers/sessionRecording.controller.js

import models from "../models/index.js";
import { loadSession, canManageSession, isAttendee } from "../service/sessionAccess.js";
import {
  getActiveRecording,
  startSessionRecording,
  stopSessionRecording,
} from "../service/recording.service.js";
import { regenerateNotes } from "../service/aiNotes.service.js";
import { getPlaybackUrl } from "../config/storage.js";

const { SessionRecording, ActivityLog } = models;

const hostOnly = (res) => res.status(403).json({ message: "Only the host can do this" });

// ── POST /sessions/:sessionId/recording/start   { aiNotes?: boolean }
export const startRecording = async (req, res) => {
  try {
    const session = await loadSession(req.params.sessionId);
    if (!session) return res.status(404).json({ message: "Session not found" });
    if (!canManageSession(req.user, session)) return hostOnly(res);
    if (session.status !== "live") {
      return res.status(400).json({ message: "You can only record while the session is live" });
    }

    const result = await startSessionRecording(session, req.user.id, { aiNotes: req.body.aiNotes !== false });
    if (result.error) return res.status(result.status).json({ message: result.error });

    await ActivityLog.create({
      userId: req.user.id,
      action: "SESSION_RECORDING_STARTED",
      meta: { sessionId: session.id, recordingId: result.recording.id, aiNotes: result.recording.aiNotesEnabled },
    }).catch(() => {});

    res.status(201).json({ recording: { id: result.recording.id, status: "recording", startedAt: result.recording.startedAt } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to start recording" });
  }
};

// ── POST /sessions/:sessionId/recording/stop
export const stopRecording = async (req, res) => {
  try {
    const session = await loadSession(req.params.sessionId);
    if (!session) return res.status(404).json({ message: "Session not found" });
    if (!canManageSession(req.user, session)) return hostOnly(res);

    const result = await stopSessionRecording(session);
    if (result.error) return res.status(result.status).json({ message: result.error });

    await ActivityLog.create({
      userId: req.user.id,
      action: "SESSION_RECORDING_STOPPED",
      meta: { sessionId: session.id, recordingId: result.recording.id },
    }).catch(() => {});

    res.json({ message: "Recording stopped. It will be ready in a few minutes." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to stop recording" });
  }
};

// ── GET /sessions/:sessionId/recording/status     (anyone in the session — drives the REC banner)
export const getRecordingStatus = async (req, res) => {
  try {
    const session = await loadSession(req.params.sessionId);
    if (!session) return res.status(404).json({ message: "Session not found" });
    if (!canManageSession(req.user, session) && !(await isAttendee(req.user.id, session.id))) {
      return res.status(403).json({ message: "You are not part of this session" });
    }

    const active = await getActiveRecording(session.id);
    res.json({ isRecording: !!active, startedAt: active?.startedAt || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load recording status" });
  }
};

// ── GET /sessions/:sessionId/recording            (host/admin: latest recording + notes + playback link)
export const getRecording = async (req, res) => {
  try {
    const session = await loadSession(req.params.sessionId);
    if (!session) return res.status(404).json({ message: "Session not found" });
    if (!canManageSession(req.user, session)) return hostOnly(res);

    const rec = await SessionRecording.findOne({
      where: { classSessionId: session.id },
      order: [["id", "DESC"]],
    });
    if (!rec) return res.json({ recording: null });

    let playbackUrl = null;
    if (rec.status === "ready" && rec.videoKey) {
      playbackUrl = await getPlaybackUrl(rec.videoKey).catch((e) => {
        console.error("[recording] presign failed:", e.message);
        return null;
      });
    }

    res.json({
      recording: {
        id: rec.id,
        status: rec.status,
        startedAt: rec.startedAt,
        endedAt: rec.endedAt,
        durationSeconds: rec.durationSeconds,
        aiNotesEnabled: rec.aiNotesEnabled,
        transcriptStatus: rec.transcriptStatus,
        transcript: rec.transcript,
        transcriptSegments: rec.transcriptSegments,
        notes: rec.notes,
        errorMessage: rec.errorMessage,
        playbackUrl,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load recording" });
  }
};

// ── POST /recordings/:recordingId/notes/regenerate
export const regenerateRecordingNotes = async (req, res) => {
  try {
    const rec = await SessionRecording.findByPk(req.params.recordingId);
    if (!rec) return res.status(404).json({ message: "Recording not found" });

    const session = await loadSession(rec.classSessionId);
    if (!canManageSession(req.user, session)) return hostOnly(res);

    const updated = await regenerateNotes(rec.id);
    res.json({ notes: updated.notes });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message || "Failed to regenerate notes" });
  }
};
