// components/live/QaPanel.jsx
// Webinar Q&A. Attendees ask (optionally anonymous) and upvote; the hosting team marks a question
// "live", types an answer, dismisses it, and can export everything to CSV.
// Render it inside the dark ThemeProvider, like PollPanel.
import { useCallback, useEffect, useRef, useState } from "react";
import { RoomEvent } from "livekit-client";
import {
  Box, Typography, TextField, Button, IconButton, Chip, FormControlLabel, Checkbox, Stack, CircularProgress, Alert, Tooltip,
} from "@mui/material";
import { ThumbUp, ThumbUpOutlined, Send, Download, Delete, RecordVoiceOver, Check, VisibilityOff, Replay } from "@mui/icons-material";
import {
  listQuestions, askQuestion, voteQuestion, updateQuestion, deleteQuestion, exportQuestionsCsv,
  listGuestWebinarQuestions, askGuestWebinarQuestion, voteGuestWebinarQuestion,
} from "../../services/webinarService";

const GREEN = "#1E7F4F";
const GOLD = "#D4A017";
const err = (e, d) => e?.response?.data?.message || d;

// guestKey: set for webinar guests (no account). They use the access-key endpoints instead of the login ones.
export default function QaPanel({ sessionId, room, canManage, qaEnabled = true, guestKey = null }) {
  const [items, setItems] = useState(null);
  const [off, setOff] = useState(!qaEnabled);
  const [text, setText] = useState("");
  const [anon, setAnon] = useState(false);
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState(null);
  const [answering, setAnswering] = useState(null); // question id
  const [answerText, setAnswerText] = useState("");
  const [tab, setTab] = useState("open");
  const timer = useRef();

  const load = useCallback(async () => {
    try {
      const r = guestKey ? await listGuestWebinarQuestions(sessionId, guestKey) : await listQuestions(sessionId);
      setItems(r.questions);
      setOff(r.qaEnabled === false);
    } catch (e) {
      setMsg({ s: "error", t: err(e, "Could not load questions") });
    }
  }, [sessionId, guestKey]);

  useEffect(() => {
    load();
    const poll = setInterval(load, 20000); // safety net; the data channel normally refreshes instantly
    return () => clearInterval(poll);
  }, [load]);

  useEffect(() => {
    if (!room) return undefined;
    const onData = (payload, _p, _k, topic) => {
      if (topic !== "qa") return;
      clearTimeout(timer.current);
      timer.current = setTimeout(load, 250);
    };
    room.on(RoomEvent.DataReceived, onData);
    return () => { room.off(RoomEvent.DataReceived, onData); clearTimeout(timer.current); };
  }, [room, load]);

  const ask = async () => {
    if (text.trim().length < 3) return;
    try {
      setSending(true);
      if (guestKey) await askGuestWebinarQuestion(sessionId, guestKey, text.trim(), anon);
      else await askQuestion(sessionId, text.trim(), anon);
      setText("");
      setMsg({ s: "success", t: "Question sent" });
      load();
    } catch (e) {
      setMsg({ s: "error", t: err(e, "Could not send") });
    } finally { setSending(false); }
  };

  const act = async (fn, okMsg) => {
    try { await fn(); if (okMsg) setMsg({ s: "success", t: okMsg }); load(); }
    catch (e) { setMsg({ s: "error", t: err(e, "Action failed") }); }
  };

  const download = async () => {
    try {
      const blob = await exportQuestionsCsv(sessionId);
      const url = URL.createObjectURL(new Blob([blob], { type: "text/csv" }));
      const a = document.createElement("a");
      a.href = url; a.download = `webinar-qa-${sessionId}.csv`; a.click();
      URL.revokeObjectURL(url);
    } catch (e) { setMsg({ s: "error", t: err(e, "Export failed") }); }
  };

  const shown = (items || []).filter((q) => (tab === "open" ? ["open", "live"].includes(q.status) : tab === "answered" ? q.status === "answered" : q.status === "dismissed"));
  const counts = {
    open: (items || []).filter((q) => ["open", "live"].includes(q.status)).length,
    answered: (items || []).filter((q) => q.status === "answered").length,
    dismissed: (items || []).filter((q) => q.status === "dismissed").length,
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "calc(100vh - 80px)" }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
        <Typography sx={{ fontWeight: 800, fontSize: 17 }}>Questions &amp; answers</Typography>
        {canManage && <Tooltip title="Download CSV"><IconButton onClick={download} size="small"><Download fontSize="small" /></IconButton></Tooltip>}
      </Box>

      {msg && <Alert severity={msg.s} onClose={() => setMsg(null)} sx={{ mb: 1 }}>{msg.t}</Alert>}

      {canManage && (
        <Box sx={{ display: "flex", gap: 0.75, mb: 1.5, flexWrap: "wrap" }}>
          {[["open", "Open"], ["answered", "Answered"], ["dismissed", "Dismissed"]].map(([k, l]) => (
            <Chip key={k} label={`${l} (${counts[k]})`} onClick={() => setTab(k)} size="small"
              sx={{ fontWeight: 700, bgcolor: tab === k ? GREEN : "rgba(255,255,255,0.08)", color: "#fff" }} />
          ))}
        </Box>
      )}

      <Box sx={{ flex: 1, overflowY: "auto", pr: 0.5 }}>
        {items === null && <Box sx={{ textAlign: "center", py: 4 }}><CircularProgress size={26} sx={{ color: GREEN }} /></Box>}
        {items && !shown.length && (
          <Typography sx={{ opacity: 0.65, fontSize: 14, textAlign: "center", py: 4 }}>
            {off ? "Q&A is turned off for this session." : "No questions yet. Ask the first one."}
          </Typography>
        )}

        <Stack spacing={1.25}>
          {shown.map((q) => (
            <Box key={q.id} sx={{ p: 1.5, borderRadius: 2.5, border: `1px solid ${q.status === "live" ? GOLD : "rgba(255,255,255,0.1)"}`, bgcolor: "rgba(255,255,255,0.04)" }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
                <Typography sx={{ fontSize: 12, opacity: 0.7 }}>
                  {q.asker}{q.anonymous && canManage ? " (anonymous to others)" : ""}
                </Typography>
                {q.status === "live" && <Chip label="Answering live" size="small" sx={{ bgcolor: GOLD, color: "#0B1F3A", fontWeight: 800, height: 20, fontSize: 10.5 }} />}
              </Box>
              <Typography sx={{ fontSize: 14.5, my: 0.5, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{q.text}</Typography>

              {q.answer && (
                <Box sx={{ mt: 0.75, p: 1, borderRadius: 2, bgcolor: `${GREEN}22`, borderLeft: `3px solid ${GREEN}` }}>
                  <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#86efac" }}>Answer</Typography>
                  <Typography sx={{ fontSize: 13.5, whiteSpace: "pre-wrap" }}>{q.answer}</Typography>
                </Box>
              )}

              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.75, flexWrap: "wrap" }}>
                <Button size="small" onClick={() => act(() => (guestKey ? voteGuestWebinarQuestion(q.id, guestKey) : voteQuestion(q.id)))}
                  startIcon={q.voted ? <ThumbUp sx={{ fontSize: 16 }} /> : <ThumbUpOutlined sx={{ fontSize: 16 }} />}
                  sx={{ textTransform: "none", minWidth: 0, color: q.voted ? GREEN : "inherit", fontWeight: 700 }}>
                  {q.votes}
                </Button>
                {canManage && q.status !== "dismissed" && (
                  <>
                    {q.status !== "answered" && (
                      <Button size="small" startIcon={<RecordVoiceOver sx={{ fontSize: 16 }} />}
                        onClick={() => act(() => updateQuestion(q.id, { status: q.status === "live" ? "open" : "live" }))}
                        sx={{ textTransform: "none", fontWeight: 700 }}>
                        {q.status === "live" ? "Stop live" : "Answer live"}
                      </Button>
                    )}
                    <Button size="small" startIcon={<Check sx={{ fontSize: 16 }} />}
                      onClick={() => { setAnswering(answering === q.id ? null : q.id); setAnswerText(q.answer || ""); }}
                      sx={{ textTransform: "none", fontWeight: 700 }}>
                      {q.answer ? "Edit answer" : "Type answer"}
                    </Button>
                    {q.status === "answered" && (
                      <Button size="small" startIcon={<Replay sx={{ fontSize: 16 }} />} onClick={() => act(() => updateQuestion(q.id, { status: "open" }))} sx={{ textTransform: "none", fontWeight: 700 }}>Reopen</Button>
                    )}
                    <Tooltip title="Dismiss (hide from attendees)">
                      <IconButton size="small" onClick={() => act(() => updateQuestion(q.id, { status: "dismissed" }))}><VisibilityOff fontSize="small" /></IconButton>
                    </Tooltip>
                  </>
                )}
                {canManage && q.status === "dismissed" && (
                  <Button size="small" startIcon={<Replay sx={{ fontSize: 16 }} />} onClick={() => act(() => updateQuestion(q.id, { status: "open" }))} sx={{ textTransform: "none", fontWeight: 700 }}>Restore</Button>
                )}
                {(canManage || (q.isMine && !guestKey)) && (
                  <Tooltip title="Delete"><IconButton size="small" onClick={() => act(() => deleteQuestion(q.id))}><Delete fontSize="small" /></IconButton></Tooltip>
                )}
              </Box>

              {answering === q.id && (
                <Box sx={{ mt: 1 }}>
                  <TextField fullWidth multiline minRows={2} size="small" placeholder="Type your answer" value={answerText} onChange={(e) => setAnswerText(e.target.value)} inputProps={{ maxLength: 3000 }} />
                  <Button size="small" variant="contained" disabled={!answerText.trim()} sx={{ mt: 0.75, textTransform: "none", fontWeight: 700, bgcolor: GREEN }}
                    onClick={() => act(async () => { await updateQuestion(q.id, { answer: answerText }); setAnswering(null); }, "Answer posted")}>
                    Post answer
                  </Button>
                </Box>
              )}
            </Box>
          ))}
        </Stack>
      </Box>

      {!off && (
        <Box sx={{ pt: 1.5 }}>
          <TextField fullWidth multiline maxRows={4} size="small" placeholder="Ask a question" value={text}
            onChange={(e) => setText(e.target.value)} inputProps={{ maxLength: 600 }} />
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 0.5 }}>
            <FormControlLabel control={<Checkbox size="small" checked={anon} onChange={(e) => setAnon(e.target.checked)} />}
              label={<Typography sx={{ fontSize: 12.5 }}>Ask anonymously</Typography>} />
            <Button variant="contained" size="small" disabled={sending || text.trim().length < 3} onClick={ask}
              startIcon={sending ? <CircularProgress size={14} color="inherit" /> : <Send fontSize="small" />}
              sx={{ textTransform: "none", fontWeight: 700, bgcolor: GREEN, "&:hover": { bgcolor: "#166d3e" } }}>
              Send
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}
