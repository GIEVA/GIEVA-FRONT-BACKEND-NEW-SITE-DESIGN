// components/live/PollPanel.jsx
// In-meeting polls & surveys. Drop it into the room sidebar / a drawer.
//
//   <PollPanel sessionId={session.id} room={room} isHost={isHost} />
//
//   room    – the livekit-client Room (used to receive realtime "poll" signals). Optional:
//             without it the panel still works, refreshing every few seconds.
//   isHost  – show host controls (create / launch / close / results). The server re-checks
//             permissions on every call, so this only controls what is displayed.

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Box, Typography, Button, Chip, Stack, Paper, IconButton, Tooltip, Collapse,
  CircularProgress, Snackbar, Alert, Divider,
} from "@mui/material";
import {
  Add, PlayArrow, Stop, Download, DeleteOutline, ExpandMore, ExpandLess, OpenInNew, CheckCircle,
} from "@mui/icons-material";
import { RoomEvent } from "livekit-client";

import {
  listPolls, createPoll, launchPoll, closePoll, respondToPoll, deletePoll, exportPollCSV,
} from "../../services/sessionToolsService";
import { PollForm, PollResults } from "./PollForm";
import PollBuilderDialog from "./PollBuilderDialog";

const NAVY = "#0B1F3A";
const GREEN = "#1E7F4F";
const MUTED = "#64748B";

const STATUS = {
  draft: { label: "Draft", bg: "#F1F5F9", color: MUTED },
  live: { label: "Live", bg: "rgba(239,68,68,0.12)", color: "#dc2626" },
  closed: { label: "Closed", bg: "rgba(30,127,79,0.12)", color: GREEN },
};

const StatusChip = ({ status }) => (
  <Chip
    size="small" label={STATUS[status].label}
    sx={{ height: 20, fontSize: 10.5, fontWeight: 800, bgcolor: STATUS[status].bg, color: STATUS[status].color }}
  />
);

export default function PollPanel({ sessionId, room, isHost = false }) {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [toast, setToast] = useState(null);
  const reloadTimer = useRef(null);

  const load = useCallback(async () => {
    try {
      const res = await listPolls(sessionId);
      setPolls(res.polls || []);
    } catch (err) {
      console.error("[PollPanel] load failed", err);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  // Initial load + slow fallback refresh
  useEffect(() => {
    load();
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
  }, [load]);

  // Realtime signals from the server over the LiveKit data channel
  useEffect(() => {
    if (!room) return undefined;

    const onData = (payload, _participant, _kind, topic) => {
      if (topic !== "poll") return;
      try {
        const msg = JSON.parse(new TextDecoder().decode(payload));
        if (msg.type === "launched" && !isHost) setToast({ msg: "The host started a poll", severity: "info" });
      } catch { /* ignore malformed */ }
      clearTimeout(reloadTimer.current);
      reloadTimer.current = setTimeout(load, 250);
    };

    room.on(RoomEvent.DataReceived, onData);
    return () => {
      room.off(RoomEvent.DataReceived, onData);
      clearTimeout(reloadTimer.current);
    };
  }, [room, load, isHost]);

  const run = async (id, fn, okMsg) => {
    try {
      setBusyId(id);
      await fn();
      if (okMsg) setToast({ msg: okMsg, severity: "success" });
      await load();
    } catch (err) {
      setToast({ msg: err?.response?.data?.message || "Something went wrong", severity: "error" });
    } finally {
      setBusyId(null);
    }
  };

  const handleCreate = async (payload) => {
    await createPoll(sessionId, payload);
    setBuilderOpen(false);
    setToast({ msg: payload.launchNow ? "Poll launched" : "Saved", severity: "success" });
    await load();
  };

  const handleExport = async (poll) => {
    try {
      const blob = await exportPollCSV(poll.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${poll.kind}-${poll.id}-results.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setToast({ msg: "Export failed", severity: "error" });
    }
  };

  if (loading) {
    return <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress size={24} sx={{ color: GREEN }} /></Box>;
  }

  // ───────────────────────── HOST VIEW ─────────────────────────
  if (isHost) {
    return (
      <Box>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography sx={{ fontWeight: 800, fontSize: 15 }}>Polls &amp; surveys</Typography>
          <Button
            size="small" variant="contained" startIcon={<Add />} onClick={() => setBuilderOpen(true)}
            sx={{ textTransform: "none", fontWeight: 800, borderRadius: 2, bgcolor: NAVY, "&:hover": { bgcolor: GREEN } }}
          >
            New
          </Button>
        </Box>

        {polls.length === 0 && (
          <Typography sx={{ fontSize: 13, color: MUTED, textAlign: "center", py: 3 }}>
            No polls yet. Create one to ask the room a question.
          </Typography>
        )}

        <Stack spacing={1.5}>
          {polls.map((p) => {
            const isOpen = expanded[p.id] ?? p.status === "live";
            const busy = busyId === p.id;
            return (
              <Paper key={p.id} variant="outlined" sx={{ p: 1.75, borderRadius: 2.5 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: 13.5 }} noWrap>{p.title}</Typography>
                    <Stack direction="row" spacing={0.75} alignItems="center" mt={0.5}>
                      <StatusChip status={p.status} />
                      <Typography sx={{ fontSize: 11.5, color: MUTED }}>
                        {p.kind === "survey" ? "Survey" : "Poll"}
                        {p.status !== "draft" && ` · ${p.responseCount ?? 0} response${p.responseCount === 1 ? "" : "s"}`}
                      </Typography>
                    </Stack>
                  </Box>

                  <Stack direction="row" spacing={0.25} alignItems="center">
                    {p.status === "draft" && (
                      <Tooltip title={p.kind === "survey" ? "Send now" : "Launch"}>
                        <span>
                          <IconButton size="small" disabled={busy} sx={{ color: GREEN }}
                            onClick={() => run(p.id, () => launchPoll(p.id), p.kind === "survey" ? "Survey sent to attendees" : "Poll launched")}>
                            <PlayArrow fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    )}
                    {p.status === "live" && (
                      <Tooltip title="Close">
                        <span>
                          <IconButton size="small" disabled={busy} sx={{ color: "#dc2626" }}
                            onClick={() => run(p.id, () => closePoll(p.id), "Closed")}>
                            <Stop fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    )}
                    {p.status !== "draft" && (
                      <Tooltip title="Download CSV">
                        <IconButton size="small" onClick={() => handleExport(p)}><Download fontSize="small" /></IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Delete">
                      <span>
                        <IconButton size="small" disabled={busy} sx={{ color: "#ef4444" }}
                          onClick={() => window.confirm("Delete this and all its responses?") && run(p.id, () => deletePoll(p.id), "Deleted")}>
                          <DeleteOutline fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    {p.status !== "draft" && (
                      <IconButton size="small" onClick={() => setExpanded((e) => ({ ...e, [p.id]: !isOpen }))}>
                        {isOpen ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                      </IconButton>
                    )}
                  </Stack>
                </Box>

                {p.status !== "draft" && (
                  <Collapse in={isOpen} unmountOnExit>
                    <Divider sx={{ my: 1.5 }} />
                    <PollResults results={p.results} />
                  </Collapse>
                )}
              </Paper>
            );
          })}
        </Stack>

        <PollBuilderDialog open={builderOpen} onClose={() => setBuilderOpen(false)} onSubmit={handleCreate} />
        <ToastBar toast={toast} onClose={() => setToast(null)} />
      </Box>
    );
  }

  // ───────────────────────── PARTICIPANT VIEW ─────────────────────────
  const live = polls.filter((p) => p.status === "live");
  const closed = polls.filter((p) => p.status === "closed" && p.results);

  return (
    <Box>
      <Typography sx={{ fontWeight: 800, fontSize: 15, mb: 2 }}>Polls</Typography>

      {live.length === 0 && closed.length === 0 && (
        <Typography sx={{ fontSize: 13, color: MUTED, textAlign: "center", py: 3 }}>
          Nothing to answer right now. Polls from the host will appear here.
        </Typography>
      )}

      <Stack spacing={1.5}>
        {live.map((p) => (
          <Paper key={p.id} variant="outlined" sx={{ p: 2, borderRadius: 2.5, borderColor: GREEN }}>
            <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
              <StatusChip status="live" />
              <Typography sx={{ fontWeight: 800, fontSize: 14 }}>{p.title}</Typography>
            </Stack>

            {p.hasResponded ? (
              <Stack direction="row" spacing={1} alignItems="center" sx={{ color: GREEN }}>
                <CheckCircle fontSize="small" />
                <Typography sx={{ fontSize: 13.5, fontWeight: 700 }}>Thanks, your response was recorded.</Typography>
              </Stack>
            ) : p.kind === "survey" ? (
              <Button
                variant="contained" endIcon={<OpenInNew />}
                href={`/session-survey/${p.id}`} target="_blank" rel="noreferrer"
                sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2.5, bgcolor: NAVY, "&:hover": { bgcolor: GREEN } }}
              >
                Open survey
              </Button>
            ) : (
              <PollForm
                poll={p}
                submitting={busyId === p.id}
                onSubmit={(answers) => run(p.id, () => respondToPoll(p.id, answers), "Response sent")}
              />
            )}
          </Paper>
        ))}

        {closed.map((p) => (
          <Paper key={p.id} variant="outlined" sx={{ p: 2, borderRadius: 2.5 }}>
            <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
              <StatusChip status="closed" />
              <Typography sx={{ fontWeight: 800, fontSize: 14 }}>{p.title}</Typography>
            </Stack>
            <PollResults results={p.results} />
          </Paper>
        ))}
      </Stack>

      <ToastBar toast={toast} onClose={() => setToast(null)} />
    </Box>
  );
}

const ToastBar = ({ toast, onClose }) => (
  <Snackbar open={!!toast} autoHideDuration={3500} onClose={onClose} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
    <Alert severity={toast?.severity || "info"} onClose={onClose} sx={{ borderRadius: 2 }}>{toast?.msg}</Alert>
  </Snackbar>
);
