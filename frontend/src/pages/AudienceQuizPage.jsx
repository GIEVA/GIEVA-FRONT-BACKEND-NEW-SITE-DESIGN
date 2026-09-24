// pages/quiz/AudienceQuizPage.jsx
//
// Public leaderboard/spectator screen. No join required — just the
// event's eventCode in the URL. Polls getAudienceState; read-only.

import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Box, Typography, Paper, Chip, Stack, Avatar, CircularProgress, Alert } from "@mui/material";
import { EmojiEvents } from "@mui/icons-material";
import { getAudienceState } from "../services/liveQuizService";
import QuestionPreview from "../components/quiz/QuestionPreview";

const NAVY = "#0B1F3A", GREEN = "#1E7F4F", GOLD = "#D4A017", BORDER = "#E6E9F0", TEXT = "#0F172A", MUTED = "#64748B";
const SILVER = "#94a3b8", BRONZE = "#B45309"; // add these
const POLL_MS = 4000;


const medalColor = (rank) => rank === 1 ? GOLD : rank === 2 ? SILVER : rank === 3 ? BRONZE : null;

export default function AudienceQuizPage() {
  const { code } = useParams();
  const [searchParams] = useSearchParams();
  const accessCode = searchParams.get("accessCode");

  const [data, setData]   = useState(null);
  const [error, setError] = useState("");

  const poll = useCallback(async () => {
    try {
      const res = await getAudienceState(code, accessCode);
      setData(res);
      setError("");
    } catch (err) {
      setError(err?.response?.data?.message || "This event isn't available.");
    }
  }, [code, accessCode]);

  useEffect(() => {
    poll();
    const t = setInterval(poll, POLL_MS);
    return () => clearInterval(t);
  }, [poll]);

  if (error) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", p: 3 }}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
      </Box>
    );
  }

  if (!data) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress sx={{ color: GREEN }} />
      </Box>
    );
  }

  const q = data.currentQuestion;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: NAVY, color: "#fff", p: { xs: 2, md: 5 } }}>
      <Typography sx={{ fontWeight: 800, fontSize: { xs: 20, md: 28 }, textAlign: "center", mb: 0.5 }}>
        {data.event.name}
      </Typography>
      <Typography sx={{ textAlign: "center", opacity: 0.7, mb: 4 }}>
        {data.isFinal ? "Final Results" : `Round ${data.activeRound || "—"}`}
      </Typography>

      {q && (
        <Paper elevation={0} sx={{ maxWidth: 720, mx: "auto", mb: 4, borderRadius: 4, p: 4, bgcolor: "#fff" }}>
          <Chip
            label={q.status === "revealed" ? "Result" : `Question ${q.sequenceNumber}`}
            size="small"
            sx={{ mb: 2, bgcolor: `${NAVY}10`, color: NAVY, fontWeight: 800 }}
          />
          <QuestionPreview
              text={q.question?.questionText}
              sx={{ fontWeight: 700, fontSize: 20, color: TEXT }}
            />
          {/* <Typography sx={{ fontWeight: 700, fontSize: 20, color: TEXT }}>
            {q.question?.questionText}</Typography> */}
        </Paper>
      )}

      {data.isFinal && (
            <Paper elevation={0} sx={{ maxWidth: 720, mx: "auto", mb: 4, borderRadius: 4, p: 3, bgcolor: "#fff", textAlign: "center" }}>
              <EmojiEvents sx={{ fontSize: 40, color: GOLD, mb: 1 }} />
              <Typography sx={{ fontWeight: 800, fontSize: 20, color: TEXT }}>Event Complete!</Typography>
              <Typography sx={{ fontSize: 13, color: MUTED }}>Here's the final ranking.</Typography>
            </Paper>
          )}

      <Paper elevation={0} sx={{ maxWidth: 720, mx: "auto", borderRadius: 4, overflow: "hidden", bgcolor: "#fff" }}>
        <Box sx={{ px: 3, py: 2, borderBottom: `1px solid ${BORDER}` }}>
          <Typography sx={{ fontWeight: 800, color: TEXT }}>
            {data.isFinal ? "Final Leaderboard" : "Leaderboard"}
          </Typography>
        </Box>
        <Stack divider={<Box sx={{ borderBottom: `1px solid ${BORDER}` }} />}>
          {data.leaderboard?.map((row) => {
            const medal = medalColor(row.rank);
            return (
              <Stack key={row.displayNumber} direction="row" alignItems="center" spacing={2} sx={{ px: 3, py: 1.5 }}>
                <Typography sx={{ width: 28, fontWeight: 800, color: medal || TEXT }}>
                  {medal ? <EmojiEvents sx={{ fontSize: 20, color: medal }} /> : `#${row.rank}`}
                </Typography>
                <Avatar src={row.photoUrl} sx={{ width: 32, height: 32, bgcolor: NAVY, fontSize: 13 }}>
                  {row.name?.[0]}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: 14, color: TEXT }}>{row.name}</Typography>
                  <Typography sx={{ fontSize: 11, color: MUTED }}>{row.school}</Typography>
                </Box>
                <Typography sx={{ fontWeight: 800, fontSize: 16, color: TEXT }}>{row.totalMarks}</Typography>
              </Stack>
            );
          })}

          
          {!data.leaderboard?.length && (
            <Typography sx={{ p: 3, textAlign: "center", color: MUTED, fontSize: 13 }}>
              {data.isFinal ? "Final results are being finalized…" : "Scores will appear once Round 1 begins."}
            </Typography>
          )}
        </Stack>
      </Paper>
    </Box>
  );
}