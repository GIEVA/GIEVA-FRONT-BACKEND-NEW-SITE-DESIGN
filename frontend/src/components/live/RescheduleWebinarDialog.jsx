// components/live/RescheduleWebinarDialog.jsx
// Admin: change a scheduled webinar's date, time and duration. The hosting team and registered guests are emailed.
import { useEffect, useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Typography, CircularProgress, Alert, FormControlLabel, Checkbox, Stack } from "@mui/material";
import { updateWebinar } from "../../services/webinarService";

const NAVY = "#0B1F3A";

// "2026-11-05T14:30" in the browser's own time zone, for <input type="datetime-local">
const toLocalInput = (d) => {
  const x = new Date(d);
  const pad = (n) => String(n).padStart(2, "0");
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}T${pad(x.getHours())}:${pad(x.getMinutes())}`;
};

export default function RescheduleWebinarDialog({ webinar, onClose, onDone }) {
  const [when, setWhen] = useState("");
  const [duration, setDuration] = useState(60);
  const [reason, setReason] = useState("");
  const [notify, setNotify] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!webinar) return;
    setWhen(toLocalInput(webinar.scheduledAt));
    setDuration(webinar.durationMinutes || 60);
    setReason(""); setNotify(true); setError("");
  }, [webinar]);

  const save = async () => {
    if (!when) return setError("Pick the new date and time");
    const date = new Date(when);
    if (Number.isNaN(date.getTime())) return setError("That date is not valid");
    if (date.getTime() < Date.now()) return setError("The new date and time must be in the future");
    try {
      setBusy(true); setError("");
      const r = await updateWebinar(webinar.id, { scheduledAt: date.toISOString(), durationMinutes: Number(duration), reason, notify });
      onDone?.(r);
    } catch (e) {
      setError(e?.response?.data?.message || "Could not reschedule");
    } finally { setBusy(false); }
  };

  return (
    <Dialog open={!!webinar} onClose={busy ? undefined : onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
      <DialogTitle sx={{ fontWeight: 800 }}>Reschedule webinar</DialogTitle>
      <DialogContent>
        <Typography sx={{ color: "text.secondary", fontSize: 14, mb: 2 }}>
          Rescheduling <strong>"{webinar?.title}"</strong>. The join link stays the same.
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Stack spacing={2}>
          <TextField type="datetime-local" label="New date & time" InputLabelProps={{ shrink: true }} value={when} onChange={(e) => setWhen(e.target.value)} fullWidth />
          <TextField select label="Duration" value={duration} onChange={(e) => setDuration(e.target.value)} fullWidth>
            {[30, 45, 60, 90, 120, 180, 240].map((d) => <MenuItem key={d} value={d}>{d} minutes</MenuItem>)}
          </TextField>
          <TextField label="Reason (optional)" multiline rows={2} value={reason} onChange={(e) => setReason(e.target.value)}
            placeholder="Tell people why the webinar moved" inputProps={{ maxLength: 500 }} fullWidth />
          <FormControlLabel
            control={<Checkbox checked={notify} onChange={(e) => setNotify(e.target.checked)} />}
            label="Email the hosting team and registered guests" />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} disabled={busy} sx={{ textTransform: "none" }}>Close</Button>
        <Button variant="contained" onClick={save} disabled={busy} sx={{ textTransform: "none", fontWeight: 700, bgcolor: NAVY, borderRadius: 2.5 }}>
          {busy ? <CircularProgress size={18} color="inherit" /> : "Reschedule"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
