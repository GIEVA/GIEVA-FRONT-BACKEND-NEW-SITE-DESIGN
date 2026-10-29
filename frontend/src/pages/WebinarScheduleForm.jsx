// components/live/WebinarScheduleForm.jsx
// Inline webinar scheduling form (used as the "Webinar Session" option of the Schedule tab).
// The "Webinar" option of your scheduler (next to Course session and Public session).
// Admin picks the host, alt hosts, co-hosts and panelists; everyone else joins as a view-only attendee.
import { useEffect, useRef, useState } from "react";
import {
  Button, TextField, Stack, MenuItem, Typography, Box, Chip,
  Switch, FormControlLabel, Autocomplete, CircularProgress, Alert, Divider,
} from "@mui/material";
import { createWebinar, searchWebinarUsers } from "../../services/webinarService";

const NAVY = "#0B1F3A";
const GREEN = "#1E7F4F";

// Search-as-you-type people picker (admin only on the server)
function PersonPicker({ label, multiple, value, onChange, helper }) {
  const [opts, setOpts] = useState([]);
  const [loading, setLoading] = useState(false);
  const t = useRef();
  const search = (q) => {
    clearTimeout(t.current);
    if (q.trim().length < 2) return setOpts([]);
    t.current = setTimeout(async () => {
      try { setLoading(true); setOpts((await searchWebinarUsers(q)).users); } catch { setOpts([]); } finally { setLoading(false); }
    }, 300);
  };
  return (
    <Autocomplete
      multiple={multiple} options={opts} value={value} loading={loading}
      filterOptions={(x) => x}
      getOptionLabel={(o) => `${o.name}${o.email ? ` (${o.email})` : ""}`}
      isOptionEqualToValue={(a, b) => a.id === b.id}
      onInputChange={(_, v) => search(v)}
      onChange={(_, v) => onChange(v)}
      noOptionsText="Type at least 2 letters of a name or email"
      renderTags={(v, getProps) => v.map((o, i) => <Chip size="small" label={o.name} {...getProps({ index: i })} key={o.id} />)}
      renderInput={(p) => <TextField {...p} label={label} helperText={helper} />}
    />
  );
}

export function WebinarScheduleForm({ onCreated, onCancel, resetKey }) {
  const blank = { title: "", description: "", scheduledAt: "", durationMinutes: 60, capacity: 500, qaEnabled: true, recordingEnabled: true };
  const [f, setF] = useState(blank);
  const [host, setHost] = useState(null);
  const [alt, setAlt] = useState([]);
  const [co, setCo] = useState([]);
  const [pan, setPan] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  useEffect(() => { setF(blank); setHost(null); setAlt([]); setCo([]); setPan([]); setError(""); /* eslint-disable-next-line */ }, [resetKey]);

  const save = async () => {
    if (f.title.trim().length < 3) return setError("Enter a webinar title");
    if (!f.scheduledAt) return setError("Pick a date and time");
    if (!host) return setError("Choose the host");
    try {
      setBusy(true); setError("");
      const r = await createWebinar({
        ...f, durationMinutes: Number(f.durationMinutes), capacity: Number(f.capacity),
        scheduledAt: new Date(f.scheduledAt).toISOString(),
        hostUserId: host.id, altHostIds: alt.map((u) => u.id), cohostIds: co.map((u) => u.id), panelistIds: pan.map((u) => u.id),
      });
      onCreated?.(r);
    } catch (e) {
      setError(e?.response?.data?.message || "Could not schedule the webinar");
    } finally { setBusy(false); }
  };

  return (
    <Box>
      <Stack spacing={2} sx={{ mt: 1 }}>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField required fullWidth label="Webinar title" value={f.title} onChange={set("title")} inputProps={{ maxLength: 255 }} />
        <TextField fullWidth multiline rows={2} label="Description (optional)" value={f.description} onChange={set("description")} />
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField required fullWidth type="datetime-local" label="Date & time" InputLabelProps={{ shrink: true }} value={f.scheduledAt} onChange={set("scheduledAt")} />
          <TextField fullWidth select label="Duration" value={f.durationMinutes} onChange={set("durationMinutes")}>
            {[30, 45, 60, 90, 120, 180].map((d) => <MenuItem key={d} value={d}>{d} minutes</MenuItem>)}
          </TextField>
        </Stack>

        <Divider><Typography sx={{ fontSize: 12, color: "text.secondary", fontWeight: 700 }}>HOSTING TEAM</Typography></Divider>
        <PersonPicker label="Host (required)" value={host} onChange={setHost} helper="Starts, runs and ends the webinar. Can promote attendees and live-stream." />
        <PersonPicker multiple label="Alternative hosts" value={alt} onChange={setAlt} helper="Can start the webinar if the host is absent, with the same powers as the host." />
        <PersonPicker multiple label="Co-hosts" value={co} onChange={setCo} helper="Help manage: mute, Q&A, polls, recording. Cannot promote people or live-stream." />
        <PersonPicker multiple label="Panelists" value={pan} onChange={setPan} helper="Can speak, show video and share their screen." />

        <Divider><Typography sx={{ fontSize: 12, color: "text.secondary", fontWeight: 700 }}>ATTENDEES</Typography></Divider>
        <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
          Everyone else who opens the link joins view-only. They watch and listen, and use chat, Q&amp;A, polls and raise hand. A host can promote one to panelist during the webinar.
        </Typography>
        <TextField fullWidth type="number" label="Attendee capacity" value={f.capacity} onChange={set("capacity")} inputProps={{ min: 10, max: 5000 }} helperText="Maximum people in the room at once" />
        <Box>
          <FormControlLabel control={<Switch checked={f.qaEnabled} onChange={(e) => setF((x) => ({ ...x, qaEnabled: e.target.checked }))} />} label="Q&A enabled" />
          <FormControlLabel control={<Switch checked={f.recordingEnabled} onChange={(e) => setF((x) => ({ ...x, recordingEnabled: e.target.checked }))} />} label="Record automatically (with AI notes)" />
        </Box>
      </Stack>
      <Box sx={{ mt: 3, display: "flex", gap: 1 }}>
        {onCancel && <Button onClick={onCancel} sx={{ textTransform: "none" }}>Cancel</Button>}
        <Button onClick={save} disabled={busy} variant="contained" disableElevation
          startIcon={busy ? <CircularProgress size={16} color="inherit" /> : null}
          sx={{ textTransform: "none", fontWeight: 800, borderRadius: 2.5, px: 3, bgcolor: NAVY, "&:hover": { bgcolor: GREEN } }}>
          {busy ? "Scheduling…" : "Schedule Webinar"}
        </Button>
      </Box>
    </Box>
  );
}
