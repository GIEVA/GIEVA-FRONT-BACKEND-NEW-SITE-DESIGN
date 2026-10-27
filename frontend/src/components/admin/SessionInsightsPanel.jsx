// components/admin/SessionInsightsPanel.jsx
// Admin/host view of one session's recording, AI notes, transcript and poll results.
//
//   <SessionInsightsPanel sessionId={session.id} />
//
// Use it on your session detail page, or in a Dialog opened from the sessions table
// (see README for the 10-line snippet for AdminLiveSessions.jsx).

import { useCallback, useEffect, useState } from "react";
import {
  Box, Typography, Tabs, Tab, Button, Chip, Stack, Paper, Alert, CircularProgress,
  LinearProgress, Divider, IconButton, Tooltip, Snackbar,
} from "@mui/material";
import { ContentCopy, Download, Refresh, AutoAwesome } from "@mui/icons-material";

import {
  getRecording, regenerateNotes, listPolls, exportPollCSV,
} from "../../services/sessionToolsService";
import { PollResults } from "../live/PollForm";

const NAVY = "#0B1F3A";
const GREEN = "#1E7F4F";
const BORDER = "#E6E9F0";
const MUTED = "#64748B";

const clock = (s) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(sec).padStart(2, "0");
  return h ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
};

const notesToMarkdown = (notes) => {
  const list = (items) => (items.length ? items.map((i) => `- ${i}`).join("\n") : "_None_");
  return [
    "# Meeting notes",
    "",
    "## Summary",
    notes.summary || "_None_",
    "",
    "## Key points",
    list(notes.keyPoints || []),
    "",
    "## Decisions",
    list(notes.decisions || []),
    "",
    "## Action items",
    list((notes.actionItems || []).map((a) => (a.owner ? `${a.task} (${a.owner})` : a.task))),
    "",
    "## Open questions",
    list(notes.openQuestions || []),
  ].join("\n");
};

const saveFile = (content, filename, type) => {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const Section = ({ title, children }) => (
  <Box sx={{ mb: 3 }}>
    <Typography sx={{ fontSize: 11.5, fontWeight: 800, color: MUTED, textTransform: "uppercase", letterSpacing: 0.8, mb: 1 }}>
      {title}
    </Typography>
    {children}
  </Box>
);

const BulletList = ({ items, empty = "None" }) =>
  items?.length ? (
    <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
      {items.map((t, i) => (
        <Typography component="li" key={i} sx={{ fontSize: 14, color: "text.primary", mb: 0.5 }}>{t}</Typography>
      ))}
    </Box>
  ) : (
    <Typography sx={{ fontSize: 13.5, color: MUTED }}>{empty}</Typography>
  );

export default function SessionInsightsPanel({ sessionId }) {
  const [tab, setTab] = useState(0);
  const [recording, setRecording] = useState(undefined); // undefined = loading, null = none
  const [polls, setPolls] = useState([]);
  const [error, setError] = useState("");
  const [regenerating, setRegenerating] = useState(false);
  const [toast, setToast] = useState(null);

  const load = useCallback(async () => {
    try {
      const [r, p] = await Promise.all([getRecording(sessionId), listPolls(sessionId)]);
      setRecording(r.recording);
      setPolls((p.polls || []).filter((x) => x.status !== "draft"));
      setError("");
    } catch (err) {
      setError(err?.response?.data?.message || "Could not load session insights");
      setRecording(null);
    }
  }, [sessionId]);

  useEffect(() => { load(); }, [load]);

  // While the file / transcript is still being produced, keep checking.
  const working =
    recording &&
    (["recording", "processing"].includes(recording.status) ||
      ["pending", "processing"].includes(recording.transcriptStatus));

  useEffect(() => {
    if (!working) return undefined;
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [working, load]);

  const handleRegenerate = async () => {
    try {
      setRegenerating(true);
      await regenerateNotes(recording.id);
      await load();
      setToast({ msg: "Notes regenerated", severity: "success" });
    } catch (err) {
      setToast({ msg: err?.response?.data?.message || "Could not regenerate", severity: "error" });
    } finally {
      setRegenerating(false);
    }
  };

  const handleExportPoll = async (poll) => {
    try {
      saveFile(await exportPollCSV(poll.id), `${poll.kind}-${poll.id}-results.csv`, "text/csv");
    } catch {
      setToast({ msg: "Export failed", severity: "error" });
    }
  };

  if (recording === undefined) {
    return <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress sx={{ color: GREEN }} /></Box>;
  }

  const notes = recording?.notes;

  return (
    <Box>
      {error && <Alert severity="error" sx={{ borderRadius: 2, mb: 2 }}>{error}</Alert>}

      <Box sx={{ borderBottom: `1px solid ${BORDER}`, mb: 3 }}>
        <Tabs
          value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto"
          sx={{
            "& .MuiTab-root": { textTransform: "none", fontWeight: 700, color: MUTED },
            "& .Mui-selected": { color: NAVY },
            "& .MuiTabs-indicator": { bgcolor: NAVY },
          }}
        >
          <Tab label="AI notes" />
          <Tab label="Recording" />
          <Tab label="Transcript" />
          <Tab label={`Polls & surveys${polls.length ? ` (${polls.length})` : ""}`} />
        </Tabs>
      </Box>

      {/* ───────────── AI NOTES ───────────── */}
      {tab === 0 && (
        <>
          {!recording && <Alert severity="info" sx={{ borderRadius: 2 }}>This session has not been recorded.</Alert>}

          {recording && !recording.aiNotesEnabled && (
            <Alert severity="info" sx={{ borderRadius: 2 }}>AI notes were turned off for this recording.</Alert>
          )}

          {recording?.aiNotesEnabled && ["pending", "processing"].includes(recording.transcriptStatus) && (
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
              <Stack direction="row" spacing={1.5} alignItems="center" mb={1.5}>
                <AutoAwesome sx={{ color: GREEN }} />
                <Typography sx={{ fontWeight: 700 }}>
                  {recording.status === "recording" ? "Recording in progress. Notes are generated after the meeting ends." : "Generating notes…"}
                </Typography>
              </Stack>
              <LinearProgress sx={{ borderRadius: 1, "& .MuiLinearProgress-bar": { bgcolor: GREEN } }} />
            </Paper>
          )}

          {recording?.transcriptStatus === "failed" && (
            <Alert
              severity="error" sx={{ borderRadius: 2, mb: 2 }}
              action={recording.transcript ? (
                <Button color="inherit" size="small" onClick={handleRegenerate} disabled={regenerating}>Retry</Button>
              ) : null}
            >
              Notes could not be generated. {recording.errorMessage}
            </Alert>
          )}

          {notes && (
            <>
              <Stack direction="row" spacing={1} justifyContent="flex-end" mb={2}>
                <Button size="small" startIcon={<ContentCopy />} sx={{ textTransform: "none", fontWeight: 700 }}
                  onClick={() => navigator.clipboard.writeText(notesToMarkdown(notes)).then(() => setToast({ msg: "Copied", severity: "success" }))}>
                  Copy
                </Button>
                <Button size="small" startIcon={<Download />} sx={{ textTransform: "none", fontWeight: 700 }}
                  onClick={() => saveFile(notesToMarkdown(notes), `meeting-notes-${sessionId}.md`, "text/markdown")}>
                  Download .md
                </Button>
                {recording.transcript && (
                  <Tooltip title="Re-run the AI summary from the existing transcript">
                    <span>
                      <Button size="small" disabled={regenerating} startIcon={regenerating ? <CircularProgress size={14} /> : <Refresh />}
                        sx={{ textTransform: "none", fontWeight: 700 }} onClick={handleRegenerate}>
                        Regenerate
                      </Button>
                    </span>
                  </Tooltip>
                )}
              </Stack>

              <Section title="Summary">
                <Typography sx={{ fontSize: 14.5, lineHeight: 1.7 }}>{notes.summary || "—"}</Typography>
              </Section>
              <Section title="Key points"><BulletList items={notes.keyPoints} /></Section>
              <Section title="Decisions"><BulletList items={notes.decisions} empty="No decisions recorded" /></Section>
              <Section title="Action items">
                <BulletList
                  items={(notes.actionItems || []).map((a) => (a.owner ? `${a.task} — ${a.owner}` : a.task))}
                  empty="No action items"
                />
              </Section>
              <Section title="Open questions"><BulletList items={notes.openQuestions} empty="None" /></Section>

              <Divider sx={{ my: 2 }} />
              <Typography sx={{ fontSize: 12, color: MUTED }}>
                Generated by AI from an automatic transcript. Check names, numbers and decisions before sharing.
              </Typography>
            </>
          )}
        </>
      )}

      {/* ───────────── RECORDING ───────────── */}
      {tab === 1 && (
        <>
          {!recording && <Alert severity="info" sx={{ borderRadius: 2 }}>This session has not been recorded.</Alert>}

          {recording && (
            <Stack spacing={2}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip size="small" label={recording.status.toUpperCase()}
                  sx={{
                    fontWeight: 800, fontSize: 10.5,
                    bgcolor: recording.status === "ready" ? "rgba(30,127,79,0.12)" : recording.status === "failed" ? "#FEF2F2" : "rgba(212,160,23,0.14)",
                    color: recording.status === "ready" ? GREEN : recording.status === "failed" ? "#dc2626" : "#b45309",
                  }} />
                {recording.durationSeconds != null && (
                  <Typography sx={{ fontSize: 13, color: MUTED }}>{clock(recording.durationSeconds)}</Typography>
                )}
              </Stack>

              {["recording", "processing"].includes(recording.status) && (
                <>
                  <Typography sx={{ fontSize: 13.5, color: MUTED }}>
                    {recording.status === "recording" ? "Recording is in progress." : "Processing the video. This usually takes a few minutes."}
                  </Typography>
                  <LinearProgress sx={{ borderRadius: 1, "& .MuiLinearProgress-bar": { bgcolor: GREEN } }} />
                </>
              )}

              {recording.status === "failed" && (
                <Alert severity="error" sx={{ borderRadius: 2 }}>{recording.errorMessage || "The recording failed."}</Alert>
              )}

              {recording.status === "ready" && recording.playbackUrl && (
                <>
                  <Box component="video" controls preload="metadata" src={recording.playbackUrl}
                    sx={{ width: "100%", borderRadius: 3, bgcolor: "#000", maxHeight: 460 }} />
                  <Box>
                    <Button size="small" variant="outlined" startIcon={<Download />} href={recording.playbackUrl}
                      sx={{ textTransform: "none", fontWeight: 700, borderColor: BORDER, color: NAVY, borderRadius: 2 }}>
                      Download
                    </Button>
                    <Typography sx={{ fontSize: 12, color: MUTED, mt: 1 }}>Links expire after an hour. Reload this page for a fresh one.</Typography>
                  </Box>
                </>
              )}

              {recording.status === "ready" && !recording.playbackUrl && (
                <Alert severity="warning" sx={{ borderRadius: 2 }}>The video is ready but a playback link could not be created. Check the storage settings.</Alert>
              )}
            </Stack>
          )}
        </>
      )}

      {/* ───────────── TRANSCRIPT ───────────── */}
      {tab === 2 && (
        <>
          {!recording?.transcript && (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              {recording?.aiNotesEnabled ? "The transcript is not ready yet." : "No transcript for this session."}
            </Alert>
          )}

          {recording?.transcript && (
            <>
              <Stack direction="row" justifyContent="flex-end" mb={2}>
                <Button size="small" startIcon={<Download />} sx={{ textTransform: "none", fontWeight: 700 }}
                  onClick={() => saveFile(recording.transcript, `transcript-${sessionId}.txt`, "text/plain")}>
                  Download .txt
                </Button>
              </Stack>
              <Stack spacing={1.25}>
                {(recording.transcriptSegments?.length ? recording.transcriptSegments : [{ start: null, text: recording.transcript }]).map((seg, i) => (
                  <Box key={i} sx={{ display: "flex", gap: 1.5 }}>
                    {seg.start !== null && (
                      <Typography sx={{ fontSize: 12, fontWeight: 700, color: MUTED, minWidth: 48, pt: 0.25, fontFamily: "monospace" }}>
                        {clock(seg.start)}
                      </Typography>
                    )}
                    <Typography sx={{ fontSize: 14, lineHeight: 1.6 }}>{seg.text}</Typography>
                  </Box>
                ))}
              </Stack>
            </>
          )}
        </>
      )}

      {/* ───────────── POLLS ───────────── */}
      {tab === 3 && (
        <>
          {polls.length === 0 && <Alert severity="info" sx={{ borderRadius: 2 }}>No polls or surveys were run in this session.</Alert>}
          <Stack spacing={2}>
            {polls.map((p) => (
              <Paper key={p.id} variant="outlined" sx={{ p: 2.5, borderRadius: 3, borderColor: BORDER }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2, gap: 1 }}>
                  <Box>
                    <Typography sx={{ fontWeight: 800, fontSize: 15 }}>{p.title}</Typography>
                    <Typography sx={{ fontSize: 12.5, color: MUTED }}>
                      {p.kind === "survey" ? "Survey" : "Poll"} · {p.status} · {p.responseCount ?? 0} response{p.responseCount === 1 ? "" : "s"}
                      {p.isAnonymous ? " · anonymous" : ""}
                    </Typography>
                  </Box>
                  <Button size="small" startIcon={<Download />} onClick={() => handleExportPoll(p)}
                    sx={{ textTransform: "none", fontWeight: 700 }}>
                    CSV
                  </Button>
                </Box>
                <PollResults results={p.results} />
              </Paper>
            ))}
          </Stack>
        </>
      )}

      <Snackbar open={!!toast} autoHideDuration={3500} onClose={() => setToast(null)} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <Alert severity={toast?.severity || "info"} onClose={() => setToast(null)} sx={{ borderRadius: 2 }}>{toast?.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
