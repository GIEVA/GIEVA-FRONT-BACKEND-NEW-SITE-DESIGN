// components/live/PollBuilderDialog.jsx
// Host-side editor for a poll or a survey.

import { useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Stack, Box,
  ToggleButtonGroup, ToggleButton, MenuItem, IconButton, FormControlLabel, Switch,
  Typography, Alert, Divider,
} from "@mui/material";
import { Add, DeleteOutline, Close } from "@mui/icons-material";

const NAVY = "#0B1F3A";
const GREEN = "#1E7F4F";
const MUTED = "#64748B";

const LIMITS = { poll: 5, survey: 20 };
const TYPE_LABELS = {
  single: "Single choice",
  multiple: "Multiple choice",
  rating: "Rating (1–5)",
  text: "Free text",
};

const blankQuestion = (type = "single") => ({ type, text: "", options: ["", ""], required: true });

export default function PollBuilderDialog({ open, onClose, onSubmit, busy = false }) {
  const [kind, setKind] = useState("poll");
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState([blankQuestion()]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [showResults, setShowResults] = useState(true);
  const [autoSendOnEnd, setAutoSendOnEnd] = useState(true);
  const [error, setError] = useState("");

  const reset = () => {
    setKind("poll"); setTitle(""); setQuestions([blankQuestion()]);
    setIsAnonymous(false); setShowResults(true); setAutoSendOnEnd(true); setError("");
  };

  const close = () => { reset(); onClose(); };

  const updateQ = (i, patch) =>
    setQuestions((qs) => qs.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
  const setOption = (i, j, v) =>
    updateQ(i, { options: questions[i].options.map((o, k) => (k === j ? v : o)) });
  const addOption = (i) => questions[i].options.length < 10 && updateQ(i, { options: [...questions[i].options, ""] });
  const removeOption = (i, j) =>
    questions[i].options.length > 2 && updateQ(i, { options: questions[i].options.filter((_, k) => k !== j) });

  const validate = () => {
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) return `Question ${i + 1} needs text`;
      if (q.type === "single" || q.type === "multiple") {
        const filled = q.options.map((o) => o.trim()).filter(Boolean);
        if (filled.length < 2) return `Question ${i + 1} needs at least 2 options`;
      }
    }
    return "";
  };

  const submit = async (launchNow) => {
    const problem = validate();
    if (problem) return setError(problem);
    setError("");

    try {
      await onSubmit(
        {
          kind,
          title: title.trim(),
          questions: questions.map((q) => ({
            ...q,
            options: q.type === "single" || q.type === "multiple" ? q.options.map((o) => o.trim()).filter(Boolean) : undefined,
          })),
          isAnonymous,
          showResultsToParticipants: showResults,
          autoSendOnEnd: kind === "survey" && autoSendOnEnd,
          launchNow,
        }
      );
      reset();
    } catch (err) {
      setError(err?.response?.data?.message || "Could not save");
    }
  };

  return (
    <Dialog open={open} onClose={close} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 800, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        New {kind === "poll" ? "poll" : "survey"}
        <IconButton onClick={close} size="small"><Close fontSize="small" /></IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2.5}>
          <ToggleButtonGroup
            exclusive size="small" value={kind}
            onChange={(_, v) => v && setKind(v)}
            sx={{ "& .MuiToggleButton-root": { textTransform: "none", fontWeight: 700, px: 2 } }}
          >
            <ToggleButton value="poll">Live poll</ToggleButton>
            <ToggleButton value="survey">Post-session survey</ToggleButton>
          </ToggleButtonGroup>

          <Typography sx={{ fontSize: 12.5, color: MUTED, mt: "-8px !important" }}>
            {kind === "poll"
              ? "Appears for everyone in the meeting right now, with live results. Up to 5 questions."
              : "Emailed to attendees after the session. Up to 20 questions."}
          </Typography>

          <TextField
            fullWidth size="small" label="Title (optional)" value={title}
            onChange={(e) => setTitle(e.target.value)} inputProps={{ maxLength: 255 }}
          />

          {questions.map((q, i) => (
            <Box key={i} sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 2.5 }}>
              <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
                <Typography sx={{ fontWeight: 800, fontSize: 13, color: MUTED, minWidth: 24 }}>Q{i + 1}</Typography>
                <TextField
                  select size="small" value={q.type} sx={{ minWidth: 160 }}
                  onChange={(e) => updateQ(i, { type: e.target.value })}
                >
                  {Object.entries(TYPE_LABELS).map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}
                </TextField>
                <Box flex={1} />
                <FormControlLabel
                  control={<Switch size="small" checked={q.required} onChange={(e) => updateQ(i, { required: e.target.checked })} />}
                  label={<Typography sx={{ fontSize: 12.5 }}>Required</Typography>}
                />
                {questions.length > 1 && (
                  <IconButton size="small" onClick={() => setQuestions((qs) => qs.filter((_, k) => k !== i))}>
                    <DeleteOutline fontSize="small" />
                  </IconButton>
                )}
              </Stack>

              <TextField
                fullWidth size="small" placeholder="Your question" value={q.text}
                onChange={(e) => updateQ(i, { text: e.target.value })} inputProps={{ maxLength: 500 }}
              />

              {(q.type === "single" || q.type === "multiple") && (
                <Stack spacing={1} mt={1.5}>
                  {q.options.map((o, j) => (
                    <Stack key={j} direction="row" spacing={1} alignItems="center">
                      <TextField
                        fullWidth size="small" placeholder={`Option ${j + 1}`} value={o}
                        onChange={(e) => setOption(i, j, e.target.value)} inputProps={{ maxLength: 200 }}
                      />
                      <IconButton size="small" disabled={q.options.length <= 2} onClick={() => removeOption(i, j)}>
                        <DeleteOutline fontSize="small" />
                      </IconButton>
                    </Stack>
                  ))}
                  <Box>
                    <Button size="small" startIcon={<Add />} onClick={() => addOption(i)} disabled={q.options.length >= 10}
                      sx={{ textTransform: "none", fontWeight: 700 }}>
                      Add option
                    </Button>
                  </Box>
                </Stack>
              )}
            </Box>
          ))}

          <Box>
            <Button
              startIcon={<Add />} onClick={() => setQuestions((qs) => [...qs, blankQuestion()])}
              disabled={questions.length >= LIMITS[kind]}
              sx={{ textTransform: "none", fontWeight: 700 }}
            >
              Add question
            </Button>
          </Box>

          <Divider />

          <Stack>
            <FormControlLabel
              control={<Switch checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} />}
              label="Anonymous (hide who answered)"
            />
            <FormControlLabel
              control={<Switch checked={showResults} onChange={(e) => setShowResults(e.target.checked)} />}
              label="Show results to participants after it closes"
            />
            {kind === "survey" && (
              <FormControlLabel
                control={<Switch checked={autoSendOnEnd} onChange={(e) => setAutoSendOnEnd(e.target.checked)} />}
                label="Send automatically when the session ends"
              />
            )}
          </Stack>

          {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={close} sx={{ textTransform: "none", color: MUTED }}>Cancel</Button>
        <Button
          onClick={() => submit(false)} disabled={busy} variant="outlined"
          sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2.5, borderColor: "divider", color: NAVY }}
        >
          Save {kind === "survey" ? "survey" : "draft"}
        </Button>
        {kind === "poll" && (
          <Button
            onClick={() => submit(true)} disabled={busy} variant="contained"
            sx={{ textTransform: "none", fontWeight: 800, borderRadius: 2.5, bgcolor: GREEN, "&:hover": { bgcolor: NAVY } }}
          >
            Launch now
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
