// pages/StudentLiveClasses.jsx

import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  Chip,
  Stack,
  Avatar,
  CircularProgress,
  Divider,
} from "@mui/material";

import {
  PlayCircle,
  Videocam,
  CalendarMonth,
  AccessTime,
  SchoolOutlined,
  Person,
  HourglassTop,
  CheckCircle,
  Cancel,
} from "@mui/icons-material";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getStudentSessions } from "../services/classSessionService";

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
  live: {
    label: "LIVE NOW",
    color: "#ef4444",
    bg: "rgba(239,68,68,0.1)",
    icon: <Videocam sx={{ fontSize: 14 }} />,
    pulse: true,
  },
  scheduled: {
    label: "Scheduled",
    color: GOLD,
    bg: "rgba(212,160,23,0.1)",
    icon: <HourglassTop sx={{ fontSize: 14 }} />,
    pulse: false,
  },
  ended: {
    label: "Ended",
    color: MUTED,
    bg: "#F1F5F9",
    icon: <CheckCircle sx={{ fontSize: 14 }} />,
    pulse: false,
  },
  cancelled: {
    label: "Cancelled",
    color: "#ef4444",
    bg: "#FEF2F2",
    icon: <Cancel sx={{ fontSize: 14 }} />,
    pulse: false,
  },
};

const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-NG", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const formatTime = (d) =>
  new Date(d).toLocaleTimeString("en-NG", {
    hour: "2-digit",
    minute: "2-digit",
  });

const SessionCard = ({ session, navigate }) => {
  const cfg = STATUS_CONFIG[session.status] || STATUS_CONFIG.scheduled;
  const isLive = session.status === "live";
  const isEnded = session.status === "ended" || session.status === "cancelled";
  const tutorName =
    session.TutorProfile?.fullName ||
    session.TutorProfile?.User?.fullName ||
    "Your Tutor";

  return (
    <Paper
      elevation={0}
      sx={{
        border: `1px solid ${isLive ? "rgba(239,68,68,0.4)" : BORDER}`,
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
      {/* HEADER BAND */}
      <Box
        sx={{
          px: 3,
          py: 2,
          background: isLive
            ? "linear-gradient(135deg, #0B1F3A, #1a3a5c)"
            : isEnded
            ? "#F8FAFC"
            : "linear-gradient(135deg, #0B1F3A, #1E7F4F)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
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
            ...(cfg.pulse && {
              animation: "livePulse 1.5s ease-in-out infinite",
              "@keyframes livePulse": {
                "0%, 100%": { boxShadow: `0 0 0 0 ${cfg.color}55` },
                "50%": { boxShadow: `0 0 0 6px ${cfg.color}00` },
              },
            }),
          }}
        />

        <Typography sx={{ fontSize: 13, color: isEnded ? MUTED : "rgba(255,255,255,0.6)", fontWeight: 600 }}>
          {session.durationMinutes} min
        </Typography>
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
              {formatTime(session.scheduledAt)}
            </Typography>
          </Box>

          {tutorName && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Person sx={{ fontSize: 16, color: MUTED }} />
              <Typography sx={{ fontSize: 13, color: MUTED }}>
                {tutorName}
              </Typography>
            </Box>
          )}
        </Stack>

        {/* PARTICIPANTS */}
        {session.totalParticipants > 0 && (
          <Typography sx={{ fontSize: 12, color: MUTED, mb: 2 }}>
            {session.totalParticipants} participant{session.totalParticipants !== 1 ? "s" : ""} attended
          </Typography>
        )}

        <Box mt="auto">
          <Button
            fullWidth
            variant="contained"
            startIcon={<PlayCircle />}
            disabled={!isLive}
            onClick={() =>
              navigate(`/live/${session.roomName}/${session.id}`, {
                state: { role: "student" },
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
              "&.Mui-disabled": {
                bgcolor: "#F1F5F9",
                color: MUTED,
              },
            }}
          >
            {isLive
              ? "Join Now"
              : session.status === "ended"
              ? "Session Ended"
              : session.status === "cancelled"
              ? "Cancelled"
              : "Waiting for Host"}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default function StudentLiveClasses() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await getStudentSessions();
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
      : sessions.filter((s) => s.status === filter);

  const liveSessions = sessions.filter((s) => s.status === "live");

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
                My Live Classes
              </Typography>
              <Typography sx={{ fontSize: 14, opacity: 0.85, mt: 0.5 }}>
                {sessions.length} session{sessions.length !== 1 ? "s" : ""} across your enrolled courses
              </Typography>
            </Box>

            {liveSessions.length > 0 && (
              <Chip
                icon={<Videocam />}
                label={`${liveSessions.length} Live Now`}
                sx={{
                  bgcolor: "rgba(239,68,68,0.25)",
                  color: "#fca5a5",
                  fontWeight: 800,
                  border: "1px solid rgba(239,68,68,0.4)",
                  animation: "livePulse 1.5s ease-in-out infinite",
                  "@keyframes livePulse": {
                    "0%, 100%": { boxShadow: "0 0 0 0 rgba(239,68,68,0.4)" },
                    "50%": { boxShadow: "0 0 0 8px rgba(239,68,68,0)" },
                  },
                  "& .MuiChip-icon": { color: "#f87171" },
                }}
              />
            )}
          </Box>
        </Paper>

        {/* FILTER TABS */}
        <Box sx={{ display: "flex", gap: 1, mb: 4, flexWrap: "wrap" }}>
          {FILTERS.map((f) => {
            const count =
              f.key === "all"
                ? sessions.length
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
                  "&:hover": { borderColor: NAVY, color: NAVY, bgcolor: "transparent" },
                  ...(filter === f.key && { "&:hover": { bgcolor: GREEN } }),
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

        {/* SESSIONS GRID */}
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
              <SchoolOutlined sx={{ fontSize: 30, color: MUTED }} />
            </Box>
            <Typography sx={{ fontWeight: 700, color: TEXT, mb: 0.5 }}>
              No sessions found
            </Typography>
            <Typography sx={{ fontSize: 14, color: MUTED }}>
              {filter === "all"
                ? "Your tutors haven't scheduled any live classes yet."
                : `No ${filter} sessions right now.`}
            </Typography>
          </Paper>
        )}
      </Box>
    </Box>
  );
}
