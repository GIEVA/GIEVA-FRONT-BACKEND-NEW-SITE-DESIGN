// pages/WebinarJoin.jsx   Route: /webinar/:id   (this is the link you share)
// Shows the details and your role, then sends you into the live room. If the host has not started yet
// it keeps checking every 10 seconds and lets you in as soon as they start.
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Box, Typography, Button, Chip, CircularProgress, Alert, Paper } from "@mui/material";
import { Videocam, Schedule } from "@mui/icons-material";
import { getWebinar, joinWebinar } from "../services/webinarService";

const NAVY = "#0B1F3A";
const GREEN = "#1E7F4F";
const GOLD = "#D4A017";
const ROLE = { host: "Host", alt_host: "Alternative host", cohost: "Co-host", panelist: "Panelist", attendee: "Attendee" };

export default function WebinarJoin() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [waiting, setWaiting] = useState(false);
  const timer = useRef();

  useEffect(() => {
    if (!localStorage.getItem("token")) { navigate(`/login`, { replace: true, state: { from: `/webinar/${id}` } }); return; }
    getWebinar(id).then(setData).catch((e) => setError(e?.response?.data?.message || "Webinar not found"));
    return () => clearTimeout(timer.current);
  }, [id, navigate]);

  const enter = useCallback(async () => {
    try {
      setNote("");
      await joinWebinar(id); // dry run: tells us right away if we may enter (the room fetches its own token)
      navigate(`/live/${data.webinar.roomName}/${id}`, { state: { role: data.canHost || data.myRole === "cohost" ? "host" : "student" } });
    } catch (e) {
      if (e?.response?.data?.code === "NOT_STARTED") {
        setWaiting(true); setNote("Waiting for the host to start. You will be let in automatically.");
        timer.current = setTimeout(enter, 10000);
      } else {
        setWaiting(false); setNote(e?.response?.data?.message || "Could not join");
      }
    }
  }, [id, data, navigate]);

  if (error) return <Box sx={{ p: 6, textAlign: "center" }}><Alert severity="error" sx={{ display: "inline-flex" }}>{error}</Alert></Box>;
  if (!data) return <Box sx={{ p: 8, textAlign: "center" }}><CircularProgress /></Box>;

  const w = data.webinar;
  const ended = ["ended", "cancelled"].includes(w.status);
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#F1F5F9", display: "grid", placeItems: "center", p: 2 }}>
      <Paper sx={{ p: { xs: 3, sm: 5 }, borderRadius: 5, maxWidth: 560, width: "100%" }} elevation={0}>
        <Chip label="WEBINAR" size="small" sx={{ bgcolor: NAVY, color: "#fff", fontWeight: 800, mb: 2 }} />
        <Typography sx={{ fontWeight: 900, fontSize: 26, color: NAVY, lineHeight: 1.2 }}>{w.title}</Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "text.secondary", mt: 1.5 }}>
          <Schedule fontSize="small" />
          <Typography sx={{ fontSize: 14 }}>{new Date(w.scheduledAt).toLocaleString("en-NG", { dateStyle: "full", timeStyle: "short" })} · {w.durationMinutes} min</Typography>
        </Box>
        {w.description && <Typography sx={{ mt: 2, color: "text.secondary", whiteSpace: "pre-wrap" }}>{w.description}</Typography>}
        {!!w.team?.length && (
          <Typography sx={{ mt: 2, fontSize: 13.5 }}>
            <b>Hosted by:</b> {w.team.filter((m) => ["host", "cohost", "alt_host"].includes(m.role)).map((m) => m.name).join(", ")}
            {w.team.some((m) => m.role === "panelist") && <> · <b>Panelists:</b> {w.team.filter((m) => m.role === "panelist").map((m) => m.name).join(", ")}</>}
          </Typography>
        )}
        <Box sx={{ mt: 2 }}><Chip size="small" label={`You join as: ${ROLE[data.myRole]}`} sx={{ bgcolor: `${GOLD}22`, fontWeight: 800 }} /></Box>
        {note && <Alert severity={waiting ? "info" : "warning"} sx={{ mt: 2 }}>{note}</Alert>}
        <Button fullWidth size="large" variant="contained" disableElevation disabled={ended || waiting} onClick={enter}
          startIcon={waiting ? <CircularProgress size={18} color="inherit" /> : <Videocam />}
          sx={{ mt: 3, textTransform: "none", fontWeight: 800, borderRadius: 3, bgcolor: GREEN, py: 1.4, "&:hover": { bgcolor: "#166d3e" } }}>
          {ended ? (w.status === "cancelled" ? "Cancelled" : "This webinar has ended") : waiting ? "Waiting for the host" : ["host", "alt_host", "cohost"].includes(data.myRole) ? "Start / join webinar" : "Join webinar"}
        </Button>
      </Paper>
    </Box>
  );
}
