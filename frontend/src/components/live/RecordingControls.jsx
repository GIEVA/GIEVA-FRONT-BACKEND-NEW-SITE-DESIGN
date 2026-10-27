// components/live/RecordingControls.jsx
//
//   <RecordingControls sessionId={session.id} room={room} isHost={isHost} />
//
// Everyone in the room sees a "REC" indicator while a recording runs (consent / transparency).
// Only the host sees the Record / Stop buttons. The server enforces permissions regardless.

import { useCallback, useEffect, useState } from "react";
import {
  Box, Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions, FormControlLabel,
  Checkbox, Typography, Snackbar, Alert, CircularProgress,
} from "@mui/material";
import { FiberManualRecord, Stop } from "@mui/icons-material";
import { RoomEvent } from "livekit-client";

import { startRecording, stopRecording, getRecordingStatus } from "../../services/sessionToolsService";

const pad = (n) => String(n).padStart(2, "0");
const formatElapsed = (ms) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
};

export default function RecordingControls({ sessionId, room, isHost = false, guest = false }) {
  // guest = public-meeting guest with no login token: skip REST calls (they would 401) and rely
  // on the realtime start/stop signals from the room, so guests still see the REC indicator.
  const [recording, setRecording] = useState({ isRecording: false, startedAt: null });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [aiNotes, setAiNotes] = useState(true);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [toast, setToast] = useState(null);

  const load = useCallback(async () => {
    if (guest) return;
    try {
      setRecording(await getRecordingStatus(sessionId));
    } catch (err) {
      console.error("[RecordingControls] status failed", err);
    }
  }, [sessionId, guest]);

  // Initial state (covers late joiners) + slow fallback refresh
  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load]);

  // Realtime start/stop signals
  useEffect(() => {
    if (!room) return undefined;
    const onData = (payload, _p, _k, topic) => {
      if (topic !== "recording") return;
      try {
        const msg = JSON.parse(new TextDecoder().decode(payload));
        if (msg.type === "started") setRecording({ isRecording: true, startedAt: msg.startedAt });
        if (msg.type === "stopped") setRecording({ isRecording: false, startedAt: null });
      } catch { /* ignore */ }
    };
    room.on(RoomEvent.DataReceived, onData);
    return () => room.off(RoomEvent.DataReceived, onData);
  }, [room]);

  // Ticking clock while recording
  useEffect(() => {
    if (!recording.isRecording) return undefined;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [recording.isRecording]);

  const handleStart = async () => {
    try {
      setBusy(true);
      await startRecording(sessionId, aiNotes);
      setConfirmOpen(false);
      await load();
    } catch (err) {
      setToast({ msg: err?.response?.data?.message || "Could not start recording", severity: "error" });
    } finally {
      setBusy(false);
    }
  };

  const handleStop = async () => {
    try {
      setBusy(true);
      const res = await stopRecording(sessionId);
      setToast({ msg: res.message || "Recording stopped", severity: "success" });
      await load();
    } catch (err) {
      setToast({ msg: err?.response?.data?.message || "Could not stop recording", severity: "error" });
    } finally {
      setBusy(false);
    }
  };

  const elapsed = recording.startedAt ? formatElapsed(now - new Date(recording.startedAt).getTime()) : "";

  return (
    <>
      <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
        {recording.isRecording && (
          <Chip
            size="small"
            icon={
              <FiberManualRecord
                sx={{
                  fontSize: 12, color: "#fff !important",
                  animation: "recPulse 1.4s infinite",
                  "@keyframes recPulse": { "0%,100%": { opacity: 1 }, "50%": { opacity: 0.25 } },
                }}
              />
            }
            label={`REC ${elapsed}`}
            sx={{ bgcolor: "#dc2626", color: "#fff", fontWeight: 800, fontSize: 11.5 }}
          />
        )}

        {isHost && !recording.isRecording && (
          <Button
            size="small" variant="outlined" startIcon={<FiberManualRecord sx={{ color: "#dc2626" }} />}
            onClick={() => setConfirmOpen(true)}
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, borderColor: "divider", color: "text.primary" }}
          >
            Record
          </Button>
        )}

        {isHost && recording.isRecording && (
          <Button
            size="small" variant="contained" disabled={busy} onClick={handleStop}
            startIcon={busy ? <CircularProgress size={14} color="inherit" /> : <Stop />}
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, bgcolor: "#0B1F3A" }}
          >
            Stop
          </Button>
        )}
      </Box>

      <Dialog open={confirmOpen} onClose={() => !busy && setConfirmOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Start recording?</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 14, color: "text.secondary", mb: 1.5 }}>
            Everyone in the room will see a recording indicator. Make sure participants know they are being recorded.
          </Typography>
          <FormControlLabel
            control={<Checkbox checked={aiNotes} onChange={(e) => setAiNotes(e.target.checked)} />}
            label={
              <Box>
                <Typography sx={{ fontSize: 14, fontWeight: 700 }}>Generate AI notes</Typography>
                <Typography sx={{ fontSize: 12.5, color: "text.secondary" }}>
                  The audio is transcribed and summarised (key points, decisions, action items) after the meeting.
                </Typography>
              </Box>
            }
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmOpen(false)} disabled={busy} sx={{ textTransform: "none", color: "text.secondary" }}>Cancel</Button>
          <Button
            variant="contained" onClick={handleStart} disabled={busy}
            startIcon={busy ? <CircularProgress size={16} color="inherit" /> : <FiberManualRecord />}
            sx={{ textTransform: "none", fontWeight: 800, borderRadius: 2.5, bgcolor: "#dc2626", "&:hover": { bgcolor: "#b91c1c" } }}
          >
            Start recording
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <Alert severity={toast?.severity || "info"} onClose={() => setToast(null)} sx={{ borderRadius: 2 }}>{toast?.msg}</Alert>
      </Snackbar>
    </>
  );
}
