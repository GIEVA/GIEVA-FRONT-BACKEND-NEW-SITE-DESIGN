// pages/PanelistQuizPage.jsx
//
// Panelist-facing live dashboard. Requires login (route wrapped in
// ProtectedRoute) — panelists are platform staff accounts, not
// anonymous link-clickers like participants/audience. Resolves the
// eventCode in the URL to a numeric eventId, then polls the same
// dashboard data the admin's Live Control panel uses, minus any
// action buttons.

import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
  Box, Typography, Paper, Chip, Table, TableHead,
  TableBody, TableRow, TableCell, CircularProgress, Alert,
} from "@mui/material";
import { CheckCircle, Cancel } from "@mui/icons-material";
import { getEventByCode, getPanelistDashboard } from "../services/liveQuizService";

const GREEN = "#1E7F4F", ORANGE = "#E8651A", RED = "#ef4444";
const BORDER = "#E6E9F0", TEXT = "#0F172A", MUTED = "#64748B";
const POLL_MS = 4000;

export default function PanelistQuizPage() {
  const { code } = useParams();
  const [eventId, setEventId] = useState(null);
  const [eventName, setEventName] = useState("");
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState("");

  // Resolve code → id once
  useEffect(() => {
    getEventByCode(code)
      .then((res) => { setEventId(res.event.id); setEventName(res.event.name); })
      .catch((err) => setError(err?.response?.data?.message || "Event not found"));
  }, [code]);

  const poll = useCallback(async () => {
    if (!eventId) return;
    try {
      const res = await getPanelistDashboard(eventId);
      setDashboard(res);
      setError("");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load dashboard");
    }
  }, [eventId]);

  useEffect(() => {
    if (!eventId) return;
    poll();
    const t = setInterval(poll, POLL_MS);
    return () => clearInterval(t);
  }, [eventId, poll]);

  if (error) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", p: 3 }}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
      </Box>
    );
  }

  if (!dashboard) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress sx={{ color: GREEN }} />
      </Box>
    );
  }

  const q = dashboard.currentQuestion;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#F7F9FC", p: { xs: 2, md: 4 } }}>
      <Typography sx={{ fontWeight: 800, fontSize: 22, color: TEXT, mb: 0.5 }}>{eventName}</Typography>
      <Typography sx={{ fontSize: 13, color: MUTED, mb: 3 }}>
        Round {dashboard.event.activeRound} · Panelist View
      </Typography>

      {q && (
        <Paper elevation={0} sx={{ borderRadius: 3, p: 3, mb: 3, border: `1px solid ${BORDER}` }}>
          <Chip
            size="small"
            label={q.status}
            sx={{
              mb: 1.5, fontWeight: 800,
              bgcolor: q.status === "open" ? `${GREEN}15` : q.status === "locked" ? `${ORANGE}15` : "rgba(139,92,246,0.1)",
              color:   q.status === "open" ? GREEN : q.status === "locked" ? ORANGE : "#8b5cf6",
            }}
          />
          <Typography sx={{ fontWeight: 700, fontSize: 16, color: TEXT }}>
            {q.QuizQuestion?.questionText}
          </Typography>
        </Paper>
      )}

      {dashboard.questionResults && (
        <Paper elevation={0} sx={{ borderRadius: 3, overflow: "hidden", mb: 3, border: `1px solid ${BORDER}` }}>
          <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${BORDER}` }}>
            <Typography sx={{ fontWeight: 800, fontSize: 15, color: TEXT }}>Answer Distribution</Typography>
          </Box>
          <Table size="small">
            <TableHead>
              <TableRow>
                {["#", "Participant", "Selected", "Correct", "Marks"].map((h) => (
                  <TableCell key={h} sx={{ fontWeight: 700, color: MUTED, fontSize: 12 }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {dashboard.questionResults.map((a) => (
                <TableRow key={a.participantId}>
                  <TableCell>{a.displayNumber}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{a.participantName}</TableCell>
                  <TableCell>
                    <Chip label={a.selectedOption || "—"} size="small"
                      sx={{ fontWeight: 800,
                            bgcolor: a.isCorrect ? `${GREEN}15` : a.selectedOption ? `rgba(239,68,68,0.1)` : "#F1F5F9",
                            color:   a.isCorrect ? GREEN : a.selectedOption ? RED : MUTED }} />
                  </TableCell>
                  <TableCell>{a.isCorrect ? <CheckCircle sx={{ fontSize: 16, color: GREEN }} /> : <Cancel sx={{ fontSize: 16, color: RED }} />}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{a.marksEarned}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      <Paper elevation={0} sx={{ borderRadius: 3, overflow: "hidden", border: `1px solid ${BORDER}` }}>
        <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${BORDER}` }}>
          <Typography sx={{ fontWeight: 800, fontSize: 15, color: TEXT }}>Scoreboard</Typography>
        </Box>
        <Table size="small">
          <TableHead>
            <TableRow>
              {["#", "Participant", "School", "Correct", "Wrong", "Unanswered", "Score"].map((h) => (
                <TableCell key={h} sx={{ fontWeight: 700, color: MUTED, fontSize: 12 }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {dashboard.scores?.map((s, i) => (
              <TableRow key={s.id}>
                <TableCell sx={{ fontWeight: 800 }}>{i + 1}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{s.QuizParticipant?.name}</TableCell>
                <TableCell sx={{ color: MUTED, fontSize: 12 }}>{s.QuizParticipant?.school}</TableCell>
                <TableCell sx={{ color: GREEN }}>{s.correctCount}</TableCell>
                <TableCell sx={{ color: RED }}>{s.incorrectCount}</TableCell>
                <TableCell sx={{ color: MUTED }}>{s.unansweredCount}</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>{s.totalMarks}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}