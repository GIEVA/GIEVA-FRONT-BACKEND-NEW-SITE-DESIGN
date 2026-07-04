import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import {
  Box, Typography, Paper, Grid, Button, Chip, Stack,
  CircularProgress, Tabs, Tab, Avatar, IconButton, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Drawer, Divider, List, ListItem,
  ListItemText, ListItemAvatar, Badge, Pagination, Alert,
  Snackbar,
} from "@mui/material";

import {
  PlayCircle, Schedule, Cancel, CheckCircle, HourglassTop,
  Videocam, CalendarMonth, AccessTime, PeopleAlt, Add,
  Refresh, MoreVert, Edit, StopCircle, Info, Close,
  BarChart, Person, EventAvailable,
} from "@mui/icons-material";

import {
  getTutorSessions,
  scheduleClassSession,
  joinTutorSession,
  endSession,
  cancelSession,
  rescheduleSession,
  forceEndSession,
  getSessionDetail,
  getSessionAttendance,
} from "../services/tutorSessionService";

// ─── Design tokens ──────────────────────────────────────────
const NAVY   = "#0B1F3A";
const GREEN  = "#1E7F4F";
const GOLD   = "#D4A017";
const BG     = "#F7F9FC";
const CARD   = "#FFFFFF";
const BORDER = "#E6E9F0";
const TEXT   = "#0F172A";
const MUTED  = "#64748B";

const SESSIONS_PER_PAGE = 10;

// ─── Status config ───────────────────────────────────────────
const STATUS = {
  live:      { label: "Live",      color: "#ef4444", bg: "rgba(239,68,68,0.1)",     icon: <Videocam sx={{ fontSize: 13 }} /> },
  scheduled: { label: "Scheduled", color: GOLD,      bg: "rgba(212,160,23,0.1)",    icon: <Schedule sx={{ fontSize: 13 }} /> },
  ended:     { label: "Ended",     color: MUTED,     bg: "#F1F5F9",                 icon: <CheckCircle sx={{ fontSize: 13 }} /> },
  cancelled: { label: "Cancelled", color: "#ef4444", bg: "rgba(239,68,68,0.08)",    icon: <Cancel sx={{ fontSize: 13 }} /> },
};

const fmt = (d) => new Date(d).toLocaleDateString("en-NG",
  { weekday: "short", day: "numeric", month: "short", year: "numeric" });
const fmtTime = (d) => new Date(d).toLocaleTimeString("en-NG",
  { hour: "2-digit", minute: "2-digit" });
const fmtDateTime = (d) => `${fmt(d)} at ${fmtTime(d)}`;

// ─── Session Card ─────────────────────────────────────────────
const SessionCard = ({ session, onJoin, onReschedule, onForceEnd, onCancel, onDetail }) => {
  const cfg    = STATUS[session.status] || STATUS.scheduled;
  const isLive = session.status === "live" || session.isLive;

  return (
    <Paper elevation={0} sx={{
      border: `1px solid ${isLive ? "rgba(239,68,68,0.35)" : BORDER}`,
      borderRadius: 3, bgcolor: CARD, overflow: "hidden",
      transition: "box-shadow 0.2s, transform 0.2s",
      "&:hover": { boxShadow: "0 6px 24px rgba(15,23,42,0.08)", transform: "translateY(-1px)" },
    }}>
      {/* Header strip */}
      <Box sx={{
        px: 2.5, py: 1.5,
        background: isLive
          ? "linear-gradient(135deg, #0B1F3A, #1a3a5c)"
          : "linear-gradient(135deg, #0B1F3A, #1E7F4F)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <Chip icon={cfg.icon} label={cfg.label} size="small"
          sx={{ bgcolor: cfg.bg, color: cfg.color, fontWeight: 800,
                border: `1px solid ${cfg.color}44`, "& .MuiChip-icon": { color: cfg.color },
                ...(isLive && {
                  animation: "livePulse 1.5s ease-in-out infinite",
                  "@keyframes livePulse": {
                    "0%,100%": { boxShadow: `0 0 0 0 ${cfg.color}55` },
                    "50%":     { boxShadow: `0 0 0 6px ${cfg.color}00` },
                  },
                }) }} />
        {session.Course?.title && (
          <Chip label={session.Course.title} size="small"
            sx={{ bgcolor: "rgba(255,255,255,0.15)", color: "#fff", fontSize: 11, fontWeight: 700 }} />
        )}
      </Box>

      <Box p={2.5}>
        <Typography sx={{ fontSize: 17, fontWeight: 800, color: TEXT, mb: 0.5 }}>
          {session.title}
        </Typography>
        {session.description && (
          <Typography sx={{ fontSize: 13, color: MUTED, mb: 1.5, lineHeight: 1.5 }}>
            {session.description.length > 80
              ? `${session.description.slice(0, 80)}…`
              : session.description}
          </Typography>
        )}

        <Stack spacing={1} mb={2}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CalendarMonth sx={{ fontSize: 15, color: MUTED }} />
            <Typography sx={{ fontSize: 13, color: MUTED }}>{fmt(session.scheduledAt)}</Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <AccessTime sx={{ fontSize: 15, color: MUTED }} />
            <Typography sx={{ fontSize: 13, color: MUTED }}>
              {fmtTime(session.scheduledAt)} · {session.durationMinutes} min
            </Typography>
          </Box>
          {session.totalParticipants > 0 && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <PeopleAlt sx={{ fontSize: 15, color: MUTED }} />
              <Typography sx={{ fontSize: 13, color: MUTED }}>
                {session.totalParticipants} participant{session.totalParticipants !== 1 ? "s" : ""}
              </Typography>
            </Box>
          )}
        </Stack>

        {/* Action buttons */}
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {(isLive || session.status === "scheduled") && (
            <Button size="small" variant="contained" startIcon={<PlayCircle />}
              onClick={() => onJoin(session)}
              sx={{ bgcolor: isLive ? "#ef4444" : NAVY, color: "#fff", textTransform: "none",
                    fontWeight: 700, borderRadius: 2,
                    "&:hover": { bgcolor: isLive ? "#dc2626" : GREEN } }}>
              {isLive ? "Resume" : "Start"}
            </Button>
          )}

          <Tooltip title="View details">
            <IconButton size="small" onClick={() => onDetail(session)}
              sx={{ border: `1px solid ${BORDER}`, borderRadius: 1.5, color: MUTED }}>
              <Info sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>

          {session.status === "scheduled" && (
            <Tooltip title="Reschedule">
              <IconButton size="small" onClick={() => onReschedule(session)}
                sx={{ border: `1px solid ${BORDER}`, borderRadius: 1.5, color: MUTED }}>
                <Edit sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          )}

          {(isLive || session.status === "scheduled") && (
            <Tooltip title="Force end">
              <IconButton size="small" onClick={() => onForceEnd(session)}
                sx={{ border: "1px solid rgba(239,68,68,0.35)", borderRadius: 1.5, color: "#ef4444" }}>
                <StopCircle sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          )}

          {session.status === "scheduled" && (
            <Tooltip title="Cancel session">
              <IconButton size="small" onClick={() => onCancel(session)}
                sx={{ border: "1px solid rgba(239,68,68,0.2)", borderRadius: 1.5, color: "#ef4444" }}>
                <Cancel sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </Box>
    </Paper>
  );
};

// ─── Session Detail Drawer ────────────────────────────────────
const DetailDrawer = ({ open, onClose, session }) => {
  const [attendance, setAttendance] = useState([]);
  const [loading,    setLoading]    = useState(false);

  useEffect(() => {
    if (!open || !session) return;
    setLoading(true);
    getSessionAttendance(session.id)
      .then((r) => setAttendance(r.attendance || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [open, session]);

  if (!session) return null;

  const attended = attendance.filter((a) => a.wasPresent || a.joinTime).length;

  return (
    <Drawer anchor="right" open={open} onClose={onClose}
      PaperProps={{ sx: { width: { xs: "100vw", sm: 420 }, bgcolor: BG } }}>
      <Box sx={{ p: 3, display: "flex", alignItems: "center", justifyContent: "space-between",
                 borderBottom: `1px solid ${BORDER}`, bgcolor: CARD }}>
        <Typography sx={{ fontWeight: 800, fontSize: 17, color: TEXT }}>Session Details</Typography>
        <IconButton onClick={onClose}><Close /></IconButton>
      </Box>

      <Box sx={{ p: 3, overflowY: "auto" }}>
        {/* Status + title */}
        <Box mb={3}>
          <Chip label={STATUS[session.status]?.label || session.status} size="small"
            sx={{ bgcolor: STATUS[session.status]?.bg, color: STATUS[session.status]?.color,
                  fontWeight: 800, mb: 1.5 }} />
          <Typography sx={{ fontSize: 20, fontWeight: 800, color: TEXT }}>{session.title}</Typography>
          {session.description && (
            <Typography sx={{ fontSize: 14, color: MUTED, mt: 1, lineHeight: 1.6 }}>
              {session.description}
            </Typography>
          )}
        </Box>

        {/* Info grid */}
        <Paper elevation={0} sx={{ border: `1px solid ${BORDER}`, borderRadius: 3, p: 2, mb: 3 }}>
          {[
            ["Course",    session.Course?.title || "—"],
            ["Date",      fmtDateTime(session.scheduledAt)],
            ["Duration",  `${session.durationMinutes} minutes`],
            ["Room",      session.roomName || "—"],
            ["Status",    session.status],
          ].map(([label, value]) => (
            <Box key={label} sx={{ display: "flex", justifyContent: "space-between",
                                    py: 1, borderBottom: `1px solid ${BORDER}`,
                                    "&:last-child": { borderBottom: "none" } }}>
              <Typography sx={{ fontSize: 13, color: MUTED, fontWeight: 600 }}>{label}</Typography>
              <Typography sx={{ fontSize: 13, color: TEXT, fontWeight: 700, maxWidth: "60%",
                                textAlign: "right" }}>{value}</Typography>
            </Box>
          ))}
        </Paper>

        {/* Join link */}
        {session.joinLink && (
          <Box mb={3}>
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: MUTED, mb: 1,
                               textTransform: "uppercase", letterSpacing: 0.8 }}>Join Link</Typography>
            <Box sx={{ bgcolor: CARD, border: `1px solid ${BORDER}`, borderRadius: 2,
                       p: 1.5, fontSize: 12, fontFamily: "monospace", color: TEXT,
                       wordBreak: "break-all" }}>
              {session.joinLink}
            </Box>
          </Box>
        )}

        {/* Attendance */}
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
            <Typography sx={{ fontSize: 14, fontWeight: 800, color: TEXT }}>
              Attendance
            </Typography>
            <Chip label={`${attended} / ${attendance.length}`} size="small"
              sx={{ bgcolor: `${GREEN}15`, color: GREEN, fontWeight: 800 }} />
          </Box>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
              <CircularProgress size={24} sx={{ color: GREEN }} />
            </Box>
          ) : attendance.length === 0 ? (
            <Typography sx={{ fontSize: 13, color: MUTED, textAlign: "center", py: 3 }}>
              No attendance records yet
            </Typography>
          ) : (
            <List disablePadding>
              {attendance.map((a) => (
                <ListItem key={a.id} disablePadding
                  sx={{ py: 1, borderBottom: `1px solid ${BORDER}` }}>
                  <ListItemAvatar>
                    <Avatar sx={{ width: 32, height: 32, fontSize: 13, bgcolor: GREEN }}>
                      {a.User?.fullName?.[0] || "?"}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography sx={{ fontSize: 13, fontWeight: 700, color: TEXT }}>
                        {a.User?.fullName || "Unknown"}
                      </Typography>
                    }
                    secondary={
                      <Typography sx={{ fontSize: 12, color: MUTED }}>
                        {a.joinTime ? `Joined ${fmtTime(a.joinTime)}` : "Not attended"}
                        {a.minutesAttended ? ` · ${a.minutesAttended} min` : ""}
                      </Typography>
                    }
                  />
                  {(a.wasPresent || a.joinTime) ? (
                    <CheckCircle sx={{ fontSize: 16, color: GREEN }} />
                  ) : (
                    <Cancel sx={{ fontSize: 16, color: MUTED }} />
                  )}
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </Box>
    </Drawer>
  );
};

// ─── Reschedule Dialog ────────────────────────────────────────
const RescheduleDialog = ({ open, session, onClose, onSave, loading }) => {
  const [form, setForm] = useState({ scheduledAt: "", durationMinutes: "", reason: "" });

  useEffect(() => {
    if (session) {
      const d = new Date(session.scheduledAt);
      // Format for datetime-local input (YYYY-MM-DDTHH:MM)
      const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
        .toISOString().slice(0, 16);
      setForm({ scheduledAt: local, durationMinutes: session.durationMinutes, reason: "" });
    }
  }, [session]);

  const setField = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  if (!session) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 800, fontSize: 18, color: TEXT }}>
        Reschedule Session
      </DialogTitle>
      <DialogContent>
        <Typography sx={{ fontSize: 14, color: MUTED, mb: 3 }}>
          Rescheduling <strong>"{session.title}"</strong>. Enrolled students will be notified.
        </Typography>

        <TextField fullWidth type="datetime-local" label="New Date & Time"
          InputLabelProps={{ shrink: true }} value={form.scheduledAt}
          onChange={setField("scheduledAt")} sx={{ mb: 2, "& fieldset": { borderColor: BORDER } }} />

        <TextField fullWidth select label="Duration" value={form.durationMinutes}
          onChange={setField("durationMinutes")} sx={{ mb: 2, "& fieldset": { borderColor: BORDER } }}>
          {[30, 45, 60, 90, 120, 180].map((d) => (
            <MenuItem key={d} value={d}>{d} minutes</MenuItem>
          ))}
        </TextField>

        <TextField fullWidth multiline rows={2} label="Reason (optional)"
          value={form.reason} onChange={setField("reason")}
          placeholder="Let students know why the session was rescheduled"
          sx={{ "& fieldset": { borderColor: BORDER } }} />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={onClose} variant="outlined"
          sx={{ textTransform: "none", borderColor: BORDER, color: MUTED, borderRadius: 2 }}>
          Cancel
        </Button>
        <Button onClick={() => onSave(form)} variant="contained" disabled={loading}
          sx={{ textTransform: "none", bgcolor: NAVY, fontWeight: 700, borderRadius: 2,
                "&:hover": { bgcolor: GREEN } }}>
          {loading ? <CircularProgress size={18} color="inherit" /> : "Reschedule"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─── Force End Dialog ─────────────────────────────────────────
const ForceEndDialog = ({ open, session, onClose, onConfirm, loading }) => {
  const [reason, setReason] = useState("");

  useEffect(() => { if (!open) setReason(""); }, [open]);

  if (!session) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 800, fontSize: 17, color: TEXT }}>
        Force End Session
      </DialogTitle>
      <DialogContent>
        <Alert severity="warning" sx={{ borderRadius: 2, mb: 2 }}>
          This will immediately end <strong>"{session.title}"</strong> and remove all participants.
        </Alert>
        <TextField fullWidth multiline rows={2} label="Reason (optional)" value={reason}
          onChange={(e) => setReason(e.target.value)}
          sx={{ "& fieldset": { borderColor: BORDER } }} />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={onClose} variant="outlined"
          sx={{ textTransform: "none", borderColor: BORDER, color: MUTED, borderRadius: 2 }}>
          Back
        </Button>
        <Button onClick={() => onConfirm(reason)} variant="contained" disabled={loading}
          sx={{ textTransform: "none", bgcolor: "#ef4444", fontWeight: 700, borderRadius: 2,
                "&:hover": { bgcolor: "#dc2626" } }}>
          {loading ? <CircularProgress size={18} color="inherit" /> : "Force End"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─── Cancel Dialog ────────────────────────────────────────────
const CancelDialog = ({ open, session, onClose, onConfirm, loading }) => {
  const [reason, setReason] = useState("");
  useEffect(() => { if (!open) setReason(""); }, [open]);
  if (!session) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 800, fontSize: 17, color: TEXT }}>Cancel Session</DialogTitle>
      <DialogContent>
        <Alert severity="error" sx={{ borderRadius: 2, mb: 2 }}>
          Cancel <strong>"{session.title}"</strong>? This cannot be undone.
        </Alert>
        <TextField fullWidth multiline rows={2} label="Reason (optional)" value={reason}
          onChange={(e) => setReason(e.target.value)}
          sx={{ "& fieldset": { borderColor: BORDER } }} />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={onClose} variant="outlined"
          sx={{ textTransform: "none", borderColor: BORDER, color: MUTED, borderRadius: 2 }}>Back</Button>
        <Button onClick={() => onConfirm(reason)} variant="contained" disabled={loading}
          sx={{ textTransform: "none", bgcolor: "#ef4444", fontWeight: 700, borderRadius: 2,
                "&:hover": { bgcolor: "#dc2626" } }}>
          {loading ? <CircularProgress size={18} color="inherit" /> : "Cancel Session"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─── Schedule Dialog (existing, slightly cleaned up) ──────────
const ScheduleDialog = ({ open, onClose, onSave, loading }) => {
  const [form, setForm] = useState({
    title: "", description: "", courseId: "", scheduledAt: "",
    durationMinutes: 60, visibility: "assigned_students",
  });
  const setField = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSave = () => {
    if (!form.title || !form.courseId || !form.scheduledAt)
      return alert("Please fill in all required fields");
    onSave({ ...form, durationMinutes: Number(form.durationMinutes) });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 800, fontSize: 18, color: TEXT }}>Schedule Live Class</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          <TextField required fullWidth label="Session Title" value={form.title}
            onChange={setField("title")} sx={{ "& fieldset": { borderColor: BORDER } }} />
          <TextField fullWidth multiline rows={2} label="Description (optional)"
            value={form.description} onChange={setField("description")}
            sx={{ "& fieldset": { borderColor: BORDER } }} />
          <TextField required fullWidth type="number" label="Course ID" value={form.courseId}
            onChange={setField("courseId")} helperText="Numeric course ID"
            sx={{ "& fieldset": { borderColor: BORDER } }} />
          <TextField required fullWidth type="datetime-local" label="Date & Time"
            InputLabelProps={{ shrink: true }} value={form.scheduledAt}
            onChange={setField("scheduledAt")} sx={{ "& fieldset": { borderColor: BORDER } }} />
          <TextField fullWidth select label="Duration" value={form.durationMinutes}
            onChange={setField("durationMinutes")} sx={{ "& fieldset": { borderColor: BORDER } }}>
            {[30, 45, 60, 90, 120].map((d) => (
              <MenuItem key={d} value={d}>{d} minutes</MenuItem>
            ))}
          </TextField>
          <TextField fullWidth select label="Visibility" value={form.visibility}
            onChange={setField("visibility")} sx={{ "& fieldset": { borderColor: BORDER } }}>
            <MenuItem value="assigned_students">Assigned students only</MenuItem>
            <MenuItem value="course_students">All course students</MenuItem>
          </TextField>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={onClose} variant="outlined"
          sx={{ textTransform: "none", borderColor: BORDER, color: MUTED, borderRadius: 2 }}>
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained" disabled={loading}
          sx={{ textTransform: "none", bgcolor: NAVY, fontWeight: 700, borderRadius: 2,
                "&:hover": { bgcolor: GREEN } }}>
          {loading ? <CircularProgress size={18} color="inherit" /> : "Schedule"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─── MAIN PAGE ────────────────────────────────────────────────
export default function TutorLiveClasses() {
  const navigate = useNavigate();

  const [sessions,    setSessions]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [tab,         setTab]         = useState(0);    // 0=All 1=Scheduled 2=Live 3=Ended
  const [page,        setPage]        = useState(1);
  const [toast,       setToast]       = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Dialog/drawer state
  const [scheduleOpen,   setScheduleOpen]   = useState(false);
  const [detailSession,  setDetailSession]  = useState(null);
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [forceEndTarget,   setForceEndTarget]   = useState(null);
  const [cancelTarget,     setCancelTarget]     = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getTutorSessions();
      setSessions(res.sessions || []);
    } catch (err) {
      setToast({ msg: err?.response?.data?.message || "Failed to load sessions", severity: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Filter by tab ──
  const TAB_FILTERS = [
    (s) => true,
    (s) => s.status === "scheduled",
    (s) => s.status === "live" || s.isLive,
    (s) => s.status === "ended",
    (s) => s.status === "cancelled",
  ];
  const TAB_LABELS = ["All", "Scheduled", "Live", "Ended", "Cancelled"];

  const filtered = sessions.filter(TAB_FILTERS[tab] || (() => true));

  // ── Pagination ──
  const totalPages = Math.ceil(filtered.length / SESSIONS_PER_PAGE);
  const paginated  = filtered.slice((page - 1) * SESSIONS_PER_PAGE, page * SESSIONS_PER_PAGE);

  // Reset to page 1 when tab changes
  const handleTabChange = (_, v) => { setTab(v); setPage(1); };

  // ── Stats ──
  const live      = sessions.filter((s) => s.status === "live" || s.isLive).length;
  const scheduled = sessions.filter((s) => s.status === "scheduled").length;
  const ended     = sessions.filter((s) => s.status === "ended").length;

  // ── Handlers ──
  const handleJoin = async (session) => {
    try {
      const res = await joinTutorSession(session.id);
      navigate(`/live/${session.roomName}/${session.id}`, { state: { role: "tutor" } });
    } catch (err) {
      setToast({ msg: err?.response?.data?.message || "Failed to join", severity: "error" });
    }
  };

  const handleSchedule = async (form) => {
    try {
      setActionLoading(true);
      await scheduleClassSession(form);
      setToast({ msg: "Class session scheduled!", severity: "success" });
      setScheduleOpen(false);
      await load();
    } catch (err) {
      setToast({ msg: err?.response?.data?.message || "Failed to schedule", severity: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReschedule = async (form) => {
    try {
      setActionLoading(true);
      await rescheduleSession(rescheduleTarget.id, form);
      setToast({ msg: "Session rescheduled. Students notified.", severity: "success" });
      setRescheduleTarget(null);
      await load();
    } catch (err) {
      setToast({ msg: err?.response?.data?.message || "Failed to reschedule", severity: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleForceEnd = async (reason) => {
    try {
      setActionLoading(true);
      await forceEndSession(forceEndTarget.id, reason);
      setToast({ msg: "Session ended.", severity: "success" });
      setForceEndTarget(null);
      await load();
    } catch (err) {
      setToast({ msg: err?.response?.data?.message || "Failed to end session", severity: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async (reason) => {
    try {
      setActionLoading(true);
      await cancelSession(cancelTarget.id, reason);
      setToast({ msg: "Session cancelled.", severity: "success" });
      setCancelTarget(null);
      await load();
    } catch (err) {
      setToast({ msg: err?.response?.data?.message || "Failed to cancel", severity: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: BG }}>
      <Box sx={{ maxWidth: 1280, mx: "auto", px: { xs: 2, sm: 3, md: 5 }, py: { xs: 3, md: 5 } }}>

        {/* HEADER */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                   flexWrap: "wrap", gap: 2, mb: 4 }}>
          <Box>
            <Typography sx={{ fontSize: { xs: 22, md: 28 }, fontWeight: 800, color: TEXT }}>
              Live Classes
            </Typography>
            <Typography sx={{ fontSize: 14, color: MUTED, mt: 0.5 }}>
              Manage and join your scheduled sessions
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.5}>
            <Button variant="outlined" startIcon={<Refresh />} onClick={load}
              sx={{ textTransform: "none", borderColor: BORDER, color: MUTED, borderRadius: 2 }}>
              Refresh
            </Button>
            <Button variant="contained" startIcon={<Add />} onClick={() => setScheduleOpen(true)}
              sx={{ textTransform: "none", bgcolor: NAVY, fontWeight: 700, borderRadius: 2,
                    "&:hover": { bgcolor: GREEN } }}>
              Schedule Class
            </Button>
          </Stack>
        </Box>

        {/* STATS STRIP */}
        <Grid container spacing={2} mb={4}>
          {[
            { label: "Total Sessions",   value: sessions.length,  icon: <BarChart sx={{ fontSize: 22, color: NAVY }} />,   bg: "#EEF2FF" },
            { label: "Live Now",         value: live,             icon: <Videocam sx={{ fontSize: 22, color: "#ef4444" }} />, bg: "rgba(239,68,68,0.08)" },
            { label: "Scheduled",        value: scheduled,        icon: <EventAvailable sx={{ fontSize: 22, color: GOLD }} />, bg: "rgba(212,160,23,0.1)" },
            { label: "Completed",        value: ended,            icon: <CheckCircle sx={{ fontSize: 22, color: GREEN }} />,  bg: `${GREEN}15` },
          ].map((s) => (
            <Grid item xs={6} sm={3} key={s.label}>
              <Paper elevation={0} sx={{ border: `1px solid ${BORDER}`, borderRadius: 3,
                                         p: 2.5, bgcolor: CARD }}>
                <Box sx={{ width: 44, height: 44, borderRadius: 2.5, bgcolor: s.bg,
                           display: "flex", alignItems: "center", justifyContent: "center", mb: 1.5 }}>
                  {s.icon}
                </Box>
                <Typography sx={{ fontSize: 26, fontWeight: 800, color: TEXT }}>{s.value}</Typography>
                <Typography sx={{ fontSize: 13, color: MUTED }}>{s.label}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* TABS */}
        <Paper elevation={0} sx={{ border: `1px solid ${BORDER}`, borderRadius: 3, overflow: "hidden", mb: 3 }}>
          <Tabs value={tab} onChange={handleTabChange}
            sx={{
              px: 2, pt: 1, borderBottom: `1px solid ${BORDER}`,
              "& .MuiTab-root": { textTransform: "none", fontWeight: 700, fontSize: 14 },
              "& .Mui-selected": { color: NAVY },
              "& .MuiTabs-indicator": { bgcolor: NAVY },
            }}>
            {TAB_LABELS.map((label, i) => {
              const count = sessions.filter(TAB_FILTERS[i]).length;
              return (
                <Tab key={label} label={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                    {label}
                    {count > 0 && (
                      <Chip label={count} size="small"
                        sx={{ height: 18, fontSize: 10, fontWeight: 800,
                              bgcolor: tab === i ? NAVY : `${NAVY}15`,
                              color:   tab === i ? "#fff" : NAVY,
                              "& .MuiChip-label": { px: 0.75 } }} />
                    )}
                  </Box>
                } />
              );
            })}
          </Tabs>

          {/* Session grid */}
          <Box p={3}>
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                <CircularProgress sx={{ color: GREEN }} />
              </Box>
            ) : paginated.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 8 }}>
                <HourglassTop sx={{ fontSize: 48, color: MUTED, mb: 2 }} />
                <Typography sx={{ fontWeight: 700, color: TEXT, mb: 0.5 }}>
                  No {TAB_LABELS[tab].toLowerCase()} sessions
                </Typography>
                <Typography sx={{ fontSize: 14, color: MUTED }}>
                  {tab === 0 ? "Schedule your first class to get started." : "Nothing here yet."}
                </Typography>
              </Box>
            ) : (
              <>
                <Grid container spacing={2.5}>
                  {paginated.map((session) => (
                    <Grid item xs={12} sm={6} lg={4} key={session.id}>
                      <SessionCard
                        session={session}
                        onJoin={handleJoin}
                        onDetail={setDetailSession}
                        onReschedule={setRescheduleTarget}
                        onForceEnd={setForceEndTarget}
                        onCancel={setCancelTarget}
                      />
                    </Grid>
                  ))}
                </Grid>

                {/* PAGINATION */}
                {totalPages > 1 && (
                  <Box sx={{ display: "flex", justifyContent: "center",
                             alignItems: "center", gap: 2, mt: 4 }}>
                    <Typography sx={{ fontSize: 13, color: MUTED }}>
                      Showing {(page - 1) * SESSIONS_PER_PAGE + 1}–
                      {Math.min(page * SESSIONS_PER_PAGE, filtered.length)} of {filtered.length}
                    </Typography>
                    <Pagination
                      count={totalPages}
                      page={page}
                      onChange={(_, v) => setPage(v)}
                      size="medium"
                      sx={{
                        "& .MuiPaginationItem-root": { fontWeight: 700 },
                        "& .Mui-selected": { bgcolor: `${NAVY} !important`, color: "#fff" },
                      }}
                    />
                  </Box>
                )}
              </>
            )}
          </Box>
        </Paper>
      </Box>

      {/* ── MODALS & DRAWERS ── */}

      <ScheduleDialog
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        onSave={handleSchedule}
        loading={actionLoading}
      />

      <RescheduleDialog
        open={!!rescheduleTarget}
        session={rescheduleTarget}
        onClose={() => setRescheduleTarget(null)}
        onSave={handleReschedule}
        loading={actionLoading}
      />

      <ForceEndDialog
        open={!!forceEndTarget}
        session={forceEndTarget}
        onClose={() => setForceEndTarget(null)}
        onConfirm={handleForceEnd}
        loading={actionLoading}
      />

      <CancelDialog
        open={!!cancelTarget}
        session={cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancel}
        loading={actionLoading}
      />

      <DetailDrawer
        open={!!detailSession}
        session={detailSession}
        onClose={() => setDetailSession(null)}
      />

      {/* Toast */}
      <Snackbar open={!!toast} autoHideDuration={5000} onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={toast?.severity || "info"} onClose={() => setToast(null)}
          sx={{ borderRadius: 2, fontWeight: 600 }}>
          {toast?.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}



// // pages/TutorLiveClasses.jsx

// import {
//   Box,
//   Typography,
//   Grid,
//   Paper,
//   Button,
//   Chip,
//   Stack,
//   CircularProgress,
//   TextField,
//   MenuItem,
//   Divider,
//   Alert,
// } from "@mui/material";

// import {
//   PlayCircle,
//   Videocam,
//   CalendarMonth,
//   AccessTime,
//   People,
//   Add,
//   VideoCall,
//   CheckCircle,
//   Cancel,
//   HourglassTop,
//   ExpandMore,
//   ExpandLess,
// } from "@mui/icons-material";

// import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";

// import {
//   getTutorSessions,
//   scheduleClassSession,
// } from "../services/classSessionService";

// // ─────────────────────────────────────────────────────────────
// const NAVY = "#0B1F3A";
// const GREEN = "#1E7F4F";
// const GOLD = "#D4A017";
// const BG = "#F7F9FC";
// const CARD = "#FFFFFF";
// const BORDER = "#E6E9F0";
// const TEXT = "#0F172A";
// const MUTED = "#64748B";

// // ─────────────────────────────────────────────────────────────

// const STATUS_CONFIG = {
//   live: { label: "LIVE", color: "#ef4444", bg: "rgba(239,68,68,0.12)", icon: <Videocam sx={{ fontSize: 13 }} /> },
//   scheduled: { label: "Scheduled", color: GOLD, bg: "rgba(212,160,23,0.12)", icon: <HourglassTop sx={{ fontSize: 13 }} /> },
//   ended: { label: "Ended", color: MUTED, bg: "#F1F5F9", icon: <CheckCircle sx={{ fontSize: 13 }} /> },
//   cancelled: { label: "Cancelled", color: "#ef4444", bg: "#FEF2F2", icon: <Cancel sx={{ fontSize: 13 }} /> },
// };

// const formatDate = (d) =>
//   new Date(d).toLocaleDateString("en-NG", {
//     weekday: "short", day: "numeric", month: "short", year: "numeric",
//   });

// const formatTime = (d) =>
//   new Date(d).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" });

// // ─────────────────────────────────────────────────────────────
// // SESSION CARD
// // ─────────────────────────────────────────────────────────────

// const SessionCard = ({ session, navigate }) => {
//   const cfg = STATUS_CONFIG[session.status] || STATUS_CONFIG.scheduled;
//   const isLive = session.isLive;
//   const isEnded = session.status === "ended" || session.status === "cancelled";

//   return (
//     <Paper
//       elevation={0}
//       sx={{
//         border: `1px solid ${isLive ? "rgba(239,68,68,0.35)" : BORDER}`,
//         borderRadius: 4,
//         bgcolor: CARD,
//         overflow: "hidden",
//         height: "100%",
//         display: "flex",
//         flexDirection: "column",
//         transition: "box-shadow 0.2s, transform 0.2s",
//         "&:hover": !isEnded && {
//           boxShadow: "0 8px 28px rgba(15,23,42,0.08)",
//           transform: "translateY(-2px)",
//         },
//       }}
//     >
//       {/* HEADER */}
//       <Box
//         sx={{
//           px: 3,
//           py: 2,
//           background: isEnded
//             ? "#F8FAFC"
//             : "linear-gradient(135deg, #0B1F3A, #1E7F4F)",
//           display: "flex",
//           justifyContent: "space-between",
//           alignItems: "center",
//         }}
//       >
//         <Chip
//           icon={cfg.icon}
//           label={cfg.label}
//           size="small"
//           sx={{
//             bgcolor: cfg.bg,
//             color: cfg.color,
//             fontWeight: 800,
//             border: `1px solid ${cfg.color}44`,
//             "& .MuiChip-icon": { color: cfg.color },
//             ...(isLive && {
//               animation: "livePulse 1.5s ease-in-out infinite",
//               "@keyframes livePulse": {
//                 "0%,100%": { boxShadow: "0 0 0 0 rgba(239,68,68,0.5)" },
//                 "50%": { boxShadow: "0 0 0 6px rgba(239,68,68,0)" },
//               },
//             }),
//           }}
//         />

//         {session.recordingStatus === "ready" && (
//           <Chip
//             label="Recording ready"
//             size="small"
//             sx={{ bgcolor: "#EFF6FF", color: "#1D4ED8", fontWeight: 700, fontSize: 11 }}
//           />
//         )}
//       </Box>

//       {/* BODY */}
//       <Box p={3} display="flex" flexDirection="column" flexGrow={1}>
//         <Typography sx={{ fontSize: 18, fontWeight: 800, color: TEXT, mb: 0.5, lineHeight: 1.3 }}>
//           {session.title}
//         </Typography>

//         <Typography sx={{ fontSize: 14, color: GREEN, fontWeight: 600, mb: 2 }}>
//           {session.Course?.title}
//         </Typography>

//         <Stack spacing={1.25} mb={3}>
//           <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
//             <CalendarMonth sx={{ fontSize: 16, color: MUTED }} />
//             <Typography sx={{ fontSize: 13, color: MUTED }}>
//               {formatDate(session.scheduledAt)}
//             </Typography>
//           </Box>
//           <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
//             <AccessTime sx={{ fontSize: 16, color: MUTED }} />
//             <Typography sx={{ fontSize: 13, color: MUTED }}>
//               {formatTime(session.scheduledAt)} · {session.durationMinutes} min
//             </Typography>
//           </Box>
//           <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
//             <People sx={{ fontSize: 16, color: MUTED }} />
//             <Typography sx={{ fontSize: 13, color: MUTED }}>
//               {session.totalParticipants || 0} participant{session.totalParticipants !== 1 ? "s" : ""}
//             </Typography>
//           </Box>
//         </Stack>

//         {/* RECORDING STATUS */}
//         {session.recordingStatus && session.recordingStatus !== "pending" && (
//           <Chip
//             label={`Recording: ${session.recordingStatus}`}
//             size="small"
//             sx={{ alignSelf: "flex-start", mb: 2, bgcolor: "#F1F5F9", color: MUTED, fontWeight: 600 }}
//           />
//         )}

//         <Box mt="auto">
//           <Button
//             fullWidth
//             variant="contained"
//             startIcon={<PlayCircle />}
//             disabled={isEnded}
//             onClick={() =>
//               navigate(`/live/${session.roomName}/${session.id}`, {
//                 state: { role: "tutor" },
//               })
//             }
//             sx={{
//               bgcolor: isLive ? "#ef4444" : NAVY,
//               color: "#fff",
//               textTransform: "none",
//               fontWeight: 700,
//               borderRadius: 2.5,
//               py: 1.25,
//               fontSize: 15,
//               "&:hover": { bgcolor: isLive ? "#dc2626" : GREEN },
//               "&.Mui-disabled": { bgcolor: "#F1F5F9", color: MUTED },
//             }}
//           >
//             {isLive ? "Rejoin Session" : isEnded ? "Session Ended" : "Start Session"}
//           </Button>
//         </Box>
//       </Box>
//     </Paper>
//   );
// };

// // ─────────────────────────────────────────────────────────────
// // SCHEDULE FORM
// // ─────────────────────────────────────────────────────────────

// const ScheduleForm = ({ onScheduled }) => {
//   const [open, setOpen] = useState(false);
//   const [saving, setSaving] = useState(false);
//   const [success, setSuccess] = useState(false);
//   const [error, setError] = useState("");

//   const [form, setForm] = useState({
//     title: "",
//     description: "",
//     courseId: "",
//     scheduledAt: "",
//     durationMinutes: 60,
//     visibility: "assigned_students",
//   });

//   const handleChange = (e) =>
//     setForm({ ...form, [e.target.name]: e.target.value });

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!form.title || !form.courseId || !form.scheduledAt) {
//       setError("Please fill in all required fields.");
//       return;
//     }

//     try {
//       setSaving(true);
//       setError("");
//       await scheduleClassSession(form);
//       setSuccess(true);
//       setForm({ title: "", description: "", courseId: "", scheduledAt: "", durationMinutes: 60, visibility: "assigned_students" });
//       onScheduled();
//       setTimeout(() => setSuccess(false), 4000);
//     } catch (err) {
//       setError(err?.response?.data?.message || "Failed to schedule session.");
//     } finally {
//       setSaving(false);
//     }
//   };

//   return (
//     <Paper
//       elevation={0}
//       sx={{
//         border: `1px solid ${BORDER}`,
//         borderRadius: 4,
//         bgcolor: CARD,
//         mb: 4,
//         overflow: "hidden",
//       }}
//     >
//       {/* TOGGLE HEADER */}
//       <Box
//         sx={{
//           px: 3,
//           py: 2.5,
//           display: "flex",
//           justifyContent: "space-between",
//           alignItems: "center",
//           cursor: "pointer",
//           userSelect: "none",
//           "&:hover": { bgcolor: "#F8FAFC" },
//         }}
//         onClick={() => setOpen(!open)}
//       >
//         <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
//           <Box
//             sx={{
//               width: 36,
//               height: 36,
//               borderRadius: 2,
//               bgcolor: "#F0FDF4",
//               display: "flex",
//               alignItems: "center",
//               justifyContent: "center",
//               color: GREEN,
//             }}
//           >
//             <Add />
//           </Box>
//           <Typography sx={{ fontWeight: 800, color: TEXT, fontSize: 16 }}>
//             Schedule a New Session
//           </Typography>
//         </Box>
//         {open ? <ExpandLess sx={{ color: MUTED }} /> : <ExpandMore sx={{ color: MUTED }} />}
//       </Box>

//       {open && (
//         <>
//           <Divider />
//           <Box
//             component="form"
//             onSubmit={handleSubmit}
//             sx={{ p: 3 }}
//           >
//             {success && (
//               <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
//                 Session scheduled successfully! Students have been notified.
//               </Alert>
//             )}
//             {error && (
//               <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
//                 {error}
//               </Alert>
//             )}

//             <Grid container spacing={2.5}>
//               <Grid item xs={12} md={6}>
//                 <TextField
//                   fullWidth
//                   required
//                   label="Session Title"
//                   name="title"
//                   value={form.title}
//                   onChange={handleChange}
//                   placeholder="e.g. Introduction to Calculus"
//                 />
//               </Grid>

//               <Grid item xs={12} md={6}>
//                 <TextField
//                   fullWidth
//                   required
//                   label="Course ID"
//                   name="courseId"
//                   value={form.courseId}
//                   onChange={handleChange}
//                   placeholder="Enter the course ID"
//                   helperText="You can find this in your course list"
//                 />
//               </Grid>

//               <Grid item xs={12}>
//                 <TextField
//                   fullWidth
//                   multiline
//                   rows={2}
//                   label="Description (optional)"
//                   name="description"
//                   value={form.description}
//                   onChange={handleChange}
//                   placeholder="What will you cover in this session?"
//                 />
//               </Grid>

//               <Grid item xs={12} md={4}>
//                 <TextField
//                   fullWidth
//                   required
//                   type="datetime-local"
//                   label="Date & Time"
//                   name="scheduledAt"
//                   value={form.scheduledAt}
//                   onChange={handleChange}
//                   InputLabelProps={{ shrink: true }}
//                 />
//               </Grid>

//               <Grid item xs={12} md={4}>
//                 <TextField
//                   fullWidth
//                   select
//                   label="Duration"
//                   name="durationMinutes"
//                   value={form.durationMinutes}
//                   onChange={handleChange}
//                 >
//                   {[30, 45, 60, 90, 120].map((d) => (
//                     <MenuItem key={d} value={d}>
//                       {d} minutes
//                     </MenuItem>
//                   ))}
//                 </TextField>
//               </Grid>

//               <Grid item xs={12} md={4}>
//                 <TextField
//                   fullWidth
//                   select
//                   label="Visibility"
//                   name="visibility"
//                   value={form.visibility}
//                   onChange={handleChange}
//                 >
//                   <MenuItem value="assigned_students">Assigned students only</MenuItem>
//                   <MenuItem value="course_students">All course students</MenuItem>
//                   <MenuItem value="private">Private (invite only)</MenuItem>
//                 </TextField>
//               </Grid>
//             </Grid>

//             <Box sx={{ display: "flex", gap: 2, mt: 3 }}>
//               <Button
//                 type="submit"
//                 variant="contained"
//                 disabled={saving}
//                 startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <VideoCall />}
//                 sx={{
//                   bgcolor: NAVY,
//                   textTransform: "none",
//                   fontWeight: 700,
//                   borderRadius: 2.5,
//                   px: 3,
//                   "&:hover": { bgcolor: GREEN },
//                 }}
//               >
//                 {saving ? "Scheduling..." : "Schedule Session"}
//               </Button>

//               <Button
//                 onClick={() => setOpen(false)}
//                 variant="outlined"
//                 sx={{
//                   textTransform: "none",
//                   borderRadius: 2.5,
//                   borderColor: BORDER,
//                   color: MUTED,
//                 }}
//               >
//                 Cancel
//               </Button>
//             </Box>
//           </Box>
//         </>
//       )}
//     </Paper>
//   );
// };

// // ─────────────────────────────────────────────────────────────
// // MAIN PAGE
// // ─────────────────────────────────────────────────────────────

// export default function TutorLiveClasses() {
//   const navigate = useNavigate();
//   const [sessions, setSessions] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [filter, setFilter] = useState("all");

//   useEffect(() => {
//     fetchSessions();
//   }, []);

//   const fetchSessions = async () => {
//     try {
//       const res = await getTutorSessions();
//       setSessions(res.sessions || []);
//     } catch (err) {
//       console.error(err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const FILTERS = [
//     { key: "all", label: "All" },
//     { key: "live", label: "Live Now" },
//     { key: "scheduled", label: "Upcoming" },
//     { key: "ended", label: "Past" },
//   ];

//   const filtered =
//     filter === "all"
//       ? sessions
//       : filter === "live"
//       ? sessions.filter((s) => s.isLive)
//       : sessions.filter((s) => s.status === filter);

//   const liveSessions = sessions.filter((s) => s.isLive);

//   const statSummary = {
//     total: sessions.length,
//     live: liveSessions.length,
//     upcoming: sessions.filter((s) => s.status === "scheduled").length,
//     ended: sessions.filter((s) => s.status === "ended").length,
//     participants: sessions.reduce((a, s) => a + (s.totalParticipants || 0), 0),
//   };

//   if (loading) {
//     return (
//       <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh", bgcolor: BG }}>
//         <CircularProgress sx={{ color: GREEN }} />
//       </Box>
//     );
//   }

//   return (
//     <Box sx={{ minHeight: "100vh", bgcolor: BG }}>
//       <Box sx={{ maxWidth: 1280, mx: "auto", px: { xs: 2, sm: 3, md: 5 }, py: { xs: 3, md: 5 } }}>

//         {/* HEADER */}
//         <Paper
//           elevation={0}
//           sx={{
//             borderRadius: 5,
//             mb: 4,
//             overflow: "hidden",
//             background: "linear-gradient(135deg, #0B1F3A, #1E7F4F)",
//             color: "#fff",
//             p: { xs: 3, md: 4 },
//           }}
//         >
//           <Box display="flex" justifyContent="space-between" alignItems="center" gap={2} flexWrap="wrap">
//             <Box>
//               <Typography sx={{ fontSize: { xs: 22, md: 28 }, fontWeight: 800 }}>
//                 Live Classes
//               </Typography>
//               <Typography sx={{ fontSize: 14, opacity: 0.85, mt: 0.5 }}>
//                 Manage and host your live teaching sessions
//               </Typography>
//             </Box>

//             {liveSessions.length > 0 && (
//               <Chip
//                 icon={<Videocam />}
//                 label={`${liveSessions.length} Session${liveSessions.length > 1 ? "s" : ""} Live`}
//                 sx={{
//                   bgcolor: "rgba(239,68,68,0.2)",
//                   color: "#fca5a5",
//                   fontWeight: 800,
//                   border: "1px solid rgba(239,68,68,0.35)",
//                   animation: "pulse 1.5s infinite",
//                   "@keyframes pulse": {
//                     "0%,100%": { boxShadow: "0 0 0 0 rgba(239,68,68,0.4)" },
//                     "50%": { boxShadow: "0 0 0 8px rgba(239,68,68,0)" },
//                   },
//                   "& .MuiChip-icon": { color: "#f87171" },
//                 }}
//               />
//             )}
//           </Box>
//         </Paper>

//         {/* STATS ROW */}
//         <Grid container spacing={2.5} mb={4}>
//           {[
//             { label: "Total Sessions", value: statSummary.total, color: NAVY },
//             { label: "Live Now", value: statSummary.live, color: "#ef4444" },
//             { label: "Upcoming", value: statSummary.upcoming, color: GOLD },
//             { label: "Completed", value: statSummary.ended, color: GREEN },
//             { label: "Total Participants", value: statSummary.participants, color: "#7C3AED" },
//           ].map((s) => (
//             <Grid item xs={6} sm={4} md key={s.label}>
//               <Paper
//                 elevation={0}
//                 sx={{
//                   border: `1px solid ${BORDER}`,
//                   borderRadius: 3,
//                   p: 2.5,
//                   bgcolor: CARD,
//                   textAlign: "center",
//                 }}
//               >
//                 <Typography sx={{ fontSize: 26, fontWeight: 800, color: s.color }}>
//                   {s.value}
//                 </Typography>
//                 <Typography sx={{ fontSize: 12, color: MUTED, fontWeight: 600 }}>
//                   {s.label}
//                 </Typography>
//               </Paper>
//             </Grid>
//           ))}
//         </Grid>

//         {/* SCHEDULE FORM */}
//         <ScheduleForm onScheduled={fetchSessions} />

//         {/* FILTER TABS */}
//         <Box sx={{ display: "flex", gap: 1, mb: 4, flexWrap: "wrap" }}>
//           {FILTERS.map((f) => {
//             const count =
//               f.key === "all"
//                 ? sessions.length
//                 : f.key === "live"
//                 ? liveSessions.length
//                 : sessions.filter((s) => s.status === f.key).length;

//             return (
//               <Button
//                 key={f.key}
//                 onClick={() => setFilter(f.key)}
//                 variant={filter === f.key ? "contained" : "outlined"}
//                 size="small"
//                 sx={{
//                   textTransform: "none",
//                   borderRadius: 3,
//                   fontWeight: 700,
//                   borderColor: BORDER,
//                   color: filter === f.key ? "#fff" : MUTED,
//                   bgcolor: filter === f.key ? NAVY : "transparent",
//                 }}
//               >
//                 {f.label}
//                 {count > 0 && (
//                   <Chip
//                     label={count}
//                     size="small"
//                     sx={{
//                       ml: 0.75,
//                       height: 18,
//                       fontSize: 11,
//                       fontWeight: 800,
//                       bgcolor: filter === f.key ? "rgba(255,255,255,0.2)" : "#F1F5F9",
//                       color: filter === f.key ? "#fff" : MUTED,
//                     }}
//                   />
//                 )}
//               </Button>
//             );
//           })}
//         </Box>

//         {/* SESSION GRID */}
//         {filtered.length > 0 ? (
//           <Grid container spacing={3}>
//             {filtered.map((session) => (
//               <Grid item xs={12} sm={6} lg={4} key={session.id}>
//                 <SessionCard session={session} navigate={navigate} />
//               </Grid>
//             ))}
//           </Grid>
//         ) : (
//           <Paper
//             elevation={0}
//             sx={{
//               border: `1px solid ${BORDER}`,
//               borderRadius: 4,
//               p: 6,
//               textAlign: "center",
//               bgcolor: CARD,
//             }}
//           >
//             <Box
//               sx={{
//                 width: 64,
//                 height: 64,
//                 borderRadius: "50%",
//                 bgcolor: "#F1F5F9",
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "center",
//                 mx: "auto",
//                 mb: 2,
//               }}
//             >
//               <VideoCall sx={{ fontSize: 30, color: MUTED }} />
//             </Box>
//             <Typography sx={{ fontWeight: 700, color: TEXT, mb: 0.5 }}>
//               No sessions yet
//             </Typography>
//             <Typography sx={{ fontSize: 14, color: MUTED }}>
//               Use the form above to schedule your first live class.
//             </Typography>
//           </Paper>
//         )}
//       </Box>
//     </Box>
//   );
// }
