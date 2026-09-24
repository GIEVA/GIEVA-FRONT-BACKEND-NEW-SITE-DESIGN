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
  createEvent, listEvents, getEvent, updateEvent, deleteEvent, publishEvent,
  addParticipant, addQuestion, approveQuestion, assignQuestions,
  startEvent, openNextQuestion, lockQuestion, revealResult,
  completeRound, pauseEvent, resumeEvent, completeEvent,
  getEliminationReview, confirmElimination, startTiebreak,
  startRound1Tiebreak, getRound1TiebreakReview,
  voidQuestion, adjustScore, getPanelistDashboard, exportResults, getFinalRankingReview,
  restartEvent, updateQuestion, deleteQuestion, updateParticipant, deleteParticipant,
  getFinalLeaderboard
} from "../services/liveQuizService";

import MathTextField from "../components/quiz/MathTextField";
import QuestionPreview from "../components/quiz/QuestionPreview";


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

const SILVER = "#94a3b8";
const BRONZE = "#B45309";
const medalColor = (rank) => rank === 1 ? GOLD : rank === 2 ? SILVER : rank === 3 ? BRONZE : null;

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
  round1_tiebreak_active:   { label: "R1 Tiebreak",   color: GOLD, bg: `rgba(212,160,23,0.1)` },
  round1_tiebreak_completed:{ label: "R1 TB Done",    color: MUTED, bg: "#F1F5F9" },
  tiebreak_completed:       { label: "Tiebreak Done", color: MUTED, bg: "#F1F5F9" },

};

const sx = { "& fieldset": { borderColor: BORDER } };

// ─── Create Event Dialog ──────────────────────────────────────
// function CreateEventDialog({ open, onClose, onCreated }) {
//   const [form, setForm] = useState({
//     name: "", description: "", venue: "", category: "SS2_SS3",
//     round1ParticipantLimit: 10, round1QuestionCount: 12,
//     round2ParticipantLimit: 5,  round2QuestionCount: 12,
//     eliminateAfterRound1: 5, questionsPerSubject: 3,
//     questionTimerSeconds: 60, tiebreakQuestionCount: 10,
//   });
//   const [saving, setSaving] = useState(false);
//   const [error,  setError]  = useState("");


//   const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

//   const handleSave = async () => {
//     if (!form.name.trim()) { setError("Event name is required."); return; }
//     try {
//       setSaving(true); setError("");
//       const res = await createEvent(form);
//       onCreated(res.event);
//       onClose();
//     } catch (err) {
//       setError(err?.response?.data?.message || "Failed to create event");
//     } finally { setSaving(false); }
//   };

//   return (
//     <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
//       PaperProps={{ sx: { borderRadius: 3 } }}>
//       <DialogTitle sx={{ fontWeight: 800, fontSize: 18, color: TEXT }}>
//         Create Quiz Event
//       </DialogTitle>
//       <DialogContent dividers>
//         {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
//         <Grid container spacing={2.5}>
//           <Grid item xs={12} sm={8}>
//             <TextField fullWidth label="Event Name *" value={form.name} onChange={set("name")} sx={sx} />
//           </Grid>
//           <Grid item xs={12} sm={4}>
//             <TextField fullWidth select label="Category" value={form.category} onChange={set("category")} sx={sx}>
//               {["SS2","SS3","SS2_SS3"].map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
//             </TextField>
//           </Grid>
//           <Grid item xs={12}>
//             <TextField fullWidth multiline rows={2} label="Description" value={form.description} onChange={set("description")} sx={sx} />
//           </Grid>
//           <Grid item xs={12} sm={6}>
//             <TextField fullWidth label="Venue" value={form.venue} onChange={set("venue")} sx={sx} />
//           </Grid>
//           <Grid item xs={12} sm={6}>
//             <TextField fullWidth type="number" label="Timer per question (seconds)" value={form.questionTimerSeconds} onChange={set("questionTimerSeconds")} sx={sx} />
//           </Grid>
//           <Grid item xs={12}><Divider><Typography sx={{ fontSize: 12, color: MUTED }}>ROUND CONFIGURATION</Typography></Divider></Grid>
//           <Grid item xs={6} sm={3}>
//             <TextField fullWidth type="number" label="R1 Participants" value={form.round1ParticipantLimit} onChange={set("round1ParticipantLimit")} sx={sx} />
//           </Grid>
//           <Grid item xs={6} sm={3}>
//             <TextField fullWidth type="number" label="R1 Questions" value={form.round1QuestionCount} onChange={set("round1QuestionCount")} sx={sx} />
//           </Grid>
//           <Grid item xs={6} sm={3}>
//             <TextField fullWidth type="number" label="R2 Participants" value={form.round2ParticipantLimit} onChange={set("round2ParticipantLimit")} sx={sx} />
//           </Grid>
//           <Grid item xs={6} sm={3}>
//             <TextField fullWidth type="number" label="R2 Questions" value={form.round2QuestionCount} onChange={set("round2QuestionCount")} sx={sx} />
//           </Grid>
//           <Grid item xs={6} sm={4}>
//             <TextField fullWidth type="number" label="Eliminate after R1 (keep top N)" value={form.eliminateAfterRound1} onChange={set("eliminateAfterRound1")} sx={sx} />
//           </Grid>
//           <Grid item xs={6} sm={4}>
//             <TextField fullWidth type="number" label="Questions per subject" value={form.questionsPerSubject} onChange={set("questionsPerSubject")} sx={sx} />
//           </Grid>
//           <Grid item xs={6} sm={4}>
//             <TextField fullWidth type="number" label="Tiebreak questions" value={form.tiebreakQuestionCount} onChange={set("tiebreakQuestionCount")} sx={sx} />
//           </Grid>
//         </Grid>
//       </DialogContent>
//       <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
//         <Button onClick={onClose} sx={{ textTransform: "none", color: MUTED }}>Cancel</Button>
//         <Button onClick={handleSave} variant="contained" disabled={saving}
//           sx={{ textTransform: "none", bgcolor: NAVY, fontWeight: 700, borderRadius: 2, "&:hover": { bgcolor: GREEN } }}>
//           {saving ? <CircularProgress size={18} color="inherit" /> : "Create Event"}
//         </Button>
//       </DialogActions>
//     </Dialog>
//   );
// }

function CreateEventDialog({ open, onClose, editing, onSaved }) {
  const blank = {
    name: "", description: "", venue: "", category: "SS2_SS3",
    round1ParticipantLimit: 10, round1QuestionCount: 12,
    round2ParticipantLimit: 5,  round2QuestionCount: 12,
    eliminateAfterRound1: 5, questionsPerSubject: 3,
    questionTimerSeconds: 60, round1TiebreakQuestionCount: 5,
    tiebreakQuestionCount: 10,
    round1TimerSeconds: 60, round2TimerSeconds: 60,
    round1TiebreakTimerSeconds: 30, round2TiebreakTimerSeconds: 30,
  };
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  useEffect(() => {
  if (editing) {
    setForm({
      name: editing.name, description: editing.description || "", venue: editing.venue || "",
      category: editing.category, round1ParticipantLimit: editing.round1ParticipantLimit,
      round1QuestionCount: editing.round1QuestionCount, round2ParticipantLimit: editing.round2ParticipantLimit,
      round2QuestionCount: editing.round2QuestionCount, eliminateAfterRound1: editing.eliminateAfterRound1,
      questionsPerSubject: editing.questionsPerSubject, questionTimerSeconds: editing.questionTimerSeconds,
      round1TiebreakQuestionCount: editing.round1TiebreakQuestionCount ?? 5,
      tiebreakQuestionCount: editing.tiebreakQuestionCount,
      round1TimerSeconds: editing.round1TimerSeconds ?? 60,
      round2TimerSeconds: editing.round2TimerSeconds ?? 60,
      round1TiebreakTimerSeconds: editing.round1TiebreakTimerSeconds ?? 30,
      round2TiebreakTimerSeconds: editing.round2TiebreakTimerSeconds ?? 30,
    });
  } else {
    setForm(blank);
  }
  setError("");
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [editing, open]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    if (!form.name.trim()) { setError("Event name is required."); return; }
    try {
      setSaving(true); setError("");
      if (editing) {
        const res = await updateEvent(editing.id, form);
        onSaved(res.event);
      } else {
        const res = await createEvent(form);
        onSaved(res.event);
      }
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || `Failed to ${editing ? "update" : "create"} event`);
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 800, fontSize: 18, color: TEXT }}>
        {editing ? "Edit Quiz Event" : "Create Quiz Event"}
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
          <Grid item xs={12}><Divider><Typography sx={{ fontSize: 12, color: MUTED }}>ROUND CONFIGURATION</Typography></Divider></Grid>
          <Grid item xs={6} sm={3}>
            <TextField fullWidth type="number" label="R1 Timer (s)" value={form.round1TimerSeconds} onChange={set("round1TimerSeconds")} sx={sx} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField fullWidth type="number" label="R2 Timer (s)" value={form.round2TimerSeconds} onChange={set("round2TimerSeconds")} sx={sx} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField fullWidth type="number" label="R1 Tiebreak Timer (s)" value={form.round1TiebreakTimerSeconds} onChange={set("round1TiebreakTimerSeconds")} sx={sx} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField fullWidth type="number" label="R2/Final Tiebreak Timer (s)" value={form.round2TiebreakTimerSeconds} onChange={set("round2TiebreakTimerSeconds")} sx={sx} />
          </Grid>
          
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
            <TextField fullWidth type="number" label="R1 Tiebreak Questions"
              value={form.round1TiebreakQuestionCount} onChange={set("round1TiebreakQuestionCount")} sx={sx} />
          </Grid>
          <Grid item xs={6} sm={4}>
            <TextField fullWidth type="number" label="R2/Final Tiebreak Questions"
              value={form.tiebreakQuestionCount} onChange={set("tiebreakQuestionCount")} sx={sx} />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={onClose} sx={{ textTransform: "none", color: MUTED }}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" disabled={saving}
          sx={{ textTransform: "none", bgcolor: NAVY, fontWeight: 700, borderRadius: 2, "&:hover": { bgcolor: GREEN } }}>
          {saving ? <CircularProgress size={18} color="inherit" /> : editing ? "Save Changes" : "Create Event"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Add Question Dialog ──────────────────────────────────────
function QuestionDialog({ open, onClose, eventId, editing, onSaved }) {
  const blank = {
    subject: "Biology", classLevel: "both", roundAssignment: "1",
    questionText: "", options: { A: "", B: "", C: "", D: "" },
    correctAnswer: "A", explanation: "", difficulty: "medium", marks: 1,
  };
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  useEffect(() => {
    if (editing) {
      setForm({
        subject: editing.subject, classLevel: editing.classLevel || "both",
        roundAssignment: editing.roundAssignment || "1",
        questionText: editing.questionText,
        options: editing.options || { A: "", B: "", C: "", D: "" },
        correctAnswer: editing.correctAnswer,
        explanation: editing.explanation || "",
        difficulty: editing.difficulty || "medium",
        marks: editing.marks || 1,
      });
    } else {
      setForm(blank);
    }
    setError("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing, open]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    if (!form.questionText.trim() || !form.options.A || !form.options.B || !form.options.C || !form.options.D)
      return setError("Question text and all 4 options are required.");
    try {
      setSaving(true); setError("");
      if (editing) {
        const res = await updateQuestion(eventId, editing.id, form);
        onSaved(res.question);
      } else {
        const res = await addQuestion(eventId, form);
        onSaved(res.question);
      }
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || `Failed to ${editing ? "update" : "add"} question`);
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 800, fontSize: 18, color: TEXT }}>
        {editing ? "Edit Question" : "Add Question"}
      </DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
        {editing?.status === "approved" && (
          <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
            This question is approved — saving changes will move it back to draft for re-approval.
          </Alert>
        )}
        <Grid container spacing={2}>
          <Grid item xs={6} sm={4}>
            <TextField fullWidth select label="Subject" value={form.subject} onChange={set("subject")} sx={sx}>
              {["Biology","Physics","Chemistry","Mathematics"].map((s) =>
                <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={6} sm={4}>
            <TextField fullWidth select label="Round" value={form.roundAssignment} onChange={set("roundAssignment")} sx={sx}>
              {[["1","Round 1"],["2","Round 2"],["round1_tiebreak","Round 1 Tiebreak"],["tiebreak","Round 2 / Final Tiebreak"]].map(([v,l]) =>
              <MenuItem key={v} value={v}>{l}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={6} sm={4}>
            <TextField fullWidth select label="Difficulty" value={form.difficulty} onChange={set("difficulty")} sx={sx}>
              {["easy","medium","hard"].map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <MathTextField label="Question Text *" value={form.questionText}
              onChange={(v) => setForm((f) => ({ ...f, questionText: v }))} multiline rows={3} />
          </Grid>
          {["A","B","C","D"].map((opt) => (
            <Grid item xs={12} sm={6} key={opt}>
              <MathTextField label={`Option ${opt} *`} value={form.options[opt]}
                onChange={(v) => setForm((f) => ({ ...f, options: { ...f.options, [opt]: v } }))} />
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
            <MathTextField label="Explanation (optional)" value={form.explanation}
              onChange={(v) => setForm((f) => ({ ...f, explanation: v }))} multiline rows={2} />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={onClose} sx={{ textTransform: "none", color: MUTED }}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" disabled={saving}
          sx={{ textTransform: "none", bgcolor: NAVY, fontWeight: 700, borderRadius: 2, "&:hover": { bgcolor: GREEN } }}>
          {saving ? <CircularProgress size={18} color="inherit" /> : editing ? "Save Changes" : "Add Question"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Live Control Panel ───────────────────────────────────────
function LiveControlPanel({ event, onRefresh, eventQuestions }) {
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

  const [tiebreakParticipantIds, setTiebreakParticipantIds] = useState([]);
  const [tiebreakQuestionIds, setTiebreakQuestionIds] = useState([]);

  const [finalData, setFinalData] = useState(null);
const [finalLoading, setFinalLoading] = useState(false);

const [selectedQualified, setSelectedQualified] = useState([]);

const [r1tbQuestionIds, setR1tbQuestionIds] = useState([]);
const [r1tbData, setR1tbData] = useState(null);       // review of the round-98 tiebreak results
const [r1tbLoading, setR1tbLoading] = useState(false);
const [selectedR1tbWinners, setSelectedR1tbWinners] = useState([]);

const [finalLeaderboard, setFinalLeaderboard] = useState(null);
const [finalLbLoading, setFinalLbLoading] = useState(false);

const loadFinalLeaderboard = async () => {
  try {
    setFinalLbLoading(true);
    const res = await getFinalLeaderboard(event.id); // add this to liveQuizService.js
    setFinalLeaderboard(res.finalScores);
  } catch (err) {
    setToast({ msg: err?.response?.data?.message || "Failed to load final leaderboard", severity: "error" });
  } finally {
    setFinalLbLoading(false);
  }
};

useEffect(() => {
  if (s === "completed") loadFinalLeaderboard();
}, [s]);


const loadRound1TiebreakReview = async () => {
  try {
    setR1tbLoading(true);
    const res = await getRound1TiebreakReview(event.id);
    setR1tbData(res);
    setSelectedR1tbWinners(res.tiebreakScores.slice(0, res.remainingSlots).map((s) => s.participantId));
  } catch (err) {
    setToast({ msg: err?.response?.data?.message || "Failed to load round 1 tiebreak review", severity: "error" });
  } finally {
    setR1tbLoading(false);
  }
};

const toggleR1tbWinner = (participantId) => {
  setSelectedR1tbWinners((ids) =>
    ids.includes(participantId) ? ids.filter((id) => id !== participantId) : [...ids, participantId]
  );
};

const loadFinalReview = async () => {
  try {
    setFinalLoading(true);
    const res = await getFinalRankingReview(event.id);
    setFinalData(res);
  } catch (err) {
    setToast({ msg: err?.response?.data?.message || "Failed to load final ranking", severity: "error" });
  } finally {
    setFinalLoading(false);
  }
};

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

// const loadEliminationReview = async () => {
//   try {
//     setElimLoading(true);
//     const res = await getEliminationReview(event.id);
//     setElimData(res);
//     setSelectedQualified(res.scores.slice(0, res.qualifyCount).map((s) => s.participantId));
//   } catch (err) {
//     setToast({ msg: err?.response?.data?.message || "Failed to load elimination review", severity: "error" });
//   } finally {
//     setElimLoading(false);
//   }
// };

const loadEliminationReview = async () => {
  try {
    setElimLoading(true);
    const res = await getEliminationReview(event.id);
    setElimData(res);
    if (!res.needsTiebreak) {
      setSelectedQualified([...res.clearlyQualifiedIds, ...res.tiedGroupIds]);
    }
  } catch (err) {
    setToast({ msg: err?.response?.data?.message || "Failed to load elimination review", severity: "error" });
  } finally {
    setElimLoading(false);
  }
};

const toggleQualified = (participantId) => {
  setSelectedQualified((ids) =>
    ids.includes(participantId) ? ids.filter((id) => id !== participantId) : [...ids, participantId]
  );
};



    // Falls back to event.status only until the first dashboard poll lands.
  // Once auto-advance is live, the server changes state without any admin
  // click, so these buttons must react to the polled dashboard, not just
  // to onRefresh() (which only fires after this admin's own action).
  // const s = dashboard?.event?.status ?? event.status;
  // const activeRoundDisplay = dashboard?.event?.activeRound ?? event.activeRound;

  // const isR1Open    = s === "round1_question_open";
  // const isR2Open    = s === "round2_question_open";
  // const isOpen      = isR1Open || isR2Open || s === "tiebreak_active";
  // const isLocked    = s === "round1_question_locked" || s === "round2_question_locked";
  // const isRevealed  = s === "round1_result_revealed"  || s === "round2_result_revealed";
  // const isIntro     = s === "round1_intro" || s === "round2_intro";
  // const isR1Done    = s === "round1_completed";
  // const isR2Done    = s === "round2_completed";
  // const isPaused    = s === "paused";
  // const canVoid     = isOpen || isLocked;

    const s = dashboard?.event?.status ?? event.status;
  const activeRoundDisplay = dashboard?.event?.activeRound ?? event.activeRound;
  const cq = dashboard?.currentQuestion; // the live QuizRoundQuestion record, or null/undefined

  // Question-phase state comes from the actual round-question record —
  // this works uniformly for Round 1, Round 2, and the tiebreak (round 99),
  // none of which get their own per-question event.status strings.
  const isOpen     = cq?.status === "open";
  const isLocked   = cq?.status === "locked";
  const isRevealed = cq?.status === "revealed";

  // "Ready to open the next question" — no live question right now, but
  // we're in an active round phase (round intro, post-reveal, or anywhere
  // inside an ongoing tiebreak) rather than a round-boundary/admin-review state.
const roundInProgress = [
  "round1_intro", "round1_question_open", "round1_question_locked", "round1_result_revealed",
  "round1_tiebreak_active",   // ← add this
  "round2_intro", "round2_question_open", "round2_question_locked", "round2_result_revealed",
  "tiebreak_active",
].includes(s);
  const isIntro = roundInProgress && !cq;

  const isR1Done = s === "round1_completed";
  const isR2Done = s === "round2_completed";
  const isPaused = s === "paused";
  const canVoid  = isOpen || isLocked;

  const cfg = STATUS_CFG[s] || STATUS_CFG.draft;





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

      {r1tbData && (
        <Dialog open={!!r1tbData} onClose={() => setR1tbData(null)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
          <DialogTitle sx={{ fontWeight: 800 }}>Round 1 Tiebreak Result — Choose who advances</DialogTitle>
          <DialogContent dividers>
            <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
              {r1tbData.remainingSlots} slot(s) remain for Round 2. Top {r1tbData.remainingSlots} by tiebreak score are
              pre-checked — adjust as needed.
            </Alert>
            <Table size="small">
              <TableHead>
                <TableRow>{["Advance","Name","School","Tiebreak Score"].map((h) =>
                  <TableCell key={h} sx={{ fontWeight: 700, color: MUTED, fontSize: 12 }}>{h}</TableCell>)}</TableRow>
              </TableHead>
              <TableBody>
                {r1tbData.tiebreakScores.map((s) => {
                  const checked = selectedR1tbWinners.includes(s.participantId);
                  return (
                    <TableRow key={s.id} sx={{ bgcolor: checked ? `${GREEN}08` : "transparent" }}>
                      <TableCell padding="checkbox">
                        <input type="checkbox" checked={checked} onChange={() => toggleR1tbWinner(s.participantId)} />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{s.QuizParticipant?.name}</TableCell>
                      <TableCell sx={{ color: MUTED }}>{s.QuizParticipant?.school}</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>{s.totalMarks}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
            <Typography sx={{ fontSize: 12, color: MUTED, mr: "auto", alignSelf: "center" }}>
              {selectedR1tbWinners.length} advancing from the tiebreak
            </Typography>
            <Button onClick={() => setR1tbData(null)} sx={{ textTransform: "none", color: MUTED }}>Close</Button>
            <Button variant="contained" disabled={submitting || selectedR1tbWinners.length === 0}
              onClick={async () => {
                const qualified  = [...r1tbData.clearlyQualifiedIds, ...selectedR1tbWinners];
                const eliminated = [
                  ...r1tbData.clearlyEliminatedIds,
                  ...r1tbData.tiebreakScores.map((s) => s.participantId).filter((id) => !selectedR1tbWinners.includes(id)),
                ];
                await action(
                  () => confirmElimination(event.id, { qualifiedParticipantIds: qualified, eliminatedParticipantIds: eliminated }),
                  "Round 2 started!"
                );
                setR1tbData(null);
              }}
              sx={{ textTransform: "none", bgcolor: NAVY, fontWeight: 700, borderRadius: 2, "&:hover": { bgcolor: GREEN } }}>
              Confirm & Start Round 2
            </Button>
          </DialogActions>
        </Dialog>
      )}

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
          {s === "round1_tiebreak_completed" && (
              <Button variant="contained" startIcon={<Group />} disabled={r1tbLoading}
                onClick={loadRound1TiebreakReview}
                sx={{ textTransform: "none", bgcolor: RED, fontWeight: 700, borderRadius: 2 }}>
                {r1tbLoading ? <CircularProgress size={18} color="inherit" /> : "Review Round 1 Tiebreak Result"}
              </Button>
            )}
         {isR2Done && (
            <Button variant="contained" startIcon={<Group />} disabled={finalLoading}
              onClick={loadFinalReview}
              sx={{ textTransform: "none", bgcolor: RED, fontWeight: 700, borderRadius: 2 }}>
              {finalLoading ? <CircularProgress size={18} color="inherit" /> : "Review Final Ranking"}
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
              <TableBody>
                {dashboard.scores.map((s) => {
                  const medal = medalColor(s.rank);
                  return (
                    <TableRow key={s.id} sx={{ bgcolor: s.rank <= 5 ? `${GREEN}06` : "transparent" }}>
                      <TableCell sx={{ fontWeight: 800, color: medal || TEXT }}>
                        {medal
                          ? <EmojiEvents sx={{ fontSize: 16, color: medal, verticalAlign: "middle", mr: 0.5 }} />
                          : null}
                        {s.rank}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{s.QuizParticipant?.name}</TableCell>
                      <TableCell sx={{ color: MUTED, fontSize: 12 }}>{s.QuizParticipant?.school}</TableCell>
                      <TableCell sx={{ color: GREEN, fontWeight: 700 }}>{s.correctCount}</TableCell>
                      <TableCell sx={{ color: RED }}>{s.incorrectCount}</TableCell>
                      <TableCell sx={{ color: MUTED }}>{s.unansweredCount}</TableCell>
                      <TableCell sx={{ fontWeight: 800, fontSize: 15 }}>{s.totalMarks}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </TableBody>
          </Table>
        </Paper>
      )}

            {/* Final Leaderboard — combined Round 1 + Round 2 (+ tiebreak), shown once the event is completed */}
      {s === "completed" && (
        <Paper elevation={0} sx={{ border: `1px solid ${BORDER}`, borderRadius: 3, overflow: "hidden", mb: 3 }}>
          <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography sx={{ fontWeight: 800, fontSize: 15, color: TEXT }}>Final Leaderboard</Typography>
            {finalLbLoading && <CircularProgress size={16} />}
          </Box>
          {finalLeaderboard?.length > 0 ? (
            <Table size="small">
              <TableHead>
                <TableRow>
                  {["#","Participant","School","Final Score"].map((h) => (
                    <TableCell key={h} sx={{ fontWeight: 700, color: MUTED, fontSize: 12 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {finalLeaderboard.map((f) => {
                  const rank = f.participant.finalRank;
                  const medal = medalColor(rank);
                  return (
                    <TableRow key={f.participant.id} sx={{ bgcolor: rank <= 5 ? `${GREEN}06` : "transparent" }}>
                      <TableCell sx={{ fontWeight: 800, color: medal || TEXT }}>
                        {medal
                          ? <EmojiEvents sx={{ fontSize: 16, color: medal, verticalAlign: "middle", mr: 0.5 }} />
                          : null}
                        {rank}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{f.participant.name}</TableCell>
                      <TableCell sx={{ color: MUTED, fontSize: 12 }}>{f.participant.school}</TableCell>
                      <TableCell sx={{ fontWeight: 800, fontSize: 15 }}>{f.finalScore}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            !finalLbLoading && (
              <Typography sx={{ p: 3, textAlign: "center", color: MUTED, fontSize: 13 }}>
                No final results yet.
              </Typography>
            )
          )}
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
      {elimData.needsTiebreak ? (
        <>
          <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
            <strong>{elimData.tiedGroup.length} participants are tied at score {elimData.boundaryScore}</strong>,
            but only {elimData.remainingSlots} slot(s) remain after the {elimData.clearlyQualified.length} clear
            qualifier(s). Run a tiebreak among the tied group to decide who fills the remaining slot(s) —
            a positional cutoff would decide this arbitrarily.
          </Alert>

          <Typography sx={{ fontWeight: 700, fontSize: 13, color: TEXT, mb: 1 }}>Tied participants</Typography>
          <Table size="small" sx={{ mb: 2 }}>
            <TableHead>
              <TableRow>{["Name","School","Score"].map((h) =>
                <TableCell key={h} sx={{ fontWeight: 700, color: MUTED, fontSize: 12 }}>{h}</TableCell>)}</TableRow>
            </TableHead>
            <TableBody>
              {elimData.tiedGroup.map((s) => (
                <TableRow key={s.id}>
                  <TableCell sx={{ fontWeight: 700 }}>{s.QuizParticipant?.name}</TableCell>
                  <TableCell sx={{ color: MUTED }}>{s.QuizParticipant?.school}</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>{s.totalMarks}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Divider sx={{ my: 2 }}><Typography sx={{ fontSize: 12, color: MUTED }}>SELECT TIEBREAK QUESTIONS (approved only)</Typography></Divider>
          <Stack spacing={0.5} sx={{ maxHeight: 220, overflowY: "auto" }}>
            {(eventQuestions || []).filter((q) => q.status === "approved" && q.roundAssignment === "round1_tiebreak").map((q) => {
              const checked = r1tbQuestionIds.includes(q.id);
              return (
                <Box key={q.id} sx={{ display: "flex", alignItems: "flex-start", gap: 1, p: 0.75,
                                       border: `1px solid ${BORDER}`, borderRadius: 1.5 }}>
                  <input type="checkbox" checked={checked} style={{ marginTop: 4 }}
                    onChange={() => setR1tbQuestionIds((ids) =>
                      checked ? ids.filter((id) => id !== q.id) : [...ids, q.id])} />
                  <Box>
                    <Typography sx={{ fontSize: 12, fontWeight: 600 }} noWrap>{q.questionText}</Typography>
                    <Typography sx={{ fontSize: 10, color: MUTED }}>{q.subject} · {q.difficulty}</Typography>
                  </Box>
                </Box>
              );
            })}
          </Stack>
        </>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              {["Advance","Name","School","Score"].map((h) => (
                <TableCell key={h} sx={{ fontWeight: 700, color: MUTED, fontSize: 12 }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {elimData.scores.map((s) => {
              const checked = selectedQualified.includes(s.participantId);
              return (
                <TableRow key={s.id} sx={{ bgcolor: checked ? `${GREEN}08` : `rgba(239,68,68,0.05)` }}>
                  <TableCell padding="checkbox">
                    <input type="checkbox" checked={checked} onChange={() => toggleQualified(s.participantId)} />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{s.QuizParticipant?.name}</TableCell>
                  <TableCell sx={{ color: MUTED }}>{s.QuizParticipant?.school}</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>{s.totalMarks}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </DialogContent>
    <DialogActions sx={{ px: 3, pb: 2.5, gap: 1, flexWrap: "wrap" }}>
      <Button onClick={() => setElimData(null)} sx={{ textTransform: "none", color: MUTED }}>Close</Button>
      {elimData.needsTiebreak ? (
        <Button variant="contained" disabled={submitting || r1tbQuestionIds.length === 0}
          onClick={async () => {
            await action(
              () => startRound1Tiebreak(event.id, {
                tiedParticipantIds: elimData.tiedGroupIds,
                questionIds: r1tbQuestionIds,
              }),
              "Round 1 tiebreak started!"
            );
            setElimData(null);
            setR1tbQuestionIds([]);
          }}
          sx={{ textTransform: "none", bgcolor: GOLD, color: NAVY, fontWeight: 700, borderRadius: 2 }}>
          Start Round 1 Tiebreak
        </Button>
      ) : (
        <Button variant="contained" disabled={submitting || selectedQualified.length === 0}
          onClick={async () => {
            const eliminated = elimData.scores
              .map((s) => s.participantId)
              .filter((id) => !selectedQualified.includes(id));
            await action(
              () => confirmElimination(event.id, {
                qualifiedParticipantIds: selectedQualified,
                eliminatedParticipantIds: eliminated,
              }),
              "Round 2 started!"
            );
            setElimData(null);
          }}
          sx={{ textTransform: "none", bgcolor: NAVY, fontWeight: 700, borderRadius: 2, "&:hover": { bgcolor: GREEN } }}>
          Confirm & Start Round 2
        </Button>
      )}
    </DialogActions>
  </Dialog>
)}


      {/* ← ADD THE NEW FINAL RANKING DIALOG HERE */}
      {finalData && (
        <Dialog open={!!finalData} onClose={() => setFinalData(null)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
          <DialogTitle sx={{ fontWeight: 800 }}>Final Ranking Review</DialogTitle>
          <DialogContent dividers>
            {!finalData.hasTies && (
              <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>No ties detected — ranking is final.</Alert>
            )}
            {finalData.tiedGroups.map((g, idx) => (
              <Alert key={idx} severity="warning" sx={{ mb: 1, borderRadius: 2 }}>
                Rank {g.rankStart}{g.rankStart !== g.rankEnd ? `–${g.rankEnd}` : ""} tied at score {g.score}:{" "}
                {g.participants.map((p) => p.QuizParticipant?.name).join(", ")}
              </Alert>
            ))}

            <Divider sx={{ my: 2 }}><Typography sx={{ fontSize: 12, color: MUTED }}>SELECT TIEBREAK PARTICIPANTS</Typography></Divider>
            <Table size="small">
              <TableHead>
                <TableRow>{["Include","Name","School","Round 2 Score"].map((h) =>
                  <TableCell key={h} sx={{ fontWeight: 700, color: MUTED, fontSize: 12 }}>{h}</TableCell>)}</TableRow>
              </TableHead>
              <TableBody>
                {finalData.scores.map((s) => {
                  const checked = tiebreakParticipantIds.includes(s.participantId);
                  return (
                    <TableRow key={s.id}>
                      <TableCell padding="checkbox">
                        <input type="checkbox" checked={checked}
                          onChange={() => setTiebreakParticipantIds((ids) =>
                            checked ? ids.filter((id) => id !== s.participantId) : [...ids, s.participantId])} />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{s.QuizParticipant?.name}</TableCell>
                      <TableCell sx={{ color: MUTED }}>{s.QuizParticipant?.school}</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>{s.totalMarks}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            <Divider sx={{ my: 2 }}><Typography sx={{ fontSize: 12, color: MUTED }}>SELECT TIEBREAK QUESTIONS (approved only)</Typography></Divider>
            <Stack spacing={0.5} sx={{ maxHeight: 220, overflowY: "auto" }}>
              {(eventQuestions || []).filter((q) => q.status === "approved" && q.roundAssignment === "tiebreak").map((q) => {
                const checked = tiebreakQuestionIds.includes(q.id);
                return (
                  <Box key={q.id} sx={{ display: "flex", alignItems: "flex-start", gap: 1, p: 0.75,
                                        border: `1px solid ${BORDER}`, borderRadius: 1.5 }}>
                    <input type="checkbox" checked={checked} style={{ marginTop: 4 }}
                      onChange={() => setTiebreakQuestionIds((ids) =>
                        checked ? ids.filter((id) => id !== q.id) : [...ids, q.id])} />
                    <Box>
                      <Typography sx={{ fontSize: 12, fontWeight: 600 }} noWrap>{q.questionText}</Typography>
                      <Typography sx={{ fontSize: 10, color: MUTED }}>{q.subject} · {q.difficulty}</Typography>
                    </Box>
                  </Box>
                );
              })}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
            <Typography sx={{ fontSize: 12, color: MUTED, mr: "auto", alignSelf: "center" }}>
              {tiebreakParticipantIds.length} participants · {tiebreakQuestionIds.length} questions
            </Typography>
            <Button onClick={() => setFinalData(null)} sx={{ textTransform: "none", color: MUTED }}>Close</Button>
            <Button variant="contained" disabled={submitting || tiebreakParticipantIds.length < 2 || tiebreakQuestionIds.length === 0}
              onClick={async () => {
                await action(
                  () => startTiebreak(event.id, {
                    tiedParticipantIds: tiebreakParticipantIds,
                    questionIds: tiebreakQuestionIds,
                  }),
                  "Tiebreak started!"
                );
                setFinalData(null);
                setTiebreakParticipantIds([]);
                setTiebreakQuestionIds([]);
              }}
              sx={{ textTransform: "none", bgcolor: GOLD, color: NAVY, fontWeight: 700, borderRadius: 2 }}>
              Start Tiebreak
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

  const [editingQuestion, setEditingQuestion] = useState(null); // null = add mode, object = edit mode
  const [deleteQTarget, setDeleteQTarget] = useState(null);

  const [editingParticipant, setEditingParticipant] = useState(null);
  const [deletePTarget, setDeletePTarget] = useState(null);
  const [restarting, setRestarting] = useState(false);

  const [editingEvent, setEditingEvent] = useState(null); // null = create mode
  const [deleteEventTarget, setDeleteEventTarget] = useState(null);

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
                        <Chip label={(STATUS_CFG[ev.status] || STATUS_CFG.draft).label} size="small"
                          sx={{ bgcolor: (STATUS_CFG[ev.status] || STATUS_CFG.draft).bg,
                                color: (STATUS_CFG[ev.status] || STATUS_CFG.draft).color, fontWeight: 800, flexShrink: 0 }} />
                      </Box>
                      <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                        {!["completed","cancelled"].includes(ev.status) && (
                          <Button size="small" onClick={(e) => { e.stopPropagation(); setEditingEvent(ev); }}
                            sx={{ textTransform: "none", fontSize: 11, p: 0, minWidth: 0, color: NAVY }}>
                            Edit
                          </Button>
                        )}
                        <Button size="small" onClick={(e) => { e.stopPropagation(); setDeleteEventTarget(ev); }}
                          sx={{ textTransform: "none", fontSize: 11, p: 0, minWidth: 0, color: RED }}>
                          Delete
                        </Button>
                      </Stack>
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

          <Dialog open={!!deleteEventTarget} onClose={() => setDeleteEventTarget(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
            <DialogTitle sx={{ fontWeight: 800 }}>Delete Event?</DialogTitle>
            <DialogContent>
              <Alert severity="warning" sx={{ borderRadius: 2 }}>
                This permanently deletes "{deleteEventTarget?.name}" — participants, questions, rounds, scores, and audit
                history included. This can't be undone.
              </Alert>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
              <Button onClick={() => setDeleteEventTarget(null)} sx={{ textTransform: "none", color: MUTED }}>Cancel</Button>
              <Button variant="contained"
                onClick={async () => {
                  try {
                    await deleteEvent(deleteEventTarget.id);
                    setEvents((evs) => evs.filter((e) => e.id !== deleteEventTarget.id));
                    if (selectedEvt === deleteEventTarget.id) { setSelectedEvt(null); setEventDetail(null); }
                    setToast({ msg: "Event deleted", severity: "success" });
                  } catch (err) {
                    setToast({ msg: err?.response?.data?.message || "Failed to delete event", severity: "error" });
                  } finally { setDeleteEventTarget(null); }
                }}
                sx={{ textTransform: "none", bgcolor: RED, fontWeight: 700, borderRadius: 2 }}>
                Delete Permanently
              </Button>
            </DialogActions>
          </Dialog>

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

                          {eventDetail.status !== "draft" && (
                          <Button variant="outlined" size="small" disabled={restarting}
                            onClick={async () => {
                              if (!window.confirm("Restart this event? All answers and scores will be cleared. Participants and questions are kept.")) return;
                              try {
                                setRestarting(true);
                                await restartEvent(eventDetail.id);
                                loadDetail(eventDetail.id);
                                setTab(0);
                                setToast({ msg: "Event restarted", severity: "success" });
                              } catch (err) {
                                setToast({ msg: err?.response?.data?.message || "Failed to restart", severity: "error" });
                              } finally { setRestarting(false); }
                            }}
                            sx={{ textTransform: "none", borderColor: RED, color: RED, fontWeight: 700, borderRadius: 2 }}>
                            {restarting ? <CircularProgress size={16} /> : "Restart Event"}
                          </Button>
                        )}
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
                              <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                                <Button size="small"
                                  onClick={() => navigator.clipboard.writeText(`${window.location.origin}/quiz/join/${p.participantCode}`)}
                                  sx={{ textTransform: "none", fontSize: 10, p: 0, minWidth: 0, color: GREEN }}>
                                  Copy link
                                </Button>
                                <Button size="small" onClick={() => setEditingParticipant(p)}
                                  sx={{ textTransform: "none", fontSize: 10, p: 0, minWidth: 0, color: NAVY }}>
                                  Edit
                                </Button>
                                <Button size="small" onClick={() => setDeletePTarget(p)}
                                  sx={{ textTransform: "none", fontSize: 10, p: 0, minWidth: 0, color: RED }}>
                                  Delete
                                </Button>
                              </Stack>
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

                  {editingParticipant && (
                    <Dialog open={!!editingParticipant} onClose={() => setEditingParticipant(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                      <DialogTitle sx={{ fontWeight: 800 }}>Edit Participant</DialogTitle>
                      <DialogContent dividers>
                        <Stack spacing={2} sx={{ mt: 0.5 }}>
                          <TextField fullWidth label="Name" value={editingParticipant.name}
                            onChange={(e) => setEditingParticipant((p) => ({ ...p, name: e.target.value }))} sx={sx} />
                          <TextField fullWidth label="School" value={editingParticipant.school || ""}
                            onChange={(e) => setEditingParticipant((p) => ({ ...p, school: e.target.value }))} sx={sx} />
                          <TextField fullWidth select label="Class" value={editingParticipant.classLevel || "SS3"}
                            onChange={(e) => setEditingParticipant((p) => ({ ...p, classLevel: e.target.value }))} sx={sx}>
                            <MenuItem value="SS2">SS2</MenuItem>
                            <MenuItem value="SS3">SS3</MenuItem>
                          </TextField>
                        </Stack>
                      </DialogContent>
                      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                        <Button onClick={() => setEditingParticipant(null)} sx={{ textTransform: "none", color: MUTED }}>Cancel</Button>
                        <Button variant="contained"
                          onClick={async () => {
                            try {
                              await updateParticipant(eventDetail.id, editingParticipant.id, {
                                name: editingParticipant.name, school: editingParticipant.school, classLevel: editingParticipant.classLevel,
                              });
                              setToast({ msg: "Participant updated", severity: "success" });
                              loadDetail(eventDetail.id);
                            } catch (err) {
                              setToast({ msg: err?.response?.data?.message || "Failed to update", severity: "error" });
                            } finally { setEditingParticipant(null); }
                          }}
                          sx={{ textTransform: "none", bgcolor: NAVY, fontWeight: 700, borderRadius: 2 }}>
                          Save
                        </Button>
                      </DialogActions>
                    </Dialog>
                  )}

                  <Dialog open={!!deletePTarget} onClose={() => setDeletePTarget(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                    <DialogTitle sx={{ fontWeight: 800 }}>Delete Participant?</DialogTitle>
                    <DialogContent>
                      <Typography sx={{ fontSize: 14, color: MUTED }}>
                        This can't be undone. If they've already answered questions, delete will be blocked — disqualify them instead.
                      </Typography>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                      <Button onClick={() => setDeletePTarget(null)} sx={{ textTransform: "none", color: MUTED }}>Cancel</Button>
                      <Button variant="contained"
                        onClick={async () => {
                          try {
                            await deleteParticipant(eventDetail.id, deletePTarget.id);
                            setToast({ msg: "Participant deleted", severity: "success" });
                            loadDetail(eventDetail.id);
                          } catch (err) {
                            setToast({ msg: err?.response?.data?.message || "Failed to delete", severity: "error" });
                          } finally { setDeletePTarget(null); }
                        }}
                        sx={{ textTransform: "none", bgcolor: RED, fontWeight: 700, borderRadius: 2 }}>
                        Delete
                      </Button>
                    </DialogActions>
                  </Dialog>

                  <Dialog open={!!deleteQTarget} onClose={() => setDeleteQTarget(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                    <DialogTitle sx={{ fontWeight: 800 }}>Delete Question?</DialogTitle>
                    <DialogContent>
                      <Typography sx={{ fontSize: 14, color: MUTED }}>
                        This removes it from the question bank and any pending round assignment. This can't be undone.
                      </Typography>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                      <Button onClick={() => setDeleteQTarget(null)} sx={{ textTransform: "none", color: MUTED }}>Cancel</Button>
                      <Button variant="contained"
                        onClick={async () => {
                          try {
                            await deleteQuestion(eventDetail.id, deleteQTarget.id);
                            setToast({ msg: "Question deleted", severity: "success" });
                            loadDetail(eventDetail.id);
                          } catch (err) {
                            setToast({ msg: err?.response?.data?.message || "Failed to delete", severity: "error" });
                          } finally { setDeleteQTarget(null); }
                        }}
                        sx={{ textTransform: "none", bgcolor: RED, fontWeight: 700, borderRadius: 2 }}>
                        Delete
                      </Button>
                    </DialogActions>
                  </Dialog>

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
                              <TableCell>
                                <Stack direction="row" spacing={0.5}>
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
                                  <Button size="small" onClick={() => setEditingQuestion(q)}
                                    sx={{ textTransform: "none", fontSize: 11, color: NAVY, minWidth: 0 }}>
                                    Edit
                                  </Button>
                                  <Button size="small" onClick={() => setDeleteQTarget(q)}
                                    sx={{ textTransform: "none", fontSize: 11, color: RED, minWidth: 0 }}>
                                    Delete
                                  </Button>
                                </Stack>
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
                    <LiveControlPanel event={eventDetail} onRefresh={() => loadDetail(eventDetail.id)} eventQuestions={eventDetail.questions} />
                  )}
                </Box>
              </Paper>
            </Grid>
          )}
        </Grid>
      </Box>

      <CreateEventDialog  open={createOpen || !!editingEvent}
    onClose={() => { setCreateOpen(false); setEditingEvent(null); }}
    editing={editingEvent}
    onSaved={(ev) => {
      if (editingEvent) {
        setEvents((evs) => evs.map((e) => (e.id === ev.id ? ev : e)));
        if (selectedEvt === ev.id) loadDetail(ev.id);
      } else {
        setEvents((evs) => [ev, ...evs]);
        setSelectedEvt(ev.id);
      }
      setCreateOpen(false);
      setEditingEvent(null);
  }} />

      {eventDetail && (
        <QuestionDialog
            open={addQOpen || !!editingQuestion}
            onClose={() => { setAddQOpen(false); setEditingQuestion(null); }}
            eventId={eventDetail?.id}
            editing={editingQuestion}
            onSaved={() => { loadDetail(eventDetail.id); setAddQOpen(false); setEditingQuestion(null); }}
          />
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