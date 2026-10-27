// components/live/PollForm.jsx
// Answer form + results bars. Shared by the in-room panel and the standalone survey page.

import { useState } from "react";
import {
  Box, Typography, RadioGroup, FormControlLabel, Radio, Checkbox, FormGroup,
  Rating, TextField, Button, LinearProgress, Stack, Alert, CircularProgress,
} from "@mui/material";

const GREEN = "#1E7F4F";
const NAVY = "#0B1F3A";
const MUTED = "#64748B";

const isEmpty = (v) =>
  v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0);

// ─────────────────────────────────────────────────────────────
// ANSWER FORM
// ─────────────────────────────────────────────────────────────
export function PollForm({ poll, onSubmit, submitting = false, submitLabel = "Submit" }) {
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState("");

  const setAnswer = (id, value) => setAnswers((a) => ({ ...a, [id]: value }));
  const toggle = (id, option) =>
    setAnswers((a) => {
      const current = a[id] || [];
      return {
        ...a,
        [id]: current.includes(option) ? current.filter((x) => x !== option) : [...current, option],
      };
    });

  const submit = () => {
    const missing = poll.questions.find((q) => q.required && isEmpty(answers[q.id]));
    if (missing) return setError(`Please answer: ${missing.text}`);
    setError("");
    onSubmit(answers);
  };

  return (
    <Stack spacing={2.5}>
      {poll.questions.map((q, i) => (
        <Box key={q.id}>
          <Typography sx={{ fontWeight: 700, fontSize: 14, color: "text.primary", mb: 0.75 }}>
            {poll.questions.length > 1 ? `${i + 1}. ` : ""}
            {q.text}
            {q.required && <span style={{ color: "#dc2626" }}> *</span>}
          </Typography>

          {q.type === "single" && (
            <RadioGroup value={answers[q.id] ?? ""} onChange={(e) => setAnswer(q.id, e.target.value)}>
              {q.options.map((o) => (
                <FormControlLabel key={o} value={o} control={<Radio size="small" />} label={o} />
              ))}
            </RadioGroup>
          )}

          {q.type === "multiple" && (
            <FormGroup>
              {q.options.map((o) => (
                <FormControlLabel
                  key={o}
                  control={
                    <Checkbox
                      size="small"
                      checked={(answers[q.id] || []).includes(o)}
                      onChange={() => toggle(q.id, o)}
                    />
                  }
                  label={o}
                />
              ))}
            </FormGroup>
          )}

          {q.type === "rating" && (
            <Rating
              value={answers[q.id] ?? null}
              onChange={(_, v) => setAnswer(q.id, v)}
              size="large"
            />
          )}

          {q.type === "text" && (
            <TextField
              fullWidth multiline minRows={2} size="small"
              value={answers[q.id] ?? ""}
              onChange={(e) => setAnswer(q.id, e.target.value)}
              inputProps={{ maxLength: 2000 }}
              placeholder="Type your answer…"
            />
          )}
        </Box>
      ))}

      {error && <Alert severity="warning" sx={{ borderRadius: 2 }}>{error}</Alert>}

      <Button
        variant="contained" onClick={submit} disabled={submitting}
        startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : null}
        sx={{ bgcolor: NAVY, textTransform: "none", fontWeight: 700, borderRadius: 2.5, "&:hover": { bgcolor: GREEN } }}
      >
        {submitting ? "Submitting…" : submitLabel}
      </Button>
    </Stack>
  );
}

// ─────────────────────────────────────────────────────────────
// RESULTS
// ─────────────────────────────────────────────────────────────
const Bar = ({ label, count, total }) => {
  const pct = total ? Math.round((count / total) * 100) : 0;
  return (
    <Box sx={{ mb: 1 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.25 }}>
        <Typography sx={{ fontSize: 13, color: "text.primary" }}>{label}</Typography>
        <Typography sx={{ fontSize: 12.5, color: MUTED, fontWeight: 700 }}>
          {count} · {pct}%
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate" value={pct}
        sx={{ height: 7, borderRadius: 20, bgcolor: "action.hover", "& .MuiLinearProgress-bar": { bgcolor: GREEN, borderRadius: 20 } }}
      />
    </Box>
  );
};

export function PollResults({ results = [] }) {
  return (
    <Stack spacing={2.5}>
      {results.map((r) => (
        <Box key={r.id}>
          <Typography sx={{ fontWeight: 700, fontSize: 13.5, color: "text.primary", mb: 0.25 }}>{r.text}</Typography>
          <Typography sx={{ fontSize: 11.5, color: MUTED, mb: 1 }}>
            {r.answered} response{r.answered === 1 ? "" : "s"}
          </Typography>

          {r.options?.map((o) => (
            <Bar key={o.label} label={o.label} count={o.count} total={r.answered} />
          ))}

          {r.type === "rating" && (
            <>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <Rating value={r.average} precision={0.1} readOnly size="small" />
                <Typography sx={{ fontSize: 13, fontWeight: 800, color: "text.primary" }}>{r.average} / 5</Typography>
              </Box>
              {r.distribution.map((d) => (
                <Bar key={d.label} label={`${d.label} star${d.label === "1" ? "" : "s"}`} count={d.count} total={r.answered} />
              ))}
            </>
          )}

          {r.type === "text" && (
            <Stack spacing={0.75}>
              {r.answers.length === 0 && <Typography sx={{ fontSize: 13, color: MUTED }}>No answers yet</Typography>}
              {r.answers.map((a, i) => (
                <Box key={i} sx={{ p: 1.25, borderRadius: 2, bgcolor: "action.hover", fontSize: 13, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                  {a}
                </Box>
              ))}
            </Stack>
          )}
        </Box>
      ))}
    </Stack>
  );
}
