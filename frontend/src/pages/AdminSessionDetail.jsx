// pages/AdminSessionDetail.jsx
// Full detail view for a single admin session.
// Route: /admin/live-sessions/:sessionId

import {
  Box, Typography, Paper, Grid, Chip, Stack, Avatar,
  Button, IconButton, Divider, CircularProgress, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Snackbar, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Tooltip,
  LinearProgress, Tab, Tabs,
} from "@mui/material";

import {
  ArrowBack, Videocam, People, AccessTime, CalendarMonth,
  Download, StopCircle, Cancel, Delete, Edit, LinkOutlined,
  Visibility, CheckCircle, Close, FiberManualRecord, PlayCircle,
  PersonAdd, Assignment, BarChart, ContentCopy, OpenInNew,
  Warning, HourglassTop, RadioButtonChecked,
} from "@mui/icons-material";

import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";

import {
  getSessionDetail,
  getSessionAttendance,
  exportAttendanceCSV,
  getSessionLink,
  joinAsObserver,
  forceEndSession,
  cancelSession,
  deleteSession,
  rescheduleSession,
  updateRecordingStatus,
  overrideAttendance,
} from "../services/adminClassSessionService";
import {
  joinPublicMeetingAsHost,
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

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
const fmt = (d) =>
  d ? new Date(d).toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "short", year: "numeric" }) : "—";
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

const STATUS_CONFIG = {
  live:      { label: "LIVE",      bg: "rgba(239,68,68,0.12)", color: "#dc2626", icon: <RadioButtonChecked sx={{ fontSize: 13 }} /> },
  scheduled: { label: "SCHEDULED", bg: "rgba(212,160,23,0.12)", color: "#b45309", icon: <HourglassTop sx={{ fontSize: 13 }} /> },
  ended:     { label: "ENDED",     bg: "#F1F5F9",               color: MUTED,     icon: <CheckCircle sx={{ fontSize: 13 }} /> },
  cancelled: { label: "CANCELLED", bg: "#FEF2F2",               color: "#dc2626", icon: <Cancel sx={{ fontSize: 13 }} /> },
};

const StatusChip = ({ status, size = "small" }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.scheduled;
  return (
    <Chip
      icon={cfg.icon}
      label={cfg.label}
      size={size}
      sx={{
        bgcolor: cfg.bg,
        color: cfg.color,
        fontWeight: 800,
        fontSize: size === "small" ? 10 : 12,
        border: `1px solid ${cfg.color}33`,
        "& .MuiChip-icon": { color: cfg.color },
        ...(status === "live" && {
          animation: "livePulse 1.8s ease-in-out infinite",
          "@keyframes livePulse": {
            "0%,100%": { boxShadow: "0 0 0 0 rgba(239,68,68,0.4)" },
            "50%":     { boxShadow: "0 0 0 7px rgba(239,68,68,0)" },
          },
        }),
      }}
    />
  );
};

const MetaRow = ({ icon, label, value }) => (
  <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, py: 1.25 }}>
    <Box sx={{ color: MUTED, mt: 0.15, "& svg": { fontSize: 17 } }}>{icon}</Box>
    <Box>
      <Typography sx={{ fontSize: 11.5, color: MUTED, fontWeight: 600, mb: 0.2 }}>{label}</Typography>
      <Typography sx={{ fontSize: 14, color: TEXT, fontWeight: 500 }}>{value || "—"}</Typography>
    </Box>
  </Box>
);

const SummaryCard = ({ label, value, color = NAVY, sub }) => (
  <Paper elevation={0} sx={{ border: `1px solid ${BORDER}`, borderRadius: 3, p: 2.5, textAlign: "center" }}>
    <Typography sx={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1 }}>{value ?? "—"}</Typography>
    <Typography sx={{ fontSize: 11.5, color: MUTED, fontWeight: 600, mt: 0.5 }}>{label}</Typography>
    {sub && <Typography sx={{ fontSize: 11, color: MUTED, mt: 0.25 }}>{sub}</Typography>}
  </Paper>
);

// ─────────────────────────────────────────────────────────────
// COPY-TO-CLIPBOARD BUTTON
// ─────────────────────────────────────────────────────────────
const CopyButton = ({ text, label = "Copy" }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <Button
      size="small"
      startIcon={<ContentCopy sx={{ fontSize: 14 }} />}
      onClick={handleCopy}
      sx={{
        textTransform: "none",
        fontWeight: 700,
        fontSize: 12,
        color: copied ? GREEN : NAVY,
        borderColor: copied ? GREEN : BORDER,
        borderRadius: 2,
      }}
      variant="outlined"
    >
      {copied ? "Copied!" : label}
    </Button>
  );
};

// ─────────────────────────────────────────────────────────────
// RESCHEDULE DIALOG
// ─────────────────────────────────────────────────────────────
const RescheduleDialog = ({ open, onClose, sessionId, currentDate, durationMinutes, onSuccess, setToast }) => {
  const [form, setForm] = useState({
    scheduledAt:     "",
    durationMinutes: durationMinutes || 60,
    notifyStudents:  true,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.scheduledAt) { setToast({ msg: "Please select a date and time.", severity: "error" }); return; }
    try {
      setLoading(true);
      await rescheduleSession(sessionId, { ...form, durationMinutes: Number(form.durationMinutes) });
      setToast({ msg: "Session rescheduled. Students have been notified.", severity: "success" });
      onSuccess();
      onClose();
    } catch (err) {
      setToast({ msg: err?.response?.data?.message || "Reschedule failed", severity: "error" });
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
      PaperProps={{ elevation: 0, sx: { borderRadius: 4, border: `1px solid ${BORDER}` } }}>
      <DialogTitle sx={{ fontWeight: 800, color: TEXT, fontSize: 17 }}>Reschedule Session</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Stack spacing={2.5} mt={1}>
          <TextField
            fullWidth required type="datetime-local" label="New Date & Time"
            InputLabelProps={{ shrink: true }}
            value={form.scheduledAt}
            onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))}
            sx={{ "& fieldset": { borderColor: BORDER } }}
          />
          <TextField
            fullWidth select label="Duration"
            value={form.durationMinutes}
            onChange={(e) => setForm((f) => ({ ...f, durationMinutes: e.target.value }))}
            sx={{ "& fieldset": { borderColor: BORDER } }}
          >
            {[30, 45, 60, 90, 120].map((d) => (
              <MenuItem key={d} value={d}>{d} minutes</MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth select label="Notify Students"
            value={form.notifyStudents}
            onChange={(e) => setForm((f) => ({ ...f, notifyStudents: e.target.value === "true" }))}
            sx={{ "& fieldset": { borderColor: BORDER } }}
          >
            <MenuItem value="true">Yes — send notification & email</MenuItem>
            <MenuItem value="false">No — update silently</MenuItem>
          </TextField>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={onClose} sx={{ textTransform: "none", color: MUTED }}>Cancel</Button>
        <Button variant="contained" disabled={loading} onClick={handleSubmit}
          sx={{ bgcolor: NAVY, textTransform: "none", fontWeight: 700, borderRadius: 2.5, "&:hover": { bgcolor: GREEN } }}>
          {loading ? <CircularProgress size={18} color="inherit" /> : "Reschedule"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─────────────────────────────────────────────────────────────
// RECORDING DIALOG
// ─────────────────────────────────────────────────────────────
const RecordingDialog = ({ open, onClose, sessionId, current, onSuccess, setToast }) => {
  const [form, setForm] = useState({
    recordingStatus:   current?.recordingStatus   || "pending",
    recordingUrl:      current?.recordingUrl      || "",
    recordingDuration: current?.recordingDuration || "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await updateRecordingStatus(sessionId, form);
      setToast({ msg: "Recording status updated.", severity: "success" });
      onSuccess();
      onClose();
    } catch (err) {
      setToast({ msg: err?.response?.data?.message || "Update failed", severity: "error" });
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
      PaperProps={{ elevation: 0, sx: { borderRadius: 4, border: `1px solid ${BORDER}` } }}>
      <DialogTitle sx={{ fontWeight: 800, color: TEXT, fontSize: 17 }}>Override Recording Status</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Stack spacing={2.5} mt={1}>
          <TextField
            fullWidth select label="Recording Status"
            value={form.recordingStatus}
            onChange={(e) => setForm((f) => ({ ...f, recordingStatus: e.target.value }))}
            sx={{ "& fieldset": { borderColor: BORDER } }}
          >
            {["pending","processing","ready","failed"].map((s) => (
              <MenuItem key={s} value={s} sx={{ textTransform: "capitalize" }}>{s}</MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth label="Recording URL (optional)"
            value={form.recordingUrl}
            onChange={(e) => setForm((f) => ({ ...f, recordingUrl: e.target.value }))}
            placeholder="https://..."
            sx={{ "& fieldset": { borderColor: BORDER } }}
          />
          <TextField
            fullWidth label="Duration (seconds, optional)"
            type="number"
            value={form.recordingDuration}
            onChange={(e) => setForm((f) => ({ ...f, recordingDuration: e.target.value }))}
            sx={{ "& fieldset": { borderColor: BORDER } }}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={onClose} sx={{ textTransform: "none", color: MUTED }}>Cancel</Button>
        <Button variant="contained" disabled={loading} onClick={handleSubmit}
          sx={{ bgcolor: NAVY, textTransform: "none", fontWeight: 700, borderRadius: 2.5, "&:hover": { bgcolor: GREEN } }}>
          {loading ? <CircularProgress size={18} color="inherit" /> : "Update"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─────────────────────────────────────────────────────────────
// ATTENDANCE OVERRIDE DIALOG
// ─────────────────────────────────────────────────────────────
const AttendanceOverrideDialog = ({ open, onClose, sessionId, onSuccess, setToast }) => {
  const [form, setForm] = useState({ userId: "", wasPresent: "true", totalMinutes: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.userId) { setToast({ msg: "User ID is required.", severity: "error" }); return; }
    try {
      setLoading(true);
      await overrideAttendance(sessionId, {
        userId: Number(form.userId),
        wasPresent: form.wasPresent === "true",
        totalMinutes: form.totalMinutes ? Number(form.totalMinutes) : undefined,
      });
      setToast({ msg: "Attendance record updated.", severity: "success" });
      setForm({ userId: "", wasPresent: "true", totalMinutes: "" });
      onSuccess();
      onClose();
    } catch (err) {
      setToast({ msg: err?.response?.data?.message || "Override failed", severity: "error" });
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
      PaperProps={{ elevation: 0, sx: { borderRadius: 4, border: `1px solid ${BORDER}` } }}>
      <DialogTitle sx={{ fontWeight: 800, color: TEXT, fontSize: 17 }}>Override Attendance</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Typography sx={{ fontSize: 13, color: MUTED, mb: 2.5 }}>
          Manually mark a student as present or absent for this session.
        </Typography>
        <Stack spacing={2.5}>
          <TextField
            fullWidth required label="User ID"
            type="number"
            value={form.userId}
            onChange={(e) => setForm((f) => ({ ...f, userId: e.target.value }))}
            helperText="Numeric user ID of the student"
            sx={{ "& fieldset": { borderColor: BORDER } }}
          />
          <TextField
            fullWidth select label="Mark as"
            value={form.wasPresent}
            onChange={(e) => setForm((f) => ({ ...f, wasPresent: e.target.value }))}
            sx={{ "& fieldset": { borderColor: BORDER } }}
          >
            <MenuItem value="true">Present ✓</MenuItem>
            <MenuItem value="false">Absent ✗</MenuItem>
          </TextField>
          <TextField
            fullWidth label="Minutes attended (optional)"
            type="number"
            value={form.totalMinutes}
            onChange={(e) => setForm((f) => ({ ...f, totalMinutes: e.target.value }))}
            sx={{ "& fieldset": { borderColor: BORDER } }}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={onClose} sx={{ textTransform: "none", color: MUTED }}>Cancel</Button>
        <Button variant="contained" disabled={loading} onClick={handleSubmit}
          sx={{ bgcolor: NAVY, textTransform: "none", fontWeight: 700, borderRadius: 2.5, "&:hover": { bgcolor: GREEN } }}>
          {loading ? <CircularProgress size={18} color="inherit" /> : "Save Override"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─────────────────────────────────────────────────────────────
// JOIN LINK PANEL
// ─────────────────────────────────────────────────────────────
const SessionLinkPanel = ({ session, navigate, setToast }) => {

   const sessionId = session.id;
  const [linkData, setLinkData]   = useState(null);
  const [loading, setLoading]     = useState(false);
  const [fetched, setFetched]     = useState(false);
  const [joining, setJoining]     = useState(false);

  const fetchLink = async () => {
    try {
      setLoading(true);
      const data = await getSessionLink(sessionId);
      setLinkData(data);
      setFetched(true);
    } catch (err) {
      setToast({ msg: err?.response?.data?.message || "Failed to get session link", severity: "error" });
    } finally { setLoading(false); }
  };

  const handleObserve = async () => {
    try {
      setJoining(true);
      const data = await joinAsObserver(sessionId);
      // open the live room passing token
      navigate(`/live/${data.roomName}/${sessionId}`, {
        state: { role: "observer", token: data.token, serverUrl: data.serverUrl, currentUser: data.currentUser },
      });
    } catch (err) {
      setToast({ msg: err?.response?.data?.message || "Cannot join as observer", severity: "error" });
    } finally { setJoining(false); }
  };


const handleStartMeeting = async () => {
    try {
        setJoining(true);

        const res = await joinPublicMeetingAsHost(sessionId);

        navigate(`/live/${res.roomName}/${sessionId}`, {
            state: {
                role: "host",
                token: res.token,
                serverUrl: res.serverUrl,
                phase: "live",
            },
        });
    } catch (err) {
        setToast({
            msg:
                err?.response?.data?.message ||
                "Unable to start meeting",
            severity: "error",
        });
    } finally {
        setJoining(false);
    }
};


  if (!fetched) {
    return (
      <Paper elevation={0} sx={{ border: `1px solid ${BORDER}`, borderRadius: 3, p: 3 }}>
        <Typography sx={{ fontWeight: 800, fontSize: 15, color: TEXT, mb: 2 }}>Session Link & Observer Access</Typography>
        <Button
          variant="contained"
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <LinkOutlined />}
          disabled={loading}
          onClick={fetchLink}
          sx={{ bgcolor: NAVY, textTransform: "none", fontWeight: 700, borderRadius: 2.5, "&:hover": { bgcolor: GREEN } }}
        >
          {loading ? "Loading…" : "Get Session Link"}
        </Button>
      </Paper>
    );
  }

  return (
    <Paper elevation={0} sx={{ border: `1px solid ${BORDER}`, borderRadius: 3, p: 3 }}>
      <Typography sx={{ fontWeight: 800, fontSize: 15, color: TEXT, mb: 2.5 }}>Session Link & Observer Access</Typography>

      <Stack spacing={2}>
        {/* Join link */}
        <Box sx={{ bgcolor: "#F8FAFC", borderRadius: 2.5, p: 2, border: `1px solid ${BORDER}` }}>
          <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: MUTED, mb: 0.75, textTransform: "uppercase", letterSpacing: 0.8 }}>
            Shareable Join Link
          </Typography>
          <Typography sx={{ fontSize: 13, color: TEXT, wordBreak: "break-all", mb: 1.5, fontFamily: "monospace" }}>
            {linkData.shareableLink}
          </Typography>
          <Stack direction="row" spacing={1}>
            <CopyButton text={linkData.shareableLink} label="Copy Link" />
            <Button
              size="small" variant="outlined"
              startIcon={<OpenInNew sx={{ fontSize: 14 }} />}
              href={linkData.shareableLink} target="_blank"
              sx={{ textTransform: "none", fontWeight: 700, fontSize: 12, borderColor: BORDER, color: NAVY, borderRadius: 2 }}
            >
              Open
            </Button>
          </Stack>
        </Box>

        {/* Observer token */}
        {linkData.adminObserverToken && (
          <Box sx={{ bgcolor: "#F8FAFC", borderRadius: 2.5, p: 2, border: `1px solid ${BORDER}` }}>
            <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: MUTED, mb: 0.75, textTransform: "uppercase", letterSpacing: 0.8 }}>
              Admin Observer Token
            </Typography>
            <Typography sx={{ fontSize: 12, color: MUTED, fontFamily: "monospace", wordBreak: "break-all", mb: 1.25 }}>
              {linkData.adminObserverToken.slice(0, 60)}…
            </Typography>
            <CopyButton text={linkData.adminObserverToken} label="Copy Token" />
          </Box>
        )}

        {/* Live join button */}
        {session.sessionType === "public" ? (

    session.status === "scheduled" ? (

        <Button
            variant="contained"
            color="success"
            startIcon={<PlayCircle />}
            onClick={handleStartMeeting}
            sx={{
                textTransform: "none",
                fontWeight: 700,
                borderRadius: 2.5,
            }}
        >
            Start Meeting
        </Button>

    ) : session.status === "live" ? (

        <Button
            variant="contained"
            color="error"
            startIcon={
                joining
                    ? (
                        <CircularProgress
                            size={16}
                            color="inherit"
                        />
                    )
                    : (
                        <Videocam />
                    )
            }
            onClick={handleStartMeeting}
            disabled={joining}
            sx={{
                textTransform: "none",
                fontWeight: 700,
                borderRadius: 2.5,
            }}
        >
            {joining
                ? "Joining..."
                : "Join Live"}
        </Button>

    ) : (

        <Button
            disabled
            variant="contained"
        >
            Meeting Ended
        </Button>

    )

) : (

    <Button
        variant="contained"
        startIcon={
            joining
                ? (
                    <CircularProgress
                        size={16}
                        color="inherit"
                    />
                )
                : (
                    <Visibility />
                )
        }
        disabled={
            joining ||
            linkData.status !== "live"
        }
        onClick={handleObserve}
        sx={{
            bgcolor:
                linkData.status === "live"
                    ? "#ef4444"
                    : "#CBD5E1",

            color: "#fff",

            textTransform: "none",

            fontWeight: 700,

            borderRadius: 2.5,

            py: 1.25,

            "&:hover": {
                bgcolor:
                    linkData.status === "live"
                        ? "#dc2626"
                        : "#CBD5E1",
            },
        }}
    >
        {joining
            ? "Joining..."

            : linkData.status === "live"

            ? "Join as Observer"

            : "Session Not Live"}
    </Button>

)}

        {linkData.linkExpiresAt && (
          <Typography sx={{ fontSize: 12, color: MUTED }}>
            Link expires: {fmtDateTime(linkData.linkExpiresAt)}
          </Typography>
        )}
      </Stack>
    </Paper>
  );
};

// ─────────────────────────────────────────────────────────────
// ATTENDANCE TABLE TAB
// ─────────────────────────────────────────────────────────────
const AttendanceTab = ({ sessionId, setToast, onRefresh }) => {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [overrideOpen, setOverrideOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getSessionAttendance(sessionId);
      setData(res);
    } catch (err) {
      setToast({ msg: "Failed to load attendance", severity: "error" });
    } finally { setLoading(false); }
  }, [sessionId]);

  useEffect(() => { load(); }, [load]);

  const handleExport = async () => {
    try {
      const blob = await exportAttendanceCSV(sessionId);
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `attendance-${sessionId}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setToast({ msg: "Export failed", severity: "error" });
    }
  };

  if (loading) return <Box sx={{ py: 6, display: "flex", justifyContent: "center" }}><CircularProgress sx={{ color: GREEN }} /></Box>;
  if (!data)   return null;

  const { summary, roster } = data;

  return (
    <Box>
      {/* Summary */}
      <Grid container spacing={2} mb={3}>
        {[
          { label: "Registered",      value: summary.total,          color: NAVY },
          { label: "Present",         value: summary.present,        color: GREEN },
          { label: "Absent",          value: summary.absent,         color: "#dc2626" },
          { label: "Attendance Rate", value: `${summary.attendanceRate}%`, color: "#7C3AED" },
        ].map((s) => (
          <Grid item xs={6} sm={3} key={s.label}>
            <SummaryCard {...s} />
          </Grid>
        ))}
      </Grid>

      {/* Actions */}
      <Stack direction="row" spacing={1.5} mb={2.5}>
        <Button
          variant="outlined"
          startIcon={<Download />}
          onClick={handleExport}
          sx={{ textTransform: "none", fontWeight: 700, borderColor: BORDER, color: NAVY, borderRadius: 2.5 }}
        >
          Export CSV
        </Button>
        <Button
          variant="outlined"
          startIcon={<PersonAdd />}
          onClick={() => setOverrideOpen(true)}
          sx={{ textTransform: "none", fontWeight: 700, borderColor: BORDER, color: NAVY, borderRadius: 2.5 }}
        >
          Override Attendance
        </Button>
      </Stack>

      {/* Roster table */}
      <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${BORDER}`, borderRadius: 3 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: "#F8FAFC" }}>
              {["Student", "Role", "Status", "Join Time", "Leave Time", "Duration", "Reconnects"].map((h) => (
                <TableCell key={h} sx={{ fontWeight: 700, color: NAVY, fontSize: 11.5, textTransform: "uppercase", letterSpacing: 0.6, py: 1.5 }}>
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {roster.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} sx={{ textAlign: "center", py: 5, color: MUTED }}>
                  No attendance records for this session yet.
                </TableCell>
              </TableRow>
            ) : roster.map((r) => (
              <TableRow key={r.userId} hover sx={{ "&:last-child td": { border: 0 } }}>
                <TableCell>
                  <Stack direction="row" spacing={1.25} alignItems="center">
                    <Avatar sx={{ width: 32, height: 32, bgcolor: avatarColor(r.fullName || ""), fontSize: 12 }}>
                      {getInitials(r.fullName || "")}
                    </Avatar>
                    <Box>
                      <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: TEXT }}>{r.fullName}</Typography>
                      <Typography sx={{ fontSize: 12, color: MUTED }}>{r.email}</Typography>
                    </Box>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Chip label={r.role} size="small" sx={{ bgcolor: "#F1F5F9", fontWeight: 600, fontSize: 11 }} />
                </TableCell>
                <TableCell>
                  <Chip
                    label={r.wasPresent ? "Present" : "Absent"}
                    size="small"
                    sx={{
                      fontWeight: 700,
                      fontSize: 11,
                      bgcolor: r.wasPresent ? "#ECFDF5" : "#FEF2F2",
                      color:   r.wasPresent ? GREEN      : "#dc2626",
                    }}
                  />
                </TableCell>
                <TableCell sx={{ fontSize: 12.5, color: TEXT }}>{r.joinTime  ? fmtTime(r.joinTime)  : "—"}</TableCell>
                <TableCell sx={{ fontSize: 12.5, color: TEXT }}>{r.leaveTime ? fmtTime(r.leaveTime) : "—"}</TableCell>
                <TableCell sx={{ fontSize: 12.5, color: TEXT }}>{r.formattedTime || "0h 0m"}</TableCell>
                <TableCell sx={{ fontSize: 12.5, color: MUTED }}>{r.reconnectCount ?? 0}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <AttendanceOverrideDialog
        open={overrideOpen}
        onClose={() => setOverrideOpen(false)}
        sessionId={sessionId}
        onSuccess={() => { load(); onRefresh(); }}
        setToast={setToast}
      />
    </Box>
  );
};

// ─────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────
export default function AdminSessionDetail() {
  const { sessionId } = useParams();
  const navigate      = useNavigate();

  const [detail,  setDetail]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState(0);
  const [toast,   setToast]   = useState(null);

  // dialogs
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [recordingOpen,  setRecordingOpen]  = useState(false);
  const [actionDialog,   setActionDialog]   = useState(null); // { type }
  const [actionReason,   setActionReason]   = useState("");
  const [actionLoading,  setActionLoading]  = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getSessionDetail(sessionId);
      setDetail(res);
    } catch (err) {
      setToast({ msg: "Failed to load session detail", severity: "error" });
    } finally { setLoading(false); }
  }, [sessionId]);

  useEffect(() => { load(); }, [load]);

  const handleAction = async () => {
    if (!actionDialog) return;
    try {
      setActionLoading(true);
      if (actionDialog === "force-end") await forceEndSession(sessionId, actionReason);
      if (actionDialog === "cancel")    await cancelSession(sessionId, actionReason);
      if (actionDialog === "delete") {
        await deleteSession(sessionId);
        navigate("/admin/live-sessions");
        return;
      }
      setToast({ msg: `Session ${actionDialog === "force-end" ? "force-ended" : actionDialog + "led"} successfully`, severity: "success" });
      setActionDialog(null);
      setActionReason("");
      load();
    } catch (err) {
      setToast({ msg: err?.response?.data?.message || "Action failed", severity: "error" });
    } finally { setActionLoading(false); }
  };

const handleStartMeeting = async () => {

    if (!detail) return;

    const session = detail.session;

    try {

        const res =
            await joinPublicMeetingAsHost(
                session.id
            );

        navigate(
            `/live/${res.roomName}/${session.id}`,
            {
                state: {
                    role: "host",
                    token: res.token,
                    serverUrl: res.serverUrl,
                    phase: "live",
                },
            }
        );

    } catch (err) {

        console.error(err);

        setToast({
            msg:
                err?.response?.data?.message ||
                "Unable to start meeting",
            severity: "error",
        });

    }
};

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: BG, display: "flex", justifyContent: "center", alignItems: "center" }}>
        <CircularProgress sx={{ color: GREEN }} />
      </Box>
    );
  }

  if (!detail) {
    return (
      <Box sx={{ p: 4, bgcolor: BG, minHeight: "100vh" }}>
        <Alert severity="error">Session not found or you don't have permission to view it.</Alert>
      </Box>
    );
  }

  const { session, summary } = detail;
  const s = session;
  const isEnded = ["ended", "cancelled"].includes(s.status);

  const ACTION_CFG = {
    "force-end": { title: "Force-End Session",  label: "Force End", color: "#dc2626", needsReason: true },
    "cancel":    { title: "Cancel Session",     label: "Cancel",    color: "#c2410c", needsReason: true },
    "delete":    { title: "Delete Session",     label: "Delete Permanently", color: "#dc2626", needsReason: false },
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: BG }}>
      <Box sx={{ maxWidth: 1200, mx: "auto", px: { xs: 2, sm: 3, md: 5 }, py: { xs: 3, md: 5 } }}>

        {/* ══ BACK + HEADER ═══════════════════════════════════════ */}
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate("/admin/live-sessions")}
          sx={{ color: MUTED, textTransform: "none", fontWeight: 700, mb: 2.5, px: 0 }}
        >
          Back to Sessions
        </Button>

        <Paper
          elevation={0}
          sx={{
            borderRadius: 5,
            mb: 4,
            overflow: "hidden",
            background: isEnded
              ? "linear-gradient(135deg, #475569, #64748B)"
              : "linear-gradient(135deg, #0B1F3A, #1E7F4F)",
            color: "#fff",
            p: { xs: 3, md: 4 },
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
            <Box>
              <StatusChip status={s.status} size="medium" />
              <Typography sx={{ fontSize: { xs: 20, md: 26 }, fontWeight: 800, mt: 1.5, lineHeight: 1.2 }}>
                {s.title}
              </Typography>
              <Typography sx={{ fontSize: 14, opacity: 0.8, mt: 0.5 }}>
                {s.Course?.title}
                {s.TutorProfile?.fullName && ` · ${s.TutorProfile.fullName}`}
              </Typography>
            </Box>

            {/* ACTION BUTTONS */}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} flexShrink={0}>
              {!isEnded && (
                <Button
                  variant="outlined"
                  startIcon={<Edit />}
                  onClick={() => setRescheduleOpen(true)}
                  sx={{ borderColor: "rgba(255,255,255,0.35)", color: "#fff", textTransform: "none", fontWeight: 700, borderRadius: 3,
                        "&:hover": { borderColor: "#fff", bgcolor: "rgba(255,255,255,0.08)" } }}
                >
                  Reschedule
                </Button>
              )}
              {s.status === "live" && (
                <Button
                  variant="contained"
                  startIcon={<StopCircle />}
                  onClick={() => setActionDialog("force-end")}
                  sx={{ bgcolor: "#ef4444", color: "#fff", textTransform: "none", fontWeight: 700, borderRadius: 3,
                        "&:hover": { bgcolor: "#dc2626" } }}
                >
                  Force End
                </Button>
              )}
              {!isEnded && s.status !== "live" && (
                <Button
                  variant="outlined"
                  startIcon={<Cancel />}
                  onClick={() => setActionDialog("cancel")}
                  sx={{ borderColor: "rgba(255,200,0,0.5)", color: GOLD, textTransform: "none", fontWeight: 700, borderRadius: 3,
                        "&:hover": { borderColor: GOLD, bgcolor: "rgba(212,160,23,0.08)" } }}
                >
                  Cancel
                </Button>
              )}
              {isEnded && (
                <Button
                  variant="outlined"
                  startIcon={<Delete />}
                  onClick={() => setActionDialog("delete")}
                  sx={{ borderColor: "rgba(255,100,100,0.5)", color: "#fca5a5", textTransform: "none", fontWeight: 700, borderRadius: 3,
                        "&:hover": { borderColor: "#ef4444", bgcolor: "rgba(239,68,68,0.08)" } }}
                >
                  Delete
                </Button>
              )}
            </Stack>
          </Box>
        </Paper>

        {/* ══ SUMMARY CARDS ══════════════════════════════════════ */}
        <Grid container spacing={2} mb={4}>
          {[
            { label: "Registered",      value: summary.totalRegistered,  color: NAVY },
            { label: "Attended",        value: summary.totalPresent,      color: GREEN },
            { label: "Absent",          value: summary.totalAbsent,       color: "#dc2626" },
            { label: "Attendance Rate", value: `${summary.attendanceRate}%`, color: "#7C3AED" },
            { label: "Total Time Logged", value: summary.formattedDuration || "0h 0m", color: "#0284C7" },
          ].map((s) => (
            <Grid item xs={6} sm={4} md key={s.label}>
              <SummaryCard {...s} />
            </Grid>
          ))}
        </Grid>

        {/* ══ TWO-COLUMN: DETAIL + LINK ══════════════════════════ */}
        <Grid container spacing={3} mb={4} alignItems="flex-start">
          {/* Left: session metadata */}
          <Grid item xs={12} md={7}>
            <Paper elevation={0} sx={{ border: `1px solid ${BORDER}`, borderRadius: 3, p: 3 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography sx={{ fontWeight: 800, fontSize: 15, color: TEXT }}>Session Details</Typography>
                <Button
                  size="small" variant="outlined"
                  startIcon={<RadioButtonChecked sx={{ fontSize: 14 }} />}
                  onClick={() => setRecordingOpen(true)}
                  sx={{ textTransform: "none", fontWeight: 700, fontSize: 12, borderColor: BORDER, color: NAVY, borderRadius: 2 }}
                >
                  Recording
                </Button>
              </Box>

              <MetaRow icon={<CalendarMonth />}   label="Scheduled At"      value={fmtDateTime(s.scheduledAt)} />
              <Divider />
              <MetaRow icon={<AccessTime />}      label="Duration"          value={`${s.durationMinutes} minutes`} />
              <Divider />
              <MetaRow icon={<People />}          label="Tutor"             value={s.TutorProfile?.fullName} />
              <Divider />
              <MetaRow icon={<Assignment />}      label="Course"            value={s.Course?.title} />
              <Divider />
              <MetaRow icon={<Visibility />}      label="Visibility"        value={s.visibility?.replace(/_/g, " ")} />
              <Divider />
              <MetaRow icon={<RadioButtonChecked />} label="Recording Status"
                value={
                  <Chip
                    label={s.recordingStatus || "pending"}
                    size="small"
                    sx={{
                      fontWeight: 700,
                      fontSize: 11,
                      bgcolor: s.recordingStatus === "ready" ? "#ECFDF5"
                               : s.recordingStatus === "failed" ? "#FEF2F2" : "#F1F5F9",
                      color: s.recordingStatus === "ready" ? GREEN
                               : s.recordingStatus === "failed" ? "#dc2626" : MUTED,
                    }}
                  />
                }
              />
              {s.recordingUrl && (
                <>
                  <Divider />
                  <Box sx={{ py: 1.25, display: "flex", gap: 1.5, alignItems: "center" }}>
                    <Typography sx={{ fontSize: 12, color: MUTED, fontWeight: 600 }}>Recording URL</Typography>
                    <CopyButton text={s.recordingUrl} label="Copy URL" />
                    <Button
                      size="small" variant="outlined"
                      href={s.recordingUrl} target="_blank"
                      startIcon={<OpenInNew sx={{ fontSize: 13 }} />}
                      sx={{ textTransform: "none", fontWeight: 700, fontSize: 12, borderColor: BORDER, color: NAVY, borderRadius: 2 }}
                    >
                      Open
                    </Button>
                  </Box>
                </>
              )}
              {s.cancellationReason && (
                <>
                  <Divider />
                  <Box sx={{ mt: 1.5, p: 2, bgcolor: "#FEF2F2", borderRadius: 2 }}>
                    <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#dc2626", mb: 0.5 }}>Cancellation Reason</Typography>
                    <Typography sx={{ fontSize: 13, color: TEXT }}>{s.cancellationReason}</Typography>
                  </Box>
                </>
              )}
              {s.description && (
                <>
                  <Divider />
                  <Box sx={{ mt: 1.5 }}>
                    <Typography sx={{ fontSize: 12, fontWeight: 700, color: MUTED, mb: 0.5 }}>Description</Typography>
                    <Typography sx={{ fontSize: 13.5, color: TEXT, lineHeight: 1.65 }}>{s.description}</Typography>
                  </Box>
                </>
              )}
            </Paper>
          </Grid>

          {/* Right: link panel */}
          <Grid item xs={12} md={5}>
            <SessionLinkPanel
                session={s}
                navigate={navigate}
                setToast={setToast}
            />
          </Grid>
        </Grid>

        {/* ══ TABS: ATTENDANCE ═══════════════════════════════════ */}
        <Box sx={{ borderBottom: `1px solid ${BORDER}`, mb: 3 }}>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            sx={{
              "& .MuiTab-root": { textTransform: "none", fontWeight: 700, color: MUTED, fontSize: 14 },
              "& .Mui-selected": { color: NAVY },
              "& .MuiTabs-indicator": { bgcolor: NAVY, height: 3, borderRadius: "3px 3px 0 0" },
            }}
          >
            <Tab label="Attendance Roster" icon={<People sx={{ fontSize: 17 }} />} iconPosition="start" />
          </Tabs>
        </Box>

        {tab === 0 && (
          <AttendanceTab sessionId={sessionId} setToast={setToast} onRefresh={load} />
        )}
      </Box>

      {/* ══ DIALOGS ════════════════════════════════════════════ */}
      <RescheduleDialog
        open={rescheduleOpen}
        onClose={() => setRescheduleOpen(false)}
        sessionId={sessionId}
        currentDate={s?.scheduledAt}
        durationMinutes={s?.durationMinutes}
        onSuccess={load}
        setToast={setToast}
      />

      <RecordingDialog
        open={recordingOpen}
        onClose={() => setRecordingOpen(false)}
        sessionId={sessionId}
        current={s}
        onSuccess={load}
        setToast={setToast}
      />

      {/* Generic action confirm */}
      <Dialog
        open={!!actionDialog} onClose={() => { setActionDialog(null); setActionReason(""); }}
        maxWidth="xs" fullWidth PaperProps={{ elevation: 0, sx: { borderRadius: 4, border: `1px solid ${BORDER}` } }}
      >
        {actionDialog && (() => {
          const cfg = ACTION_CFG[actionDialog];
          return (
            <>
              <DialogTitle sx={{ fontWeight: 800, color: TEXT }}>{cfg.title}</DialogTitle>
              <DialogContent>
                <Typography sx={{ color: MUTED, mb: cfg.needsReason ? 2 : 0, fontSize: 14 }}>
                  {actionDialog === "delete"
                    ? `Permanently delete "${s?.title}"? All attendance records will be erased. This cannot be undone.`
                    : `Confirm ${actionDialog === "force-end" ? "force-end" : "cancellation"} of "${s?.title}".`}
                </Typography>
                {cfg.needsReason && (
                  <TextField
                    fullWidth multiline rows={2} size="small" label="Reason (optional)"
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    sx={{ "& fieldset": { borderColor: BORDER } }}
                  />
                )}
              </DialogContent>
              <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                <Button onClick={() => { setActionDialog(null); setActionReason(""); }}
                  sx={{ textTransform: "none", color: MUTED }}>Cancel</Button>
                <Button variant="contained" disabled={actionLoading} onClick={handleAction}
                  sx={{ bgcolor: cfg.color, textTransform: "none", fontWeight: 700, borderRadius: 2.5 }}>
                  {actionLoading ? <CircularProgress size={18} color="inherit" /> : cfg.label}
                </Button>
              </DialogActions>
            </>
          );
        })()}
      </Dialog>

      {/* ══ TOAST ══════════════════════════════════════════════ */}
      <Snackbar open={!!toast} autoHideDuration={4500} onClose={() => setToast(null)} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <Alert severity={toast?.severity || "info"} onClose={() => setToast(null)} sx={{ borderRadius: 2 }}>
          {toast?.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
