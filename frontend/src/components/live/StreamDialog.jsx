// components/live/StreamDialog.jsx
// Host / alt host: broadcast the webinar to YouTube, Facebook, Twitch or any RTMP destination.
import { useEffect, useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Stack, Typography, Alert, Chip, CircularProgress } from "@mui/material";
import { getStreamStatus, startLiveStream, stopLiveStream } from "../../services/webinarService";

export default function StreamDialog({ open, onClose, sessionId }) {
  const [live, setLive] = useState(false);
  const [rows, setRows] = useState([{ url: "", key: "" }]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    if (!open) return;
    getStreamStatus(sessionId).then((r) => setLive(!!r.live)).catch(() => {});
  }, [open, sessionId]);

  const setRow = (i, k, v) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, [k]: v } : r)));

  const start = async () => {
    const urls = rows.filter((r) => r.url.trim()).map((r) => `${r.url.trim().replace(/\/+$/, "")}${r.key.trim() ? `/${r.key.trim()}` : ""}`);
    try {
      setBusy(true); setMsg(null);
      await startLiveStream(sessionId, urls);
      setLive(true);
      setRows([{ url: "", key: "" }]); // never keep stream keys around in the page
      setMsg({ s: "success", t: "You are live." });
    } catch (e) {
      setMsg({ s: "error", t: e?.response?.data?.message || "Could not start the stream" });
    } finally { setBusy(false); }
  };

  const stop = async () => {
    try { setBusy(true); await stopLiveStream(sessionId); setLive(false); setMsg({ s: "success", t: "Stream stopped." }); }
    catch (e) { setMsg({ s: "error", t: e?.response?.data?.message || "Could not stop" }); }
    finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 800 }}>
        Live stream {live && <Chip label="LIVE" color="error" size="small" sx={{ ml: 1, fontWeight: 800 }} />}
      </DialogTitle>
      <DialogContent>
        {msg && <Alert severity={msg.s} sx={{ mb: 2 }}>{msg.t}</Alert>}
        {live ? (
          <Typography>The webinar is being streamed out. Stop it here when you are done.</Typography>
        ) : (
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <Typography sx={{ fontSize: 13.5, opacity: 0.8 }}>
              Paste the server URL and stream key your platform gives you (YouTube Studio → Go live → Stream settings, or Facebook Live Producer).
              Keys are sent to the streaming service and are not saved.
            </Typography>
            {rows.map((r, i) => (
              <Stack key={i} direction={{ xs: "column", sm: "row" }} spacing={1}>
                <TextField fullWidth size="small" label="Server URL" placeholder="rtmp://a.rtmp.youtube.com/live2" value={r.url} onChange={(e) => setRow(i, "url", e.target.value)} />
                <TextField fullWidth size="small" label="Stream key" type="password" autoComplete="off" value={r.key} onChange={(e) => setRow(i, "key", e.target.value)} />
              </Stack>
            ))}
            {rows.length < 3 && <Button onClick={() => setRows((rs) => [...rs, { url: "", key: "" }])} sx={{ textTransform: "none", alignSelf: "flex-start" }}>+ Add another destination</Button>}
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={{ textTransform: "none" }}>Close</Button>
        {live
          ? <Button onClick={stop} disabled={busy} color="error" variant="contained" sx={{ textTransform: "none", fontWeight: 700 }}>{busy ? <CircularProgress size={18} color="inherit" /> : "Stop streaming"}</Button>
          : <Button onClick={start} disabled={busy || !rows.some((r) => r.url.trim())} variant="contained" sx={{ textTransform: "none", fontWeight: 700 }}>{busy ? <CircularProgress size={18} color="inherit" /> : "Go live"}</Button>}
      </DialogActions>
    </Dialog>
  );
}
