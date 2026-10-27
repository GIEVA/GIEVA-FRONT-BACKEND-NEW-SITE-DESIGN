// pages/SessionSurvey.jsx
// Standalone page for the post-session survey link (emailed to attendees).
// Route:  <Route path="/session-survey/:pollId" element={<SessionSurvey />} />   (inside your logged-in routes)

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Box, Paper, Typography, CircularProgress, Alert } from "@mui/material";
import { CheckCircle } from "@mui/icons-material";

import { getPoll, respondToPoll } from "../services/sessionToolsService";
import { PollForm, PollResults } from "../components/live/PollForm";

const NAVY = "#0B1F3A";
const GREEN = "#1E7F4F";
const MUTED = "#64748B";

// Defined at module level on purpose: declaring it inside SessionSurvey would remount the
// form on every render and wipe whatever the user had typed.
const Shell = ({ children }) => (
  <Box sx={{ minHeight: "100vh", bgcolor: "#F7F9FC", display: "flex", justifyContent: "center", px: 2, py: { xs: 4, md: 8 } }}>
    <Paper elevation={0} sx={{ width: "100%", maxWidth: 640, border: "1px solid #E6E9F0", borderRadius: 4, p: { xs: 3, md: 4 }, alignSelf: "flex-start" }}>
      {children}
    </Paper>
  </Box>
);

export default function SessionSurvey() {
  const { pollId } = useParams();
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const load = async () => {
    try {
      const res = await getPoll(pollId);
      setPoll(res.poll);
    } catch (err) {
      setError(err?.response?.data?.message || "This survey could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [pollId]);

  const submit = async (answers) => {
    try {
      setSubmitting(true);
      setError("");
      await respondToPoll(pollId, answers);
      setDone(true);
    } catch (err) {
      setError(err?.response?.data?.message || "Could not submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Shell><Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress sx={{ color: GREEN }} /></Box></Shell>;
  }

  if (!poll) {
    return <Shell><Alert severity="error" sx={{ borderRadius: 2 }}>{error || "Survey not found."}</Alert></Shell>;
  }

  const closedWithResults = poll.status === "closed" && poll.results;

  return (
    <Shell>
      <Typography sx={{ fontSize: 12, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: 0.8 }}>
        {poll.session?.title}
      </Typography>
      <Typography sx={{ fontSize: { xs: 22, md: 26 }, fontWeight: 800, color: NAVY, mb: 3 }}>{poll.title}</Typography>

      {done || poll.hasResponded ? (
        <Box sx={{ textAlign: "center", py: 4, color: GREEN }}>
          <CheckCircle sx={{ fontSize: 48, mb: 1 }} />
          <Typography sx={{ fontWeight: 800, fontSize: 18 }}>Thank you!</Typography>
          <Typography sx={{ color: MUTED, fontSize: 14 }}>Your feedback has been recorded.</Typography>
        </Box>
      ) : poll.status !== "live" ? (
        <>
          <Alert severity="info" sx={{ borderRadius: 2, mb: closedWithResults ? 3 : 0 }}>
            {poll.status === "closed" ? "This survey is closed." : "This survey is not open yet."}
          </Alert>
          {closedWithResults && <PollResults results={poll.results} />}
        </>
      ) : (
        <>
          {error && <Alert severity="error" sx={{ borderRadius: 2, mb: 2 }}>{error}</Alert>}
          {poll.isAnonymous && (
            <Typography sx={{ fontSize: 12.5, color: MUTED, mb: 2 }}>This survey is anonymous. The host cannot see who answered.</Typography>
          )}
          <PollForm poll={poll} onSubmit={submit} submitting={submitting} submitLabel="Submit feedback" />
        </>
      )}
    </Shell>
  );
}
