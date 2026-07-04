// pages/PublicMeetingRedirect.jsx
//
// Handles the /public-meet/:roomName URL that the backend puts in
// every public meeting's joinLink. Its only job is to look up the
// sessionId for this roomName, then redirect to the real LiveClassroom
// route (/live/:roomName/:sessionId).
//
// This is a separate page (not a raw <Navigate>) because:
//   1. The lookup is async — we need a loading state.
//   2. Unauthenticated guests land here directly from a shared link.
//      The GuestGate prompt in LiveClassroom handles them once they
//      reach /live/:roomName/:sessionId — we don't need to worry
//      about auth here at all.
//   3. If the link is invalid/expired we show a clear error instead
//      of a blank page.
//
// ── Route to add in App.jsx ──────────────────────────────────
//   <Route path="/public-meet/:roomName" element={<PublicMeetingRedirect />} />
//
// Place it OUTSIDE any ProtectedRoute wrapper — public meeting links
// must be reachable by unauthenticated guests.

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

import {
  Box, Typography, CircularProgress, Button, Paper,
} from "@mui/material";

import { ErrorOutline, Videocam } from "@mui/icons-material";

const GREEN = "#1E7F4F";
const NAVY  = "#0B1F3A";
const DARK  = "#0f172a";
const TEXT  = "#f1f5f9";
const MUTED = "#94a3b8";

// Use a plain axios instance — guests have no token, and we don't
// want the authenticated API instance's interceptors redirecting
// them to /login just because there's no Bearer token.
const PLAIN = axios.create({ baseURL: "https://gieva-front-backend-new-site-design-production.up.railway.app" });

export default function PublicMeetingRedirect() {
  const { roomName } = useParams();
  const navigate     = useNavigate();

  const [error, setError] = useState("");

  useEffect(() => {
    if (!roomName) { setError("Invalid meeting link."); return; }

    PLAIN.get(`/api/session/public-meetings/resolve/${roomName}`)
      .then(({ data }) => {
        const sessionId = data?.session?.id;
        if (!sessionId) { setError("Meeting not found."); return; }

        // Redirect to LiveClassroom with the resolved sessionId.
        // Replace so the back button doesn't loop back here.
        navigate(`/live/${roomName}/${sessionId}`, { replace: true });
      })
      .catch((err) => {
        const msg = err?.response?.data?.message;
        if (err?.response?.status === 404 || msg?.toLowerCase().includes("not found")) {
          setError("This meeting link is invalid or has expired.");
        } else {
          setError(msg || "Could not load meeting. Please try again.");
        }
      });
  }, [roomName, navigate]);

  // ── Loading state ──────────────────────────────────────────
  if (!error) {
    return (
      <Box sx={{
        height: "100vh", bgcolor: DARK,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 2,
      }}>
        <Box sx={{
          width: 64, height: 64, borderRadius: "50%",
          bgcolor: `${GREEN}22`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Videocam sx={{ fontSize: 32, color: GREEN }} />
        </Box>
        <CircularProgress sx={{ color: GREEN }} size={32} />
        <Typography sx={{ color: TEXT, fontWeight: 700, fontSize: 17 }}>
          Loading meeting…
        </Typography>
        <Typography sx={{ color: MUTED, fontSize: 14 }}>
          Please wait a moment
        </Typography>
      </Box>
    );
  }

  // ── Error state ────────────────────────────────────────────
  return (
    <Box sx={{
      height: "100vh", bgcolor: DARK,
      display: "flex", alignItems: "center", justifyContent: "center",
      px: 3,
    }}>
      <Paper elevation={0} sx={{
        maxWidth: 400, width: "100%", p: 4, borderRadius: 3,
        bgcolor: "#1e293b", textAlign: "center",
        border: "1px solid rgba(255,255,255,0.08)",
      }}>
        <ErrorOutline sx={{ fontSize: 48, color: "#ef4444", mb: 2 }} />
        <Typography sx={{ color: TEXT, fontWeight: 800, fontSize: 18, mb: 1 }}>
          Meeting not found
        </Typography>
        <Typography sx={{ color: MUTED, fontSize: 14, mb: 3, lineHeight: 1.6 }}>
          {error}
        </Typography>
        <Button variant="contained" onClick={() => navigate("/")}
          sx={{
            bgcolor: GREEN, color: "#fff", textTransform: "none",
            fontWeight: 700, borderRadius: 2, px: 3,
            "&:hover": { bgcolor: "#166d3e" },
          }}>
          Go to Home
        </Button>
      </Paper>
    </Box>
  );
}
