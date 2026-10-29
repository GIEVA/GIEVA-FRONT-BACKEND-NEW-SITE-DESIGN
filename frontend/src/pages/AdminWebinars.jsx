// pages/AdminWebinars.jsx   Route (admin area): /admin/webinars
// Lists every webinar, schedules new ones, edits the team, copies the join link, cancels.
import { useCallback, useEffect, useState } from "react";
import {
  Box, Typography, Button, Chip, Stack, Paper, IconButton, Tooltip, CircularProgress, Snackbar, Alert, Dialog, DialogTitle,
  DialogContent, DialogActions, MenuItem, TextField, Autocomplete,
} from "@mui/material";
import { Add, ContentCopy, Groups, Cancel, OpenInNew, Delete } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import ScheduleWebinarDialog from "../components/live/ScheduleWebinarDialog";
import {
  listWebinars, cancelWebinar, getWebinarTeam, assignWebinarTeamMember, removeWebinarTeamMember, searchWebinarUsers,
} from "../services/webinarService";

const NAVY = "#0B1F3A";
const GOLD = "#D4A017";
const ROLE = { host: "Host", alt_host: "Alt host", cohost: "Co-host", panelist: "Panelist" };
const STATUS = { scheduled: ["Scheduled", GOLD], live: ["Live", "#ef4444"], ended: ["Ended", "#64748b"], cancelled: ["Cancelled", "#64748b"] };
const fmt = (d) => new Date(d).toLocaleString("en-NG", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

function TeamDialog({ webinar, onClose, onToast }) {
  const [team, setTeam] = useState(null);
  const [opts, setOpts] = useState([]);
  const [pick, setPick] = useState(null);
  const [role, setRole] = useState("cohost");
  const load = useCallback(() => getWebinarTeam(webinar.id).then((r) => setTeam(r.team)).catch(() => onToast("Could not load the team", "error")), [webinar.id, onToast]);
  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!pick) return;
    try { const r = await assignWebinarTeamMember(webinar.id, pick.id, role); onToast(r.message, "success"); setPick(null); load(); }
    catch (e) { onToast(e?.response?.data?.message || "Could not add", "error"); }
  };
  const remove = async (userId) => {
    try { await removeWebinarTeamMember(webinar.id, userId); load(); }
    catch (e) { onToast(e?.response?.data?.message || "Could not remove", "error"); }
  };

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 800 }}>Team: {webinar.title}</DialogTitle>
      <DialogContent>
        {!team ? <CircularProgress size={24} /> : (
          <Stack spacing={1} sx={{ mb: 2 }}>
            {team.map((m) => (
              <Box key={m.userId} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", p: 1, borderRadius: 2, bgcolor: "#F8FAFC" }}>
                <Box><Typography sx={{ fontWeight: 700, fontSize: 14 }}>{m.name}</Typography><Typography sx={{ fontSize: 12, color: "text.secondary" }}>{m.email}</Typography></Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Chip size="small" label={ROLE[m.role]} sx={{ fontWeight: 700 }} />
                  <IconButton size="small" onClick={() => remove(m.userId)}><Delete fontSize="small" /></IconButton>
                </Box>
              </Box>
            ))}
          </Stack>
        )}
        <Typography sx={{ fontWeight: 800, fontSize: 13, mb: 1 }}>Add or change a person</Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <Autocomplete fullWidth size="small" options={opts} value={pick} filterOptions={(x) => x}
            getOptionLabel={(o) => `${o.name} (${o.email})`}
            onInputChange={async (_, q) => { if (q.trim().length >= 2) { try { setOpts((await searchWebinarUsers(q)).users); } catch { setOpts([]); } } }}
            onChange={(_, v) => setPick(v)} renderInput={(p) => <TextField {...p} label="Search name or email" />} />
          <TextField select size="small" label="Role" value={role} onChange={(e) => setRole(e.target.value)} sx={{ minWidth: 140 }}>
            {Object.entries(ROLE).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
          </TextField>
          <Button variant="contained" disabled={!pick} onClick={add} sx={{ textTransform: "none", fontWeight: 700, bgcolor: NAVY }}>Add</Button>
        </Stack>
        <Typography sx={{ fontSize: 12, color: "text.secondary", mt: 1 }}>Making someone the host moves the current host to alternative host.</Typography>
      </DialogContent>
      <DialogActions><Button onClick={onClose} sx={{ textTransform: "none" }}>Done</Button></DialogActions>
    </Dialog>
  );
}

export default function AdminWebinars({ embedded = false }) {
  const navigate = useNavigate();
  const [rows, setRows] = useState(null);
  const [open, setOpen] = useState(false);
  const [teamFor, setTeamFor] = useState(null);
  const [toast, setToast] = useState(null);
  const say = useCallback((msg, severity = "info") => setToast({ msg, severity }), []);

  const load = useCallback(() => listWebinars("all").then((r) => setRows(r.webinars)).catch(() => say("Could not load webinars", "error")), [say]);
  useEffect(() => { load(); }, [load]);

  const link = (w) => `${window.location.origin}/webinar/${w.id}`;
  const copy = async (w) => { try { await navigator.clipboard.writeText(link(w)); say("Join link copied", "success"); } catch { say(link(w), "info"); } };
  const cancel = async (w) => {
    if (!window.confirm(`Cancel "${w.title}"?`)) return;
    try { await cancelWebinar(w.id); say("Cancelled", "success"); load(); } catch (e) { say(e?.response?.data?.message || "Could not cancel", "error"); }
  };

  return (
    <Box sx={embedded ? {} : { p: { xs: 2, md: 4 } }}>
      <Box sx={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 2, mb: 3 }}>
        {embedded ? (
          <Typography sx={{ fontSize: 13.5, color: "text.secondary" }}>Webinars, their hosting teams and join links.</Typography>
        ) : (
          <Box>
            <Typography sx={{ color: GOLD, fontWeight: 800, letterSpacing: 1.4, fontSize: 12 }}>ADMIN</Typography>
            <Typography sx={{ fontWeight: 900, fontSize: { xs: 24, md: 30 }, color: NAVY }}>Webinars</Typography>
          </Box>
        )}
        <Button startIcon={<Add />} variant="contained" disableElevation onClick={() => setOpen(true)} sx={{ textTransform: "none", fontWeight: 800, borderRadius: 3, bgcolor: NAVY }}>Schedule webinar</Button>
      </Box>

      {!rows ? <Box sx={{ textAlign: "center", p: 6 }}><CircularProgress /></Box> : !rows.length ? (
        <Paper variant="outlined" sx={{ p: 5, textAlign: "center", borderRadius: 4 }}><Typography>No webinars yet. Schedule the first one.</Typography></Paper>
      ) : (
        <Stack spacing={1.5}>
          {rows.map((w) => {
            const [label, color] = STATUS[w.status] || [w.status, "#64748b"];
            const host = w.team?.find((m) => m.role === "host");
            const active = ["scheduled", "live"].includes(w.status);
            return (
              <Paper key={w.id} variant="outlined" sx={{ p: 2, borderRadius: 3, display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
                <Box sx={{ flex: 1, minWidth: 220 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                    <Typography sx={{ fontWeight: 800, color: NAVY }}>{w.title}</Typography>
                    <Chip size="small" label={label} sx={{ bgcolor: `${color}22`, color, fontWeight: 800 }} />
                  </Box>
                  <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
                    {fmt(w.scheduledAt)} · {w.durationMinutes} min · up to {w.capacity} attendees{host ? ` · Host: ${host.name}` : ""}
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: "text.secondary" }}>{w.team?.length || 0} on the team{w.qaEnabled ? " · Q&A on" : ""}{w.recordingEnabled ? " · recording on" : ""}</Typography>
                </Box>
                <Tooltip title="Copy join link"><IconButton onClick={() => copy(w)}><ContentCopy fontSize="small" /></IconButton></Tooltip>
                <Tooltip title="Team"><span><IconButton disabled={!active} onClick={() => setTeamFor(w)}><Groups fontSize="small" /></IconButton></span></Tooltip>
                <Tooltip title="Open"><IconButton onClick={() => navigate(`/webinar/${w.id}`)}><OpenInNew fontSize="small" /></IconButton></Tooltip>
                {w.status === "scheduled" && <Tooltip title="Cancel"><IconButton onClick={() => cancel(w)}><Cancel fontSize="small" /></IconButton></Tooltip>}
              </Paper>
            );
          })}
        </Stack>
      )}

      <ScheduleWebinarDialog open={open} onClose={() => setOpen(false)} onCreated={() => { say("Webinar scheduled. The team has been emailed.", "success"); load(); }} />
      {teamFor && <TeamDialog webinar={teamFor} onClose={() => { setTeamFor(null); load(); }} onToast={say} />}
      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={toast?.severity || "info"} onClose={() => setToast(null)}>{toast?.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
