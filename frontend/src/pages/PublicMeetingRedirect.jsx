// pages/PublicMeetingRedirect.jsx
//
// Route: /public-meet/:roomName  (add to App.jsx WITHOUT ProtectedRoute)
//
// Resolves a shared public meeting link → redirects to LiveClassroom.
// Uses publicMeetingService.resolvePublicMeetingLink which internally
// uses an unauthenticated axios instance, so guests with no token
// can reach this page without hitting a 401.

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Typography, CircularProgress, Button } from "@mui/material";
import { resolvePublicMeetingLink } from "../services/publicMeetingService";

const GREEN = "#1E7F4F";
const DARK  = "#0f172a";
const TEXT  = "#f1f5f9";
const MUTED = "#94a3b8";

export default function PublicMeetingRedirect() {
  const { roomName } = useParams();
  const navigate     = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    if (!roomName) { setError("Invalid meeting link."); return; }

    resolvePublicMeetingLink(roomName)
      .then(({ session }) => {
        if (session.status === "ended" || session.status === "cancelled") {
          setError(`This meeting has already ${session.status}.`);
          return;
        }
        navigate(`/live/${roomName}/${session.id}`, {
          replace: true,
          state: { role: "student" },
        });
      })
      .catch((err) => {
        setError(err?.response?.data?.message || "Meeting link not found or has expired.");
      });
  }, [roomName, navigate]);

  if (error) {
    return (
      <Box sx={{ height: "100vh", bgcolor: DARK, display: "flex", flexDirection: "column",
                 alignItems: "center", justifyContent: "center", gap: 3, px: 3 }}>
        <Box sx={{ fontSize: 52 }}>🔗</Box>
        <Typography sx={{ color: TEXT, fontSize: 22, fontWeight: 800, textAlign: "center" }}>
          Meeting not found
        </Typography>
        <Typography sx={{ color: MUTED, fontSize: 14, textAlign: "center", maxWidth: 360 }}>
          {error}
        </Typography>
        <Button variant="outlined" onClick={() => navigate("/")}
          sx={{ borderColor: "rgba(255,255,255,0.2)", color: MUTED, textTransform: "none",
                borderRadius: 2, "&:hover": { borderColor: GREEN, color: GREEN } }}>
          Go to Home
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ height: "100vh", bgcolor: DARK, display: "flex", flexDirection: "column",
               alignItems: "center", justifyContent: "center", gap: 2 }}>
      <CircularProgress sx={{ color: GREEN }} size={44} />
      <Typography sx={{ color: TEXT, fontWeight: 700, fontSize: 17 }}>Loading meeting…</Typography>
      <Typography sx={{ color: MUTED, fontSize: 13 }}>Please wait a moment.</Typography>
    </Box>
  );
}
