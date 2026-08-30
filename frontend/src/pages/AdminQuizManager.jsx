// pages/admin/AdminQuizManager.jsx
//
// Tabs: Events list → Event detail → Live Control
// Covers: create event, add participants, add/approve questions,
// assign to rounds, start event, control question flow,
// elimination review, tiebreak, complete event.

import { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Paper, Grid, Button, Chip, Stack,
  TextField, MenuItem, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, Alert, Snackbar, Divider,
  List, ListItem, ListItemText, ListItemAvatar, Avatar,
  CircularProgress, Tabs, Tab, Table, TableHead,
  TableBody, TableRow, TableCell, LinearProgress,
} from "@mui/material";
import {
  Add, PlayArrow, Lock, Visibility, SkipNext, CheckCircle,
  Cancel, Pause, PlayCircle, EmojiEvents, Group, Quiz,
  Warning, Download, Refresh, Close,
} from "@mui/icons-material";
import {
  createEvent, listEvents, getEvent, publishEvent,
  addParticipant, addQuestion, approveQuestion, assignQuestions,
  startEvent, openNextQuestion, lockQuestion, revealResult,
  completeRound, pauseEvent, resumeEvent, completeEvent,
  getEliminationReview, confirmElimination, startTiebreak,
  voidQuestion, adjustScore, getPanelistDashboard, exportResults,
} from "../services/liveQuizService";

// ─── Design tokens ────────────────────────────────────────────
const NAVY   = "#0B1F3A";
const GREEN  = "#1E7F4F";
const GOLD   = "#D4A017";
const ORANGE = "#E8651A";
const RED    = "#ef4444";
const BG     = "#F7F9FC";
const CARD   = "#FFFFFF";
const BORDER = "#E6E9F0";
const TEXT   = "#0F172A";
const MUTED  = "#64748B";

const STATUS_CFG = {
  draft:                    { label: "Draft",           color: MUTED,   bg: "#F1F5F9" },
  published:                { label: "Published",       color: "#3b82f6", bg: "rgba(59,130,246,0.1)" },
  ready:                    { label: "Ready",           color: GREEN,   bg: `${GREEN}15` },
  round1_intro:             { label: "R1 Intro",        color: NAVY,    bg: `${NAVY}15` },
  round1_question_open:     { label: "Q Open",          color: GREEN,   bg: `${GREEN}15` },
  round1_question_locked:   { label: "Q Locked",        color: ORANGE,  bg: `${ORANGE}15` },
  round1_result_revealed:   { label: "Result",          color: "#8b5cf6", bg: "rgba(139,92,246,0.1)" },
  round1_completed:         { label: "R1 Done",         color: MUTED,   bg: "#F1F5F9" },
  elimination_review:       { label: "Elimination",     color: RED,     bg: `rgba(239,68,68,0.1)` },
  tiebreak_active:          { label: "Tiebreak",        color: GOLD,    bg: `rgba(212,160,23,0.1)` },
  round2_intro:             { label: "R2 Intro",        color: NAVY,    bg: `${NAVY}15` },
  round2_question_open:     { label: "Q Open",          color: GREEN,   bg: `${GREEN}15` },
  round2_question_locked:   { label: "Q Locked",        color: ORANGE,  bg: `${ORANGE}15` },
  round2_result_revealed:   { label: "Result",          color: "#8b5cf6", bg: "rgba(139,92,246,0.1)" },
  round2_completed:         { label: "R2 Done",         color: MUTED,   bg: "#F1F5F9" },
  completed:                { label: "Completed",       color: GREEN,   bg: `${GREEN}15` },
  paused:                   { label: "Paused",          color: GOLD,    bg: `rgba(212,160,23,0.1)` },
  cancelled:                { label: "Cancelled",       color: RED,     bg: `rgba(239,68,68,0.1)` },
};

const sx = { "& fieldset": { borderColor: BORDER } };

// ─── Create Event Dialog ──────────────────────────────────────
function CreateEventDialog({ open, onClose, onCreated }) {
  const [form, setForm] = useState({
    name: "", description: "", venue: "", category: "SS2_SS3",
    round1ParticipantLimit: 10, round1QuestionCount: 12,
    round2ParticipantLimit: 5,  round2QuestionCount: 12,
    eliminateAfterRound1: 5, questionsPerSubject: 3,
    questionTimerSeconds: 60, tiebreakQuestionCount: 10,
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");


  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    if (!form.name.trim()) { setError("Event name is required."); return; }
    try {
      setSaving(true); setError("");
      const res = await createEvent(form);
      onCreated(res.event);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create event");
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 800, fontSize: 18, color: TEXT }}>
        Create Quiz Event
      </DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
        <Grid container spacing={2.5}>
          <Grid item xs={12} sm={8}>
            <TextField fullWidth label="Event Name *" value={form.name} onChange={set("name")} sx={sx} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth select label="Category" value={form.category} onChange={set("category")} sx={sx}>
              {["SS2","SS3","SS2_SS3"].map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth multiline rows={2} label="Description" value={form.description} onChange={set("description")} sx={sx} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Venue" value={form.venue} onChange={set("venue")} sx={sx} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth type="number" label="Timer per question (seconds)" value={form.questionTimerSeconds} onChange={set("questionTimerSeconds")} sx={sx} />
          </Grid>
          <Grid item xs={12}><Divider><Typography sx={{ fontSize: 12, color: MUTED }}>ROUND CONFIGURATION</Typography></Divider></Grid>
          <Grid item xs={6} sm={3}>
            <TextField fullWidth type="number" label="R1 Participants" value={form.round1ParticipantLimit} onChange={set("round1ParticipantLimit")} sx={sx} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField fullWidth type="number" label="R1 Questions" value={form.round1QuestionCount} onChange={set("round1QuestionCount")} sx={sx} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField fullWidth type="number" label="R2 Participants" value={form.round2ParticipantLimit} onChange={set("round2ParticipantLimit")} sx={sx} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField fullWidth type="number" label="R2 Questions" value={form.round2QuestionCount} onChange={set("round2QuestionCount")} sx={sx} />
          </Grid>
          <Grid item xs={6} sm={4}>
            <TextField fullWidth type="number" label="Eliminate after R1 (keep top N)" value={form.eliminateAfterRound1} onChange={set("eliminateAfterRound1")} sx={sx} />
          </Grid>
          <Grid item xs={6} sm={4}>
            <TextField fullWidth type="number" label="Questions per subject" value={form.questionsPerSubject} onChange={set("questionsPerSubject")} sx={sx} />
          </Grid>
          <Grid item xs={6} sm={4}>
            <TextField fullWidth type="number" label="Tiebreak questions" value={form.tiebreakQuestionCount} onChange={set("tiebreakQuestionCount")} sx={sx} />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={onClose} sx={{ textTransform: "none", color: MUTED }}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" disabled={saving}
          sx={{ textTransform: "none", bgcolor: NAVY, fontWeight: 700, borderRadius: 2, "&:hover": { bgcolor: GREEN } }}>
          {saving ? <CircularProgress size={18} color="inherit" /> : "Create Event"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Add Question Dialog ──────────────────────────────────────
function AddQuestionDialog({ open, onClose, eventId, onAdded }) {
  const [form, setForm] = useState({
    subject: "Biology", classLevel: "both", roundAssignment: "1",
    questionText: "", options: { A: "", B: "", C: "", D: "" },
    correctAnswer: "A", explanation: "", difficulty: "medium", marks: 1,
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setOpt = (k) => (e) => setForm((f) => ({ ...f, options: { ...f.options, [k]: e.target.value } }));

  const handleSave = async () => {
    if (!form.questionText.trim() || !form.options.A || !form.options.B || !form.options.C || !form.options.D)
      return setError("Question text and all 4 options are required.");
    try {
      setSaving(true); setError("");
      const res = await addQuestion(eventId, form);
      onAdded(res.question);
      onClose();
      setForm({ subject: "Biology", classLevel: "both", roundAssignment: "1",
        questionText: "", options: { A: "", B: "", C: "", D: "" },
        correctAnswer: "A", explanation: "", difficulty: "medium", marks: 1 });
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to add question");
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 800, fontSize: 18, color: TEXT }}>Add Question</DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
        <Grid container spacing={2}>
          <Grid item xs={6} sm={4}>
            <TextField fullWidth select label="Subject" value={form.subject} onChange={set("subject")} sx={sx}>
              {["Biology","Physics","Chemistry","Mathematics"].map((s) =>
                <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={6} sm={4}>
            <TextField fullWidth select label="Round" value={form.roundAssignment} onChange={set("roundAssignment")} sx={sx}>
              {[["1","Round 1"],["2","Round 2"],["tiebreak","Tiebreak"]].map(([v,l]) =>
                <MenuItem key={v} value={v}>{l}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={6} sm={4}>
            <TextField fullWidth select label="Difficulty" value={form.difficulty} onChange={set("difficulty")} sx={sx}>
              {["easy","medium","hard"].map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth multiline rows={3} label="Question Text *" value={form.questionText} onChange={set("questionText")} sx={sx} />
          </Grid>
          {["A","B","C","D"].map((opt) => (
            <Grid item xs={12} sm={6} key={opt}>
              <TextField fullWidth label={`Option ${opt} *`} value={form.options[opt]} onChange={setOpt(opt)} sx={sx} />
            </Grid>
          ))}
          <Grid item xs={6}>
            <TextField fullWidth select label="Correct Answer *" value={form.correctAnswer} onChange={set("correctAnswer")} sx={sx}>
              {["A","B","C","D"].map((o) => <MenuItem key={o} value={o}>Option {o}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth type="number" label="Marks" value={form.marks} onChange={set("marks")} sx={sx} />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth multiline rows={2} label="Explanation (optional)" value={form.explanation} onChange={set("explanation")} sx={sx} />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={onClose} sx={{ textTransform: "none", color: MUTED }}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" disabled={saving}
          sx={{ textTransform: "none", bgcolor: NAVY, fontWeight: 700, borderRadius: 2, "&:hover": { bgcolor: GREEN } }}>
          {saving ? <CircularProgress size={18} color="inherit" /> : "Add Question"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Live Control Panel ───────────────────────────────────────
function LiveControlPanel({ event, onRefresh }) {
  const [dashboard,  setDashboard]  = useState(null);
  const [loading,    setLoading]    = useState(false);
  // Tracks whether a control action (open/lock/reveal/pause/etc.) is
  // currently in flight, so buttons can be disabled and can't be
  // double-fired by an impatient click during a live event.
  const [submitting, setSubmitting] = useState(false);
  const [toast,      setToast]      = useState(null);
  const [elimData,   setElimData]   = useState(null);
  const [elimLoading,setElimLoading]= useState(false);
  const [voidReason, setVoidReason] = useState("");
  const [showVoid,   setShowVoid]   = useState(false);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getPanelistDashboard(event.id);
      setDashboard(res);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [event.id]);

  useEffect(() => { loadDashboard(); const t = setInterval(loadDashboard, 5000); return () => clearInterval(t); }, [loadDashboard]);

  const action = async (fn, msg) => {
    if (submitting) return; // guard against double-fire while a previous action is still in flight
    try {
      setSubmitting(true);
      await fn();
      setToast({ msg, severity: "success" });
      onRefresh();
      await loadDashboard();
    } catch (err) {
      setToast({ msg: err?.response?.data?.message || "Action failed", severity: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const loadEliminationReview = async () => {
    try {
      setElimLoading(true);
      const res = await getEliminationReview(event.id);
      setElimData(res);
    } catch (err) {
      setToast({ msg: err?.response?.data?.message || "Failed to load elimination review", severity: "error" });
    } finally {
      setElimLoading(false);
    }
  };



    // Falls back to event.status only until the first dashboard poll lands.
  // Once auto-advance is live, the server changes state without any admin
  // click, so these buttons must react to the polled dashboard, not just
  // to onRefresh() (which only fires after this admin's own action).
  const s = dashboard?.event?.status ?? event.status;
  const activeRoundDisplay = dashboard?.event?.activeRound ?? event.activeRound;

  const isR1Open    = s === "round1_question_open";
  const isR2Open    = s === "round2_question_open";
  const isOpen      = isR1Open || isR2Open || s === "tiebreak_active";
  const isLocked    = s === "round1_question_locked" || s === "round2_question_locked";
  const isRevealed  = s === "round1_result_revealed"  || s === "round2_result_revealed";
  const isIntro     = s === "round1_intro" || s === "round2_intro";
  const isR1Done    = s === "round1_completed";
  const isR2Done    = s === "round2_completed";
  const isPaused    = s === "paused";
  const canVoid     = isOpen || isLocked;

  const cfg = STATUS_CFG[s] || STATUS_CFG.draft;

  // const s = event.status;
  // const isR1Open    = s === "round1_question_open";
  // const isR2Open    = s === "round2_question_open";
  // const isOpen      = isR1Open || isR2Open || s === "tiebreak_active";
  // const isLocked    = s === "round1_question_locked" || s === "round2_question_locked";
  // const isRevealed  = s === "round1_result_revealed"  || s === "round2_result_revealed";
  // const isIntro     = s === "round1_intro" || s === "round2_intro";
  // const isR1Done    = s === "round1_completed";
  // const isR2Done    = s === "round2_completed";
  // const isPaused    = s === "paused";
  // // The backend allows voiding a question in either "open" or "locked"
  // // state — keep this button's visibility window matching that, so a
  // // problem spotted during locked-answer review (before reveal) can
  // // still be corrected.
  // const canVoid     = isOpen || isLocked;

  // const cfg = STATUS_CFG[s] || STATUS_CFG.draft;



  return (
    <Box>
      {/* Status bar */}
      <Paper elevation={0} sx={{ border: `1px solid ${BORDER}`, borderRadius: 3, p: 2.5, mb: 3,
                                  display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Chip label={cfg.label} sx={{ bgcolor: cfg.bg, color: cfg.color, fontWeight: 800 }} />
          {/* <Typography sx={{ fontSize: 14, color: MUTED }}>Round {event.activeRound}</Typography> */}
          <Typography sx={{ fontSize: 14, color: MUTED }}>Round {activeRoundDisplay}</Typography>
          <Typography sx={{ fontSize: 14, color: MUTED }}>Q {event.currentQuestionIdx || 0}</Typography>
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button size="small" startIcon={<Refresh />} onClick={loadDashboard} disabled={loading}
            sx={{ textTransform: "none", borderColor: BORDER, color: MUTED }} variant="outlined">
            Refresh
          </Button>
          {!isPaused
            ? <Button size="small" startIcon={<Pause />} variant="outlined" disabled={submitting}
                onClick={() => action(() => pauseEvent(event.id), "Event paused")}
                sx={{ textTransform: "none", borderColor: GOLD, color: GOLD }}>
                Pause
              </Button>
            : <Button size="small" startIcon={<PlayCircle />} variant="contained" disabled={submitting}
                onClick={() => action(() => resumeEvent(event.id), "Event resumed")}
                sx={{ textTransform: "none", bgcolor: GREEN, "&:hover": { bgcolor: "#166d3e" } }}>
                Resume
              </Button>
          }
        </Stack>
      </Paper>

      {/* Action buttons */}
      <Paper elevation={0} sx={{ border: `1px solid ${BORDER}`, borderRadius: 3, p: 2.5, mb: 3 }}>
        <Typography sx={{ fontWeight: 800, fontSize: 15, color: TEXT, mb: 2 }}>Controls</Typography>
        <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
          {(isIntro || isRevealed) && (
            <Button variant="contained" startIcon={<SkipNext />} disabled={submitting}
              onClick={() => action(() => openNextQuestion(event.id), "Question opened")}
              sx={{ textTransform: "none", bgcolor: GREEN, fontWeight: 700, borderRadius: 2, "&:hover": { bgcolor: "#166d3e" } }}>
              Open Next Question
            </Button>
          )}
          {isOpen && (
            <Button variant="contained" startIcon={<Lock />} disabled={submitting}
              onClick={() => action(() => lockQuestion(event.id), "Question locked")}
              sx={{ textTransform: "none", bgcolor: ORANGE, fontWeight: 700, borderRadius: 2 }}>
              Lock Question
            </Button>
          )}
          {isLocked && (
            <Button variant="contained" startIcon={<Visibility />} disabled={submitting}
              onClick={() => action(() => revealResult(event.id), "Result revealed")}
              sx={{ textTransform: "none", bgcolor: "#8b5cf6", fontWeight: 700, borderRadius: 2 }}>
              Reveal Result
            </Button>
          )}
          {isRevealed && (
            <Button variant="outlined" startIcon={<CheckCircle />} disabled={submitting}
              onClick={() => action(() => completeRound(event.id), "Round completed")}
              sx={{ textTransform: "none", borderColor: GREEN, color: GREEN, fontWeight: 700, borderRadius: 2 }}>
              Complete Round
            </Button>
          )}
          {isR1Done && (
            <Button variant="contained" startIcon={<Group />} disabled={elimLoading}
              onClick={loadEliminationReview}
              sx={{ textTransform: "none", bgcolor: RED, fontWeight: 700, borderRadius: 2 }}>
              {elimLoading ? <CircularProgress size={18} color="inherit" /> : "Elimination Review"}
            </Button>
          )}
          {isR2Done && (
            <Button variant="contained" startIcon={<EmojiEvents />} disabled={submitting}
              onClick={() => action(() => completeEvent(event.id), "Event completed!")}
              sx={{ textTransform: "none", bgcolor: GOLD, color: NAVY, fontWeight: 700, borderRadius: 2 }}>
              Complete Event & Finalize Results
            </Button>
          )}
          {canVoid && (
            <Button variant="outlined" startIcon={<Cancel />} disabled={submitting}
              onClick={() => setShowVoid(true)}
              sx={{ textTransform: "none", borderColor: RED, color: RED, fontWeight: 700, borderRadius: 2 }}>
              Void Question
            </Button>
          )}
        </Stack>
      </Paper>

      {/* Scoreboard */}
      {dashboard?.scores?.length > 0 && (
        <Paper elevation={0} sx={{ border: `1px solid ${BORDER}`, borderRadius: 3, overflow: "hidden", mb: 3 }}>
          <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${BORDER}` }}>
            <Typography sx={{ fontWeight: 800, fontSize: 15, color: TEXT }}>Live Scoreboard — Round {event.activeRound}</Typography>
          </Box>
          <Table size="small">
            <TableHead>
              <TableRow>
                {["#","Participant","School","Correct","Wrong","Unanswered","Score"].map((h) => (
                  <TableCell key={h} sx={{ fontWeight: 700, color: MUTED, fontSize: 12 }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {dashboard.scores.map((s, i) => (
                <TableRow key={s.id} sx={{ bgcolor: i < 5 ? `${GREEN}06` : "transparent" }}>
                  <TableCell sx={{ fontWeight: 800, color: i === 0 ? GOLD : TEXT }}>{i + 1}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{s.QuizParticipant?.name}</TableCell>
                  <TableCell sx={{ color: MUTED, fontSize: 12 }}>{s.QuizParticipant?.school}</TableCell>
                  <TableCell sx={{ color: GREEN, fontWeight: 700 }}>{s.correctCount}</TableCell>
                  <TableCell sx={{ color: RED }}>{s.incorrectCount}</TableCell>
                  <TableCell sx={{ color: MUTED }}>{s.unansweredCount}</TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: 15 }}>{s.totalMarks}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      {/* Current question answer distribution */}
      {dashboard?.questionResults && (
        <Paper elevation={0} sx={{ border: `1px solid ${BORDER}`, borderRadius: 3, overflow: "hidden" }}>
          <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${BORDER}` }}>
            <Typography sx={{ fontWeight: 800, fontSize: 15, color: TEXT }}>Answer Distribution</Typography>
          </Box>
          <Table size="small">
            <TableHead>
              <TableRow>
                {["#","Participant","Selected","Correct","Marks"].map((h) => (
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

      {/* Void dialog */}
      <Dialog open={showVoid} onClose={() => setShowVoid(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Void Current Question</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>All participants receive 0 for this question.</Alert>
          <TextField fullWidth multiline rows={2} label="Reason *" value={voidReason}
            onChange={(e) => setVoidReason(e.target.value)} sx={sx} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setShowVoid(false)} sx={{ textTransform: "none", color: MUTED }}>Cancel</Button>
          <Button variant="contained" disabled={!voidReason.trim() || submitting}
            onClick={async () => {
              // dashboard.currentQuestion is the raw QuizRoundQuestion record
              // returned by getPanelistDashboard — its primary key is `id`,
              // there is no `roundQuestionId` field on this payload.
              const roundQuestionId = dashboard?.currentQuestion?.id;
              if (!roundQuestionId) {
                setToast({ msg: "No current question to void", severity: "error" });
                return;
              }
              await action(
                () => voidQuestion(event.id, roundQuestionId, voidReason),
                "Question voided"
              );
              setShowVoid(false);
              setVoidReason("");
            }}
            sx={{ textTransform: "none", bgcolor: RED, fontWeight: 700, borderRadius: 2 }}>
            Void Question
          </Button>
        </DialogActions>
      </Dialog>

      {/* Elimination review dialog */}
      {elimData && (
        <Dialog open={!!elimData} onClose={() => setElimData(null)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
          <DialogTitle sx={{ fontWeight: 800, color: TEXT }}>Elimination Review</DialogTitle>
          <DialogContent dividers>
            {elimData.hasTie && (
              <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
                <strong>Tie detected at boundary score {elimData.boundaryScore}!</strong>
                <br />Participants at positions {elimData.tiedParticipants.map((p) => p.QuizParticipant?.name).join(", ")} are tied.
                Resolve this with a tiebreak before confirming — a positional cutoff would decide the tie
                arbitrarily.
              </Alert>
            )}
            <Table size="small">
              <TableHead>
                <TableRow>
                  {["Rank","Name","School","Score","Status"].map((h) => (
                    <TableCell key={h} sx={{ fontWeight: 700, color: MUTED, fontSize: 12 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {elimData.scores.map((s, i) => {
                  const qualifies = i < elimData.qualifyCount;
                  return (
                    <TableRow key={s.id} sx={{ bgcolor: qualifies ? `${GREEN}08` : `rgba(239,68,68,0.05)` }}>
                      <TableCell sx={{ fontWeight: 800, color: qualifies ? GREEN : RED }}>{i + 1}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{s.QuizParticipant?.name}</TableCell>
                      <TableCell sx={{ color: MUTED }}>{s.QuizParticipant?.school}</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>{s.totalMarks}</TableCell>
                      <TableCell>
                        <Chip size="small" label={qualifies ? "Qualifies" : "Eliminated"}
                          sx={{ fontWeight: 800, bgcolor: qualifies ? `${GREEN}15` : "rgba(239,68,68,0.1)",
                                color: qualifies ? GREEN : RED }} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, gap: 1, flexWrap: "wrap" }}>
            <Button onClick={() => setElimData(null)} sx={{ textTransform: "none", color: MUTED }}>Close</Button>
            {elimData.hasTie && (
              <Button variant="outlined" startIcon={<Warning />} disabled={submitting}
                onClick={async () => {
                  const tiedIds = elimData.tiedParticipants.map((s) => s.participantId);
                  await action(() => startTiebreak(event.id, tiedIds), "Tiebreak started!");
                  setElimData(null);
                }}
                sx={{ textTransform: "none", borderColor: GOLD, color: GOLD, fontWeight: 700, borderRadius: 2 }}>
                Start Tiebreak
              </Button>
            )}
            <Button variant="contained" disabled={submitting || elimData.hasTie}
              onClick={async () => {
                const qualified  = elimData.scores.slice(0, elimData.qualifyCount).map((s) => s.participantId);
                const eliminated = elimData.scores.slice(elimData.qualifyCount).map((s) => s.participantId);
                await action(
                  () => confirmElimination(event.id, { qualifiedParticipantIds: qualified, eliminatedParticipantIds: eliminated }),
                  "Round 2 started!"
                );
                setElimData(null);
              }}
              sx={{ textTransform: "none", bgcolor: NAVY, fontWeight: 700, borderRadius: 2, "&:hover": { bgcolor: GREEN } }}>
              Confirm & Start Round 2
            </Button>
          </DialogActions>
        </Dialog>
      )}

      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={toast?.severity || "info"} onClose={() => setToast(null)} sx={{ borderRadius: 2 }}>
          {toast?.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────
export default function AdminQuizManager() {
  const [events,      setEvents]      = useState([]);
  const [selectedEvt, setSelectedEvt] = useState(null);
  const [eventDetail, setEventDetail] = useState(null);
  const [tab,         setTab]         = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [createOpen,  setCreateOpen]  = useState(false);
  const [addQOpen,    setAddQOpen]    = useState(false);
  const [toast,       setToast]       = useState(null);

  const [selectedQIds, setSelectedQIds] = useState([]);
  const [assigning, setAssigning] = useState(false);

  const toggleSelect = (qId) => {
    setSelectedQIds((ids) => ids.includes(qId) ? ids.filter((i) => i !== qId) : [...ids, qId]);
  };

  const loadDetail = useCallback(async (id) => {
    try { const r = await getEvent(id); setEventDetail(r.event); }
    catch { setToast({ msg: "Failed to load event", severity: "error" }); }
  }, []);

  const handleAssign = async (roundNumber) => {
    const round = eventDetail.rounds?.find((r) => r.roundNumber === roundNumber);
    if (!round) return setToast({ msg: `Round ${roundNumber} not found`, severity: "error" });
    try {
      setAssigning(true);
      await assignQuestions(eventDetail.id, round.id, selectedQIds);
      setToast({ msg: `${selectedQIds.length} questions assigned to Round ${roundNumber}`, severity: "success" });
      setSelectedQIds([]);
      loadDetail(eventDetail.id);
    } catch (err) {
      setToast({ msg: err?.response?.data?.message || "Failed to assign questions", severity: "error" });
    } finally {
      setAssigning(false);
    }
  };

  const loadEvents = useCallback(async () => {
    try { setLoading(true); const r = await listEvents(); setEvents(r.events || []); }
    catch { setToast({ msg: "Failed to load events", severity: "error" }); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadEvents(); }, [loadEvents]);
  useEffect(() => { if (selectedEvt) loadDetail(selectedEvt); }, [selectedEvt, loadDetail]);
  // Selections don't carry meaning across events — clear them whenever
  // the admin switches which event is selected.
  useEffect(() => { setSelectedQIds([]); }, [selectedEvt]);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: BG }}>
      <Box sx={{ maxWidth: 1400, mx: "auto", px: { xs: 2, md: 4 }, py: { xs: 3, md: 5 } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 4, flexWrap: "wrap", gap: 2 }}>
          <Box>
            <Typography sx={{ fontSize: 26, fontWeight: 800, color: TEXT }}>Quiz Events</Typography>
            <Typography sx={{ fontSize: 14, color: MUTED }}>Create and manage inter-school quiz competitions</Typography>
          </Box>
          <Button variant="contained" startIcon={<Add />} onClick={() => setCreateOpen(true)}
            sx={{ textTransform: "none", bgcolor: NAVY, fontWeight: 700, borderRadius: 2, "&:hover": { bgcolor: GREEN } }}>
            New Event
          </Button>
        </Box>

        <Grid container spacing={3}>
          {/* Event list */}
          <Grid item xs={12} md={selectedEvt ? 3 : 12}>
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress sx={{ color: GREEN }} /></Box>
            ) : (
              <Stack spacing={1.5}>
                {events.map((ev) => {
                  const cfg = STATUS_CFG[ev.status] || STATUS_CFG.draft;
                  return (
                    <Paper key={ev.id} elevation={0} onClick={() => setSelectedEvt(ev.id)}
                      sx={{ border: `1px solid ${selectedEvt === ev.id ? GREEN : BORDER}`, borderRadius: 3,
                            p: 2.5, cursor: "pointer", bgcolor: selectedEvt === ev.id ? `${GREEN}06` : CARD,
                            transition: "all 0.15s", "&:hover": { borderColor: GREEN } }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <Box flex={1} minWidth={0}>
                          <Typography sx={{ fontWeight: 800, fontSize: 15, color: TEXT }} noWrap>{ev.name}</Typography>
                          <Typography sx={{ fontSize: 12, color: MUTED }}>{ev.category} · #{ev.eventCode}</Typography>
                        </Box>
                        <Chip label={cfg.label} size="small"
                          sx={{ bgcolor: cfg.bg, color: cfg.color, fontWeight: 800, flexShrink: 0 }} />
                      </Box>
                    </Paper>
                  );
                })}
                {events.length === 0 && !loading && (
                  <Box sx={{ textAlign: "center", py: 8 }}>
                    <Quiz sx={{ fontSize: 52, color: MUTED, mb: 2 }} />
                    <Typography sx={{ color: MUTED }}>No events yet. Create one to get started.</Typography>
                  </Box>
                )}
              </Stack>
            )}
          </Grid>

          {/* Event detail */}
          {selectedEvt && eventDetail && (
            <Grid item xs={12} md={9}>
              <Paper elevation={0} sx={{ border: `1px solid ${BORDER}`, borderRadius: 3, overflow: "hidden" }}>
                <Box sx={{ borderBottom: `1px solid ${BORDER}`, bgcolor: CARD }}>
                  <Tabs value={tab} onChange={(_, v) => setTab(v)}
                    sx={{ px: 2, "& .MuiTab-root": { textTransform: "none", fontWeight: 700 },
                          "& .Mui-selected": { color: NAVY },
                          "& .MuiTabs-indicator": { bgcolor: NAVY } }}>
                    <Tab label="Setup" />
                    <Tab label="Questions" />
                    <Tab label="Live Control" />
                  </Tabs>
                </Box>

                <Box p={3}>
                  {/* SETUP TAB */}
                  {tab === 0 && (
                    <Box>
                      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3, flexWrap: "wrap", gap: 1 }}>
                        <Box>
                          <Typography sx={{ fontSize: 20, fontWeight: 800, color: TEXT }}>{eventDetail.name}</Typography>
                          <Typography sx={{ fontSize: 13, color: MUTED }}>
                            Code: <strong>{eventDetail.eventCode}</strong> · {eventDetail.category}
                          </Typography>
                        </Box>
                        <Stack direction="row" spacing={1}>
                          {eventDetail.status === "draft" && (
                            <Button variant="contained" size="small"
                              onClick={async () => {
                                await publishEvent(eventDetail.id);
                                loadDetail(eventDetail.id);
                                setToast({ msg: "Event published!", severity: "success" });
                              }}
                              sx={{ textTransform: "none", bgcolor: GREEN, fontWeight: 700, borderRadius: 2 }}>
                              Publish
                            </Button>
                          )}
                          {["published","ready"].includes(eventDetail.status) && (
                            <Button variant="contained" size="small" startIcon={<PlayArrow />}
                              onClick={async () => {
                                try {
                                  await startEvent(eventDetail.id);
                                  loadDetail(eventDetail.id);
                                  setTab(2);
                                  setToast({ msg: "Event started!", severity: "success" });
                                } catch (err) {
                                  setToast({ msg: err?.response?.data?.message || "Failed to start", severity: "error" });
                                }
                              }}
                              sx={{ textTransform: "none", bgcolor: NAVY, fontWeight: 700, borderRadius: 2, "&:hover": { bgcolor: GREEN } }}>
                              Start Event
                            </Button>
                          )}
                          <Button variant="outlined" size="small" startIcon={<Download />}
                            onClick={async () => {
                              const r = await exportResults(eventDetail.id);
                              const blob = new Blob([JSON.stringify(r, null, 2)], { type: "application/json" });
                              const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
                              a.download = `${eventDetail.eventCode}-results.json`; a.click();
                            }}
                            sx={{ textTransform: "none", borderColor: BORDER, color: MUTED, fontWeight: 700, borderRadius: 2 }}>
                            Export
                          </Button>
                        </Stack>
                      </Box>

                      {/* Participant list */}
                      <Typography sx={{ fontWeight: 800, fontSize: 15, color: TEXT, mb: 2 }}>
                        Participants ({eventDetail.participants?.length || 0})
                      </Typography>
                      <Grid container spacing={1.5} mb={3}>
                        {(eventDetail.participants || []).map((p) => (
                          <Grid item xs={12} sm={6} md={4} key={p.id}>
                            <Paper elevation={0} sx={{ border: `1px solid ${BORDER}`, borderRadius: 2, p: 1.5 }}>
                              <Typography sx={{ fontWeight: 700, fontSize: 13, color: TEXT }}>{p.displayNumber}. {p.name}</Typography>
                              <Typography sx={{ fontSize: 11, color: MUTED }}>{p.school} · {p.participantCode}</Typography>
                              <Button
                                size="small"
                                onClick={() => {
                                  navigator.clipboard.writeText(`${window.location.origin}/quiz/join/${p.participantCode}`);
                                }}
                                sx={{ mt: 0.5, textTransform: "none", fontSize: 10, p: 0, minWidth: 0, color: GREEN }}
                              >
                                Copy join link
                              </Button>
                              <Chip label={p.connectionStatus} size="small"
                                sx={{ mt: 0.5, height: 16, fontSize: 9, display: "block", width: "fit-content",
                                      bgcolor: p.connectionStatus === "ready" ? `${GREEN}15` : "#F1F5F9",
                                      color:   p.connectionStatus === "ready" ? GREEN : MUTED }} />
                            </Paper>
                          </Grid>
                        ))}
                      </Grid>
                      {["draft","published"].includes(eventDetail.status) && (
                        <AddParticipantInline eventId={eventDetail.id} onAdded={() => loadDetail(eventDetail.id)} />
                      )}

                      {/* Links */}
                      <Divider sx={{ my: 3 }} />
                      <Typography sx={{ fontWeight: 800, fontSize: 15, color: TEXT, mb: 1.5 }}>Access Links</Typography>
                      {[
                        { label: "Participant Link", url: eventDetail.participantLink },
                        { label: "Panelist Link",    url: eventDetail.panelistLink    },
                        { label: "Audience Link",    url: eventDetail.audienceLink    },
                      ].map(({ label, url }) => (
                        <Box key={label} sx={{ mb: 1.5 }}>
                          <Typography sx={{ fontSize: 12, fontWeight: 700, color: MUTED, mb: 0.5 }}>{label}</Typography>
                          <Box sx={{ bgcolor: BG, border: `1px solid ${BORDER}`, borderRadius: 2,
                                     p: 1.5, fontSize: 12, fontFamily: "monospace", color: TEXT,
                                     wordBreak: "break-all" }}>
                            {url}
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  )}

                  {/* QUESTIONS TAB */}
                  {tab === 1 && (
                    <Box>
                      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3, flexWrap: "wrap", gap: 1 }}>
                        <Typography sx={{ fontWeight: 800, fontSize: 15, color: TEXT }}>
                          Questions ({eventDetail.questions?.length || 0})
                        </Typography>
                        <Stack direction="row" spacing={1}>
                          {selectedQIds.length > 0 && (
                            <>
                              <Button size="small" variant="outlined" disabled={assigning}
                                onClick={() => handleAssign(1)}
                                sx={{ textTransform: "none", borderColor: GREEN, color: GREEN, fontWeight: 700, borderRadius: 2 }}>
                                Assign {selectedQIds.length} to Round 1
                              </Button>
                              <Button size="small" variant="outlined" disabled={assigning}
                                onClick={() => handleAssign(2)}
                                sx={{ textTransform: "none", borderColor: NAVY, color: NAVY, fontWeight: 700, borderRadius: 2 }}>
                                Assign to Round 2
                              </Button>
                            </>
                          )}
                          <Button variant="contained" size="small" startIcon={<Add />}
                            onClick={() => setAddQOpen(true)}
                            sx={{ textTransform: "none", bgcolor: NAVY, fontWeight: 700, borderRadius: 2, "&:hover": { bgcolor: GREEN } }}>
                            Add Question
                          </Button>
                        </Stack>
                      </Box>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            {["","#","Subject","Round","Question","Difficulty","Status","Action"].map((h) => (
                              <TableCell key={h} sx={{ fontWeight: 700, color: MUTED, fontSize: 12 }}>{h}</TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {(eventDetail.questions || []).map((q, i) => (
                            <TableRow key={q.id}>
                              <TableCell padding="checkbox">
                                <input
                                  type="checkbox"
                                  checked={selectedQIds.includes(q.id)}
                                  onChange={() => toggleSelect(q.id)}
                                  disabled={q.status !== "approved"}
                                />
                              </TableCell>
                              <TableCell>{i + 1}</TableCell>
                              <TableCell><Chip label={q.subject} size="small" sx={{ fontSize: 10, fontWeight: 700 }} /></TableCell>
                              <TableCell sx={{ color: MUTED, fontSize: 12 }}>R{q.roundAssignment}</TableCell>
                              <TableCell sx={{ maxWidth: 200 }}>
                                <Typography sx={{ fontSize: 12 }} noWrap>{q.questionText}</Typography>
                              </TableCell>
                              <TableCell sx={{ color: MUTED, fontSize: 12 }}>{q.difficulty}</TableCell>
                              <TableCell>
                                <Chip label={q.status} size="small"
                                  sx={{ fontSize: 10, fontWeight: 800,
                                        bgcolor: q.status === "approved" ? `${GREEN}15` : "#F1F5F9",
                                        color:   q.status === "approved" ? GREEN : MUTED }} />
                              </TableCell>
                              <TableCell>
                                {q.status === "draft" && (
                                  <Button size="small" variant="outlined"
                                    onClick={async () => {
                                      await approveQuestion(eventDetail.id, q.id);
                                      loadDetail(eventDetail.id);
                                      setToast({ msg: "Question approved", severity: "success" });
                                    }}
                                    sx={{ textTransform: "none", fontSize: 11, borderColor: GREEN, color: GREEN }}>
                                    Approve
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                          {(!eventDetail.questions || eventDetail.questions.length === 0) && (
                            <TableRow>
                              <TableCell colSpan={8} sx={{ textAlign: "center", color: MUTED, py: 4 }}>
                                No questions yet — click "Add Question" to create one.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </Box>
                  )}

                  {/* LIVE CONTROL TAB */}
                  {tab === 2 && (
                    <LiveControlPanel event={eventDetail} onRefresh={() => loadDetail(eventDetail.id)} />
                  )}
                </Box>
              </Paper>
            </Grid>
          )}
        </Grid>
      </Box>

      <CreateEventDialog open={createOpen} onClose={() => setCreateOpen(false)}
        onCreated={(ev) => { setEvents((e) => [ev, ...e]); setSelectedEvt(ev.id); setCreateOpen(false); }} />

      {eventDetail && (
        <AddQuestionDialog open={addQOpen} onClose={() => setAddQOpen(false)}
          eventId={eventDetail.id}
          onAdded={() => { loadDetail(eventDetail.id); setAddQOpen(false); }} />
      )}

      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={toast?.severity || "info"} onClose={() => setToast(null)} sx={{ borderRadius: 2 }}>
          {toast?.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}

// Inline add participant (to avoid another dialog)
function AddParticipantInline({ eventId, onAdded }) {
  const [form, setForm] = useState({ name: "", school: "", classLevel: "SS3" });
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!form.name.trim()) return;
    try {
      setSaving(true);
      await addParticipant(eventId, form);
      setForm({ name: "", school: "", classLevel: "SS3" });
      onAdded();
    } finally { setSaving(false); }
  };

  return (
    <Box sx={{ p: 2, border: `1px solid ${BORDER}`, borderRadius: 2.5, bgcolor: BG }}>
      <Typography sx={{ fontWeight: 700, fontSize: 13, color: TEXT, mb: 1.5 }}>Add Participant</Typography>
      <Grid container spacing={1.5} alignItems="center">
        <Grid item xs={12} sm={4}>
          <TextField fullWidth size="small" label="Name *" value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} sx={sx} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField fullWidth size="small" label="School" value={form.school}
            onChange={(e) => setForm((f) => ({ ...f, school: e.target.value }))} sx={sx} />
        </Grid>
        <Grid item xs={6} sm={2}>
          <TextField fullWidth size="small" select label="Class" value={form.classLevel}
            onChange={(e) => setForm((f) => ({ ...f, classLevel: e.target.value }))} sx={sx}>
            <MenuItem value="SS2">SS2</MenuItem>
            <MenuItem value="SS3">SS3</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={6} sm={2}>
          <Button fullWidth variant="contained" disabled={saving || !form.name.trim()}
            onClick={handleAdd}
            sx={{ textTransform: "none", bgcolor: GREEN, fontWeight: 700, borderRadius: 2, "&:hover": { bgcolor: "#166d3e" } }}>
            {saving ? <CircularProgress size={16} color="inherit" /> : "Add"}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
}