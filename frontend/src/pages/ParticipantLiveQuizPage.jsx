// pages/quiz/ParticipantQuizPage.jsx
//
// Participant-facing live quiz screen.
// Flow: join by code → wait for event to start → answer questions
// live (question opens → participant answers → question locks →
// result reveals) → see own results after rounds/event complete.
//
// Real-time via Socket.io, with REST polling (getEventState) as a
// fallback safety net in case a socket event is ever missed —
// matches the same pattern used in the admin Live Control panel.

import {
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";

import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import {
  Box, Typography, Paper, Button, Chip, Stack, TextField,
  CircularProgress, Alert, Snackbar, Grid, LinearProgress, Divider, GlobalStyles,
} from "@mui/material";
import {
  CheckCircle, Cancel, WifiOff, EmojiEvents, HelpOutline,
  PauseCircle, Announcement,
} from "@mui/icons-material";


import { getEventState, joinEvent, submitAnswer, getMyResults, sendHeartbeat, } from "../services/liveQuizService";

import API from "../services/api";
import QuestionPreview from "../components/quiz/QuestionPreview";


// ─── Design tokens (matches AdminQuizManager) ─────────────────
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

const STORAGE_KEY = "quiz_participant_code";
const HEARTBEAT_MS = 15000;
const POLL_FALLBACK_MS = 4000; // safety-net poll; socket is primary source of truth

export default function ParticipantQuizPage() {
  // ── Session ──────────────────────────────────────────────
  const [participant, setParticipant] = useState(null);
  const [event,       setEvent]       = useState(null); // latest known event summary
  const [codeInput,   setCodeInput]   = useState("");
  const [joining,     setJoining]     = useState(false);
  const [joinError,   setJoinError]   = useState("");

  // ── Live state ───────────────────────────────────────────
  const [eventStatus,       setEventStatus]       = useState(null);
  const [participantStatus, setParticipantStatus] = useState(null);
  const [currentQuestion,   setCurrentQuestion]    = useState(null); // {roundQuestionId, status, question, openedAt, sequenceNumber, totalSeconds}
  const [myAnswer,          setMyAnswer]           = useState(null);
  const [myScore,           setMyScore]            = useState(null);
  const [selected,           setSelected]          = useState(null); // locally selected option, pre-submit confirmation
  const [submitting,         setSubmitting]        = useState(false);
  const [secondsLeft,        setSecondsLeft]       = useState(null);
  const [announcement,       setAnnouncement]      = useState(null);
  const [connected,          setConnected]         = useState(false);
  const [toast,              setToast]             = useState(null);
  const [finalResults,       setFinalResults]      = useState(null);
  const [waitingForTiebreak, setWaitingForTiebreak] = useState(false);

  const [saving, setSaving] = useState(false);

  const [obscured, setObscured] = useState(false);
  const lastWarnRef = useRef(0);

  const pendingPickRef = useRef(null); // { roundQuestionId, option } — latest unsent pick
  const savingRef      = useRef(false);

  const socketRef        = useRef(null);
  const timerIntervalRef = useRef(null);
  const answeringSentRef = useRef(false); // avoid spamming quiz:answering on every keystroke-equivalent click

  // Mutable "current values" refs — needed because startTimer's tick
  // callback and the socket handlers are set up once (per participant/
  // event) and would otherwise close over stale state from whichever
  // render they were created in.
  const selectedRef        = useRef(null);
  const myAnswerRef        = useRef(null);
  const currentQuestionRef = useRef(null);

  useEffect(() => { selectedRef.current = selected; }, [selected]);
  useEffect(() => { myAnswerRef.current = myAnswer; }, [myAnswer]);
  useEffect(() => { currentQuestionRef.current = currentQuestion; }, [currentQuestion]);

  const { code: urlCode } = useParams();

  useEffect(() => {
    const savedCode = sessionStorage.getItem(STORAGE_KEY);
    const codeToUse = urlCode?.trim().toUpperCase() || savedCode;
    if (codeToUse) {
      setCodeInput(codeToUse);
      attemptJoin(codeToUse, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlCode]);



useEffect(() => {
  if (!participant) return;

  const warn = (msg) => {
    const now = Date.now();
    if (now - lastWarnRef.current < 3000) return; // don't spam toasts
    lastWarnRef.current = now;
    setToast({ msg, severity: "warning" });
  };

  const block = (e) => { e.preventDefault(); warn("Copying and right-click are disabled during the quiz."); };

  const onKeyDown = (e) => {
    const k = e.key.toLowerCase();
    const mod = e.ctrlKey || e.metaKey;
    if (
      (mod && ["c", "x", "v", "a", "p", "s", "u"].includes(k)) ||
      (mod && e.shiftKey && ["i", "j", "c", "s"].includes(k)) ||
      e.key === "F12"
    ) {
      e.preventDefault();
      warn("That shortcut is disabled during the quiz.");
    }
  };

  const onKeyUp = (e) => {
    if (e.key === "PrintScreen") {
      navigator.clipboard?.writeText("").catch(() => {}); // wipe whatever was captured
      warn("Screenshots are not allowed during the quiz.");
    }
  };

  const hide = () => setObscured(true);
  const show = () => { if (document.visibilityState === "visible") setObscured(false); };

  const onVisibility = () => (document.hidden ? hide() : show());

  document.addEventListener("contextmenu", block);
  document.addEventListener("copy", block);
  document.addEventListener("cut", block);
  document.addEventListener("paste", block);
  document.addEventListener("dragstart", block);
  document.addEventListener("selectstart", block);
  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", hide);
  window.addEventListener("focus", show);
  document.addEventListener("visibilitychange", onVisibility);;

  return () => {
    document.removeEventListener("contextmenu", block);
    document.removeEventListener("copy", block);
    document.removeEventListener("cut", block);
    document.removeEventListener("paste", block);
    document.removeEventListener("dragstart", block);
    document.removeEventListener("selectstart", block);
    document.removeEventListener("keydown", onKeyDown);
    document.removeEventListener("keyup", onKeyUp);
    window.removeEventListener("blur", hide);
    window.removeEventListener("focus", show);
    document.removeEventListener("visibilitychange", onVisibility);
  };
}, [participant?.id]);

// Faint repeating watermark tying the screen to this participant
const watermarkUrl = participant
  ? (() => {
      const label = `${participant.name} · ${participant.participantCode}`
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      const svg =
        `<svg xmlns="http://www.w3.org/2000/svg" width="260" height="140">` +
        `<text x="20" y="80" font-size="14" font-family="sans-serif" fill="rgba(0,0,0,0.07)" ` +
        `transform="rotate(-25 130 70)">${label}</text></svg>`;
      return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
    })()
  : null;


  // ── Join flow ────────────────────────────────────────────
  const attemptJoin = async (code, silent = false) => {
    if (!code?.trim()) return;
    try {
      if (!silent) setJoining(true);
      setJoinError("");
      const res = await joinEvent(code.trim());
      setParticipant(res.participant);
      setEvent(res.event);
      setEventStatus(res.event.status);
      setParticipantStatus(res.participant.status);
      sessionStorage.setItem(STORAGE_KEY, code.trim());
    } catch (err) {
      sessionStorage.removeItem(STORAGE_KEY);
      if (!silent) {
        setJoinError(err?.response?.data?.message || "Failed to join. Check your code and try again.");
      }
    } finally {
      setJoining(false);
    }
  };

  // ── Auto-submit whatever's currently selected, if anything ──────
  // Called either when the local countdown hits 0, or when the server
  // locks the question early (everyone else finished first). Silently
  // ignores failures — a 409 here just means the question was already
  // locked by the time this fired, which is fine, nothing to do.
  const attemptAutoSubmit = async () => {
    const cq = currentQuestionRef.current;
    const sel = selectedRef.current;
    const alreadySubmitted = !!myAnswerRef.current?.selectedOption;
    if (!cq || cq.status !== "open" || !sel || alreadySubmitted) return;

    try {
      await submitAnswer(event.id, {
        participantId: participant.id,
        roundQuestionId: cq.roundQuestionId,
        selectedOption: sel,
      });
      setMyAnswer({ selectedOption: sel, submittedAt: new Date().toISOString() });
    } catch {
      /* question likely already locked server-side — nothing more to do */
    }
  };

  // ── Timer ────────────────────────────────────────────────
  const startTimer = (openedAt, timerSeconds) => {
    stopTimer();
    const openedMs = new Date(openedAt).getTime();
    const tick = () => {
      const elapsed = (Date.now() - openedMs) / 1000;
      const remaining = Math.max(0, Math.floor(timerSeconds - elapsed));
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        stopTimer();
        attemptAutoSubmit();
      }
    };
    tick();
    timerIntervalRef.current = setInterval(tick, 500);
  };
  const stopTimer = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = null;
  };
  useEffect(() => () => stopTimer(), []);

  // ── Socket connection — established once we have a participant ──
  useEffect(() => {
    if (!participant || !event) return;

    const socket = io(API.defaults.baseURL, { withCredentials: false });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("quiz:join_room", {
        eventId: event.id,
        role: "participant",
        participantId: participant.id,
      });
    });

    socket.on("quiz:joined", () => {
      socket.emit("quiz:participant_ready", { eventId: event.id, participantId: participant.id });
    });

    socket.on("disconnect", () => setConnected(false));

    socket.on("event:state_change", ({ status }) => {
      setEventStatus(status);
    });

    socket.on("quiz:question_open", ({ roundQuestionId, sequenceNumber, question, timerSeconds, openedAt }) => {
      setCurrentQuestion({ roundQuestionId, sequenceNumber, status: "open", question, openedAt, totalSeconds: timerSeconds });
      setMyAnswer(null);
      setSelected(null);
      answeringSentRef.current = false;
      startTimer(openedAt, timerSeconds);
    });

    socket.on("quiz:question_locked", ({ roundQuestionId }) => {
      setCurrentQuestion((cq) => (cq?.roundQuestionId === roundQuestionId ? { ...cq, status: "locked" } : cq));
      stopTimer();
      // The room may have finished early (everyone answered before the
      // timer ran out). If this participant picked an option but never
      // hit Submit, get it in before it's too late.
      attemptAutoSubmit();
    });

    socket.on("quiz:result_revealed", ({ roundQuestionId, correctAnswer, explanation, scores }) => {
      setCurrentQuestion((cq) =>
        cq?.roundQuestionId === roundQuestionId
          ? { ...cq, status: "revealed", question: { ...cq.question, correctAnswer, explanation } }
          : cq
      );
      const mine = scores?.find((s) => s.participantId === participant.id);
      if (mine) setMyScore(mine);
    });

    socket.on("quiz:round_completed", () => {
      setToast({ msg: "Round completed — please wait for the next stage.", severity: "info" });
      setCurrentQuestion(null);
    });

    socket.on("quiz:elimination_confirmed", ({ qualifiedParticipantIds, eliminatedParticipantIds }) => {
      if (eliminatedParticipantIds?.includes(participant.id)) {
        setParticipantStatus("eliminated");
      } else if (qualifiedParticipantIds?.includes(participant.id)) {
        setParticipantStatus("qualified_round2");
        setWaitingForTiebreak(false);
        setToast({ msg: "You qualified for Round 2!", severity: "success" });
      }
    });

    socket.on("quiz:tiebreak_started", ({ tiedParticipantIds }) => {
      if (tiedParticipantIds?.includes(participant.id)) {
        setParticipantStatus("tiebreak");
        setToast({ msg: "You're in a tiebreak — get ready!", severity: "warning" });
      }
    });

    socket.on("quiz:paused", ({ reason }) => {
      setEventStatus("paused");
      stopTimer();
      setToast({ msg: reason ? `Event paused: ${reason}` : "Event paused", severity: "warning" });
    });

    socket.on("quiz:resumed", ({ status }) => {
      setEventStatus(status);
      setToast({ msg: "Event resumed", severity: "success" });
    });

    socket.on("quiz:question_voided", () => {
      setCurrentQuestion(null);
      stopTimer();
      setToast({ msg: "That question was voided — everyone scores 0 for it.", severity: "warning" });
    });

    socket.on("quiz:announcement", ({ message }) => {
      setAnnouncement(message);
    });

    socket.on("quiz:event_completed", ({ finalScores }) => {
      setEventStatus("completed");
      const mine = finalScores?.find((f) => f.participant?.id === participant.id);
      setFinalResults(mine || null);
    });

    return () => {
      stopTimer();
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participant?.id, event?.id]);

  // ── REST poll fallback — catches anything a dropped socket connection missed ──
  const pollState = useCallback(async () => {
    if (!participant || !event) return;
    try {
      const res = await getEventState(event.id, participant.id);
      setEventStatus(res.eventStatus);
      setParticipantStatus(res.participantStatus);
      setWaitingForTiebreak(res.waitingForTiebreak || false);

      if (res.currentQuestion) {
        const isNewQuestion = currentQuestionRef.current?.roundQuestionId !== res.currentQuestion.roundQuestionId;

        if (isNewQuestion) {
          // A different question than what's locally shown — the poll
          // caught a transition the socket missed. Reset local selection
          // state so a stale pick from the previous question can't carry
          // over visually or keep the Submit button hidden.
          setCurrentQuestion(res.currentQuestion);
          setSelected(null);
          answeringSentRef.current = false;
          if (res.currentQuestion.status === "open") {
            startTimer(res.currentQuestion.openedAt, event.questionTimerSeconds);
          } else {
            stopTimer();
          }
        } else {
          setCurrentQuestion((cq) => ({ ...cq, status: res.currentQuestion.status }));
        }

        if (res.timerInfo && res.currentQuestion.status === "open") {
          setSecondsLeft(res.timerInfo.remaining);
        }
      }else if (currentQuestionRef.current) {
        // Poll caught a transition to "no active question for you" that the
        // socket missed (e.g. you're now excluded from an active tiebreak).
        setCurrentQuestion(null);
        setSelected(null);
        stopTimer();
      }

      // Always sync to the server's answer for the current question —
      // including clearing it to null when there isn't one yet. Only
      // updating on a truthy value here was the bug: it let a stale
      // answer object from the previous question stick around, which
      // both showed the old option as still selected and hid the
      // Submit button (since hasSubmitted stayed true).
      // setMyAnswer(res.myAnswer || null);
      if (!savingRef.current) setMyAnswer(res.myAnswer || null);

      if (res.myScore) setMyScore(res.myScore);
    } catch {
      /* transient — next poll or a socket event will recover state */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participant, event]);

  useEffect(() => {
    if (!participant || !event) return;
    const t = setInterval(pollState, POLL_FALLBACK_MS);
    return () => clearInterval(t);
  }, [participant, event, pollState]);

  // ── Heartbeat ────────────────────────────────────────────
  useEffect(() => {
    if (!participant || !event) return;
    const t = setInterval(() => {
      sendHeartbeat(event.id, participant.id).catch(() => {});
    }, HEARTBEAT_MS);
    return () => clearInterval(t);
  }, [participant, event]);

  // ── Answer submission ────────────────────────────────────
  // const pickOption = (opt) => {
  //   if (currentQuestion?.status !== "open") return;
  //   setSelected(opt);
  //   if (!answeringSentRef.current && socketRef.current) {
  //     socketRef.current.emit("quiz:answering", { eventId: event.id, participantId: participant.id });
  //     answeringSentRef.current = true;
  //   }
  // };

  // const confirmAnswer = async () => {
  //   if (!selected || !currentQuestion || currentQuestion.status !== "open") return;
  //   try {
  //     setSubmitting(true);
  //     await submitAnswer(event.id, {
  //       participantId: participant.id,
  //       roundQuestionId: currentQuestion.roundQuestionId,
  //       selectedOption: selected,
  //     });
  //     setMyAnswer({ selectedOption: selected, submittedAt: new Date().toISOString() });
  //     setToast({ msg: "Answer submitted", severity: "success" });
  //   } catch (err) {
  //     setToast({ msg: err?.response?.data?.message || "Couldn't submit — try again", severity: "error" });
  //   } finally {
  //     setSubmitting(false);
  //   }
  // };

  const flushPick = async () => {
  if (savingRef.current) return; // a loop is already draining the queue
  savingRef.current = true;
  setSaving(true);
  try {
    while (pendingPickRef.current) {
      const pick = pendingPickRef.current;
      pendingPickRef.current = null;
      try {
        await submitAnswer(event.id, {
          participantId: participant.id,
          roundQuestionId: pick.roundQuestionId,
          selectedOption: pick.option,
        });
        if (currentQuestionRef.current?.roundQuestionId === pick.roundQuestionId) {
          setMyAnswer({ selectedOption: pick.option, submittedAt: new Date().toISOString() });
        }
      } catch (err) {
        // Only react if the participant hasn't already picked something newer
        if (!pendingPickRef.current) {
          setSelected(null); // fall back to the last answer the server accepted
          setToast({
            msg: err?.response?.status === 409
              ? "Time's up — your last saved answer counts."
              : "Couldn't save your answer — tap it again.",
            severity: "error",
          });
        }
      }
    }
  } finally {
    savingRef.current = false;
    setSaving(false);
  }
};

const pickOption = (opt) => {
  const cq = currentQuestionRef.current;
  if (!cq || cq.status !== "open") return;
  setSelected(opt);
  pendingPickRef.current = { roundQuestionId: cq.roundQuestionId, option: opt };
  flushPick();

  if (!answeringSentRef.current && socketRef.current) {
    socketRef.current.emit("quiz:answering", { eventId: event.id, participantId: participant.id });
    answeringSentRef.current = true;
  }
};

  // ── Fetch full results once event/round is done ─────────
  const [resultsDetail, setResultsDetail] = useState(null);
  useEffect(() => {
    if (!participant || !event) return;
    const doneStates = ["round1_completed", "round2_completed", "completed"];
    if (doneStates.includes(eventStatus)) {
      getMyResults(event.id, participant.id).then(setResultsDetail).catch(() => {});
    }
  }, [eventStatus, participant, event]);

  // ─────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────

  if (!participant) {
    return (
      <JoinScreen
        codeInput={codeInput}
        setCodeInput={setCodeInput}
        onJoin={() => attemptJoin(codeInput)}
        joining={joining}
        error={joinError}
      />
    );
  }

  if (participantStatus === "eliminated" || participantStatus === "disqualified") {
    return <EliminatedScreen participant={participant} />;
  }

  if (eventStatus === "completed") {
    return <CompletedScreen participant={participant} finalResults={finalResults} resultsDetail={resultsDetail} />;
  }

  return (
     <Box sx={{
    minHeight: "100vh", bgcolor: BG, display: "flex", flexDirection: "column",
    userSelect: "none", WebkitUserSelect: "none", WebkitTouchCallout: "none",
  }}>
    <GlobalStyles styles={{ "@media print": { body: { display: "none !important" } } }} />

    {/* Watermark */}
    <Box sx={{
      position: "fixed", inset: 0, zIndex: 1200, pointerEvents: "none",
      backgroundImage: watermarkUrl,
    }} />

    {/* Privacy cover when the window loses focus */}
    {obscured && (
      <Box sx={{
        position: "fixed", inset: 0, zIndex: 1500, bgcolor: NAVY, color: "#fff",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", p: 3,
      }}>
        <Typography sx={{ fontWeight: 800, fontSize: 20, mb: 1 }}>Quiz hidden</Typography>
        <Typography sx={{ fontSize: 14, opacity: 0.8 }}>
          Return to this window to continue. Switching away during the quiz is not allowed.
        </Typography>
      </Box>
    )}
      {/* Top bar */}
      <Box sx={{ bgcolor: NAVY, color: "#fff", px: 3, py: 1.5,
                 display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: 15 }}>{event.name}</Typography>
          <Typography sx={{ fontSize: 12, opacity: 0.7 }}>
            {participant.name} · #{participant.displayNumber} · {participant.school}
          </Typography>
        </Box>
        <Chip
          size="small"
          icon={connected ? undefined : <WifiOff sx={{ fontSize: 14, color: "#fff !important" }} />}
          label={connected ? "Live" : "Reconnecting…"}
          sx={{ bgcolor: connected ? `${GREEN}CC` : `${RED}CC`, color: "#fff", fontWeight: 700 }}
        />
      </Box>

      {announcement && (
        <Alert
          icon={<Announcement />}
          severity="info"
          onClose={() => setAnnouncement(null)}
          sx={{ borderRadius: 0 }}
        >
          {announcement}
        </Alert>
      )}

            <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", p: 3 }}>
        {eventStatus === "paused" ? (
          <PausedCard />
        ) : waitingForTiebreak ? (
          <TiebreakWaitingCard myScore={myScore} />
        ) : currentQuestion ? (
          <QuestionCard
            currentQuestion={currentQuestion}
            selected={selected}
            myAnswer={myAnswer}
            secondsLeft={secondsLeft}
            saving={saving}
            onPick={pickOption}
            myScore={myScore}
          />
        ) : (
          <WaitingCard eventStatus={eventStatus} myScore={myScore} />
        )}
      </Box>

      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={toast?.severity || "info"} onClose={() => setToast(null)} sx={{ borderRadius: 2 }}>
          {toast?.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}

// ─── Join screen ────────────────────────────────────────────
function JoinScreen({ codeInput, setCodeInput, onJoin, joining, error }) {
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: NAVY, display: "flex",
               alignItems: "center", justifyContent: "center", p: 3 }}>
      <Paper elevation={0} sx={{ maxWidth: 380, width: "100%", borderRadius: 4, p: 4, textAlign: "center" }}>
        <Typography sx={{ fontWeight: 800, fontSize: 22, color: TEXT, mb: 0.5 }}>Join Quiz</Typography>
        <Typography sx={{ fontSize: 13, color: MUTED, mb: 3 }}>
          Enter the participant code given to you by your event organiser.
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2, textAlign: "left" }}>{error}</Alert>}
        <TextField
          fullWidth
          autoFocus
          label="Participant Code"
          value={codeInput}
          onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && onJoin()}
          sx={{ mb: 2.5, "& input": { textAlign: "center", fontWeight: 800, letterSpacing: 2, fontSize: 18 } }}
        />
        <Button
          fullWidth
          variant="contained"
          disabled={joining || !codeInput.trim()}
          onClick={onJoin}
          sx={{ textTransform: "none", bgcolor: GREEN, fontWeight: 700, borderRadius: 2, py: 1.3,
                "&:hover": { bgcolor: "#166d3e" } }}
        >
          {joining ? <CircularProgress size={20} color="inherit" /> : "Join"}
        </Button>
      </Paper>
    </Box>
  );
}

// ─── Waiting screen (between questions / before start) ─────
function WaitingCard({ eventStatus, myScore }) {
  const messages = {
  published: "Waiting for the event to start…",
  ready: "Waiting for the event to start…",
  round1_intro: "Round 1 is about to begin — get ready!",
  round2_intro: "Round 2 is about to begin — get ready!",
  round1_result_revealed: "Waiting for the next question…",
  round2_result_revealed: "Waiting for the next question…",
  round1_completed: "Round 1 is complete. Waiting for the organiser…",
  round2_completed: "Round 2 is complete. Waiting for final results…",
  elimination_review: "The panel is reviewing Round 1 results…",
  round1_tiebreak_active: "Tiebreak in progress — get ready for the next question!",
  round1_tiebreak_completed: "Tiebreak complete. Waiting for the panel's review…",
  tiebreak_active: "Get ready — tiebreak question coming up!",
  tiebreak_completed: "Tiebreak complete. Waiting for final results…",
};
  return (
    <Paper elevation={0} sx={{ maxWidth: 420, width: "100%", borderRadius: 4, p: 5, textAlign: "center",
                                border: `1px solid ${BORDER}` }}>
      <CircularProgress sx={{ color: GREEN, mb: 3 }} />
      <Typography sx={{ fontWeight: 800, fontSize: 18, color: TEXT, mb: 1 }}>
        {messages[eventStatus] || "Waiting…"}
      </Typography>
      {myScore && (
        <Typography sx={{ fontSize: 13, color: MUTED, mt: 2 }}>
          Your score so far: <strong style={{ color: TEXT }}>{myScore.totalMarks}</strong>
        </Typography>
      )}
    </Paper>
  );
}

function TiebreakWaitingCard({ myScore }) {
  return (
    <Paper elevation={0} sx={{ maxWidth: 420, width: "100%", borderRadius: 4, p: 5, textAlign: "center",
                                border: `1px solid ${BORDER}` }}>
      <CircularProgress sx={{ color: GOLD, mb: 3 }} />
      <Typography sx={{ fontWeight: 800, fontSize: 18, color: TEXT, mb: 1 }}>
        Hold on — a tiebreak is in progress
      </Typography>
      <Typography sx={{ fontSize: 13, color: MUTED }}>
        A small group of participants is settling a tie. You've already qualified — the next round will begin shortly.
      </Typography>
      {myScore && (
        <Typography sx={{ fontSize: 13, color: MUTED, mt: 2 }}>
          Your score so far: <strong style={{ color: TEXT }}>{myScore.totalMarks}</strong>
        </Typography>
      )}
    </Paper>
  );
}

function PausedCard() {
  return (
    <Paper elevation={0} sx={{ maxWidth: 420, width: "100%", borderRadius: 4, p: 5, textAlign: "center",
                                border: `2px solid ${GOLD}` }}>
      <PauseCircle sx={{ fontSize: 48, color: GOLD, mb: 2 }} />
      <Typography sx={{ fontWeight: 800, fontSize: 18, color: TEXT }}>Event Paused</Typography>
      <Typography sx={{ fontSize: 13, color: MUTED, mt: 1 }}>Hang tight — this will resume shortly.</Typography>
    </Paper>
  );
}

function EliminatedScreen({ participant }) {
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: BG, display: "flex", alignItems: "center", justifyContent: "center", p: 3 }}>
      <Paper elevation={0} sx={{ maxWidth: 420, width: "100%", borderRadius: 4, p: 5, textAlign: "center",
                                  border: `1px solid ${BORDER}` }}>
        <Typography sx={{ fontWeight: 800, fontSize: 20, color: TEXT, mb: 1 }}>
          Thanks for competing, {participant.name.split(" ")[0]}!
        </Typography>
        <Typography sx={{ fontSize: 14, color: MUTED }}>
          You didn't advance past this round — but great effort out there. Stick around to watch the rest of the event.
        </Typography>
      </Paper>
    </Box>
  );
}

function CompletedScreen({ participant, finalResults, resultsDetail }) {
  const rank = finalResults?.participant?.finalRank ?? resultsDetail?.participant?.finalRank;
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: NAVY, display: "flex", alignItems: "center", justifyContent: "center", p: 3 }}>
      <Paper elevation={0} sx={{ maxWidth: 460, width: "100%", borderRadius: 4, p: 5, textAlign: "center" }}>
        <EmojiEvents sx={{ fontSize: 52, color: GOLD, mb: 2 }} />
        <Typography sx={{ fontWeight: 800, fontSize: 22, color: TEXT, mb: 0.5 }}>Event Complete!</Typography>
        <Typography sx={{ fontSize: 14, color: MUTED, mb: 3 }}>Thanks for competing, {participant.name}.</Typography>
        {rank && (
          <Chip
            label={`Final Rank: #${rank}`}
            sx={{ bgcolor: `${GOLD}20`, color: GOLD, fontWeight: 800, fontSize: 15, px: 2, py: 2.5, mb: 3 }}
          />
        )}
        {resultsDetail?.results?.map((r) => (
          <Box key={r.roundNumber} sx={{ mt: 2, textAlign: "left" }}>
            <Divider sx={{ mb: 1.5 }} />
            <Typography sx={{ fontWeight: 700, fontSize: 13, color: TEXT }}>{r.roundLabel}</Typography>
            <Typography sx={{ fontSize: 12, color: MUTED }}>
              Score: {r.score?.totalMarks ?? "—"} · Correct: {r.score?.correctCount ?? 0} ·
              Wrong: {r.score?.incorrectCount ?? 0} · Unanswered: {r.score?.unansweredCount ?? 0}
            </Typography>
          </Box>
        ))}
      </Paper>
    </Box>
  );
}

// ─── Question card ──────────────────────────────────────────
function QuestionCard({ currentQuestion, selected, myAnswer, secondsLeft, saving, onPick, myScore }) {
  const q = currentQuestion.question;
  const isOpen     = currentQuestion.status === "open";
  const isLocked   = currentQuestion.status === "locked";
  const isRevealed = currentQuestion.status === "revealed";
  const hasSubmitted = !!myAnswer?.selectedOption;
  const urgentTimer = secondsLeft !== null && secondsLeft <= 10;

  const mySelection = selected ?? myAnswer?.selectedOption;
  const isCorrectOption = (opt) => opt === q.correctAnswer;
  const isMySelection   = (opt) => opt === mySelection;

  // Border: green on the correct answer once revealed; red on my pick
  // if it was wrong; navy while I'm still choosing (pre-reveal).
  const optionBorder = (opt) => {
    if (isRevealed) {
      if (isCorrectOption(opt)) return GREEN;
      if (isMySelection(opt))   return RED;
      return BORDER;
    }
    return isMySelection(opt) ? NAVY : BORDER;
  };

  // Fill: a light tint matching the border, so the correct/incorrect
  // answer is unmistakable at a glance once revealed, not just the
  // border color.
  const optionBg = (opt) => {
    if (isRevealed) {
      if (isCorrectOption(opt)) return `${GREEN}15`;
      if (isMySelection(opt))   return `${RED}10`;
      return CARD;
    }
    return isMySelection(opt) ? `${NAVY}08` : CARD;
  };

  const totalSeconds = currentQuestion.totalSeconds || 60;
  const progressPct = secondsLeft !== null
    ? Math.max(0, Math.min(100, (secondsLeft / totalSeconds) * 100))
    : 0;

  return (
    <Paper elevation={0} sx={{ maxWidth: 560, width: "100%", borderRadius: 4, p: 4, border: `1px solid ${BORDER}` }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Chip
          size="small"
          label={`Question ${currentQuestion.sequenceNumber}`}
          sx={{ bgcolor: `${NAVY}10`, color: NAVY, fontWeight: 800 }}
        />
        {isOpen && secondsLeft !== null && (
          <Chip
            size="small"
            label={`${secondsLeft}s`}
            sx={{ bgcolor: urgentTimer ? `${RED}15` : `${GREEN}15`,
                  color: urgentTimer ? RED : GREEN, fontWeight: 800, fontSize: 14 }}
          />
        )}
        {isLocked && <Chip size="small" label="Locked" sx={{ bgcolor: `${ORANGE}15`, color: ORANGE, fontWeight: 800 }} />}
        {isRevealed && <Chip size="small" label="Result" sx={{ bgcolor: "rgba(139,92,246,0.1)", color: "#8b5cf6", fontWeight: 800 }} />}
      </Stack>

      {isOpen && secondsLeft !== null && (
        <LinearProgress
          variant="determinate"
          value={progressPct}
          sx={{ mb: 2.5, height: 5, borderRadius: 5, bgcolor: `${BORDER}`,
                "& .MuiLinearProgress-bar": { bgcolor: urgentTimer ? RED : GREEN } }}
        />
      )}

      <Typography sx={{ fontWeight: 800, fontSize: 12, color: MUTED, mb: 0.5 }}>{q.subject}</Typography>
      <QuestionPreview
        text={q.questionText}
        sx={{ fontWeight: 700, fontSize: 18, color: TEXT, mb: 3, lineHeight: 1.4 }}
      />
      {/* <Typography sx={{ fontWeight: 700, fontSize: 18, color: TEXT, mb: 3, lineHeight: 1.4 }}>
        {q.questionText}
      </Typography> */}

      <Stack spacing={1.5}>
        {["A", "B", "C", "D"].map((opt) => (
          <Button
            key={opt}
            fullWidth
            disabled={!isOpen}
            onClick={() => onPick(opt)}
            sx={{
              justifyContent: "flex-start", textTransform: "none", textAlign: "left",
              border: `2px solid ${optionBorder(opt)}`,
              bgcolor: optionBg(opt),
              borderRadius: 2.5, py: 1.5, px: 2, color: TEXT, fontWeight: 600,
              "&:hover": { bgcolor: isOpen ? `${NAVY}05` : undefined },
            }}
            startIcon={
              isRevealed && isCorrectOption(opt) ? <CheckCircle sx={{ color: GREEN }} /> :
              isRevealed && isMySelection(opt) && !isCorrectOption(opt) ? <Cancel sx={{ color: RED }} /> :
              undefined
            }
          >
            {/* <Box component="span" sx={{ fontWeight: 800, mr: 1.5 }}>{opt}.</Box> {q.options?.[opt]} */}
            <Box component="span" sx={{ fontWeight: 800, mr: 1.5 }}>{opt}.</Box>
            <QuestionPreview text={q.options?.[opt] || ""} variant="span" sx={{ display: "inline" }} />
          </Button>
        ))}
      </Stack>

      {isOpen && (
        <Alert
          severity={mySelection ? "success" : "info"}
          icon={saving ? <CircularProgress size={16} /> : mySelection ? <CheckCircle /> : <HelpOutline />}
          sx={{ mt: 3, borderRadius: 2 }}
        >
          {saving
            ? "Saving your answer…"
            : mySelection
              ? "Answer saved — tap a different option to change it until time is up."
              : "Tap an option to answer."}
        </Alert>
      )}
      {isLocked && (
        <Alert severity="warning" icon={<HelpOutline />} sx={{ mt: 3, borderRadius: 2 }}>
          Time's up! Waiting for the result…
        </Alert>
      )}
      {isRevealed && q.explanation && (
        <Alert severity="info" sx={{ mt: 3, borderRadius: 2 }}>
          <QuestionPreview text={q.explanation} variant="span" />
        </Alert>
      )}
      {/* {isRevealed && q.explanation && (
        <Alert severity="info" sx={{ mt: 3, borderRadius: 2 }}>{q.explanation}</Alert>
      )} */}
      {myScore && (
        <Typography sx={{ fontSize: 12, color: MUTED, mt: 2, textAlign: "right" }}>
          Score so far: <strong style={{ color: TEXT }}>{myScore.totalMarks}</strong>
        </Typography>
      )}
    </Paper>
  );
}