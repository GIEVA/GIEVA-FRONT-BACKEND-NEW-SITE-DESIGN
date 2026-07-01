

import {
  LiveKitRoom,
  RoomAudioRenderer,
  useParticipants,
  useLocalParticipant,
  useTracks,
  VideoTrack,
  useRoomContext,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import "@livekit/components-styles";

import {
  useEffect, useRef, useState, useCallback,
} from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";

import {
  Box, Typography, IconButton, Tooltip, Avatar, Chip, Drawer,
  List, ListItem, ListItemAvatar, ListItemText, Badge, Popover,
  Slider, Button, Stack, CircularProgress, Divider, Snackbar, Alert,
} from "@mui/material";

import {
  Mic, MicOff, Videocam, VideocamOff, ScreenShare, StopScreenShare,
  PeopleAlt, PanTool, EmojiEmotions, FiberManualRecord, StopCircle,
  Draw, Close, CallEnd, DeleteSweep, CheckCircle, Cancel,
  HourglassTop, PersonAdd, Visibility,
} from "@mui/icons-material";

import {
  leaveAttendance,
  joinClassSession,
  joinTutorSession,
  sendSessionReaction,
  raiseHand,
  startRecording,
  stopRecording,
  admitParticipant,
  denyParticipant,
  getWaitingRoom,
  getParticipantToken,
} from "../services/classSessionService";
import { joinPublicMeetingAsHost } from "../services/publicMeetingService";
import {
  guestJoinPublicMeeting,
  guestCheckAdmissionStatus,
  guestGetParticipantToken,
} from "../services/guestMeetingService";


// ─── Design tokens ────────────────────────────────────────────
const NAVY    = "#0B1F3A";
const GREEN   = "#1E7F4F";
const GOLD    = "#D4A017";
const DARK    = "#0f172a";
const DARK2   = "#1e293b";
const DARK3   = "#334155";
const TEXT    = "#f1f5f9";
const MUTED_D = "#94a3b8";

// ─── Helpers ──────────────────────────────────────────────────
const getMetadata = (p) => {
  try { return JSON.parse(p?.metadata || "{}"); } catch { return {}; }
};

const getInitials = (name = "") =>
  name.split(" ").filter(Boolean).slice(0, 2).map((n) => n[0]).join("").toUpperCase() || "?";

const avatarColor = (name = "") => {
  const colors = ["#7C3AED","#0284C7","#DC2626","#D97706","#059669","#0891B2"];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + h * 31;
  return colors[Math.abs(h) % colors.length];
};

const decodeMsg = (bytes) => {
  try { return JSON.parse(new TextDecoder().decode(bytes)); } catch { return null; }
};

const firstName = (name = "") => name.trim().split(" ")[0] || name;

// ─── Data message types (extend your existing constants) ──────
const MSG = {
  JOIN_REQUEST:      "JOIN_REQUEST",
  ADMITTED:           "ADMITTED",
  DENIED:             "DENIED",
  RAISE_HAND:         "RAISE_HAND",
  REACTION:           "REACTION",
  WHITEBOARD_OPEN:    "WHITEBOARD_OPEN",
  WHITEBOARD_CLOSE:   "WHITEBOARD_CLOSE",
  WHITEBOARD_STROKE:  "WHITEBOARD_STROKE",
  WHITEBOARD_CLEAR:   "WHITEBOARD_CLEAR",
  WHITEBOARD_SYNC:    "WHITEBOARD_SYNC",   // host → late-joiner replay
};

// ─── Participant Tile — NOW shows raised-hand badge + reaction bubble ──
const ParticipantTile = ({
  participant, isLocal = false, isLarge = false,
  isHandRaised = false,
  reaction = null,
}) => {
  const meta   = getMetadata(participant);
  const name   = meta.fullName || participant.identity;
  const pic    = meta.profilePicUrl;
  const isHost = meta.role === "host";

  // ── FIX 3: useTracks scoped to THIS participant only ──────────
  // Without `{ participant }`, the hook returns ALL camera tracks
  // in the room, and the first one gets picked for every tile.
  const tracks = useTracks(
    [{ source: Track.Source.Camera, withPlaceholder: true }],
    { participant }   // ← critical: scope to this participant
  );

  const camTrack = tracks.find((t) => t.source === Track.Source.Camera);
  const hasCam   = camTrack && !camTrack.isMuted && camTrack.publication;

  return (
    <Box sx={{
      width: "100%",
      aspectRatio: isLarge ? undefined : "16/9",
      minHeight: isLarge ? 340 : undefined,
      height: isLarge ? "100%" : undefined,
      position: "relative", borderRadius: 3, overflow: "hidden",
      bgcolor: DARK2, border: `1px solid ${isHandRaised ? GOLD : DARK3}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      transition: "border-color 0.2s",
    }}>
      {hasCam ? (
        <Box sx={{ position: "absolute", inset: 0 }}>
          <VideoTrack
            trackRef={camTrack}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </Box>
      ) : (
        <Avatar src={pic || undefined}
          sx={{ width: isLarge ? 120 : 68, height: isLarge ? 120 : 68,
                fontSize: isLarge ? 44 : 26, fontWeight: 800,
                bgcolor: avatarColor(name), border: "3px solid rgba(255,255,255,0.13)" }}>
          {!pic && getInitials(name)}
        </Avatar>
      )}

      {/* Raised hand badge */}
      {isHandRaised && (
        <Box sx={{
          position: "absolute", top: 8, right: 8,
          width: 34, height: 34, borderRadius: "50%",
          bgcolor: GOLD, display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18, boxShadow: "0 2px 8px rgba(0,0,0,0.35)",
          animation: "handPulse 1s ease-in-out infinite",
          "@keyframes handPulse": {
            "0%,100%": { transform: "scale(1)" },
            "50%":     { transform: "scale(1.12)" },
          },
        }}>✋</Box>
      )}

      {/* Reaction bubble */}
      {reaction && (
        <Box sx={{
          position: "absolute", top: -6, left: "50%",
          transform: "translate(-50%, -100%)",
          bgcolor: "rgba(15,23,42,0.92)", borderRadius: 3,
          px: 1.5, py: 0.75, display: "flex", alignItems: "center", gap: 0.75,
          border: `1px solid ${DARK3}`, whiteSpace: "nowrap",
          animation: "floatUp 2.5s ease-out forwards",
          "@keyframes floatUp": {
            "0%":   { opacity: 0, transform: "translate(-50%, -85%)" },
            "15%":  { opacity: 1, transform: "translate(-50%, -100%)" },
            "80%":  { opacity: 1 },
            "100%": { opacity: 0, transform: "translate(-50%, -120%)" },
          },
        }}>
          <Typography sx={{ fontSize: 20, lineHeight: 1 }}>{reaction.emoji}</Typography>
          <Typography sx={{ fontSize: 12, fontWeight: 700, color: TEXT }}>
            {firstName(reaction.fullName)}
          </Typography>
        </Box>
      )}

      <Box sx={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        background: "linear-gradient(transparent, rgba(0,0,0,0.72))",
        px: 1.5, py: 1, display: "flex", alignItems: "center", gap: 1,
      }}>
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: TEXT, flex: 1 }} noWrap>
          {isLocal ? `${name} (You)` : name}
        </Typography>
        {isHost && (
          <Chip label="Host" size="small"
            sx={{ bgcolor: GOLD, color: NAVY, fontWeight: 800, height: 20, fontSize: 11 }} />
        )}
        {participant.isMicrophoneEnabled
          ? <Mic sx={{ fontSize: 14, color: GREEN }} />
          : <MicOff sx={{ fontSize: 14, color: "#ef4444" }} />}
      </Box>
    </Box>
  );
};

// ─── Participant Grid — now passes raisedHands/reactions down ─────────
const ParticipantGrid = ({ raisedHands = {}, reactions = {} }) => {
  const participants         = useParticipants();
  const { localParticipant } = useLocalParticipant();

  const all = [
    localParticipant,
    ...participants.filter((p) => p.identity !== localParticipant?.identity),
  ].filter(Boolean).filter((p) => getMetadata(p).role !== "lobby");

  const count = all.length;
  const cols  = count === 1 ? 1 : count <= 4 ? 2 : count <= 9 ? 3 : 4;

  return (
    <Box sx={{
      flex: 1, display: "grid",
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gap: 1.5, p: 2, alignContent: "start", overflowY: "auto",
    }}>
      {all.map((p) => (
        <ParticipantTile
          key={p.identity}
          participant={p}
          isLocal={p.identity === localParticipant?.identity}
          isLarge={count === 1}
          isHandRaised={!!raisedHands[p.identity]}
          reaction={reactions[p.identity] || null}
        />
      ))}
    </Box>
  );
};

// ─── Whiteboard — now shared: host draws, everyone watches ─────────────
//
// `isHost` controls whether the toolbar is interactive.
// `onLocalStroke` / `onLocalClear` bubble drawing events up to RoomInner,
// which broadcasts them. `remoteStroke` / `remoteClear` / `syncStrokes`
// are applied to the canvas when they arrive from the host.
const WhiteboardDrawer = ({
  open, onClose, isHost,
  onLocalStroke, onLocalClear,
  // ── FIX 1: replaced remoteStroke/remoteClear state props with refs ──
  strokeQueueRef,    // React.MutableRefObject<stroke[]>  — append from outside
  clearTriggerRef,   // React.MutableRefObject<number>    — increment from outside
  syncStrokes,
}) => {
  const canvasRef  = useRef(null);
  const isDrawing  = useRef(false);
  const lastPos    = useRef({ x: 0, y: 0 });
  const rafRef     = useRef(null);
  const lastClearRef = useRef(0); // tracks which clear we last applied

  const [tool, setTool]           = useState("pen");
  const [color, setColor]         = useState("#000000");
  const [thickness, setThickness] = useState(3);
  const COLORS = ["#000000","#ffffff","#ef4444","#f97316","#eab308","#22c55e","#3b82f6","#8b5cf6"];

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (cx - rect.left) * (canvas.width  / rect.width),
      y: (cy - rect.top)  * (canvas.height / rect.height),
    };
  };

  const toNorm   = (pos, canvas) => ({ nx: pos.x / canvas.width, ny: pos.y / canvas.height });
  const fromNorm = (nx, ny, canvas) => ({ x: nx * canvas.width, y: ny * canvas.height });

  const strokeOnCanvas = useCallback((from, to, strokeColor, strokeWidth) => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx    = canvas.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth   = strokeWidth;
    ctx.lineCap     = "round";
    ctx.lineJoin    = "round";
    ctx.stroke();
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx    = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  // ── FIX 1: RAF loop — drain stroke queue every animation frame ──
  // This runs continuously while the drawer is open, applying all
  // queued strokes in order. Because it runs outside React's render
  // cycle, no batching can drop strokes.
  useEffect(() => {
    if (!open || isHost) return; // host draws locally; only viewers need the RAF loop

    const loop = () => {
      // Apply any pending clear first
      if (clearTriggerRef && clearTriggerRef.current > lastClearRef.current) {
        clearCanvas();
        lastClearRef.current = clearTriggerRef.current;
      }

      // Drain the stroke queue
      if (strokeQueueRef && strokeQueueRef.current.length > 0) {
        const canvas = canvasRef.current;
        if (canvas) {
          // Splice out all pending strokes atomically
          const pending = strokeQueueRef.current.splice(0);
          for (const stroke of pending) {
            const from = fromNorm(stroke.from.nx, stroke.from.ny, canvas);
            const to   = fromNorm(stroke.to.nx,   stroke.to.ny,   canvas);
            strokeOnCanvas(from, to, stroke.color, stroke.thickness);
          }
        }
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [open, isHost, strokeQueueRef, clearTriggerRef, strokeOnCanvas, clearCanvas]);

  // Init canvas when opened
  useEffect(() => {
    if (!open) return;
    setTimeout(() => {
      const canvas = canvasRef.current; if (!canvas) return;
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      clearCanvas();
      if (!isHost) syncStrokes?.();
    }, 120);
  }, [open, isHost, clearCanvas, syncStrokes]);

  const startDraw = useCallback((e) => {
    if (!isHost) return;
    e.preventDefault();
    const canvas = canvasRef.current; if (!canvas) return;
    isDrawing.current = true;
    lastPos.current   = getPos(e, canvas);
  }, [isHost]);

  const draw = useCallback((e) => {
    if (!isHost || !isDrawing.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const pos    = getPos(e, canvas);
    const sc     = tool === "eraser" ? "#ffffff" : color;
    const sw     = tool === "eraser" ? thickness * 5 : thickness;

    // Apply locally for zero-latency host drawing
    strokeOnCanvas(lastPos.current, pos, sc, sw);

    // Broadcast using normalized coords
    onLocalStroke?.({
      from:      toNorm(lastPos.current, canvas),
      to:        toNorm(pos, canvas),
      color:     sc,
      thickness: sw,
    });

    lastPos.current = pos;
  }, [isHost, tool, color, thickness, strokeOnCanvas, onLocalStroke]);

  const stopDraw = useCallback(() => { isDrawing.current = false; }, []);

  const handleClearClick = () => {
    if (!isHost) return;
    clearCanvas();
    onLocalClear?.();
  };

  return (
    <Drawer anchor="right" open={open} onClose={isHost ? onClose : undefined}
      PaperProps={{ sx: { width: { xs: "100vw", md: 700 }, bgcolor: "#f8fafc", display: "flex", flexDirection: "column" } }}>
      <Box sx={{ p: 1.5, bgcolor: DARK, display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
        <Typography sx={{ color: TEXT, fontWeight: 800, fontSize: 15, mr: 1 }}>Whiteboard</Typography>

        {!isHost && (
          <Chip icon={<Visibility sx={{ fontSize: 13 }} />} label="View only" size="small"
            sx={{ bgcolor: "rgba(255,255,255,0.1)", color: MUTED_D, fontWeight: 700, fontSize: 11,
                  "& .MuiChip-icon": { color: MUTED_D } }} />
        )}

        {isHost && (
          <>
            <Tooltip title="Pen">
              <IconButton onClick={() => setTool("pen")} sx={{ color: tool === "pen" ? GOLD : MUTED_D }}>
                <Draw />
              </IconButton>
            </Tooltip>
            <Tooltip title="Eraser">
              <IconButton onClick={() => setTool("eraser")} sx={{ color: tool === "eraser" ? GOLD : MUTED_D, fontSize: 18 }}>⬜</IconButton>
            </Tooltip>
            <Box sx={{ display: "flex", gap: 0.5 }}>
              {COLORS.map((c) => (
                <Box key={c} onClick={() => { setColor(c); setTool("pen"); }}
                  sx={{ width: 22, height: 22, borderRadius: "50%", bgcolor: c, cursor: "pointer",
                        border: color === c ? "2px solid #fff" : "2px solid transparent",
                        boxShadow: color === c ? `0 0 0 2px ${GOLD}` : "none" }} />
              ))}
            </Box>
            <Box sx={{ width: 80 }}>
              <Slider size="small" min={1} max={20} value={thickness} onChange={(_, v) => setThickness(v)} sx={{ color: GOLD }} />
            </Box>
            <Tooltip title="Clear">
              <IconButton onClick={handleClearClick} sx={{ color: "#ef4444" }}><DeleteSweep /></IconButton>
            </Tooltip>
          </>
        )}

        <Box flex={1} />
        {isHost && <IconButton onClick={onClose} sx={{ color: MUTED_D }}><Close /></IconButton>}
      </Box>

      <Box sx={{
        flex: 1, overflow: "hidden",
        cursor: isHost ? (tool === "eraser" ? "cell" : "crosshair") : "default",
      }}>
        <canvas ref={canvasRef}
          style={{ width: "100%", height: "100%", display: "block", touchAction: "none" }}
          onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
          onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw} />
      </Box>
    </Drawer>
  );
};

// ─── Participants Drawer (unchanged from your version) ────────────────
const ParticipantsDrawer = ({ open, onClose }) => {
  const participants         = useParticipants();
  const { localParticipant } = useLocalParticipant();

  const all = [
    localParticipant,
    ...participants.filter((p) => p.identity !== localParticipant?.identity),
  ].filter(Boolean);

  return (
    <Drawer anchor="right" open={open} onClose={onClose}
      PaperProps={{ sx: { width: 300, bgcolor: DARK2 } }}>
      <Box sx={{ p: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Typography sx={{ color: TEXT, fontWeight: 800, fontSize: 16 }}>
          Participants ({all.length})
        </Typography>
        <IconButton onClick={onClose} sx={{ color: MUTED_D }}><Close /></IconButton>
      </Box>
      <List>
        {all.map((p) => {
          const meta    = getMetadata(p);
          const name    = meta.fullName || p.identity;
          const pic     = meta.profilePicUrl;
          const isHost  = meta.role === "host";
          const isLobby = meta.role === "lobby";
          const isLocal = p.identity === localParticipant?.identity;
          return (
            <ListItem key={p.identity}>
              <ListItemAvatar>
                <Avatar src={pic || undefined} sx={{ bgcolor: avatarColor(name), width: 38, height: 38 }}>
                  {!pic && getInitials(name)}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Typography sx={{ color: TEXT, fontSize: 14, fontWeight: 600 }}>
                    {isLocal ? `${name} (You)` : name}
                    {isHost  && <Chip label="Host"    size="small" sx={{ ml: 1, bgcolor: GOLD, color: NAVY, height: 18, fontSize: 10 }} />}
                    {isLobby && <Chip label="Waiting" size="small" sx={{ ml: 1, bgcolor: "rgba(239,68,68,0.2)", color: "#fca5a5", height: 18, fontSize: 10 }} />}
                  </Typography>
                }
                secondary={
                  <Box sx={{ display: "flex", gap: 0.5, mt: 0.25 }}>
                    {isLobby
                      ? <Typography sx={{ fontSize: 11, color: MUTED_D }}>In waiting room</Typography>
                      : <>
                          {p.isMicrophoneEnabled ? <Mic sx={{ fontSize: 13, color: GREEN }} /> : <MicOff sx={{ fontSize: 13, color: "#ef4444" }} />}
                          {p.isCameraEnabled     ? <Videocam sx={{ fontSize: 13, color: GREEN }} /> : <VideocamOff sx={{ fontSize: 13, color: "#ef4444" }} />}
                        </>
                    }
                  </Box>
                }
              />
            </ListItem>
          );
        })}
      </List>
    </Drawer>
  );
};

// ─── Admit Panel (unchanged from your version) ─────────────────────────
const AdmitPanel = ({ open, onClose, sessionId, onAdmit, onDeny, triggerRefresh }) => {
  const [waiting, setWaiting] = useState([]);
  const [loading, setLoading] = useState(false);
  const intervalRef           = useRef(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getWaitingRoom(sessionId);
      setWaiting(res.waiting || []);
    } catch (err) {
      console.error("getWaitingRoom:", err);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (!open) { clearInterval(intervalRef.current); return; }
    refresh();
    intervalRef.current = setInterval(refresh, 4000);
    return () => clearInterval(intervalRef.current);
  }, [open, refresh]);

  useEffect(() => {
    if (triggerRefresh > 0) refresh();
  }, [triggerRefresh, refresh]);

  const handleAdmit = async (userId) => {
    await onAdmit(userId);
    setWaiting((prev) => prev.filter((w) => w.userId !== userId));
  };

  const handleDeny = async (userId) => {
    await onDeny(userId);
    setWaiting((prev) => prev.filter((w) => w.userId !== userId));
  };

  return (
    <Drawer anchor="left" open={open} onClose={onClose}
      PaperProps={{ sx: { width: 320, bgcolor: DARK2 } }}>
      <Box sx={{ p: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Typography sx={{ color: TEXT, fontWeight: 800, fontSize: 16 }}>
          Waiting Room
          {waiting.length > 0 && (
            <Chip label={waiting.length} size="small"
              sx={{ ml: 1.5, bgcolor: "#ef4444", color: "#fff", fontWeight: 800, height: 20, fontSize: 11 }} />
          )}
        </Typography>
        <IconButton onClick={onClose} sx={{ color: MUTED_D }}><Close /></IconButton>
      </Box>
      <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

      {loading && waiting.length === 0 ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress size={28} sx={{ color: GREEN }} />
        </Box>
      ) : waiting.length === 0 ? (
        <Box sx={{ textAlign: "center", mt: 5, px: 3 }}>
          <HourglassTop sx={{ fontSize: 36, color: MUTED_D, mb: 1 }} />
          <Typography sx={{ color: MUTED_D, fontSize: 14 }}>No one waiting</Typography>
        </Box>
      ) : (
        <List>
          {waiting.map((w) => (
            <ListItem key={w.userId}
              sx={{ flexDirection: "column", alignItems: "stretch",
                    borderBottom: "1px solid rgba(255,255,255,0.06)", pb: 2 }}>
              <Stack direction="row" spacing={1.5} alignItems="center" mb={1.5}>
                <Avatar src={w.profilePicUrl || undefined}
                  sx={{ width: 42, height: 42, bgcolor: avatarColor(w.fullName) }}>
                  {!w.profilePicUrl && getInitials(w.fullName)}
                </Avatar>
                <Box>
                <Stack direction="row" spacing={0.75} alignItems="center">
                  <Typography sx={{ color: TEXT, fontWeight: 700, fontSize: 14 }}>{w.fullName}</Typography>
                  {w.isGuest && (
                    <Chip
                      label="Guest"
                      size="small"
                      sx={{ height: 18, fontSize: 10, fontWeight: 800, bgcolor: "rgba(212,160,23,0.18)", color: GOLD }}
                    />
                  )}
                </Stack>
                <Typography sx={{ color: MUTED_D, fontSize: 12 }}>Waiting to join</Typography>
              </Box>
                {/* <Box>
                  <Typography sx={{ color: TEXT, fontWeight: 700, fontSize: 14 }}>{w.fullName}</Typography>
                  <Typography sx={{ color: MUTED_D, fontSize: 12 }}>Waiting to join</Typography>
                </Box> */}
              </Stack>
              <Stack direction="row" spacing={1}>
                <Button fullWidth variant="contained" size="small"
                  startIcon={<CheckCircle sx={{ fontSize: 15 }} />}
                  onClick={() => handleAdmit(w.isGuest ? w.guestId : w.userId)}
                  // onClick={() => handleAdmit(w.userId)}
                  sx={{ bgcolor: GREEN, textTransform: "none", fontWeight: 700, borderRadius: 2,
                        "&:hover": { bgcolor: "#166d3e" } }}>
                  Admit
                </Button>
                <Button fullWidth variant="outlined" size="small"
                  startIcon={<Cancel sx={{ fontSize: 15 }} />}
                  onClick={() => handleDeny(w.isGuest ? w.guestId : w.userId)}
                  // onClick={() => handleDeny(w.userId)}
                  sx={{ borderColor: "#ef4444", color: "#ef4444", textTransform: "none", fontWeight: 700,
                        borderRadius: 2, "&:hover": { borderColor: "#dc2626", bgcolor: "rgba(239,68,68,0.08)" } }}>
                  Deny
                </Button>
              </Stack>
            </ListItem>
          ))}
        </List>
      )}
    </Drawer>
  );
};

// ─── Control Bar — raise hand is now a TOGGLE, shows active state ──────
const ControlBar = ({
  role, sessionId, onLeave,
  onWhiteboard, onParticipants, onAdmitPanel,
  participantCount, waitingCount,
  handRaised, onToggleHand,
}) => {
  const { localParticipant } = useLocalParticipant();
  const room                 = useRoomContext();

  const [micOn,         setMicOn]         = useState(true);
  const [camOn,         setCamOn]         = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [recording,     setRecording]     = useState(false);

  // ── CHANGED: boolean toggle instead of anchored Popover state ──
  const [reactionPickerOpen, setReactionPickerOpen] = useState(false);

  const REACTIONS = ["👋","👍","❤️","😂","🎉","🔥","❓","👏"];

  const toggleMic    = async () => { await localParticipant?.setMicrophoneEnabled(!micOn); setMicOn(!micOn); };
  const toggleCam    = async () => { await localParticipant?.setCameraEnabled(!camOn);     setCamOn(!camOn); };
  const toggleScreen = async () => {
    try { await localParticipant?.setScreenShareEnabled(!screenSharing); setScreenSharing(!screenSharing); }
    catch { /* user cancelled */ }
  };
  const toggleRecording = async () => {
    try {
      recording ? await stopRecording(sessionId) : await startRecording(sessionId);
      setRecording(!recording);
    } catch (err) { console.error(err); }
  };

  const handleReaction = async (emoji) => {
    setReactionPickerOpen(false);   // ← was setReactionAnchor(null)
    try {
      const payload = new TextEncoder().encode(JSON.stringify({
        type: MSG.REACTION,
        identity: localParticipant?.identity,
        fullName: getMetadata(localParticipant).fullName,
        emoji,
      }));
      await room?.localParticipant?.publishData(payload, { reliable: false });
      await sendSessionReaction(sessionId, emoji);
    } catch (err) { console.error(err); }
  };

  const CtrlBtn = ({ title, onClick, active, activeColor = GREEN, danger, children }) => (
    <Tooltip title={title}>
      <IconButton onClick={onClick} sx={{
        width: 48, height: 48, borderRadius: 2.5,
        bgcolor: danger ? "rgba(239,68,68,0.15)" : active ? `${activeColor}22` : "rgba(255,255,255,0.06)",
        color:   danger ? "#ef4444"              : active ? activeColor        : MUTED_D,
        "&:hover": { bgcolor: danger ? "rgba(239,68,68,0.28)" : `${activeColor}33` },
        transition: "all 0.15s",
      }}>
        {children}
      </IconButton>
    </Tooltip>
  );

  return (
    <Box sx={{
      position: "relative",   // ← anchors the reaction panel below via "absolute"
      bgcolor: DARK2, borderTop: "1px solid rgba(255,255,255,0.06)",
      px: 3, py: 1.5, display: "flex", alignItems: "center",
      justifyContent: "center", gap: 1, flexWrap: "wrap",
    }}>
      <Box sx={{ display: "flex", gap: 1 }}>
        <CtrlBtn title={micOn ? "Mute" : "Unmute"} onClick={toggleMic} active={micOn}>
          {micOn ? <Mic /> : <MicOff />}
        </CtrlBtn>
        <CtrlBtn title={camOn ? "Camera off" : "Camera on"} onClick={toggleCam} active={camOn}>
          {camOn ? <Videocam /> : <VideocamOff />}
        </CtrlBtn>
        <CtrlBtn title={screenSharing ? "Stop sharing" : "Share screen"} onClick={toggleScreen}
          active={screenSharing} activeColor={GOLD}>
          {screenSharing ? <StopScreenShare /> : <ScreenShare />}
        </CtrlBtn>
      </Box>

      <Box sx={{ width: 1, height: 36, bgcolor: "rgba(255,255,255,0.08)", mx: 0.5 }} />

      <Box sx={{ display: "flex", gap: 1 }}>
        <CtrlBtn title={handRaised ? "Lower hand" : "Raise hand"} onClick={onToggleHand}
          active={handRaised} activeColor={GOLD}>
          <PanTool />
        </CtrlBtn>

        {/* ── CHANGED: toggle instead of opening a Popover anchored to this button ── */}
        <CtrlBtn title="Reactions" onClick={() => setReactionPickerOpen((o) => !o)}
          active={reactionPickerOpen} activeColor="#7C3AED">
          <EmojiEmotions />
        </CtrlBtn>

        <Tooltip title="Whiteboard">
          <IconButton onClick={onWhiteboard}
            sx={{ width: 48, height: 48, borderRadius: 2.5, bgcolor: "rgba(255,255,255,0.06)", color: MUTED_D,
                  "&:hover": { bgcolor: "rgba(255,255,255,0.12)" } }}>
            <Draw />
          </IconButton>
        </Tooltip>
        <Tooltip title="Participants">
          <Badge badgeContent={participantCount} color="primary" max={99}>
            <IconButton onClick={onParticipants}
              sx={{ width: 48, height: 48, borderRadius: 2.5, bgcolor: "rgba(255,255,255,0.06)", color: MUTED_D,
                    "&:hover": { bgcolor: "rgba(255,255,255,0.12)" } }}>
              <PeopleAlt />
            </IconButton>
          </Badge>
        </Tooltip>

        {role === "host" && (
          <Tooltip title="Waiting room">
            <Badge badgeContent={waitingCount} color="error" max={99}>
              <IconButton onClick={onAdmitPanel}
                sx={{
                  width: 48, height: 48, borderRadius: 2.5,
                  bgcolor: waitingCount > 0 ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.06)",
                  color:   waitingCount > 0 ? "#ef4444"               : MUTED_D,
                  animation: waitingCount > 0 ? "pulse 1.5s infinite" : "none",
                  "@keyframes pulse": {
                    "0%,100%": { boxShadow: "0 0 0 0 rgba(239,68,68,0.4)" },
                    "50%":     { boxShadow: "0 0 0 8px rgba(239,68,68,0)" },
                  },
                  "&:hover": { bgcolor: "rgba(239,68,68,0.25)" },
                }}>
                <PersonAdd />
              </IconButton>
            </Badge>
          </Tooltip>
        )}
      </Box>

      <Box sx={{ width: 1, height: 36, bgcolor: "rgba(255,255,255,0.08)", mx: 0.5 }} />

      <Box sx={{ display: "flex", gap: 1 }}>
        {role === "host" && (
          <CtrlBtn title={recording ? "Stop recording" : "Record"} onClick={toggleRecording}
            active={recording} activeColor="#ef4444">
            {recording ? <StopCircle /> : <FiberManualRecord />}
          </CtrlBtn>
        )}
        <Tooltip title="Leave">
          <Button onClick={onLeave} variant="contained"
            sx={{ bgcolor: "#ef4444", color: "#fff", borderRadius: 2.5, px: 2.5,
                  fontWeight: 700, textTransform: "none",
                  "&:hover": { bgcolor: "#dc2626" }, gap: 1 }}>
            <CallEnd sx={{ fontSize: 18 }} /> Leave
          </Button>
        </Tooltip>
      </Box>

      {/* ══════════════════════════════════════════════════════
          REACTION PICKER — self-positioned panel, NOT a Popover.
          No anchorEl tracking, no Modal/aria-hidden interaction.
          ══════════════════════════════════════════════════════ */}
      {reactionPickerOpen && (
        <>
          {/* Click-outside backdrop — plain div, invisible, just for closing */}
          <Box
            onClick={() => setReactionPickerOpen(false)}
            sx={{ position: "fixed", inset: 0, zIndex: 1200 }}
          />
          <Box
            sx={{
              position: "absolute",
              bottom: "calc(100% + 12px)",
              left: "50%",
              transform: "translateX(-50%)",
              bgcolor: DARK2,
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 3,
              p: 1,
              display: "flex",
              gap: 0.5,
              zIndex: 1201,
              boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            }}
          >
            {REACTIONS.map((emoji) => (
              <IconButton key={emoji} onClick={() => handleReaction(emoji)}
                sx={{ fontSize: 22, "&:hover": { bgcolor: "rgba(255,255,255,0.1)" } }}>
                {emoji}
              </IconButton>
            ))}
          </Box>
        </>
      )}
    </Box>
  );
};


// ─── Lobby Screen (unchanged from your version) ────────────────────────
const LobbyScreen = ({ currentUser, onLeave }) => (
  <Box sx={{ height: "100vh", bgcolor: DARK, display: "flex", flexDirection: "column",
             alignItems: "center", justifyContent: "center", gap: 3, px: 3 }}>
    <Box sx={{
      width: 80, height: 80, borderRadius: "50%", bgcolor: `${GOLD}22`,
      display: "flex", alignItems: "center", justifyContent: "center",
      animation: "glow 2s ease-in-out infinite",
      "@keyframes glow": {
        "0%,100%": { boxShadow: `0 0 0 0 ${GOLD}55` },
        "50%":     { boxShadow: `0 0 0 16px ${GOLD}00` },
      },
    }}>
      <HourglassTop sx={{ fontSize: 38, color: GOLD }} />
    </Box>

    <Avatar src={currentUser?.profilePicUrl || undefined}
      sx={{ width: 72, height: 72, bgcolor: avatarColor(currentUser?.fullName || ""),
            fontSize: 26, fontWeight: 800, border: `3px solid ${GOLD}` }}>
      {!currentUser?.profilePicUrl && getInitials(currentUser?.fullName || "")}
    </Avatar>

    <Box sx={{ textAlign: "center" }}>
      <Typography sx={{ color: TEXT, fontSize: 22, fontWeight: 800, mb: 0.75 }}>
        Waiting to be admitted
      </Typography>
      <Typography sx={{ color: MUTED_D, fontSize: 15 }}>
        {currentUser?.fullName}, please wait while the host lets you in.
      </Typography>
      <Typography sx={{ color: MUTED_D, fontSize: 13, mt: 0.75 }}>
        You'll join automatically once admitted.
      </Typography>
    </Box>

    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 1 }}>
      <Box sx={{
        width: 10, height: 10, borderRadius: "50%", bgcolor: GREEN,
        animation: "pulse 1.5s infinite",
        "@keyframes pulse": { "0%,100%": { opacity: 1 }, "50%": { opacity: 0.3 } },
      }} />
      <Typography sx={{ color: GREEN, fontSize: 14, fontWeight: 700 }}>
        Connected — host will admit you shortly
      </Typography>
    </Box>

    <Button variant="outlined" onClick={onLeave}
      sx={{ borderColor: "rgba(255,255,255,0.3)", color: MUTED_D, textTransform: "none",
            borderRadius: 2.5, mt: 1, "&:hover": { borderColor: "#ef4444", color: "#ef4444" } }}>
      Leave waiting room
    </Button>
  </Box>
);

// ─── RoomInner — now owns whiteboard/hand/reaction shared state ───────
const RoomInner = ({ role, sessionId, navigate, currentUser, phase, onRequestTokenSwap, guestId }) => {
  const participants         = useParticipants();
  const { localParticipant } = useLocalParticipant();
  const room                 = useRoomContext();

  const [whiteboardOpen,   setWhiteboardOpen]   = useState(false);
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [admitPanelOpen,   setAdmitPanelOpen]   = useState(false);
  const [waitingCount,     setWaitingCount]      = useState(0);
  const [joinRequestTick,  setJoinRequestTick]   = useState(0);
  const [toast,            setToast]             = useState(null);
  const [upgrading,        setUpgrading]         = useState(false);
  const [raisedHands,      setRaisedHands]       = useState({});
  const [reactions,        setReactions]         = useState({});
  const [myHandRaised,     setMyHandRaised]      = useState(false);

  // ── FIX 1: stroke queue refs — written by data handler, read by RAF loop ──
  const strokeQueueRef   = useRef([]);   // { from, to, color, thickness }[]
  const clearTriggerRef  = useRef(0);    // increment to trigger a clear

  // Host's full stroke log for sync-on-open
  const strokeLogRef     = useRef([]);
  const reactionTimers   = useRef({});
  const myIdentityRef    = useRef(localParticipant?.identity);
  useEffect(() => { myIdentityRef.current = localParticipant?.identity; }, [localParticipant?.identity]);

  const isHost = role === "host";
  const totalParticipants = (localParticipant ? 1 : 0) + participants.length;

  // Waiting room poll (host only)
  useEffect(() => {
    if (role !== "host") return;
    const poll = async () => {
      try { const res = await getWaitingRoom(sessionId); setWaitingCount((res.waiting || []).length); } catch { /* silent */ }
    };
    poll();
    const id = setInterval(poll, 5000);
    return () => clearInterval(id);
  }, [role, sessionId]);

  // Admission poll fallback (student/guest in lobby)
  useEffect(() => {
    if (phase !== "lobby" || role === "host") return;
    const poll = async () => {
      if (upgrading) return;
      try {
        const res = guestId
          ? await guestGetParticipantToken(sessionId, guestId)
          : await getParticipantToken(sessionId);
        if (res?.token) { setUpgrading(true); onRequestTokenSwap(res.token, res.serverUrl); }
      } catch { /* 403 = still waiting */ }
    };
    const id = setInterval(poll, 3000);
    return () => clearInterval(id);
  }, [phase, role, sessionId, upgrading, onRequestTokenSwap, guestId]);

  const broadcast = useCallback(async (msg, reliable = true) => {
    try {
      const payload = new TextEncoder().encode(JSON.stringify(msg));
      await room?.localParticipant?.publishData(payload, { reliable });
    } catch (err) { console.error("broadcast:", err); }
  }, [room]);

  const handleToggleHand = useCallback(async () => {
    const next = !myHandRaised;
    setMyHandRaised(next);
    setRaisedHands((p) => { const n = { ...p }; if (next) n[myIdentityRef.current] = true; else delete n[myIdentityRef.current]; return n; });
    await broadcast({ type: MSG.RAISE_HAND, identity: myIdentityRef.current, fullName: getMetadata(localParticipant).fullName, raised: next });
    try { await raiseHand(sessionId); } catch { /* best effort */ }
  }, [myHandRaised, broadcast, localParticipant, sessionId]);

  const handleOpenWhiteboard = useCallback(async () => {
    setWhiteboardOpen(true);
    if (isHost) { strokeLogRef.current = []; await broadcast({ type: MSG.WHITEBOARD_OPEN }); }
  }, [isHost, broadcast]);

  const handleCloseWhiteboard = useCallback(async () => {
    setWhiteboardOpen(false);
    if (isHost) await broadcast({ type: MSG.WHITEBOARD_CLOSE });
  }, [isHost, broadcast]);

  const handleLocalStroke = useCallback((stroke) => {
    strokeLogRef.current.push(stroke);
    broadcast({ type: MSG.WHITEBOARD_STROKE, stroke }, false);
  }, [broadcast]);

  const handleLocalClear = useCallback(() => {
    strokeLogRef.current = [];
    broadcast({ type: MSG.WHITEBOARD_CLEAR });
  }, [broadcast]);

  const handleRequestSync = useCallback(() => {
    if (isHost) return;
    broadcast({ type: MSG.WHITEBOARD_SYNC, requesterIdentity: myIdentityRef.current });
  }, [isHost, broadcast]);

  // Data handler
  useEffect(() => {
    if (!room) return;
    const handleData = async (payload) => {
      const data = decodeMsg(payload);
      if (!data) return;

      if (data.type === MSG.JOIN_REQUEST && role === "host") {
        setWaitingCount((c) => c + 1);
        setJoinRequestTick((t) => t + 1);
        setAdmitPanelOpen(true);
        setToast({ msg: `✋ ${data.fullName || "Someone"} is waiting to join`, severity: "info" });
        return;
      }
      if (data.type === MSG.ADMITTED && phase === "lobby") {
        if (data.identity && data.identity !== myIdentityRef.current) return;
        if (upgrading) return;
        setUpgrading(true);
        try {
          const res = guestId
            ? await guestGetParticipantToken(sessionId, guestId)
            : await getParticipantToken(sessionId);
          onRequestTokenSwap(res.token, res.serverUrl);
          setToast({ msg: "You've been admitted! 🎉", severity: "success" });
        } catch (err) {
          console.error("Token upgrade:", err);
          setUpgrading(false);
          setToast({ msg: "Admission error — retrying shortly.", severity: "warning" });
        }
        return;
      }
      if (data.type === MSG.DENIED && phase === "lobby") {
        if (data.identity && data.identity !== myIdentityRef.current) return;
        setToast({ msg: `Request declined.${data.reason ? ` Reason: ${data.reason}` : ""}`, severity: "error" });
        setTimeout(() => navigate("/student/live-classes"), 3500);
        return;
      }
      if (data.type === MSG.RAISE_HAND) {
        setRaisedHands((p) => { const n = { ...p }; if (data.raised) n[data.identity] = true; else delete n[data.identity]; return n; });
        if (data.raised) setToast({ msg: `✋ ${data.fullName || "Someone"} raised their hand`, severity: "info" });
        return;
      }
      if (data.type === MSG.REACTION) {
        const id = data.identity; if (!id) return;
        setReactions((p) => ({ ...p, [id]: { emoji: data.emoji, fullName: data.fullName } }));
        clearTimeout(reactionTimers.current[id]);
        reactionTimers.current[id] = setTimeout(() => {
          setReactions((p) => { const n = { ...p }; delete n[id]; return n; });
        }, 2500);
        return;
      }
      if (data.type === MSG.WHITEBOARD_OPEN)  { setWhiteboardOpen(true);  if (!isHost) setToast({ msg: "Host opened the whiteboard", severity: "info" }); return; }
      if (data.type === MSG.WHITEBOARD_CLOSE) { setWhiteboardOpen(false); return; }

      // ── FIX 1: push stroke into queue ref (no React setState) ──
      if (data.type === MSG.WHITEBOARD_STROKE && !isHost) {
        strokeQueueRef.current.push(data.stroke);
        return;
      }
      // ── FIX 1: increment clear trigger ref ──
      if (data.type === MSG.WHITEBOARD_CLEAR && !isHost) {
        clearTriggerRef.current += 1;
        return;
      }
      if (data.type === MSG.WHITEBOARD_SYNC && isHost) {
        for (const stroke of strokeLogRef.current) {
          await broadcast({ type: MSG.WHITEBOARD_STROKE, stroke }, false);
        }
        return;
      }
    };
    room.on("dataReceived", handleData);
    return () => { room.off("dataReceived", handleData); };
  }, [room, role, phase, sessionId, navigate, upgrading, onRequestTokenSwap, isHost, broadcast, guestId]);

  const handleAdmit = async (userId) => {
    try { await admitParticipant(sessionId, userId); setWaitingCount((c) => Math.max(0, c - 1)); setToast({ msg: "Participant admitted ✓", severity: "success" }); }
    catch (err) { console.error(err); setToast({ msg: "Failed to admit", severity: "error" }); }
  };
  const handleDeny = async (userId) => {
    try { await denyParticipant(sessionId, userId); setWaitingCount((c) => Math.max(0, c - 1)); }
    catch (err) { console.error(err); }
  };

  // ════════════════════════════════════════════════════════════
  // FIX 2: handleLeave — routes correctly for host, observer, admin
  // Previously always sent non-hosts to /student/live-classes.
  // Now: host/tutor → /tutor/live-classes
  //      observer/admin → /admin/live-sessions
  //      student/participant → /student/live-classes
  // ════════════════════════════════════════════════════════════
  const handleLeave = async () => {
    try { await leaveAttendance(sessionId); } catch { /* ignore */ }

    if (role === "host" || role === "tutor") {
      navigate("/tutor/live-classes");
    } else if (role === "observer" || role === "admin") {
      navigate("/admin/live-sessions");
    } else {
      navigate("/student/live-classes");
    }
  };

  // Lobby phase
  if (phase === "lobby") {
    return (
      <>
        <RoomAudioRenderer />
        <LobbyScreen currentUser={currentUser} onLeave={handleLeave} />
        {upgrading && (
          <Box sx={{ position: "fixed", inset: 0, bgcolor: "rgba(0,0,0,0.75)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, zIndex: 9999 }}>
            <CircularProgress sx={{ color: GREEN }} size={48} />
            <Typography sx={{ color: TEXT, fontWeight: 700, fontSize: 18 }}>Joining the class…</Typography>
          </Box>
        )}
        <Snackbar open={!!toast} autoHideDuration={5000} onClose={() => setToast(null)} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
          <Alert severity={toast?.severity || "info"} onClose={() => setToast(null)}>{toast?.msg}</Alert>
        </Snackbar>
      </>
    );
  }

  // Live phase
  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh", bgcolor: DARK, overflow: "hidden" }}>
      {/* TOP BAR */}
      <Box sx={{ bgcolor: DARK2, borderBottom: "1px solid rgba(255,255,255,0.06)", px: 3, py: 1.25, display: "flex", alignItems: "center", gap: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: GREEN, boxShadow: `0 0 0 3px ${GREEN}44`,
                      animation: "p 2s infinite", "@keyframes p": { "0%,100%": { opacity: 1 }, "50%": { opacity: 0.4 } } }} />
          <Typography sx={{ color: TEXT, fontWeight: 800, fontSize: 15 }}>GIEVA Live</Typography>
        </Box>
        <Chip label="LIVE" size="small" sx={{ bgcolor: "#ef444433", color: "#ef4444", fontWeight: 800, fontSize: 11 }} />
        <Box flex={1} />
        {waitingCount > 0 && role === "host" && (
          <Chip icon={<PersonAdd sx={{ fontSize: 14 }} />} label={`${waitingCount} waiting`} onClick={() => setAdmitPanelOpen(true)} size="small"
            sx={{ bgcolor: "rgba(239,68,68,0.18)", color: "#fca5a5", fontWeight: 800, border: "1px solid rgba(239,68,68,0.35)", cursor: "pointer", "& .MuiChip-icon": { color: "#f87171" } }} />
        )}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Avatar src={currentUser?.profilePicUrl || undefined}
            sx={{ width: 30, height: 30, bgcolor: avatarColor(currentUser?.fullName || ""), fontSize: 12 }}>
            {!currentUser?.profilePicUrl && getInitials(currentUser?.fullName || "")}
          </Avatar>
          <Typography sx={{ fontSize: 13, color: MUTED_D }}>{currentUser?.fullName}</Typography>
          {role === "host" && <Chip label="Host" size="small" sx={{ bgcolor: GOLD, color: NAVY, fontWeight: 800, height: 20, fontSize: 11 }} />}
          {role === "observer" && <Chip label="Observer" size="small" sx={{ bgcolor: "rgba(148,163,184,0.15)", color: MUTED_D, fontWeight: 800, height: 20, fontSize: 11 }} />}
        </Box>
      </Box>

      <ParticipantGrid raisedHands={raisedHands} reactions={reactions} />
      <RoomAudioRenderer />

      <ControlBar
        role={role} sessionId={sessionId} onLeave={handleLeave}
        onWhiteboard={handleOpenWhiteboard} onParticipants={() => setParticipantsOpen(true)}
        onAdmitPanel={() => setAdmitPanelOpen(true)}
        participantCount={totalParticipants} waitingCount={waitingCount}
        handRaised={myHandRaised} onToggleHand={handleToggleHand}
      />

      {/* FIX 1: pass ref objects instead of React state to WhiteboardDrawer */}
      <WhiteboardDrawer
        open={whiteboardOpen}
        onClose={handleCloseWhiteboard}
        isHost={isHost}
        onLocalStroke={handleLocalStroke}
        onLocalClear={handleLocalClear}
        strokeQueueRef={strokeQueueRef}
        clearTriggerRef={clearTriggerRef}
        syncStrokes={handleRequestSync}
      />
      <ParticipantsDrawer open={participantsOpen} onClose={() => setParticipantsOpen(false)} />
      <AdmitPanel open={admitPanelOpen} onClose={() => setAdmitPanelOpen(false)}
        sessionId={sessionId} onAdmit={handleAdmit} onDeny={handleDeny} triggerRefresh={joinRequestTick} />

      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <Alert severity={toast?.severity || "info"} onClose={() => setToast(null)}>{toast?.msg}</Alert>
      </Snackbar>
    </Box>
  );
};


const GuestGate = ({ onSubmit, loading, error }) => {
  const [name, setName] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit(name.trim());
  };

  return (
    <Box sx={{ height: "100vh", bgcolor: DARK, display: "flex", flexDirection: "column",
               alignItems: "center", justifyContent: "center", gap: 3, px: 3 }}>
      <Box sx={{
        width: 72, height: 72, borderRadius: "50%", bgcolor: `${GREEN}22`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Videocam sx={{ fontSize: 32, color: GREEN }} />
      </Box>

      <Box sx={{ textAlign: "center" }}>
        <Typography sx={{ color: TEXT, fontSize: 22, fontWeight: 800, mb: 0.75 }}>
          Join this meeting
        </Typography>
        <Typography sx={{ color: MUTED_D, fontSize: 14 }}>
          Enter your name to request entry — no account needed.
        </Typography>
      </Box>

      <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%", maxWidth: 360 }}>
        <Box
          component="input"
          autoFocus
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          sx={{
            width: "100%", height: 48, borderRadius: 2.5, px: 2,
            bgcolor: DARK2, border: `1px solid ${DARK3}`, color: TEXT,
            fontSize: 15, outline: "none", mb: 2,
            "&:focus": { borderColor: GREEN },
          }}
        />

        {error && (
          <Typography sx={{ color: "#ef4444", fontSize: 13, mb: 2, textAlign: "center" }}>
            {error}
          </Typography>
        )}

        <Button
          type="submit"
          fullWidth
          variant="contained"
          disabled={loading || !name.trim()}
          sx={{
            bgcolor: GREEN, color: "#fff", textTransform: "none", fontWeight: 700,
            borderRadius: 2.5, py: 1.25, "&:hover": { bgcolor: "#166d3e" },
          }}
        >
          {loading ? <CircularProgress size={20} color="inherit" /> : "Ask to Join"}
        </Button>
      </Box>

      <Typography sx={{ color: MUTED_D, fontSize: 12, mt: 1 }}>
        Have an account?{" "}
        <Box component="span" sx={{ color: GREEN, cursor: "pointer", fontWeight: 700 }}
          onClick={() => window.location.assign("/login")}>
          Log in
        </Box>{" "}
        instead
      </Typography>
    </Box>
  );
};

// ═══════════════════════════════════════════════════════════════
// MAIN EXPORT — full replacement
// ═══════════════════════════════════════════════════════════════

export default function LiveClassroom() {
  const { roomName, sessionId } = useParams();
  const location      = useLocation();
  const navigate      = useNavigate();
  const role          = location.state?.role || "student";

  const [token,       setToken]       = useState("");
  const [serverUrl,   setServerUrl]   = useState("");
  const [phase,       setPhase]       = useState("lobby");
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  // ── NEW: guest-mode state ──
  const isPublicRoom = roomName?.startsWith("public-");
  const hasAuthToken = !!localStorage.getItem("token");

  // sessionStorage (not localStorage) — guest identity should not
  // outlive the tab/browser session the way a real login persists.
  const [guestId, setGuestId] = useState(() => sessionStorage.getItem(`guestId:${sessionId}`));
  const [needsGuestGate, setNeedsGuestGate] = useState(false);
  const [guestGateLoading, setGuestGateLoading] = useState(false);
  const [guestGateError, setGuestGateError] = useState("");

  const isHostRole = role === "tutor" || role === "host";

  useEffect(() => {
    // ── Decide the entry path up front ──
    if (!hasAuthToken) {
      if (isPublicRoom) {
        // Unauthenticated + public meeting → show the guest gate
        // instead of attempting any join call yet.
        setNeedsGuestGate(true);
        setLoading(false);
        return;
      }
      // Unauthenticated + NOT a public meeting → this replaces what
      // <ProtectedRoute> used to do for this route.
      navigate("/login", { replace: true });
      return;
    }

    // Authenticated path — unchanged from before.
    loadClass();
    return () => { leaveAttendance(sessionId).catch(() => {}); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const loadClass = async () => {
    try {
      setLoading(true);
      let response;

      if (isHostRole && isPublicRoom) {
        response = await joinPublicMeetingAsHost(sessionId);
      } else if (isHostRole) {
        response = await joinTutorSession(sessionId);
      } else {
        response = await joinClassSession(sessionId);
      }

      setToken(response.token);
      setServerUrl(response.serverUrl);
      setPhase(response.phase || (isHostRole ? "live" : "lobby"));
      setCurrentUser(response.currentUser || null);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Failed to join class");
    } finally {
      setLoading(false);
    }
  };

  // ── NEW: guest gate submit handler ──
  const handleGuestSubmit = async (displayName) => {
    try {
      setGuestGateLoading(true);
      setGuestGateError("");

      const response = await guestJoinPublicMeeting(sessionId, displayName);

      sessionStorage.setItem(`guestId:${sessionId}`, response.guestId);
      setGuestId(response.guestId);

      setToken(response.token);
      setServerUrl(response.serverUrl);
      setPhase(response.phase || "lobby");
      setCurrentUser(response.currentUser || null);
      setNeedsGuestGate(false);
    } catch (err) {
      console.error(err);
      setGuestGateError(err?.response?.data?.message || "Failed to join — please try again");
    } finally {
      setGuestGateLoading(false);
    }
  };

  // ── Admission token-swap callback — branches on guest vs. registered ──
  const handleTokenSwap = useCallback((newToken, newServerUrl) => {
    setToken(newToken);
    if (newServerUrl) setServerUrl(newServerUrl);
    setPhase("live");
  }, []);

  // ── GUEST GATE — shown before any LiveKit connection exists ──
  if (needsGuestGate) {
    return (
      <GuestGate
        onSubmit={handleGuestSubmit}
        loading={guestGateLoading}
        error={guestGateError}
      />
    );
  }

  if (loading) {
    return (
      <Box sx={{ height: "100vh", display: "flex", justifyContent: "center",
                 alignItems: "center", flexDirection: "column", bgcolor: DARK, gap: 2 }}>
        <Box sx={{ width: 64, height: 64, borderRadius: "50%", bgcolor: `${GREEN}22`,
                   display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Videocam sx={{ fontSize: 32, color: GREEN }} />
        </Box>
        <Typography sx={{ color: TEXT, fontWeight: 700, fontSize: 18 }}>Joining classroom…</Typography>
        <Typography sx={{ color: MUTED_D, fontSize: 14 }}>Setting up your session</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ height: "100vh", display: "flex", justifyContent: "center",
                 alignItems: "center", flexDirection: "column", bgcolor: DARK, gap: 2, p: 3 }}>
        <Typography sx={{ color: "#ef4444", fontWeight: 700, fontSize: 18, textAlign: "center" }}>
          {error}
        </Typography>
        <Button variant="outlined"
          onClick={() => navigate(role === "tutor" ? "/tutor/live-classes" : "/student/live-classes")}
          sx={{ borderColor: MUTED_D, color: MUTED_D, textTransform: "none", borderRadius: 2 }}>
          Go back
        </Button>
      </Box>
    );
  }

  return (
    <LiveKitRoom
      key={token}
      token={token}
      serverUrl={serverUrl}
      connect
      audio={phase === "live"}
      video={phase === "live"}
      onDisconnected={() =>
        navigate(role === "host" || role === "tutor" ? "/tutor/live-classes" : "/student/live-classes")
      }
    >
      <RoomInner
        role={role === "tutor" ? "host" : role}
        sessionId={sessionId}
        navigate={navigate}
        currentUser={currentUser}
        phase={phase}
        onRequestTokenSwap={handleTokenSwap}
        // NEW: tells RoomInner's poll-fallback effect which endpoints
        // to use for this participant
        guestId={guestId}
      />
    </LiveKitRoom>
  );
}



// ─── Main Export (unchanged from the public-meeting-host patch) ───────
// export default function LiveClassroom() {
//   const { roomName, sessionId } = useParams();
//   const location      = useLocation();
//   const navigate      = useNavigate();
//   const role          = location.state?.role || "student";

//   const [token,       setToken]       = useState("");
//   const [serverUrl,   setServerUrl]   = useState("");
//   const [phase,       setPhase]       = useState("lobby");
//   const [loading,     setLoading]     = useState(true);
//   const [error,       setError]       = useState("");
//   const [currentUser, setCurrentUser] = useState(null);

//   useEffect(() => {
//     loadClass();
//     return () => { leaveAttendance(sessionId).catch(() => {}); };
//   }, [sessionId]);

//   const loadClass = async () => {
//     try {
//       setLoading(true);
//       let response;

//       const isHostRole   = role === "tutor" || role === "host";
//       const isPublicRoom = roomName?.startsWith("public-");

//       if (isHostRole && isPublicRoom) {
//         response = await joinPublicMeetingAsHost(sessionId);
//       } else if (isHostRole) {
//         response = await joinTutorSession(sessionId);
//       } else {
//         response = await joinClassSession(sessionId);
//       }

//       setToken(response.token);
//       setServerUrl(response.serverUrl);
//       setPhase(response.phase || (isHostRole ? "live" : "lobby"));
//       setCurrentUser(response.currentUser || null);
//     } catch (err) {
//       console.error(err);
//       setError(err?.response?.data?.message || "Failed to join class");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleTokenSwap = useCallback((newToken, newServerUrl) => {
//     setToken(newToken);
//     if (newServerUrl) setServerUrl(newServerUrl);
//     setPhase("live");
//   }, []);

//   if (loading) {
//     return (
//       <Box sx={{ height: "100vh", display: "flex", justifyContent: "center",
//                  alignItems: "center", flexDirection: "column", bgcolor: DARK, gap: 2 }}>
//         <Box sx={{ width: 64, height: 64, borderRadius: "50%", bgcolor: `${GREEN}22`,
//                    display: "flex", alignItems: "center", justifyContent: "center" }}>
//           <Videocam sx={{ fontSize: 32, color: GREEN }} />
//         </Box>
//         <Typography sx={{ color: TEXT, fontWeight: 700, fontSize: 18 }}>Joining classroom…</Typography>
//         <Typography sx={{ color: MUTED_D, fontSize: 14 }}>Setting up your session</Typography>
//       </Box>
//     );
//   }

//   if (error) {
//     return (
//       <Box sx={{ height: "100vh", display: "flex", justifyContent: "center",
//                  alignItems: "center", flexDirection: "column", bgcolor: DARK, gap: 2, p: 3 }}>
//         <Typography sx={{ color: "#ef4444", fontWeight: 700, fontSize: 18, textAlign: "center" }}>
//           {error}
//         </Typography>
//         <Button variant="outlined"
//           onClick={() => navigate(role === "tutor" ? "/tutor/live-classes" : "/student/live-classes")}
//           sx={{ borderColor: MUTED_D, color: MUTED_D, textTransform: "none", borderRadius: 2 }}>
//           Go back
//         </Button>
//       </Box>
//     );
//   }

//   return (
//     <LiveKitRoom
//       key={token}
//       token={token}
//       serverUrl={serverUrl}
//       connect
//       audio={phase === "live"}
//       video={phase === "live"}
//       onDisconnected={() =>
//         navigate(role === "host" || role === "tutor" ? "/tutor/live-classes" : "/student/live-classes")
//       }
//     >
//       <RoomInner
//         role={role === "tutor" ? "host" : role}
//         sessionId={sessionId}
//         navigate={navigate}
//         currentUser={currentUser}
//         phase={phase}
//         onRequestTokenSwap={handleTokenSwap}
//       />
//     </LiveKitRoom>
//   );
// }





// // pages/LiveClassroom.jsx
// // Full production-grade live classroom:
// //  - Real participant names from LiveKit token metadata
// //  - Real profile picture avatars (fallback to initials)
// //  - Functional HTML5 Canvas whiteboard (draw, erase, clear, color, thickness)
// //  - Premium Zoom-style UI with dark theme
// //  - Participant list drawer
// //  - Recording, raise hand, reactions

// import {
//   LiveKitRoom,
//   RoomAudioRenderer,
//   useParticipants,
//   useLocalParticipant,
//   useTracks,
//   VideoTrack,
//   AudioTrack,
// } from "@livekit/components-react";

// import { Track } from "livekit-client";

// import "@livekit/components-styles";

// import {
//   useEffect,
//   useRef,
//   useState,
//   useCallback,
// } from "react";

// import {
//   useParams,
//   useLocation,
//   useNavigate,
// } from "react-router-dom";

// import {
//   Box,
//   Typography,
//   IconButton,
//   Tooltip,
//   Avatar,
//   Chip,
//   Drawer,
//   List,
//   ListItem,
//   ListItemAvatar,
//   ListItemText,
//   Badge,
//   Popover,
//   Slider,
//   Button,
//   Stack,
// } from "@mui/material";

// import {
//   Mic,
//   MicOff,
//   Videocam,
//   VideocamOff,
//   ScreenShare,
//   StopScreenShare,
//   Chat,
//   PeopleAlt,
//   PanTool,
//   EmojiEmotions,
//   FiberManualRecord,
//   StopCircle,
//   Draw,
//   Close,
//   CallEnd,
//   Circle,
//   DeleteSweep,
// } from "@mui/icons-material";

// import {
//   markAttendance,
//   leaveAttendance,
//   joinClassSession,
//   joinTutorSession,
//   sendSessionReaction,
//   raiseHand,
//   startRecording,
//   stopRecording,
// } from "../services/classSessionService";

// // ─────────────────────────────────────────────────────────────
// // TOKENS
// // ─────────────────────────────────────────────────────────────

// const NAVY = "#0B1F3A";
// const GREEN = "#1E7F4F";
// const GOLD = "#D4A017";
// const DARK = "#0f172a";
// const DARK2 = "#1e293b";
// const DARK3 = "#334155";
// const TEXT = "#f1f5f9";
// const MUTED_DARK = "#94a3b8";

// // ─────────────────────────────────────────────────────────────
// // HELPERS
// // ─────────────────────────────────────────────────────────────

// const getMetadata = (participant) => {
//   try {
//     return JSON.parse(participant?.metadata || "{}");
//   } catch {
//     return {};
//   }
// };

// const getInitials = (name = "") =>
//   name
//     .split(" ")
//     .filter(Boolean)
//     .slice(0, 2)
//     .map((n) => n[0])
//     .join("")
//     .toUpperCase() || "?";

// const avatarColor = (name = "") => {
//   const colors = [
//     "#7C3AED", "#0284C7", "#DC2626",
//     "#D97706", "#059669", "#0891B2",
//   ];
//   let hash = 0;
//   for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + hash * 31;
//   return colors[Math.abs(hash) % colors.length];
// };

// // ─────────────────────────────────────────────────────────────
// // PARTICIPANT AVATAR TILE
// // ─────────────────────────────────────────────────────────────

// const ParticipantTile = ({ participant, isLocal = false, isLarge = false }) => {
//   const meta = getMetadata(participant);
//   const name = meta.fullName || participant.identity;
//   const pic = meta.profilePicUrl;
//   const isHost = meta.role === "host" || meta.role === "tutor";

//   const tracks = useTracks(
//     [{ source: Track.Source.Camera, withPlaceholder: true }],
//     { participant }
//   );
//   const camTrack = tracks.find((t) => t.source === Track.Source.Camera);
//   const hasCam = camTrack && !camTrack.isMuted && camTrack.publication;

//   const tileSize = isLarge
//     ? { width: "100%", height: "100%", minHeight: 320 }
//     : { width: "100%", aspectRatio: "16/9" };

//   return (
//     <Box
//       sx={{
//         ...tileSize,
//         position: "relative",
//         borderRadius: 3,
//         overflow: "hidden",
//         bgcolor: DARK2,
//         border: `1px solid ${DARK3}`,
//         display: "flex",
//         alignItems: "center",
//         justifyContent: "center",
//       }}
//     >
//       {/* VIDEO */}
//       {hasCam ? (
//         <Box sx={{ position: "absolute", inset: 0 }}>
//           <VideoTrack trackRef={camTrack} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
//         </Box>
//       ) : (
//         /* AVATAR FALLBACK */
//         <Avatar
//           src={pic || undefined}
//           sx={{
//             width: isLarge ? 120 : 72,
//             height: isLarge ? 120 : 72,
//             fontSize: isLarge ? 42 : 26,
//             fontWeight: 800,
//             bgcolor: avatarColor(name),
//             border: "3px solid rgba(255,255,255,0.15)",
//           }}
//         >
//           {!pic && getInitials(name)}
//         </Avatar>
//       )}

//       {/* NAME BAR */}
//       <Box
//         sx={{
//           position: "absolute",
//           bottom: 0,
//           left: 0,
//           right: 0,
//           background: "linear-gradient(transparent, rgba(0,0,0,0.75))",
//           px: 1.5,
//           py: 1,
//           display: "flex",
//           alignItems: "center",
//           gap: 1,
//         }}
//       >
//         <Typography sx={{ fontSize: 13, fontWeight: 700, color: TEXT, flex: 1 }} noWrap>
//           {isLocal ? `${name} (You)` : name}
//         </Typography>

//         {isHost && (
//           <Chip
//             label="Host"
//             size="small"
//             sx={{ bgcolor: GOLD, color: NAVY, fontWeight: 800, height: 20, fontSize: 11 }}
//           />
//         )}

//         {/* MIC indicator */}
//         {participant.isMicrophoneEnabled ? (
//           <Mic sx={{ fontSize: 14, color: GREEN }} />
//         ) : (
//           <MicOff sx={{ fontSize: 14, color: "#ef4444" }} />
//         )}
//       </Box>
//     </Box>
//   );
// };

// // ─────────────────────────────────────────────────────────────
// // PARTICIPANT GRID
// // ─────────────────────────────────────────────────────────────

// const ParticipantGrid = () => {
//   const participants = useParticipants();
//   const { localParticipant } = useLocalParticipant();

//   const all = [
//     localParticipant,
//     ...participants.filter((p) => p.identity !== localParticipant?.identity),
//   ].filter(Boolean);

//   const count = all.length;

//   const gridCols = count === 1 ? 1 : count <= 4 ? 2 : count <= 9 ? 3 : 4;

//   return (
//     <Box
//       sx={{
//         flex: 1,
//         display: "grid",
//         gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
//         gap: 1.5,
//         p: 2,
//         alignContent: "start",
//         overflowY: "auto",
//       }}
//     >
//       {all.map((p) => (
//         <ParticipantTile
//           key={p.identity}
//           participant={p}
//           isLocal={p.identity === localParticipant?.identity}
//           isLarge={count === 1}
//         />
//       ))}
//     </Box>
//   );
// };

// // ─────────────────────────────────────────────────────────────
// // WHITEBOARD DRAWER — real HTML5 Canvas
// // ─────────────────────────────────────────────────────────────

// const WhiteboardDrawer = ({ open, onClose }) => {
//   const canvasRef = useRef(null);
//   const isDrawing = useRef(false);
//   const lastPos = useRef({ x: 0, y: 0 });

//   const [tool, setTool] = useState("pen"); // pen | eraser
//   const [color, setColor] = useState("#000000");
//   const [thickness, setThickness] = useState(3);

//   const COLORS = [
//     "#000000", "#ffffff", "#ef4444", "#f97316",
//     "#eab308", "#22c55e", "#3b82f6", "#8b5cf6",
//   ];

//   const getPos = (e, canvas) => {
//     const rect = canvas.getBoundingClientRect();
//     const clientX = e.touches ? e.touches[0].clientX : e.clientX;
//     const clientY = e.touches ? e.touches[0].clientY : e.clientY;
//     return {
//       x: (clientX - rect.left) * (canvas.width / rect.width),
//       y: (clientY - rect.top) * (canvas.height / rect.height),
//     };
//   };

//   const startDraw = useCallback((e) => {
//     e.preventDefault();
//     const canvas = canvasRef.current;
//     if (!canvas) return;
//     isDrawing.current = true;
//     lastPos.current = getPos(e, canvas);
//   }, []);

//   const draw = useCallback(
//     (e) => {
//       e.preventDefault();
//       if (!isDrawing.current) return;
//       const canvas = canvasRef.current;
//       const ctx = canvas.getContext("2d");
//       const pos = getPos(e, canvas);

//       ctx.beginPath();
//       ctx.moveTo(lastPos.current.x, lastPos.current.y);
//       ctx.lineTo(pos.x, pos.y);
//       ctx.strokeStyle = tool === "eraser" ? "#ffffff" : color;
//       ctx.lineWidth = tool === "eraser" ? thickness * 5 : thickness;
//       ctx.lineCap = "round";
//       ctx.lineJoin = "round";
//       ctx.stroke();
//       lastPos.current = pos;
//     },
//     [tool, color, thickness]
//   );

//   const stopDraw = useCallback(() => {
//     isDrawing.current = false;
//   }, []);

//   const clearCanvas = () => {
//     const canvas = canvasRef.current;
//     const ctx = canvas.getContext("2d");
//     ctx.fillStyle = "#ffffff";
//     ctx.fillRect(0, 0, canvas.width, canvas.height);
//   };

//   // Init white background
//   useEffect(() => {
//     if (!open) return;
//     setTimeout(() => {
//       const canvas = canvasRef.current;
//       if (!canvas) return;
//       canvas.width = canvas.offsetWidth;
//       canvas.height = canvas.offsetHeight;
//       clearCanvas();
//     }, 100);
//   }, [open]);

//   return (
//     <Drawer
//       anchor="right"
//       open={open}
//       onClose={onClose}
//       PaperProps={{
//         sx: {
//           width: { xs: "100vw", md: 700 },
//           bgcolor: "#f8fafc",
//           display: "flex",
//           flexDirection: "column",
//         },
//       }}
//     >
//       {/* TOOLBAR */}
//       <Box
//         sx={{
//           p: 1.5,
//           bgcolor: DARK,
//           display: "flex",
//           alignItems: "center",
//           gap: 1.5,
//           flexWrap: "wrap",
//         }}
//       >
//         <Typography sx={{ color: TEXT, fontWeight: 800, fontSize: 15, mr: 1 }}>
//           Whiteboard
//         </Typography>

//         {/* Tool toggle */}
//         <Tooltip title="Pen">
//           <IconButton
//             onClick={() => setTool("pen")}
//             sx={{
//               color: tool === "pen" ? GOLD : MUTED_DARK,
//               bgcolor: tool === "pen" ? "rgba(212,160,23,0.15)" : "transparent",
//             }}
//           >
//             <Draw />
//           </IconButton>
//         </Tooltip>

//         <Tooltip title="Eraser">
//           <IconButton
//             onClick={() => setTool("eraser")}
//             sx={{
//               color: tool === "eraser" ? GOLD : MUTED_DARK,
//               bgcolor: tool === "eraser" ? "rgba(212,160,23,0.15)" : "transparent",
//               fontSize: 18,
//             }}
//           >
//             ⬜
//           </IconButton>
//         </Tooltip>

//         {/* Colours */}
//         <Box sx={{ display: "flex", gap: 0.5 }}>
//           {COLORS.map((c) => (
//             <Box
//               key={c}
//               onClick={() => { setColor(c); setTool("pen"); }}
//               sx={{
//                 width: 22,
//                 height: 22,
//                 borderRadius: "50%",
//                 bgcolor: c,
//                 cursor: "pointer",
//                 border: color === c ? "2px solid #fff" : "2px solid transparent",
//                 boxShadow: color === c ? "0 0 0 2px " + GOLD : "none",
//                 transition: "box-shadow 0.15s",
//               }}
//             />
//           ))}
//         </Box>

//         {/* Thickness */}
//         <Box sx={{ width: 80 }}>
//           <Slider
//             size="small"
//             min={1}
//             max={20}
//             value={thickness}
//             onChange={(_, v) => setThickness(v)}
//             sx={{ color: GOLD }}
//           />
//         </Box>

//         <Tooltip title="Clear board">
//           <IconButton onClick={clearCanvas} sx={{ color: "#ef4444" }}>
//             <DeleteSweep />
//           </IconButton>
//         </Tooltip>

//         <Box flex={1} />

//         <IconButton onClick={onClose} sx={{ color: MUTED_DARK }}>
//           <Close />
//         </IconButton>
//       </Box>

//       {/* CANVAS */}
//       <Box
//         sx={{
//           flex: 1,
//           position: "relative",
//           overflow: "hidden",
//           cursor: tool === "eraser" ? "cell" : "crosshair",
//         }}
//       >
//         <canvas
//           ref={canvasRef}
//           style={{ width: "100%", height: "100%", display: "block", touchAction: "none" }}
//           onMouseDown={startDraw}
//           onMouseMove={draw}
//           onMouseUp={stopDraw}
//           onMouseLeave={stopDraw}
//           onTouchStart={startDraw}
//           onTouchMove={draw}
//           onTouchEnd={stopDraw}
//         />
//       </Box>
//     </Drawer>
//   );
// };

// // ─────────────────────────────────────────────────────────────
// // PARTICIPANTS LIST DRAWER
// // ─────────────────────────────────────────────────────────────

// const ParticipantsDrawer = ({ open, onClose }) => {
//   const participants = useParticipants();
//   const { localParticipant } = useLocalParticipant();

//   const all = [
//     localParticipant,
//     ...participants.filter((p) => p.identity !== localParticipant?.identity),
//   ].filter(Boolean);

//   return (
//     <Drawer
//       anchor="right"
//       open={open}
//       onClose={onClose}
//       PaperProps={{ sx: { width: 300, bgcolor: DARK2 } }}
//     >
//       <Box sx={{ p: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
//         <Typography sx={{ color: TEXT, fontWeight: 800, fontSize: 16 }}>
//           Participants ({all.length})
//         </Typography>
//         <IconButton onClick={onClose} sx={{ color: MUTED_DARK }}>
//           <Close />
//         </IconButton>
//       </Box>

//       <List>
//         {all.map((p) => {
//           const meta = getMetadata(p);
//           const name = meta.fullName || p.identity;
//           const pic = meta.profilePicUrl;
//           const isHost = meta.role === "host" || meta.role === "tutor";
//           const isLocal = p.identity === localParticipant?.identity;

//           return (
//             <ListItem key={p.identity}>
//               <ListItemAvatar>
//                 <Avatar
//                   src={pic || undefined}
//                   sx={{ bgcolor: avatarColor(name), width: 38, height: 38 }}
//                 >
//                   {!pic && getInitials(name)}
//                 </Avatar>
//               </ListItemAvatar>

//               <ListItemText
//                 primary={
//                   <Typography sx={{ color: TEXT, fontSize: 14, fontWeight: 600 }}>
//                     {isLocal ? `${name} (You)` : name}
//                     {isHost && (
//                       <Chip label="Host" size="small" sx={{ ml: 1, bgcolor: GOLD, color: NAVY, height: 18, fontSize: 10 }} />
//                     )}
//                   </Typography>
//                 }
//                 secondary={
//                   <Box sx={{ display: "flex", gap: 0.5, mt: 0.25 }}>
//                     {p.isMicrophoneEnabled
//                       ? <Mic sx={{ fontSize: 13, color: GREEN }} />
//                       : <MicOff sx={{ fontSize: 13, color: "#ef4444" }} />}
//                     {p.isCameraEnabled
//                       ? <Videocam sx={{ fontSize: 13, color: GREEN }} />
//                       : <VideocamOff sx={{ fontSize: 13, color: "#ef4444" }} />}
//                   </Box>
//                 }
//               />
//             </ListItem>
//           );
//         })}
//       </List>
//     </Drawer>
//   );
// };

// // ─────────────────────────────────────────────────────────────
// // CONTROL BAR
// // ─────────────────────────────────────────────────────────────

// const ControlBar = ({
//   role,
//   sessionId,
//   onLeave,
//   onWhiteboard,
//   onParticipants,
//   participantCount,
// }) => {
//   const { localParticipant } = useLocalParticipant();

//   const [micOn, setMicOn] = useState(true);
//   const [camOn, setCamOn] = useState(true);
//   const [screenSharing, setScreenSharing] = useState(false);
//   const [recording, setRecording] = useState(false);
//   const [reactionAnchor, setReactionAnchor] = useState(null);

//   const REACTIONS = ["👋", "👍", "❤️", "😂", "🎉", "🔥", "❓", "👏"];

//   const toggleMic = async () => {
//     await localParticipant?.setMicrophoneEnabled(!micOn);
//     setMicOn(!micOn);
//   };

//   const toggleCam = async () => {
//     await localParticipant?.setCameraEnabled(!camOn);
//     setCamOn(!camOn);
//   };

//   const toggleScreen = async () => {
//     try {
//       if (!screenSharing) {
//         await localParticipant?.setScreenShareEnabled(true);
//       } else {
//         await localParticipant?.setScreenShareEnabled(false);
//       }
//       setScreenSharing(!screenSharing);
//     } catch { /* user cancelled */ }
//   };

//   const toggleRecording = async () => {
//     try {
//       if (!recording) {
//         await startRecording(sessionId);
//       } else {
//         await stopRecording(sessionId);
//       }
//       setRecording(!recording);
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   const handleRaiseHand = async () => {
//     try {
//       await raiseHand(sessionId);
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   const handleReaction = async (emoji) => {
//     setReactionAnchor(null);
//     try {
//       await sendSessionReaction(sessionId, emoji);
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   const CtrlBtn = ({ title, onClick, active, activeColor = GREEN, danger, children }) => (
//     <Tooltip title={title}>
//       <IconButton
//         onClick={onClick}
//         sx={{
//           width: 48,
//           height: 48,
//           borderRadius: 2.5,
//           bgcolor: danger
//             ? "rgba(239,68,68,0.15)"
//             : active
//             ? `${activeColor}22`
//             : "rgba(255,255,255,0.06)",
//           color: danger
//             ? "#ef4444"
//             : active
//             ? activeColor
//             : MUTED_DARK,
//           "&:hover": {
//             bgcolor: danger
//               ? "rgba(239,68,68,0.28)"
//               : `${activeColor}33`,
//           },
//           transition: "all 0.15s",
//         }}
//       >
//         {children}
//       </IconButton>
//     </Tooltip>
//   );

//   return (
//     <Box
//       sx={{
//         bgcolor: DARK2,
//         borderTop: "1px solid rgba(255,255,255,0.06)",
//         px: 3,
//         py: 1.5,
//         display: "flex",
//         alignItems: "center",
//         justifyContent: "center",
//         gap: 1,
//         flexWrap: "wrap",
//       }}
//     >
//       {/* LEFT GROUP */}
//       <Box sx={{ display: "flex", gap: 1 }}>
//         <CtrlBtn title={micOn ? "Mute mic" : "Unmute mic"} onClick={toggleMic} active={micOn} activeColor={GREEN}>
//           {micOn ? <Mic /> : <MicOff />}
//         </CtrlBtn>

//         <CtrlBtn title={camOn ? "Turn off camera" : "Turn on camera"} onClick={toggleCam} active={camOn} activeColor={GREEN}>
//           {camOn ? <Videocam /> : <VideocamOff />}
//         </CtrlBtn>

//         <CtrlBtn
//           title={screenSharing ? "Stop sharing" : "Share screen"}
//           onClick={toggleScreen}
//           active={screenSharing}
//           activeColor={GOLD}
//         >
//           {screenSharing ? <StopScreenShare /> : <ScreenShare />}
//         </CtrlBtn>
//       </Box>

//       {/* DIVIDER */}
//       <Box sx={{ width: 1, height: 36, bgcolor: "rgba(255,255,255,0.08)", mx: 0.5 }} />

//       {/* CENTER GROUP */}
//       <Box sx={{ display: "flex", gap: 1 }}>
//         <CtrlBtn title="Raise hand" onClick={handleRaiseHand} activeColor={GOLD}>
//           <PanTool />
//         </CtrlBtn>

//         <CtrlBtn
//           title="Reactions"
//           onClick={(e) => setReactionAnchor(e.currentTarget)}
//           activeColor="#7C3AED"
//         >
//           <EmojiEmotions />
//         </CtrlBtn>

//         <Tooltip title="Whiteboard">
//           <IconButton
//             onClick={onWhiteboard}
//             sx={{
//               width: 48,
//               height: 48,
//               borderRadius: 2.5,
//               bgcolor: "rgba(255,255,255,0.06)",
//               color: MUTED_DARK,
//               "&:hover": { bgcolor: "rgba(255,255,255,0.12)" },
//             }}
//           >
//             <Draw />
//           </IconButton>
//         </Tooltip>

//         <Tooltip title="Participants">
//           <Badge badgeContent={participantCount} color="primary" max={99}>
//             <IconButton
//               onClick={onParticipants}
//               sx={{
//                 width: 48,
//                 height: 48,
//                 borderRadius: 2.5,
//                 bgcolor: "rgba(255,255,255,0.06)",
//                 color: MUTED_DARK,
//                 "&:hover": { bgcolor: "rgba(255,255,255,0.12)" },
//               }}
//             >
//               <PeopleAlt />
//             </IconButton>
//           </Badge>
//         </Tooltip>
//       </Box>

//       {/* DIVIDER */}
//       <Box sx={{ width: 1, height: 36, bgcolor: "rgba(255,255,255,0.08)", mx: 0.5 }} />

//       {/* RIGHT GROUP */}
//       <Box sx={{ display: "flex", gap: 1 }}>
//         {role === "tutor" && (
//           <CtrlBtn
//             title={recording ? "Stop recording" : "Start recording"}
//             onClick={toggleRecording}
//             active={recording}
//             activeColor="#ef4444"
//           >
//             {recording ? <StopCircle /> : <FiberManualRecord />}
//           </CtrlBtn>
//         )}

//         {/* LEAVE */}
//         <Tooltip title="Leave class">
//           <Button
//             onClick={onLeave}
//             variant="contained"
//             sx={{
//               bgcolor: "#ef4444",
//               color: "#fff",
//               borderRadius: 2.5,
//               px: 2.5,
//               fontWeight: 700,
//               textTransform: "none",
//               "&:hover": { bgcolor: "#dc2626" },
//               gap: 1,
//             }}
//           >
//             <CallEnd sx={{ fontSize: 18 }} />
//             Leave
//           </Button>
//         </Tooltip>
//       </Box>

//       {/* REACTION POPOVER */}
//       <Popover
//         open={Boolean(reactionAnchor)}
//         anchorEl={reactionAnchor}
//         onClose={() => setReactionAnchor(null)}
//         anchorOrigin={{ vertical: "top", horizontal: "center" }}
//         transformOrigin={{ vertical: "bottom", horizontal: "center" }}
//         PaperProps={{ sx: { bgcolor: DARK2, border: "1px solid rgba(255,255,255,0.1)", borderRadius: 3, p: 1 } }}
//       >
//         <Box sx={{ display: "flex", gap: 0.5 }}>
//           {REACTIONS.map((emoji) => (
//             <IconButton
//               key={emoji}
//               onClick={() => handleReaction(emoji)}
//               sx={{ fontSize: 22, "&:hover": { bgcolor: "rgba(255,255,255,0.1)" } }}
//             >
//               {emoji}
//             </IconButton>
//           ))}
//         </Box>
//       </Popover>
//     </Box>
//   );
// };

// // ─────────────────────────────────────────────────────────────
// // INNER ROOM (uses LiveKit hooks — must be inside LiveKitRoom)
// // ─────────────────────────────────────────────────────────────

// const RoomInner = ({ role, sessionId, navigate, currentUser }) => {
//   const participants = useParticipants();
//   const { localParticipant } = useLocalParticipant();

//   const [whiteboardOpen, setWhiteboardOpen] = useState(false);
//   const [participantsOpen, setParticipantsOpen] = useState(false);

//   const totalParticipants =
//     (localParticipant ? 1 : 0) + participants.length;

//   const handleLeave = async () => {
//     if (sessionId) {
//       try { await leaveAttendance(sessionId); } catch { /* ignore */ }
//     }
//     navigate(role === "tutor" ? "/tutor/live-classes" : "/student/live-classes");
//   };

//   return (
//     <Box
//       sx={{
//         display: "flex",
//         flexDirection: "column",
//         height: "100vh",
//         bgcolor: DARK,
//         overflow: "hidden",
//       }}
//     >
//       {/* TOP BAR */}
//       <Box
//         sx={{
//           bgcolor: DARK2,
//           borderBottom: "1px solid rgba(255,255,255,0.06)",
//           px: 3,
//           py: 1.25,
//           display: "flex",
//           alignItems: "center",
//           gap: 2,
//         }}
//       >
//         <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
//           <Box
//             sx={{
//               width: 10,
//               height: 10,
//               borderRadius: "50%",
//               bgcolor: GREEN,
//               boxShadow: `0 0 0 3px rgba(30,127,79,0.3)`,
//               animation: "pulse 2s infinite",
//               "@keyframes pulse": {
//                 "0%, 100%": { opacity: 1 },
//                 "50%": { opacity: 0.5 },
//               },
//             }}
//           />
//           <Typography sx={{ color: TEXT, fontWeight: 800, fontSize: 15 }}>
//             GIEVA Live
//           </Typography>
//         </Box>

//         <Chip
//           label="LIVE"
//           size="small"
//           sx={{ bgcolor: "#ef444433", color: "#ef4444", fontWeight: 800, fontSize: 11 }}
//         />

//         <Box flex={1} />

//         {/* Current user pill */}
//         <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
//           <Avatar
//             src={currentUser?.profilePicUrl || undefined}
//             sx={{ width: 30, height: 30, bgcolor: avatarColor(currentUser?.fullName || ""), fontSize: 12 }}
//           >
//             {!currentUser?.profilePicUrl && getInitials(currentUser?.fullName || "")}
//           </Avatar>
//           <Typography sx={{ fontSize: 13, color: MUTED_DARK }}>
//             {currentUser?.fullName}
//           </Typography>
//           {role === "tutor" && (
//             <Chip label="Host" size="small" sx={{ bgcolor: GOLD, color: NAVY, fontWeight: 800, height: 20, fontSize: 11 }} />
//           )}
//         </Box>
//       </Box>

//       {/* PARTICIPANT GRID */}
//       <ParticipantGrid />

//       {/* AUDIO (invisible) */}
//       <RoomAudioRenderer />

//       {/* CONTROL BAR */}
//       <ControlBar
//         role={role}
//         sessionId={sessionId}
//         onLeave={handleLeave}
//         onWhiteboard={() => setWhiteboardOpen(true)}
//         onParticipants={() => setParticipantsOpen(true)}
//         participantCount={totalParticipants}
//       />

//       {/* DRAWERS */}
//       <WhiteboardDrawer
//         open={whiteboardOpen}
//         onClose={() => setWhiteboardOpen(false)}
//       />
//       <ParticipantsDrawer
//         open={participantsOpen}
//         onClose={() => setParticipantsOpen(false)}
//       />
//     </Box>
//   );
// };

// // ─────────────────────────────────────────────────────────────
// // MAIN PAGE
// // ─────────────────────────────────────────────────────────────

// export default function LiveClassroom() {
//   const { sessionId } = useParams();
//   const location = useLocation();
//   const navigate = useNavigate();

//   const role = location.state?.role || "student";

//   const [token, setToken] = useState("");
//   const [serverUrl, setServerUrl] = useState("");
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [currentUser, setCurrentUser] = useState(null);

//   useEffect(() => {
//     loadClass();

//     return () => {
//       if (sessionId) {
//         leaveAttendance(sessionId).catch(() => {});
//       }
//     };
//   }, [sessionId]);

//   const loadClass = async () => {
//     try {
//       setLoading(true);
//       let response;

//       if (role === "tutor") {
//         response = await joinTutorSession(sessionId);
//       } else {
//         response = await joinClassSession(sessionId);
//         await markAttendance(sessionId).catch(() => {});
//       }

//       setToken(response.token);
//       setServerUrl(response.serverUrl);
//       // Backend now returns currentUser with real name + avatar
//       setCurrentUser(response.currentUser || null);
//     } catch (err) {
//       console.error(err);
//       setError(err?.response?.data?.message || "Failed to join class");
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (loading) {
//     return (
//       <Box
//         sx={{
//           height: "100vh",
//           display: "flex",
//           justifyContent: "center",
//           alignItems: "center",
//           flexDirection: "column",
//           bgcolor: DARK,
//           gap: 2,
//         }}
//       >
//         <Box
//           sx={{
//             width: 64,
//             height: 64,
//             borderRadius: "50%",
//             bgcolor: `${GREEN}22`,
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "center",
//             mb: 1,
//           }}
//         >
//           <Videocam sx={{ fontSize: 32, color: GREEN }} />
//         </Box>
//         <Typography sx={{ color: TEXT, fontWeight: 700, fontSize: 18 }}>
//           Joining classroom...
//         </Typography>
//         <Typography sx={{ color: MUTED_DARK, fontSize: 14 }}>
//           Setting up your session
//         </Typography>
//       </Box>
//     );
//   }

//   if (error) {
//     return (
//       <Box
//         sx={{
//           height: "100vh",
//           display: "flex",
//           justifyContent: "center",
//           alignItems: "center",
//           flexDirection: "column",
//           bgcolor: DARK,
//           gap: 2,
//           p: 3,
//         }}
//       >
//         <Typography sx={{ color: "#ef4444", fontWeight: 700, fontSize: 18, textAlign: "center" }}>
//           {error}
//         </Typography>
//         <Button
//           variant="outlined"
//           onClick={() => navigate(role === "tutor" ? "/tutor/live-classes" : "/student/live-classes")}
//           sx={{ borderColor: MUTED_DARK, color: MUTED_DARK, textTransform: "none", borderRadius: 2 }}
//         >
//           Go back
//         </Button>
//       </Box>
//     );
//   }

//   return (
//     <LiveKitRoom
//       token={token}
//       serverUrl={serverUrl}
//       connect
//       audio
//       video
//       onDisconnected={() =>
//         navigate(role === "tutor" ? "/tutor/live-classes" : "/student/live-classes")
//       }
//     >
//       <RoomInner
//         role={role}
//         sessionId={sessionId}
//         navigate={navigate}
//         currentUser={currentUser}
//       />
//     </LiveKitRoom>
//   );
// }


// // import {
// //   LiveKitRoom,
// //   VideoConference,
// //   RoomAudioRenderer,
// // } from "@livekit/components-react";

// // import "@livekit/components-styles";

// // import {
// //   useParams,
// //   useLocation,
// //   useNavigate,
// // } from "react-router-dom";

// // import {
// //   useEffect,
// //   useState,
// // } from "react";

// // import {
// //   Box,
// //   CircularProgress,
// //   Typography,
// // } from "@mui/material";

// // import {
// //   joinClassSession,
// //   joinTutorSession,
// // } from "../services/classSessionService";

// // export default function LiveClassroom() {

// //   const {
// //     sessionId,
// //   } = useParams();

// //   const location =
// //     useLocation();

// //   const navigate =
// //     useNavigate();

// //   const role =
// //     location.state?.role ||
// //     "student";

// //   const [token,
// //     setToken] =
// //     useState("");

// //   const [serverUrl,
// //     setServerUrl] =
// //     useState("");

// //   const [loading,
// //     setLoading] =
// //     useState(true);

// //   const [error,
// //     setError] =
// //     useState("");

// //   useEffect(() => {

// //     loadSession();

// //   }, [sessionId]);

// //   const loadSession =
// //     async () => {

// //       try {

// //         setLoading(true);

// //         let response;

// //         if (
// //           role === "tutor"
// //         ) {

// //           response =
// //             await joinTutorSession(
// //               sessionId
// //             );

// //         } else {

// //           response =
// //             await joinClassSession(
// //               sessionId
// //             );
// //         }

// //         console.log(
// //           "JOIN RESPONSE:",
// //           response
// //         );

// //         if (
// //           !response?.token
// //         ) {
// //           throw new Error(
// //             "No LiveKit token returned"
// //           );
// //         }

// //         setToken(
// //           response.token
// //         );

// //         setServerUrl(
// //           response.serverUrl
// //         );

// //       } catch (err) {

// //         console.error(err);

// //         setError(
// //           err?.response?.data
// //             ?.message ||
// //           err.message ||
// //           "Failed to join class"
// //         );

// //       } finally {

// //         setLoading(false);
// //       }
// //     };

// //   if (loading) {

// //     return (
// //       <Box
// //         sx={{
// //           height: "100vh",
// //           display: "flex",
// //           flexDirection:
// //             "column",
// //           alignItems:
// //             "center",
// //           justifyContent:
// //             "center",
// //           gap: 2,
// //         }}
// //       >
// //         <CircularProgress />

// //         <Typography>
// //           Joining classroom...
// //         </Typography>
// //       </Box>
// //     );
// //   }

// //   if (error) {

// //     return (
// //       <Box
// //         sx={{
// //           height: "100vh",
// //           display: "flex",
// //           alignItems:
// //             "center",
// //           justifyContent:
// //             "center",
// //         }}
// //       >
// //         <Typography
// //           color="error"
// //         >
// //           {error}
// //         </Typography>
// //       </Box>
// //     );
// //   }

// //   return (
// //     <Box
// //       sx={{
// //         width: "100%",
// //         height: "100vh",
// //         overflow: "hidden",
// //         background:
// //           "#0f172a",
// //       }}
// //     >
// //       <LiveKitRoom
// //         token={token}
// //         serverUrl={
// //           serverUrl
// //         }
// //         connect={true}
// //         audio={true}
// //         video={true}
// //         data-lk-theme="default"
// //         onDisconnected={() => {

// //           if (
// //             role === "tutor"
// //           ) {

// //             navigate(
// //               "/tutor/live-classes"
// //             );

// //           } else {

// //             navigate(
// //               "/student/live-classes"
// //             );
// //           }
// //         }}
// //       >
// //         <RoomAudioRenderer />

// //         <VideoConference />
// //       </LiveKitRoom>
// //     </Box>
// //   );
// // }