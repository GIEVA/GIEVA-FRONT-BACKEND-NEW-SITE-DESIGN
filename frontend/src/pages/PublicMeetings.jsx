// pages/PublicMeetings.jsx
// Browse open public meetings and request to join — no course
// enrollment required. Mirrors StudentLiveClasses.jsx's visual
// language so it feels native to the rest of the app.

import {
  Box, Typography, Grid, Paper, Button, Chip, Stack,
  CircularProgress, TextField, InputAdornment,
} from "@mui/material";

import {
  PlayCircle, Videocam, CalendarMonth, AccessTime,
  Public, HourglassTop, CheckCircle, Search, Link as LinkIcon,
} from "@mui/icons-material";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  listPublicMeetings,
  resolvePublicMeetingLink,
} from "../services/publicMeetingService";

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

const STATUS_CONFIG = {
  live: {
    label: "LIVE NOW", color: "#ef4444", bg: "rgba(239,68,68,0.1)",
    icon: <Videocam sx={{ fontSize: 14 }} />, pulse: true,
  },
  scheduled: {
    label: "Scheduled", color: GOLD, bg: "rgba(212,160,23,0.1)",
    icon: <HourglassTop sx={{ fontSize: 14 }} />, pulse: false,
  },
  ended: {
    label: "Ended", color: MUTED, bg: "#F1F5F9",
    icon: <CheckCircle sx={{ fontSize: 14 }} />, pulse: false,
  },
};

const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
const formatTime = (d) =>
  new Date(d).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" });

const MeetingCard = ({ meeting, navigate }) => {
  const cfg    = STATUS_CONFIG[meeting.status] || STATUS_CONFIG.scheduled;
  const isLive = meeting.status === "live" || meeting.isLive;

  return (
    <Paper
      elevation={0}
      sx={{
        border: `1px solid ${isLive ? "rgba(239,68,68,0.4)" : BORDER}`,
        borderRadius: 4, bgcolor: CARD, overflow: "hidden",
        height: "100%", display: "flex", flexDirection: "column",
        transition: "box-shadow 0.2s, transform 0.2s",
        "&:hover": { boxShadow: "0 8px 28px rgba(15,23,42,0.08)", transform: "translateY(-2px)" },
      }}
    >
      <Box sx={{
        px: 3, py: 2,
        background: isLive
          ? "linear-gradient(135deg, #0B1F3A, #1a3a5c)"
          : "linear-gradient(135deg, #0B1F3A, #1E7F4F)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <Chip
          icon={cfg.icon} label={cfg.label} size="small"
          sx={{
            bgcolor: cfg.bg, color: cfg.color, fontWeight: 800,
            border: `1px solid ${cfg.color}44`, "& .MuiChip-icon": { color: cfg.color },
            ...(cfg.pulse && {
              animation: "livePulse 1.5s ease-in-out infinite",
              "@keyframes livePulse": {
                "0%, 100%": { boxShadow: `0 0 0 0 ${cfg.color}55` },
                "50%":      { boxShadow: `0 0 0 6px ${cfg.color}00` },
              },
            }),
          }}
        />
        <Chip
          icon={<Public sx={{ fontSize: 13 }} />} label="Public" size="small"
          sx={{ bgcolor: "rgba(255,255,255,0.15)", color: "#fff", fontWeight: 700, fontSize: 11,
                "& .MuiChip-icon": { color: "#fff" } }}
        />
      </Box>

      <Box p={3} display="flex" flexDirection="column" flexGrow={1}>
        <Typography sx={{ fontSize: 18, fontWeight: 800, color: TEXT, mb: 0.5, lineHeight: 1.3 }}>
          {meeting.title}
        </Typography>

        {meeting.description && (
          <Typography sx={{ fontSize: 13, color: MUTED, mb: 2, lineHeight: 1.5 }}>
            {meeting.description.length > 90 ? `${meeting.description.slice(0, 90)}…` : meeting.description}
          </Typography>
        )}

        <Stack spacing={1.25} mb={3}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CalendarMonth sx={{ fontSize: 16, color: MUTED }} />
            <Typography sx={{ fontSize: 13, color: MUTED }}>{formatDate(meeting.scheduledAt)}</Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <AccessTime sx={{ fontSize: 16, color: MUTED }} />
            <Typography sx={{ fontSize: 13, color: MUTED }}>
              {formatTime(meeting.scheduledAt)} · {meeting.durationMinutes} min
            </Typography>
          </Box>
          {meeting.scheduler?.fullName && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Public sx={{ fontSize: 16, color: MUTED }} />
              <Typography sx={{ fontSize: 13, color: MUTED }}>
                Hosted by {meeting.scheduler.fullName}
              </Typography>
            </Box>
          )}
        </Stack>

        <Box mt="auto">
          <Button
            fullWidth variant="contained" startIcon={<PlayCircle />}
            disabled={meeting.status === "ended"}
            onClick={() =>
              navigate(`/live/${meeting.roomName}/${meeting.id}`, { state: { role: "student" } })
            }
            sx={{
              bgcolor: isLive ? "#ef4444" : NAVY, color: "#fff", textTransform: "none",
              fontWeight: 700, borderRadius: 2.5, py: 1.25, fontSize: 15,
              "&:hover": { bgcolor: isLive ? "#dc2626" : GREEN },
              "&.Mui-disabled": { bgcolor: "#F1F5F9", color: MUTED },
            }}
          >
            {isLive ? "Request to Join" : meeting.status === "ended" ? "Meeting Ended" : "Request to Join"}
          </Button>
          {!isLive && meeting.status !== "ended" && (
            <Typography sx={{ fontSize: 11.5, color: MUTED, mt: 1, textAlign: "center" }}>
              You'll wait in the lobby until the host starts the meeting
            </Typography>
          )}
        </Box>
      </Box>
    </Paper>
  );
};

export default function PublicMeetings() {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [linkInput, setLinkInput] = useState("");
  const [resolving, setResolving] = useState(false);
  const [linkError, setLinkError] = useState("");

  useEffect(() => { fetchMeetings(); }, []);

  const fetchMeetings = async () => {
    try {
      const res = await listPublicMeetings();
      setMeetings(res.meetings || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Lets someone paste a full join link or just the room name and
  // jump straight to the meeting, mirroring Zoom/Meet's "enter a
  // meeting code/link" pattern.
  const handleJoinByLink = async (e) => {
    e.preventDefault();
    if (!linkInput.trim()) return;
    setLinkError("");

    // Extract the roomName whether they pasted a full URL or just the code
    const trimmed  = linkInput.trim();
    const roomName = trimmed.includes("/")
      ? trimmed.split("/").filter(Boolean).pop()
      : trimmed;

    try {
      setResolving(true);
      const res = await resolvePublicMeetingLink(roomName);
      navigate(`/live/${roomName}/${res.session.id}`, { state: { role: "student" } });
    } catch (err) {
      setLinkError(err?.response?.data?.message || "Meeting link not found");
    } finally {
      setResolving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh", bgcolor: BG }}>
        <CircularProgress sx={{ color: GREEN }} />
      </Box>
    );
  }

  const liveMeetings = meetings.filter((m) => m.status === "live" || m.isLive);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: BG }}>
      <Box sx={{ maxWidth: 1280, mx: "auto", px: { xs: 2, sm: 3, md: 5 }, py: { xs: 3, md: 5 } }}>

        {/* HEADER */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: 5, mb: 4, overflow: "hidden",
            background: "linear-gradient(135deg, #0B1F3A, #1E7F4F)",
            color: "#fff", p: { xs: 3, md: 4 },
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" gap={2} flexWrap="wrap">
            <Box>
              <Typography sx={{ fontSize: { xs: 22, md: 28 }, fontWeight: 800 }}>
                Public Meetings
              </Typography>
              <Typography sx={{ fontSize: 14, opacity: 0.85, mt: 0.5 }}>
                Open sessions anyone can request to join — no enrollment needed
              </Typography>
            </Box>

            {liveMeetings.length > 0 && (
              <Chip
                icon={<Videocam />} label={`${liveMeetings.length} Live Now`}
                sx={{
                  bgcolor: "rgba(239,68,68,0.25)", color: "#fca5a5", fontWeight: 800,
                  border: "1px solid rgba(239,68,68,0.4)",
                  animation: "livePulse 1.5s ease-in-out infinite",
                  "@keyframes livePulse": {
                    "0%, 100%": { boxShadow: "0 0 0 0 rgba(239,68,68,0.4)" },
                    "50%":      { boxShadow: "0 0 0 8px rgba(239,68,68,0)" },
                  },
                  "& .MuiChip-icon": { color: "#f87171" },
                }}
              />
            )}
          </Box>
        </Paper>

        {/* JOIN BY LINK */}
        <Paper
          elevation={0}
          component="form"
          onSubmit={handleJoinByLink}
          sx={{ border: `1px solid ${BORDER}`, borderRadius: 4, p: 3, mb: 4, bgcolor: CARD }}
        >
          <Typography sx={{ fontWeight: 800, color: TEXT, fontSize: 15, mb: 1.5 }}>
            Have a meeting link or code?
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <TextField
              fullWidth size="small" placeholder="Paste a meeting link or code"
              value={linkInput} onChange={(e) => setLinkInput(e.target.value)}
              error={!!linkError} helperText={linkError || " "}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LinkIcon sx={{ fontSize: 18, color: MUTED }} />
                  </InputAdornment>
                ),
              }}
              sx={{ "& fieldset": { borderColor: BORDER } }}
            />
            <Button
              type="submit" variant="contained" disabled={resolving || !linkInput.trim()}
              startIcon={resolving ? <CircularProgress size={16} color="inherit" /> : null}
              sx={{ bgcolor: NAVY, textTransform: "none", fontWeight: 700, borderRadius: 2.5,
                    px: 3, height: 40, "&:hover": { bgcolor: GREEN } }}
            >
              {resolving ? "Finding…" : "Join"}
            </Button>
          </Stack>
        </Paper>

        {/* MEETINGS GRID */}
        {meetings.length > 0 ? (
          <Grid container spacing={3}>
            {meetings.map((meeting) => (
              <Grid item xs={12} sm={6} lg={4} key={meeting.id}>
                <MeetingCard meeting={meeting} navigate={navigate} />
              </Grid>
            ))}
          </Grid>
        ) : (
          <Paper
            elevation={0}
            sx={{ border: `1px solid ${BORDER}`, borderRadius: 4, p: 6, textAlign: "center", bgcolor: CARD }}
          >
            <Box sx={{
              width: 64, height: 64, borderRadius: "50%", bgcolor: "#F1F5F9",
              display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 2,
            }}>
              <Search sx={{ fontSize: 30, color: MUTED }} />
            </Box>
            <Typography sx={{ fontWeight: 700, color: TEXT, mb: 0.5 }}>
              No public meetings right now
            </Typography>
            <Typography sx={{ fontSize: 14, color: MUTED }}>
              Check back later, or use a meeting link above if someone shared one with you.
            </Typography>
          </Paper>
        )}
      </Box>
    </Box>
  );
}
