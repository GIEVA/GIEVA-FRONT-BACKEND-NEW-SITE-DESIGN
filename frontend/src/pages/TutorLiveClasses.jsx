// pages/TutorLiveClasses.jsx

import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  Chip,
  Stack,
  CircularProgress,
  TextField,
  MenuItem,
  Divider,
  Alert,
} from "@mui/material";

import {
  PlayCircle,
  Videocam,
  CalendarMonth,
  AccessTime,
  People,
  Add,
  VideoCall,
  CheckCircle,
  Cancel,
  HourglassTop,
  ExpandMore,
  ExpandLess,
} from "@mui/icons-material";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getTutorSessions,
  scheduleClassSession,
} from "../services/classSessionService";

// ─────────────────────────────────────────────────────────────
const NAVY = "#0B1F3A";
const GREEN = "#1E7F4F";
const GOLD = "#D4A017";
const BG = "#F7F9FC";
const CARD = "#FFFFFF";
const BORDER = "#E6E9F0";
const TEXT = "#0F172A";
const MUTED = "#64748B";

// ─────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  live: { label: "LIVE", color: "#ef4444", bg: "rgba(239,68,68,0.12)", icon: <Videocam sx={{ fontSize: 13 }} /> },
  scheduled: { label: "Scheduled", color: GOLD, bg: "rgba(212,160,23,0.12)", icon: <HourglassTop sx={{ fontSize: 13 }} /> },
  ended: { label: "Ended", color: MUTED, bg: "#F1F5F9", icon: <CheckCircle sx={{ fontSize: 13 }} /> },
  cancelled: { label: "Cancelled", color: "#ef4444", bg: "#FEF2F2", icon: <Cancel sx={{ fontSize: 13 }} /> },
};

const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-NG", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });

const formatTime = (d) =>
  new Date(d).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" });

// ─────────────────────────────────────────────────────────────
// SESSION CARD
// ─────────────────────────────────────────────────────────────

const SessionCard = ({ session, navigate }) => {
  const cfg = STATUS_CONFIG[session.status] || STATUS_CONFIG.scheduled;
  const isLive = session.isLive;
  const isEnded = session.status === "ended" || session.status === "cancelled";

  return (
    <Paper
      elevation={0}
      sx={{
        border: `1px solid ${isLive ? "rgba(239,68,68,0.35)" : BORDER}`,
        borderRadius: 4,
        bgcolor: CARD,
        overflow: "hidden",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        transition: "box-shadow 0.2s, transform 0.2s",
        "&:hover": !isEnded && {
          boxShadow: "0 8px 28px rgba(15,23,42,0.08)",
          transform: "translateY(-2px)",
        },
      }}
    >
      {/* HEADER */}
      <Box
        sx={{
          px: 3,
          py: 2,
          background: isEnded
            ? "#F8FAFC"
            : "linear-gradient(135deg, #0B1F3A, #1E7F4F)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Chip
          icon={cfg.icon}
          label={cfg.label}
          size="small"
          sx={{
            bgcolor: cfg.bg,
            color: cfg.color,
            fontWeight: 800,
            border: `1px solid ${cfg.color}44`,
            "& .MuiChip-icon": { color: cfg.color },
            ...(isLive && {
              animation: "livePulse 1.5s ease-in-out infinite",
              "@keyframes livePulse": {
                "0%,100%": { boxShadow: "0 0 0 0 rgba(239,68,68,0.5)" },
                "50%": { boxShadow: "0 0 0 6px rgba(239,68,68,0)" },
              },
            }),
          }}
        />

        {session.recordingStatus === "ready" && (
          <Chip
            label="Recording ready"
            size="small"
            sx={{ bgcolor: "#EFF6FF", color: "#1D4ED8", fontWeight: 700, fontSize: 11 }}
          />
        )}
      </Box>

      {/* BODY */}
      <Box p={3} display="flex" flexDirection="column" flexGrow={1}>
        <Typography sx={{ fontSize: 18, fontWeight: 800, color: TEXT, mb: 0.5, lineHeight: 1.3 }}>
          {session.title}
        </Typography>

        <Typography sx={{ fontSize: 14, color: GREEN, fontWeight: 600, mb: 2 }}>
          {session.Course?.title}
        </Typography>

        <Stack spacing={1.25} mb={3}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CalendarMonth sx={{ fontSize: 16, color: MUTED }} />
            <Typography sx={{ fontSize: 13, color: MUTED }}>
              {formatDate(session.scheduledAt)}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <AccessTime sx={{ fontSize: 16, color: MUTED }} />
            <Typography sx={{ fontSize: 13, color: MUTED }}>
              {formatTime(session.scheduledAt)} · {session.durationMinutes} min
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <People sx={{ fontSize: 16, color: MUTED }} />
            <Typography sx={{ fontSize: 13, color: MUTED }}>
              {session.totalParticipants || 0} participant{session.totalParticipants !== 1 ? "s" : ""}
            </Typography>
          </Box>
        </Stack>

        {/* RECORDING STATUS */}
        {session.recordingStatus && session.recordingStatus !== "pending" && (
          <Chip
            label={`Recording: ${session.recordingStatus}`}
            size="small"
            sx={{ alignSelf: "flex-start", mb: 2, bgcolor: "#F1F5F9", color: MUTED, fontWeight: 600 }}
          />
        )}

        <Box mt="auto">
          <Button
            fullWidth
            variant="contained"
            startIcon={<PlayCircle />}
            disabled={isEnded}
            onClick={() =>
              navigate(`/live/${session.roomName}/${session.id}`, {
                state: { role: "tutor" },
              })
            }
            sx={{
              bgcolor: isLive ? "#ef4444" : NAVY,
              color: "#fff",
              textTransform: "none",
              fontWeight: 700,
              borderRadius: 2.5,
              py: 1.25,
              fontSize: 15,
              "&:hover": { bgcolor: isLive ? "#dc2626" : GREEN },
              "&.Mui-disabled": { bgcolor: "#F1F5F9", color: MUTED },
            }}
          >
            {isLive ? "Rejoin Session" : isEnded ? "Session Ended" : "Start Session"}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

// ─────────────────────────────────────────────────────────────
// SCHEDULE FORM
// ─────────────────────────────────────────────────────────────

const ScheduleForm = ({ onScheduled }) => {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    courseId: "",
    scheduledAt: "",
    durationMinutes: 60,
    visibility: "assigned_students",
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.courseId || !form.scheduledAt) {
      setError("Please fill in all required fields.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      await scheduleClassSession(form);
      setSuccess(true);
      setForm({ title: "", description: "", courseId: "", scheduledAt: "", durationMinutes: 60, visibility: "assigned_students" });
      onScheduled();
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to schedule session.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        border: `1px solid ${BORDER}`,
        borderRadius: 4,
        bgcolor: CARD,
        mb: 4,
        overflow: "hidden",
      }}
    >
      {/* TOGGLE HEADER */}
      <Box
        sx={{
          px: 3,
          py: 2.5,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
          userSelect: "none",
          "&:hover": { bgcolor: "#F8FAFC" },
        }}
        onClick={() => setOpen(!open)}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              bgcolor: "#F0FDF4",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: GREEN,
            }}
          >
            <Add />
          </Box>
          <Typography sx={{ fontWeight: 800, color: TEXT, fontSize: 16 }}>
            Schedule a New Session
          </Typography>
        </Box>
        {open ? <ExpandLess sx={{ color: MUTED }} /> : <ExpandMore sx={{ color: MUTED }} />}
      </Box>

      {open && (
        <>
          <Divider />
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ p: 3 }}
          >
            {success && (
              <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
                Session scheduled successfully! Students have been notified.
              </Alert>
            )}
            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            <Grid container spacing={2.5}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="Session Title"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="e.g. Introduction to Calculus"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="Course ID"
                  name="courseId"
                  value={form.courseId}
                  onChange={handleChange}
                  placeholder="Enter the course ID"
                  helperText="You can find this in your course list"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Description (optional)"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="What will you cover in this session?"
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  required
                  type="datetime-local"
                  label="Date & Time"
                  name="scheduledAt"
                  value={form.scheduledAt}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  select
                  label="Duration"
                  name="durationMinutes"
                  value={form.durationMinutes}
                  onChange={handleChange}
                >
                  {[30, 45, 60, 90, 120].map((d) => (
                    <MenuItem key={d} value={d}>
                      {d} minutes
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  select
                  label="Visibility"
                  name="visibility"
                  value={form.visibility}
                  onChange={handleChange}
                >
                  <MenuItem value="assigned_students">Assigned students only</MenuItem>
                  <MenuItem value="course_students">All course students</MenuItem>
                  <MenuItem value="private">Private (invite only)</MenuItem>
                </TextField>
              </Grid>
            </Grid>

            <Box sx={{ display: "flex", gap: 2, mt: 3 }}>
              <Button
                type="submit"
                variant="contained"
                disabled={saving}
                startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <VideoCall />}
                sx={{
                  bgcolor: NAVY,
                  textTransform: "none",
                  fontWeight: 700,
                  borderRadius: 2.5,
                  px: 3,
                  "&:hover": { bgcolor: GREEN },
                }}
              >
                {saving ? "Scheduling..." : "Schedule Session"}
              </Button>

              <Button
                onClick={() => setOpen(false)}
                variant="outlined"
                sx={{
                  textTransform: "none",
                  borderRadius: 2.5,
                  borderColor: BORDER,
                  color: MUTED,
                }}
              >
                Cancel
              </Button>
            </Box>
          </Box>
        </>
      )}
    </Paper>
  );
};

// ─────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────

export default function TutorLiveClasses() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await getTutorSessions();
      setSessions(res.sessions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const FILTERS = [
    { key: "all", label: "All" },
    { key: "live", label: "Live Now" },
    { key: "scheduled", label: "Upcoming" },
    { key: "ended", label: "Past" },
  ];

  const filtered =
    filter === "all"
      ? sessions
      : filter === "live"
      ? sessions.filter((s) => s.isLive)
      : sessions.filter((s) => s.status === filter);

  const liveSessions = sessions.filter((s) => s.isLive);

  const statSummary = {
    total: sessions.length,
    live: liveSessions.length,
    upcoming: sessions.filter((s) => s.status === "scheduled").length,
    ended: sessions.filter((s) => s.status === "ended").length,
    participants: sessions.reduce((a, s) => a + (s.totalParticipants || 0), 0),
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh", bgcolor: BG }}>
        <CircularProgress sx={{ color: GREEN }} />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: BG }}>
      <Box sx={{ maxWidth: 1280, mx: "auto", px: { xs: 2, sm: 3, md: 5 }, py: { xs: 3, md: 5 } }}>

        {/* HEADER */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: 5,
            mb: 4,
            overflow: "hidden",
            background: "linear-gradient(135deg, #0B1F3A, #1E7F4F)",
            color: "#fff",
            p: { xs: 3, md: 4 },
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" gap={2} flexWrap="wrap">
            <Box>
              <Typography sx={{ fontSize: { xs: 22, md: 28 }, fontWeight: 800 }}>
                Live Classes
              </Typography>
              <Typography sx={{ fontSize: 14, opacity: 0.85, mt: 0.5 }}>
                Manage and host your live teaching sessions
              </Typography>
            </Box>

            {liveSessions.length > 0 && (
              <Chip
                icon={<Videocam />}
                label={`${liveSessions.length} Session${liveSessions.length > 1 ? "s" : ""} Live`}
                sx={{
                  bgcolor: "rgba(239,68,68,0.2)",
                  color: "#fca5a5",
                  fontWeight: 800,
                  border: "1px solid rgba(239,68,68,0.35)",
                  animation: "pulse 1.5s infinite",
                  "@keyframes pulse": {
                    "0%,100%": { boxShadow: "0 0 0 0 rgba(239,68,68,0.4)" },
                    "50%": { boxShadow: "0 0 0 8px rgba(239,68,68,0)" },
                  },
                  "& .MuiChip-icon": { color: "#f87171" },
                }}
              />
            )}
          </Box>
        </Paper>

        {/* STATS ROW */}
        <Grid container spacing={2.5} mb={4}>
          {[
            { label: "Total Sessions", value: statSummary.total, color: NAVY },
            { label: "Live Now", value: statSummary.live, color: "#ef4444" },
            { label: "Upcoming", value: statSummary.upcoming, color: GOLD },
            { label: "Completed", value: statSummary.ended, color: GREEN },
            { label: "Total Participants", value: statSummary.participants, color: "#7C3AED" },
          ].map((s) => (
            <Grid item xs={6} sm={4} md key={s.label}>
              <Paper
                elevation={0}
                sx={{
                  border: `1px solid ${BORDER}`,
                  borderRadius: 3,
                  p: 2.5,
                  bgcolor: CARD,
                  textAlign: "center",
                }}
              >
                <Typography sx={{ fontSize: 26, fontWeight: 800, color: s.color }}>
                  {s.value}
                </Typography>
                <Typography sx={{ fontSize: 12, color: MUTED, fontWeight: 600 }}>
                  {s.label}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* SCHEDULE FORM */}
        <ScheduleForm onScheduled={fetchSessions} />

        {/* FILTER TABS */}
        <Box sx={{ display: "flex", gap: 1, mb: 4, flexWrap: "wrap" }}>
          {FILTERS.map((f) => {
            const count =
              f.key === "all"
                ? sessions.length
                : f.key === "live"
                ? liveSessions.length
                : sessions.filter((s) => s.status === f.key).length;

            return (
              <Button
                key={f.key}
                onClick={() => setFilter(f.key)}
                variant={filter === f.key ? "contained" : "outlined"}
                size="small"
                sx={{
                  textTransform: "none",
                  borderRadius: 3,
                  fontWeight: 700,
                  borderColor: BORDER,
                  color: filter === f.key ? "#fff" : MUTED,
                  bgcolor: filter === f.key ? NAVY : "transparent",
                }}
              >
                {f.label}
                {count > 0 && (
                  <Chip
                    label={count}
                    size="small"
                    sx={{
                      ml: 0.75,
                      height: 18,
                      fontSize: 11,
                      fontWeight: 800,
                      bgcolor: filter === f.key ? "rgba(255,255,255,0.2)" : "#F1F5F9",
                      color: filter === f.key ? "#fff" : MUTED,
                    }}
                  />
                )}
              </Button>
            );
          })}
        </Box>

        {/* SESSION GRID */}
        {filtered.length > 0 ? (
          <Grid container spacing={3}>
            {filtered.map((session) => (
              <Grid item xs={12} sm={6} lg={4} key={session.id}>
                <SessionCard session={session} navigate={navigate} />
              </Grid>
            ))}
          </Grid>
        ) : (
          <Paper
            elevation={0}
            sx={{
              border: `1px solid ${BORDER}`,
              borderRadius: 4,
              p: 6,
              textAlign: "center",
              bgcolor: CARD,
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                bgcolor: "#F1F5F9",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 2,
              }}
            >
              <VideoCall sx={{ fontSize: 30, color: MUTED }} />
            </Box>
            <Typography sx={{ fontWeight: 700, color: TEXT, mb: 0.5 }}>
              No sessions yet
            </Typography>
            <Typography sx={{ fontSize: 14, color: MUTED }}>
              Use the form above to schedule your first live class.
            </Typography>
          </Paper>
        )}
      </Box>
    </Box>
  );
}
