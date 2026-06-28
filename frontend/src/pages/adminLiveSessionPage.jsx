// pages/AdminLiveSessions.jsx
// Complete admin live-session management dashboard.
// Tabs: Overview | Sessions | Tutor Hours | Schedule

import {
  Box, Typography, Paper, Grid, Chip, Stack, Avatar,
  Button, IconButton, TextField, MenuItem, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Tooltip,
  CircularProgress, Divider, Dialog, DialogTitle,
  DialogContent, DialogActions, Snackbar, Alert, Badge,
  LinearProgress, Tabs, Tab, ToggleButtonGroup, ToggleButton,
} from "@mui/material";

import {
  Videocam, People, AccessTime, TrendingUp, School,
  PlayCircle, StopCircle, Cancel, Delete,
  Edit, Download, Visibility, Add, Refresh, FiberManualRecord,
  CheckCircle, CalendarMonth, BarChart, PersonAdd,
  LinkOutlined, Close, Send, HourglassTop,
} from "@mui/icons-material";

import { Public, ContentCopy, OpenInNew } from "@mui/icons-material";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as ReTooltip, ResponsiveContainer, BarChart as RechartBar,
  Bar, Legend,
} from "recharts";

import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import {
  getSessionAnalytics, getLiveSessions, getTutorHours,
  getAllSessions, getSessionDetail, getSessionAttendance,
  exportAttendanceCSV, rescheduleSession,
  forceEndSession, cancelSession, deleteSession,
  getSessionLink, overrideAttendance,
} from "../services/adminClassSessionService";
import {
  adminScheduleSession,
  scheduleAdminPublicMeeting,
} from "../services/adminSessionService";
// ─────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────
const NAVY   = "#0B1F3A";
const GREEN  = "#1E7F4F";
const GOLD   = "#D4A017";
const BG     = "#F7F9FC";
const CARD   = "#FFFFFF";
const BORDER = "#E6E9F0";
const TEXT   = "#0F172A";
const MUTED  = "#64748B";



const CopyButton = ({ text, label = "Copy" }) => {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      size="small"
      startIcon={<ContentCopy sx={{ fontSize: 14 }} />}
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
      }}
      sx={{
        textTransform: "none", fontWeight: 700, fontSize: 12,
        color: copied ? GREEN : NAVY, borderColor: copied ? GREEN : BORDER, borderRadius: 2,
      }}
      variant="outlined"
    >
      {copied ? "Copied!" : label}
    </Button>
  );
};


// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
const fmt = (d) =>
  d ? new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "—";
const fmtTime = (d) =>
  d ? new Date(d).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" }) : "—";
const fmtDateTime = (d) => (d ? `${fmt(d)}, ${fmtTime(d)}` : "—");

const getInitials = (name = "") =>
  name.split(" ").filter(Boolean).slice(0, 2).map((n) => n[0]).join("").toUpperCase() || "?";

const avatarColor = (name = "") => {
  const colors = ["#7C3AED","#0284C7","#DC2626","#D97706","#059669","#0891B2"];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + h * 31;
  return colors[Math.abs(h) % colors.length];
};

const STATUS_COLORS = {
  live:      { bg: "rgba(239,68,68,0.12)",  color: "#dc2626" },
  scheduled: { bg: "rgba(212,160,23,0.12)", color: "#b45309" },
  ended:     { bg: "#F1F5F9",               color: MUTED     },
  cancelled: { bg: "#FEF2F2",               color: "#dc2626" },
};

const StatusChip = ({ status }) => {
  const cfg = STATUS_COLORS[status] || STATUS_COLORS.scheduled;
  return (
    <Chip
      label={status?.toUpperCase()}
      size="small"
      sx={{ bgcolor: cfg.bg, color: cfg.color, fontWeight: 800, fontSize: 10, height: 22 }}
    />
  );
};

const StatCard = ({ title, value, icon, color = GREEN, sub }) => (
  <Paper elevation={0} sx={{
    border: `1px solid ${BORDER}`, borderRadius: 3, p: 3, bgcolor: CARD,
    transition: "box-shadow 0.2s",
    "&:hover": { boxShadow: `0 4px 18px ${color}22` },
  }}>
    <Box sx={{
      width: 40, height: 40, borderRadius: 2, bgcolor: `${color}14`,
      display: "flex", alignItems: "center", justifyContent: "center",
      color, mb: 1.5, "& svg": { fontSize: 20 },
    }}>
      {icon}
    </Box>
    <Typography sx={{ fontSize: 11, color: MUTED, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8 }}>
      {title}
    </Typography>
    <Typography sx={{ fontSize: 26, fontWeight: 800, color: TEXT, lineHeight: 1.1, mt: 0.25 }}>
      {value ?? "—"}
    </Typography>
    {sub && <Typography sx={{ fontSize: 12, color: MUTED, mt: 0.5 }}>{sub}</Typography>}
  </Paper>
);

// ─────────────────────────────────────────────────────────────
// OVERVIEW TAB
// ─────────────────────────────────────────────────────────────
const OverviewTab = ({ navigate }) => {
  const [analytics, setAnalytics] = useState(null);
  const [live,      setLive]      = useState([]);
  const [loading,   setLoading]   = useState(true);

  const load = useCallback(async () => {
    try {
      const [a, l] = await Promise.all([getSessionAnalytics(), getLiveSessions()]);
      setAnalytics(a);
      setLive(l.sessions || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
      <CircularProgress sx={{ color: GREEN }} />
    </Box>
  );

  const ov  = analytics?.overview       || {};
  const topT = analytics?.topTutors      || [];
  const topC = analytics?.topCourses     || [];
  const monthly = (analytics?.monthlyBreakdown || []).map((m) => ({
    ...m,
    label: m.month ? new Date(m.month).toLocaleDateString("en-NG", { month: "short", year: "2-digit" }) : "",
  }));

  return (
    <Box>
      {/* KPI STATS */}
      <Grid container spacing={2.5} mb={4}>
        {[
          { title: "Total Sessions",    value: ov.totalSessions,        icon: <Videocam />,          color: NAVY },
          { title: "Live Now",          value: ov.liveSessions,         icon: <FiberManualRecord />,  color: "#ef4444",
            sub: ov.liveSessions > 0 ? "● Active right now" : "No active sessions" },
          { title: "Scheduled",         value: ov.scheduledSessions,    icon: <CalendarMonth />,      color: GOLD },
          { title: "Completed",         value: ov.endedSessions,        icon: <CheckCircle />,        color: GREEN },
          { title: "Total Attendance",  value: ov.totalAttendance,      icon: <People />,             color: "#7C3AED" },
          { title: "Lecture Hours",     value: ov.totalLectureHours,    icon: <AccessTime />,         color: "#0284C7",
            sub: ov.formattedLectureTime },
          { title: "Completion Rate",   value: `${ov.completionRate ?? 0}%`,    icon: <TrendingUp />, color: GREEN },
          { title: "Cancellation Rate", value: `${ov.cancellationRate ?? 0}%`,  icon: <Cancel />,     color: "#dc2626" },
        ].map((s) => (
          <Grid item xs={6} sm={4} md={3} key={s.title}>
            <StatCard {...s} />
          </Grid>
        ))}
      </Grid>

      {/* LIVE NOW */}
      {live.length > 0 && (
        <Paper elevation={0} sx={{ border: `1px solid ${BORDER}`, borderRadius: 4, overflow: "hidden", mb: 4 }}>
          <Box sx={{
            px: 3, py: 2.5,
            background: "linear-gradient(135deg, #0B1F3A, #1E7F4F)",
            display: "flex", alignItems: "center", gap: 1.5,
          }}>
            <Box sx={{
              width: 10, height: 10, borderRadius: "50%", bgcolor: "#ef4444",
              animation: "lp 1.5s infinite",
              "@keyframes lp": { "0%,100%": { opacity: 1 }, "50%": { opacity: 0.3 } },
            }} />
            <Typography sx={{ fontWeight: 800, fontSize: 16, color: "#fff" }}>
              Live Sessions Right Now
            </Typography>
            <Chip label={live.length} size="small"
              sx={{ bgcolor: "rgba(239,68,68,0.25)", color: "#fca5a5", fontWeight: 800 }} />
          </Box>

          <Box sx={{ p: 3 }}>
            <Grid container spacing={2}>
              {live.map((s) => (
                <Grid item xs={12} sm={6} md={4} key={s.id}>
                  <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, borderColor: "rgba(239,68,68,0.3)" }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
                      <Box>
                        <Typography sx={{ fontWeight: 700, color: TEXT, fontSize: 14.5 }}>{s.title}</Typography>
                        <Typography sx={{ fontSize: 12.5, color: GREEN, fontWeight: 600 }}>{s.course}</Typography>
                      </Box>
                      <Chip label="LIVE" size="small"
                        sx={{ bgcolor: "rgba(239,68,68,0.1)", color: "#dc2626", fontWeight: 800, fontSize: 10 }} />
                    </Box>
                    <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
                      <Avatar src={s.tutorPicUrl || undefined}
                        sx={{ width: 28, height: 28, bgcolor: avatarColor(s.tutor || ""), fontSize: 11 }}>
                        {!s.tutorPicUrl && getInitials(s.tutor || "")}
                      </Avatar>
                      <Typography sx={{ fontSize: 13, color: MUTED }}>{s.tutor}</Typography>
                    </Stack>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <People sx={{ fontSize: 14, color: MUTED }} />
                        <Typography sx={{ fontSize: 12, color: MUTED }}>{s.liveParticipants} live</Typography>
                      </Stack>
                      <Button size="small" variant="outlined"
                        onClick={() => navigate(`/admin/live-sessions/${s.id}`)}
                        sx={{ borderColor: NAVY, color: NAVY, textTransform: "none", borderRadius: 2, fontSize: 12 }}>
                        View
                      </Button>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Paper>
      )}

      {/* MONTHLY ACTIVITY CHART */}
      {monthly.length > 0 && (
        <Paper elevation={0} sx={{ border: `1px solid ${BORDER}`, borderRadius: 4, p: 3, mb: 4 }}>
          <Typography sx={{ fontWeight: 800, fontSize: 16, color: TEXT, mb: 3 }}>
            Monthly Session Activity (Last 6 Months)
          </Typography>
          <ResponsiveContainer width="100%" height={260}>
            <RechartBar data={monthly} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: MUTED }} />
              <YAxis yAxisId="left"  tick={{ fontSize: 11, fill: MUTED }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: MUTED }} />
              <ReTooltip contentStyle={{ borderRadius: 8, border: `1px solid ${BORDER}`, fontSize: 13 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar yAxisId="left"  dataKey="sessions" name="Sessions" fill={NAVY}  radius={[3,3,0,0]} />
              <Bar yAxisId="right" dataKey="hours"    name="Hours"    fill={GREEN} radius={[3,3,0,0]} />
            </RechartBar>
          </ResponsiveContainer>
        </Paper>
      )}

      {/* TOP TUTORS + TOP COURSES */}
      <Grid container spacing={3}>
        {/* Top Tutors */}
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ border: `1px solid ${BORDER}`, borderRadius: 4, overflow: "hidden" }}>
            <Box sx={{ px: 3, py: 2.5, borderBottom: `1px solid ${BORDER}` }}>
              <Typography sx={{ fontWeight: 800, fontSize: 15, color: TEXT }}>Top Tutors by Sessions</Typography>
            </Box>
            <Box sx={{ p: 3 }}>
              {topT.length === 0 ? (
                <Typography sx={{ color: MUTED, fontSize: 13.5, textAlign: "center", py: 3 }}>No data available</Typography>
              ) : (
                <Stack spacing={2}>
                  {topT.map((t, i) => (
                    <Box key={t.tutorProfileId} sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 800, color: MUTED, width: 20 }}>#{i + 1}</Typography>
                      <Avatar src={t.profilePicUrl || undefined}
                        sx={{ width: 36, height: 36, bgcolor: avatarColor(t.fullName || ""), fontSize: 13 }}>
                        {!t.profilePicUrl && getInitials(t.fullName || "")}
                      </Avatar>
                      <Box flex={1}>
                        <Typography sx={{ fontSize: 14, fontWeight: 700, color: TEXT }}>{t.fullName}</Typography>
                      </Box>
                      <Chip
                        label={`${t.sessionCount} sessions`}
                        size="small"
                        sx={{ bgcolor: `${NAVY}14`, color: NAVY, fontWeight: 700, fontSize: 11 }}
                      />
                    </Box>
                  ))}
                </Stack>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Top Courses */}
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ border: `1px solid ${BORDER}`, borderRadius: 4, overflow: "hidden" }}>
            <Box sx={{ px: 3, py: 2.5, borderBottom: `1px solid ${BORDER}` }}>
              <Typography sx={{ fontWeight: 800, fontSize: 15, color: TEXT }}>Most Active Courses</Typography>
            </Box>
            <Box sx={{ p: 3 }}>
              {topC.length === 0 ? (
                <Typography sx={{ color: MUTED, fontSize: 13.5, textAlign: "center", py: 3 }}>No data available</Typography>
              ) : (
                <Stack spacing={2}>
                  {topC.map((c, i) => {
                    const max = topC[0]?.sessionCount || 1;
                    const pct = Math.round((c.sessionCount / max) * 100);
                    return (
                      <Box key={c.courseId}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                          <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: TEXT }}>{c.title}</Typography>
                          <Typography sx={{ fontSize: 13, color: GREEN, fontWeight: 800 }}>{c.sessionCount}</Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate" value={pct}
                          sx={{
                            height: 6, borderRadius: 20, bgcolor: "#EEF2F7",
                            "& .MuiLinearProgress-bar": { bgcolor: GREEN, borderRadius: 20 },
                          }}
                        />
                      </Box>
                    );
                  })}
                </Stack>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

// ─────────────────────────────────────────────────────────────
// SESSIONS LIST TAB
// ─────────────────────────────────────────────────────────────
const SessionsTab = ({ navigate, setToast }) => {
  const [sessions,      setSessions]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [total,         setTotal]         = useState(0);
  const [page,          setPage]          = useState(1);
  const [filters,       setFilters]       = useState({ status: "", search: "" });
  const [actionDialog,  setActionDialog]  = useState(null); // { type, session }
  const [actionReason,  setActionReason]  = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAllSessions({ page, limit: 15, ...filters });
      setSessions(res.sessions || []);
      setTotal(res.total || 0);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [page, filters]);

  useEffect(() => { load(); }, [load]);

  const handleExportCSV = async (sessionId, title) => {
    try {
      const blob = await exportAttendanceCSV(sessionId);
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `attendance-${title}-${sessionId}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setToast({ msg: "Export failed", severity: "error" });
    }
  };

  const handleAction = async () => {
    if (!actionDialog) return;
    const { type, session } = actionDialog;
    try {
      setActionLoading(true);
      if (type === "force-end") await forceEndSession(session.id, actionReason);
      if (type === "cancel")    await cancelSession(session.id, actionReason);
      if (type === "delete")    await deleteSession(session.id);
      setToast({ msg: `Session ${type === "force-end" ? "force-ended" : type + "led"} successfully`, severity: "success" });
      setActionDialog(null);
      setActionReason("");
      load();
    } catch (err) {
      setToast({ msg: err?.response?.data?.message || "Action failed", severity: "error" });
    } finally { setActionLoading(false); }
  };

  const ACTIONS = {
    "force-end": { title: "Force-End Session", color: "#dc2626", label: "Force End" },
    "cancel":    { title: "Cancel Session",     color: "#c2410c", label: "Cancel"    },
    "delete":    { title: "Delete Session",     color: "#dc2626", label: "Delete"    },
  };

  return (
    <Box>
      {/* FILTERS */}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={3} alignItems="center">
        <TextField
          size="small" placeholder="Search by title…" value={filters.search}
          onChange={(e) => { setFilters((f) => ({ ...f, search: e.target.value })); setPage(1); }}
          sx={{ flex: 1, "& fieldset": { borderColor: BORDER } }}
        />
        <TextField
          select size="small" value={filters.status} label="Status"
          onChange={(e) => { setFilters((f) => ({ ...f, status: e.target.value })); setPage(1); }}
          sx={{ minWidth: 150, "& fieldset": { borderColor: BORDER } }}
        >
          <MenuItem value="">All</MenuItem>
          {["live","scheduled","ended","cancelled"].map((s) => (
            <MenuItem key={s} value={s} sx={{ textTransform: "capitalize" }}>{s}</MenuItem>
          ))}
        </TextField>
        <IconButton onClick={load} sx={{ color: MUTED }}><Refresh /></IconButton>
      </Stack>

      <Typography sx={{ fontSize: 13, color: MUTED, mb: 2 }}>
        {total} session{total !== 1 ? "s" : ""} total
      </Typography>

      {loading ? (
        <LinearProgress sx={{ borderRadius: 1, "& .MuiLinearProgress-bar": { bgcolor: GREEN } }} />
      ) : (
        <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${BORDER}`, borderRadius: 3 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: "#F8FAFC" }}>
                {["Session","Course / Tutor","Scheduled","Duration","Status","Participants","Actions"].map((h) => (
                  <TableCell key={h} sx={{ fontWeight: 700, color: NAVY, fontSize: 11.5, textTransform: "uppercase", letterSpacing: 0.6, py: 1.5 }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {sessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: "center", py: 6, color: MUTED }}>
                    No sessions found
                  </TableCell>
                </TableRow>
              ) : sessions.map((s) => (
                <TableRow key={s.id} hover sx={{ "&:last-child td": { border: 0 } }}>
                  <TableCell sx={{ maxWidth: 200 }}>
                    <Typography sx={{ fontWeight: 700, color: TEXT, fontSize: 13.5 }} noWrap>{s.title}</Typography>
                    <Typography sx={{ fontSize: 11.5, color: MUTED }}>ID: {s.id}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: 13, color: GREEN, fontWeight: 600 }}>{s.Course?.title}</Typography>
                    <Typography sx={{ fontSize: 12, color: MUTED }}>{s.TutorProfile?.fullName}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: 13, color: TEXT }}>{fmt(s.scheduledAt)}</Typography>
                    <Typography sx={{ fontSize: 11.5, color: MUTED }}>{fmtTime(s.scheduledAt)}</Typography>
                  </TableCell>
                  <TableCell sx={{ fontSize: 13, color: TEXT }}>{s.durationMinutes}m</TableCell>
                  <TableCell><StatusChip status={s.status} /></TableCell>
                  <TableCell sx={{ fontSize: 13, color: TEXT }}>{s.totalParticipants ?? 0}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.25}>
                      <Tooltip title="Full detail">
                        <IconButton size="small" onClick={() => navigate(`/admin/live-sessions/${s.id}`)} sx={{ color: NAVY }}>
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Export attendance CSV">
                        <IconButton size="small" onClick={() => handleExportCSV(s.id, s.title)} sx={{ color: MUTED }}>
                          <Download fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {s.status === "live" && (
                        <Tooltip title="Force end">
                          <IconButton size="small" onClick={() => setActionDialog({ type: "force-end", session: s })} sx={{ color: "#dc2626" }}>
                            <StopCircle fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {!["ended","cancelled"].includes(s.status) && (
                        <Tooltip title="Cancel">
                          <IconButton size="small" onClick={() => setActionDialog({ type: "cancel", session: s })} sx={{ color: "#c2410c" }}>
                            <Cancel fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Delete permanently">
                        <IconButton size="small" onClick={() => setActionDialog({ type: "delete", session: s })} sx={{ color: "#ef4444" }}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* PAGINATION */}
      {total > 15 && (
        <Box sx={{ display: "flex", justifyContent: "center", gap: 1.5, mt: 3 }}>
          <Button disabled={page === 1} onClick={() => setPage((p) => p - 1)} variant="outlined"
            sx={{ borderColor: BORDER, color: NAVY, textTransform: "none", borderRadius: 2.5 }}>← Prev</Button>
          <Typography sx={{ alignSelf: "center", color: MUTED, fontSize: 13 }}>
            Page {page} of {Math.ceil(total / 15)}
          </Typography>
          <Button disabled={page >= Math.ceil(total / 15)} onClick={() => setPage((p) => p + 1)} variant="outlined"
            sx={{ borderColor: BORDER, color: NAVY, textTransform: "none", borderRadius: 2.5 }}>Next →</Button>
        </Box>
      )}

      {/* ACTION DIALOG */}
      <Dialog open={!!actionDialog} onClose={() => { setActionDialog(null); setActionReason(""); }}
        maxWidth="xs" fullWidth PaperProps={{ elevation: 0, sx: { borderRadius: 4, border: `1px solid ${BORDER}` } }}>
        {actionDialog && (
          <>
            <DialogTitle sx={{ fontWeight: 800, color: TEXT }}>{ACTIONS[actionDialog.type]?.title}</DialogTitle>
            <DialogContent>
              <Typography sx={{ color: MUTED, mb: 2, fontSize: 14 }}>
                {actionDialog.type === "delete"
                  ? `Permanently delete "${actionDialog.session.title}"? This cannot be undone.`
                  : `${actionDialog.type === "force-end" ? "Force-end" : "Cancel"} "${actionDialog.session.title}"?`}
              </Typography>
              {actionDialog.type !== "delete" && (
                <TextField fullWidth multiline rows={2} size="small" label="Reason (optional)"
                  value={actionReason} onChange={(e) => setActionReason(e.target.value)}
                  sx={{ "& fieldset": { borderColor: BORDER } }} />
              )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
              <Button onClick={() => { setActionDialog(null); setActionReason(""); }}
                sx={{ textTransform: "none", color: MUTED }}>Cancel</Button>
              <Button variant="contained" disabled={actionLoading} onClick={handleAction}
                sx={{ bgcolor: ACTIONS[actionDialog.type]?.color, textTransform: "none", fontWeight: 700, borderRadius: 2.5 }}>
                {actionLoading ? <CircularProgress size={18} color="inherit" /> : ACTIONS[actionDialog.type]?.label}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

const CourseSessionForm = ({ setToast }) => {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", courseId: "", tutorProfileId: "",
    scheduledAt: "", durationMinutes: 60, visibility: "assigned_students",
    notifyStudents: true,
  });

  const setField = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.courseId || !form.tutorProfileId || !form.scheduledAt) {
      setToast({ msg: "Please fill in all required fields.", severity: "error" }); return;
    }
    try {
      setLoading(true);
      const res = await adminScheduleSession({ ...form, durationMinutes: Number(form.durationMinutes) });
      setToast({
        msg: `Session scheduled! ${res.session?.studentsNotified ?? 0} student(s) notified.`,
        severity: "success",
      });
      setForm({ title: "", description: "", courseId: "", tutorProfileId: "", scheduledAt: "",
                durationMinutes: 60, visibility: "assigned_students", notifyStudents: true });
    } catch (err) {
      setToast({ msg: err?.response?.data?.message || "Failed to schedule session", severity: "error" });
    } finally { setLoading(false); }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Typography sx={{ fontSize: 13.5, color: MUTED, mb: 3 }}>
        Creates the session, pre-registers all assigned students, and optionally notifies them via email and in-app notification.
      </Typography>

      <Grid container spacing={2.5}>
        <Grid item xs={12}>
          <TextField required fullWidth label="Session Title" value={form.title} onChange={setField("title")}
            placeholder="e.g. Introduction to SAT Math"
            sx={{ "& fieldset": { borderColor: BORDER } }} />
        </Grid>
        <Grid item xs={12}>
          <TextField fullWidth multiline rows={2} label="Description (optional)" value={form.description} onChange={setField("description")}
            placeholder="What will be covered in this session?"
            sx={{ "& fieldset": { borderColor: BORDER } }} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField required fullWidth label="Course ID" value={form.courseId} onChange={setField("courseId")}
            type="number" helperText="Numeric course ID"
            sx={{ "& fieldset": { borderColor: BORDER } }} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField required fullWidth label="Tutor Profile ID" value={form.tutorProfileId} onChange={setField("tutorProfileId")}
            type="number" helperText="Numeric tutor profile ID"
            sx={{ "& fieldset": { borderColor: BORDER } }} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField required fullWidth type="datetime-local" label="Date & Time" InputLabelProps={{ shrink: true }}
            value={form.scheduledAt} onChange={setField("scheduledAt")}
            sx={{ "& fieldset": { borderColor: BORDER } }} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth select label="Duration" value={form.durationMinutes} onChange={setField("durationMinutes")}
            sx={{ "& fieldset": { borderColor: BORDER } }}>
            {[30, 45, 60, 90, 120].map((d) => (
              <MenuItem key={d} value={d}>{d} minutes</MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth select label="Visibility" value={form.visibility} onChange={setField("visibility")}
            sx={{ "& fieldset": { borderColor: BORDER } }}>
            <MenuItem value="assigned_students">Assigned students only</MenuItem>
            <MenuItem value="course_students">All course students</MenuItem>
            <MenuItem value="private">Private</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth select label="Notify Students" value={form.notifyStudents}
            onChange={(e) => setForm((f) => ({ ...f, notifyStudents: e.target.value === "true" }))}
            sx={{ "& fieldset": { borderColor: BORDER } }}>
            <MenuItem value="true">Yes — send email + in-app notification</MenuItem>
            <MenuItem value="false">No — schedule silently</MenuItem>
          </TextField>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3 }}>
        <Button type="submit" variant="contained" disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Send />}
          sx={{ bgcolor: NAVY, textTransform: "none", fontWeight: 700, borderRadius: 2.5, px: 3,
                "&:hover": { bgcolor: GREEN } }}>
          {loading ? "Scheduling…" : "Schedule Course Session"}
        </Button>
      </Box>
    </Box>
  );
};

// ─────────────────────────────────────────────────────────────
// TUTOR HOURS TAB
// ─────────────────────────────────────────────────────────────
const TutorHoursTab = () => {
  const [data,     setData]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [from,     setFrom]     = useState("");
  const [to,       setTo]       = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getTutorHours({ from: from || undefined, to: to || undefined });
      setData(res);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [from, to]);

  useEffect(() => { load(); }, [load]);

  return (
    <Box>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={3} alignItems="center">
        <TextField size="small" type="date" label="From" InputLabelProps={{ shrink: true }}
          value={from} onChange={(e) => setFrom(e.target.value)}
          sx={{ "& fieldset": { borderColor: BORDER } }} />
        <TextField size="small" type="date" label="To" InputLabelProps={{ shrink: true }}
          value={to} onChange={(e) => setTo(e.target.value)}
          sx={{ "& fieldset": { borderColor: BORDER } }} />
        <IconButton onClick={load} sx={{ color: GREEN }}><Refresh /></IconButton>
      </Stack>

      {data && (
        <Grid container spacing={2} mb={3}>
          {[
            { label: "Total Tutors",   value: data.summary.totalTutors   },
            { label: "Total Sessions", value: data.summary.totalSessions  },
            { label: "Total Hours",    value: data.summary.grandTotalHours },
            { label: "Formatted",      value: data.summary.formattedTotal  },
          ].map((s) => (
            <Grid item xs={6} sm={3} key={s.label}>
              <Paper elevation={0} sx={{ border: `1px solid ${BORDER}`, borderRadius: 2.5, p: 2.5, textAlign: "center" }}>
                <Typography sx={{ fontSize: 22, fontWeight: 800, color: NAVY }}>{s.value}</Typography>
                <Typography sx={{ fontSize: 12, color: MUTED }}>{s.label}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      {loading ? (
        <LinearProgress sx={{ borderRadius: 1, "& .MuiLinearProgress-bar": { bgcolor: GREEN } }} />
      ) : (
        <Stack spacing={2}>
          {(data?.tutors || []).map((t, i) => (
            <Paper key={t.tutorProfileId} elevation={0}
              sx={{ border: `1px solid ${BORDER}`, borderRadius: 3, overflow: "hidden" }}>
              <Box
                sx={{ px: 3, py: 2, display: "flex", alignItems: "center", gap: 2,
                      cursor: "pointer", "&:hover": { bgcolor: "#F8FAFC" }, transition: "background 0.15s" }}
                onClick={() => setExpanded(expanded === t.tutorProfileId ? null : t.tutorProfileId)}
              >
                <Typography sx={{ fontSize: 14, color: MUTED, fontWeight: 700, width: 24 }}>#{i + 1}</Typography>
                <Avatar src={t.profilePicUrl || undefined}
                  sx={{ width: 40, height: 40, bgcolor: avatarColor(t.fullName || ""), fontSize: 14 }}>
                  {!t.profilePicUrl && getInitials(t.fullName || "")}
                </Avatar>
                <Box flex={1}>
                  <Typography sx={{ fontWeight: 700, color: TEXT, fontSize: 14.5 }}>{t.fullName}</Typography>
                  <Typography sx={{ fontSize: 12, color: MUTED }}>{t.email}</Typography>
                </Box>
                <Stack direction="row" spacing={3} alignItems="center">
                  <Box sx={{ textAlign: "center" }}>
                    <Typography sx={{ fontSize: 18, fontWeight: 800, color: NAVY }}>{t.totalSessions}</Typography>
                    <Typography sx={{ fontSize: 11, color: MUTED }}>Sessions</Typography>
                  </Box>
                  <Box sx={{ textAlign: "center" }}>
                    <Typography sx={{ fontSize: 18, fontWeight: 800, color: GREEN }}>{t.formattedHours}</Typography>
                    <Typography sx={{ fontSize: 11, color: MUTED }}>Total Time</Typography>
                  </Box>
                </Stack>
              </Box>

              {expanded === t.tutorProfileId && (
                <Box sx={{ borderTop: `1px solid ${BORDER}`, bgcolor: "#FAFBFC", px: 3, py: 2 }}>
                  <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: 0.8, mb: 1.5 }}>
                    Session Breakdown
                  </Typography>
                  <Stack spacing={1}>
                    {t.sessions.map((sess) => (
                      <Box key={sess.sessionId}
                        sx={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                              p: 1.5, bgcolor: CARD, borderRadius: 2, border: `1px solid ${BORDER}` }}>
                        <Box>
                          <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: TEXT }}>{sess.title}</Typography>
                          <Typography sx={{ fontSize: 12, color: MUTED }}>{sess.course} · {fmtDateTime(sess.scheduledAt)}</Typography>
                        </Box>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Typography sx={{ fontSize: 13, fontWeight: 700, color: NAVY }}>{sess.durationMinutes}m</Typography>
                          <StatusChip status={sess.status} />
                          <Typography sx={{ fontSize: 12, color: MUTED }}>{sess.totalParticipants ?? 0} attended</Typography>
                        </Stack>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              )}
            </Paper>
          ))}

          {!data?.tutors?.length && (
            <Paper elevation={0} sx={{ border: `1px solid ${BORDER}`, borderRadius: 3, p: 6, textAlign: "center" }}>
              <AccessTime sx={{ fontSize: 36, color: MUTED, mb: 1 }} />
              <Typography sx={{ color: MUTED }}>No tutor session data for the selected period.</Typography>
            </Paper>
          )}
        </Stack>
      )}
    </Box>
  );
};

// ─────────────────────────────────────────────────────────────
// PUBLIC MEETING FORM  (NEW — Zoom/Meet-style, no course needed)
// ─────────────────────────────────────────────────────────────
const PublicMeetingForm = ({ setToast }) => {
  const [loading, setLoading]   = useState(false);
  const [created, setCreated]   = useState(null); // holds the returned session after success
  const [form, setForm] = useState({
    title: "",
    description: "",
    scheduledAt: "",
    durationMinutes: 60,
    enableWaitingRoom: true,
    recordingEnabled: false,
    allowChat: true,
    allowScreenShare: true,
    allowStudentCamera: true,
    allowStudentMic: true,
  });

  const setField = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setBool  = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value === "true" }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.scheduledAt) {
      setToast({ msg: "Please fill in the title and date/time.", severity: "error" }); return;
    }
    try {
      setLoading(true);
      const res = await scheduleAdminPublicMeeting({
        ...form,
        durationMinutes: Number(form.durationMinutes),
      });
      setCreated(res.session);
      setToast({ msg: "Public meeting scheduled! Share the join link below.", severity: "success" });
    } catch (err) {
      setToast({ msg: err?.response?.data?.message || "Failed to schedule public meeting", severity: "error" });
    } finally { setLoading(false); }
  };

  const handleScheduleAnother = () => {
    setCreated(null);
    setForm({
      title: "", description: "", scheduledAt: "", durationMinutes: 60,
      enableWaitingRoom: true, recordingEnabled: false,
      allowChat: true, allowScreenShare: true, allowStudentCamera: true, allowStudentMic: true,
    });
  };

  // ── SUCCESS STATE: show the shareable link ──
  if (created) {
    return (
      <Box>
        <Alert severity="success" sx={{ borderRadius: 2, mb: 3 }}>
          "{created.title}" is scheduled. Anyone with the link below can request to join — you'll
          admit them from the waiting room when the meeting starts.
        </Alert>

        <Paper variant="outlined" sx={{ borderRadius: 3, borderColor: BORDER, p: 3, mb: 3 }}>
          <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: MUTED, mb: 1, textTransform: "uppercase", letterSpacing: 0.8 }}>
            Shareable Join Link
          </Typography>
          <Typography sx={{ fontSize: 13.5, color: TEXT, fontFamily: "monospace", wordBreak: "break-all", mb: 1.5 }}>
            {created.joinLink}
          </Typography>
          <Stack direction="row" spacing={1}>
            <CopyButton text={created.joinLink} label="Copy Link" />
            <Button
              size="small" variant="outlined" href={created.joinLink} target="_blank"
              startIcon={<OpenInNew sx={{ fontSize: 14 }} />}
              sx={{ textTransform: "none", fontWeight: 700, fontSize: 12, borderColor: BORDER, color: NAVY, borderRadius: 2 }}
            >
              Open
            </Button>
          </Stack>
        </Paper>

        <Button onClick={handleScheduleAnother} variant="outlined"
          sx={{ textTransform: "none", fontWeight: 700, borderColor: BORDER, color: NAVY, borderRadius: 2.5 }}>
          Schedule Another Public Meeting
        </Button>
      </Box>
    );
  }

  // ── FORM STATE ──
  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Typography sx={{ fontSize: 13.5, color: MUTED, mb: 3 }}>
        Open to anyone with the link — no course enrollment required. Attendees request to join
        and wait in a lobby until you (or another admin) admit them, just like Zoom or Google Meet.
      </Typography>

      <Grid container spacing={2.5}>
        <Grid item xs={12}>
          <TextField required fullWidth label="Meeting Title" value={form.title} onChange={setField("title")}
            placeholder="e.g. GIEVA Community Town Hall"
            sx={{ "& fieldset": { borderColor: BORDER } }} />
        </Grid>
        <Grid item xs={12}>
          <TextField fullWidth multiline rows={2} label="Description (optional)" value={form.description} onChange={setField("description")}
            placeholder="What is this meeting about?"
            sx={{ "& fieldset": { borderColor: BORDER } }} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField required fullWidth type="datetime-local" label="Date & Time" InputLabelProps={{ shrink: true }}
            value={form.scheduledAt} onChange={setField("scheduledAt")}
            sx={{ "& fieldset": { borderColor: BORDER } }} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth select label="Duration" value={form.durationMinutes} onChange={setField("durationMinutes")}
            sx={{ "& fieldset": { borderColor: BORDER } }}>
            {[30, 45, 60, 90, 120, 180].map((d) => (
              <MenuItem key={d} value={d}>{d} minutes</MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12}><Divider sx={{ my: 0.5 }} /></Grid>

        <Grid item xs={12} sm={6}>
          <TextField fullWidth select label="Waiting Room" value={form.enableWaitingRoom}
            onChange={setBool("enableWaitingRoom")}
            sx={{ "& fieldset": { borderColor: BORDER } }}>
            <MenuItem value="true">On — admit attendees manually</MenuItem>
            <MenuItem value="false">Off — anyone can join instantly</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth select label="Recording" value={form.recordingEnabled}
            onChange={setBool("recordingEnabled")}
            sx={{ "& fieldset": { borderColor: BORDER } }}>
            <MenuItem value="false">Disabled</MenuItem>
            <MenuItem value="true">Enabled</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField fullWidth select label="Attendee Chat" value={form.allowChat}
            onChange={setBool("allowChat")} sx={{ "& fieldset": { borderColor: BORDER } }}>
            <MenuItem value="true">Allowed</MenuItem>
            <MenuItem value="false">Disabled</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField fullWidth select label="Attendee Camera" value={form.allowStudentCamera}
            onChange={setBool("allowStudentCamera")} sx={{ "& fieldset": { borderColor: BORDER } }}>
            <MenuItem value="true">Allowed</MenuItem>
            <MenuItem value="false">Disabled</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField fullWidth select label="Attendee Mic" value={form.allowStudentMic}
            onChange={setBool("allowStudentMic")} sx={{ "& fieldset": { borderColor: BORDER } }}>
            <MenuItem value="true">Allowed</MenuItem>
            <MenuItem value="false">Disabled</MenuItem>
          </TextField>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3 }}>
        <Button type="submit" variant="contained" disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Public />}
          sx={{ bgcolor: GOLD, color: NAVY, textTransform: "none", fontWeight: 800, borderRadius: 2.5, px: 3,
                "&:hover": { bgcolor: "#C8970F" } }}>
          {loading ? "Scheduling…" : "Schedule Public Meeting"}
        </Button>
      </Box>
    </Box>
  );
};

// ─────────────────────────────────────────────────────────────
// SCHEDULE TAB  (replaces your existing ScheduleTab)
// ─────────────────────────────────────────────────────────────
export const ScheduleTab = ({ setToast }) => {
  const [mode, setMode] = useState("course"); // "course" | "public"

  return (
    <Box>
      <Paper elevation={0}
        sx={{ border: `1px solid ${BORDER}`, borderRadius: 4, p: { xs: 3, md: 4 }, maxWidth: 760 }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 2, mb: 1 }}>
          <Typography sx={{ fontSize: 17, fontWeight: 800, color: TEXT }}>
            Schedule a Live Session
          </Typography>

          <ToggleButtonGroup
            value={mode}
            exclusive
            size="small"
            onChange={(_, v) => v && setMode(v)}
            sx={{
              "& .MuiToggleButton-root": {
                textTransform: "none", fontWeight: 700, fontSize: 13, px: 2,
                borderColor: BORDER, color: MUTED,
              },
              "& .Mui-selected": {
                bgcolor: `${NAVY}10 !important`, color: `${NAVY} !important`,
              },
            }}
          >
            <ToggleButton value="course">
              <School sx={{ fontSize: 16, mr: 0.75 }} /> Course Session
            </ToggleButton>
            <ToggleButton value="public">
              <Public sx={{ fontSize: 16, mr: 0.75 }} /> Public Meeting
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Box sx={{ mt: 2.5 }}>
          {mode === "course"
            ? <CourseSessionForm setToast={setToast} />
            : <PublicMeetingForm setToast={setToast} />}
        </Box>
      </Paper>
    </Box>
  );
};

// ─────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────
export default function AdminLiveSessions() {
  const navigate = useNavigate();
  const [tab,   setTab]   = useState(0);
  const [toast, setToast] = useState(null);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: BG }}>
      <Box sx={{ maxWidth: 1400, mx: "auto", px: { xs: 2, sm: 3, md: 5 }, py: { xs: 3, md: 5 } }}>

        {/* HERO */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: 5, mb: 4, overflow: "hidden",
            background: "linear-gradient(135deg, #0B1F3A, #1E7F4F)",
            color: "#fff", p: { xs: 3, md: 4 },
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
            <Box>
              <Typography sx={{ fontSize: { xs: 22, md: 28 }, fontWeight: 800 }}>Live Sessions</Typography>
              <Typography sx={{ fontSize: 13.5, opacity: 0.8, mt: 0.5 }}>
                Monitor, manage and schedule live teaching sessions across the platform
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setTab(3)}
              sx={{ bgcolor: GOLD, color: NAVY, textTransform: "none", fontWeight: 800, borderRadius: 3, px: 2.5,
                    "&:hover": { bgcolor: "#C8970F" } }}
            >
              Schedule Session
            </Button>
          </Box>
        </Paper>

        {/* TABS */}
        <Box sx={{ borderBottom: `1px solid ${BORDER}`, mb: 4 }}>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            sx={{
              "& .MuiTab-root":   { textTransform: "none", fontWeight: 700, color: MUTED, fontSize: 14 },
              "& .Mui-selected":  { color: NAVY },
              "& .MuiTabs-indicator": { bgcolor: NAVY, height: 3, borderRadius: "3px 3px 0 0" },
            }}
          >
            <Tab label="Overview"     icon={<BarChart    sx={{ fontSize: 17 }} />} iconPosition="start" />
            <Tab label="All Sessions" icon={<Videocam    sx={{ fontSize: 17 }} />} iconPosition="start" />
            <Tab label="Tutor Hours"  icon={<AccessTime  sx={{ fontSize: 17 }} />} iconPosition="start" />
            <Tab label="Schedule"     icon={<Add         sx={{ fontSize: 17 }} />} iconPosition="start" />
          </Tabs>
        </Box>

        {tab === 0 && <OverviewTab navigate={navigate} />}
        {tab === 1 && <SessionsTab navigate={navigate} setToast={setToast} />}
        {tab === 2 && <TutorHoursTab />}
        {tab === 3 && <ScheduleTab setToast={setToast} />}
      </Box>

      <Snackbar open={!!toast} autoHideDuration={4500} onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <Alert severity={toast?.severity || "info"} onClose={() => setToast(null)} sx={{ borderRadius: 2 }}>
          {toast?.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
