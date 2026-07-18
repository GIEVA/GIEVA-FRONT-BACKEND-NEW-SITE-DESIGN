
// pages/LiveClassroom.jsx
// ═══════════════════════════════════════════════════════════════
// CHANGES IN THIS VERSION (on top of previous fixes)
// ═══════════════════════════════════════════════════════════════
//
// 5. HOST CAN MUTE INDIVIDUAL PARTICIPANTS
//    How it works:
//      - ParticipantsDrawer now accepts `role` and `sessionId` props
//      - For each non-local, non-lobby participant, a speaker icon
//        button appears on the right side of their row (host-only)
//      - VolumeUp (grey)  → mic is on  → click to mute
//      - VolumeOff (red)  → mic is off → click to unmute
//      - Clicking calls muteParticipant(sessionId, identity, muted)
//        which hits POST /api/session/:sessionId/mute/:identity
//      - The backend calls roomService.mutePublishedTrack() on LiveKit
//        server — this FORCES the track muted server-side, the participant
//        cannot override it from their own client
//      - LiveKit pushes a "track muted" event to ALL room subscribers
//        automatically — no polling, no data-channel message needed.
//        The mic icon in the muted participant's ParticipantTile updates
//        by itself because `participant.isMicrophoneEnabled` is a reactive
//        LiveKit property that reflects the server state.
//      - A spinner replaces the icon during the in-flight request
//      - A toast confirms the action to the host

import {
  LiveKitRoom,
  RoomAudioRenderer,
  useParticipants,
  useLocalParticipant,
  useRoomContext,
  VideoTrack,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import "@livekit/components-styles";
import { useTracks } from "@livekit/components-react";

import {
  useEffect, useRef, useState, useCallback,
} from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";

import {
  Box, Typography, IconButton, Tooltip, Avatar, Chip, Drawer,
  List, ListItem, ListItemAvatar, ListItemText, Badge,
  Slider, Button, Stack, CircularProgress, Divider, Snackbar, Alert,
} from "@mui/material";

import {
  Mic, MicOff, Videocam, VideocamOff, ScreenShare, StopScreenShare,
  PeopleAlt, PanTool, EmojiEmotions, FiberManualRecord, StopCircle,
  Draw, Close, CallEnd, DeleteSweep, CheckCircle, Cancel,
  HourglassTop, PersonAdd, Visibility, Chat, Send,
  VolumeOff, VolumeUp,           // ← NEW: for host mute buttons
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
  muteParticipant,               // ← NEW: host mute service call
} from "../services/classSessionService";
import { joinPublicMeetingAsHost } from "../services/publicMeetingService";
import {
  guestJoinPublicMeeting,
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

const MSG = {
  JOIN_REQUEST:     "JOIN_REQUEST",
  ADMITTED:         "ADMITTED",
  DENIED:           "DENIED",
  RAISE_HAND:       "RAISE_HAND",
  REACTION:         "REACTION",
  WHITEBOARD_OPEN:  "WHITEBOARD_OPEN",
  WHITEBOARD_CLOSE: "WHITEBOARD_CLOSE",
  WHITEBOARD_STROKE:"WHITEBOARD_STROKE",
  WHITEBOARD_CLEAR: "WHITEBOARD_CLEAR",
  WHITEBOARD_SYNC:  "WHITEBOARD_SYNC",
  CHAT_MESSAGE:     "CHAT_MESSAGE",
};

// ─── Navigation helper ────────────────────────────────────────
const leaveDestination = (role) => {
  switch (role) {
    case "host":        return "/tutor/live-classes";
    case "observer":    return "/admin/live-sessions";
    case "participant":
    case "student":
    case "lobby":
    default:            return "/student/live-classes";
  }
};

// ─── ParticipantTile ──────────────────────────────────────────
const ParticipantTile = ({
  participant,
  isLocal      = false,
  isLarge      = false,
  isHandRaised = false,
  reaction     = null,
  compact      = false,
}) => {
  const meta   = getMetadata(participant);
  const name   = meta.fullName || participant.identity;
  const pic    = meta.profilePicUrl;
  const isHost = meta.role === "host";

  const camPub = participant.getTrackPublication(Track.Source.Camera);
  const hasCam = camPub
    && !camPub.isMuted
    && camPub.track
    && camPub.source !== Track.Source.ScreenShare
    ? (isLocal ? true : !!camPub.isSubscribed)
    : false;

  return (
    <Box sx={{
      width: "100%",
      aspectRatio: "16/9",
      minHeight: compact ? 80  : isLarge ? 340 : undefined,
      height:    compact ? 90  : isLarge ? "100%" : undefined,
      position: "relative", borderRadius: compact ? 2 : 3, overflow: "hidden",
      bgcolor: DARK2, border: `1.5px solid ${isHandRaised ? GOLD : DARK3}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
      transition: "border-color 0.2s",
    }}>
      {hasCam ? (
        <Box sx={{ position: "absolute", inset: 0 }}>
          <VideoTrack
            trackRef={{ participant, source: Track.Source.Camera, publication: camPub }}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </Box>
      ) : (
        <Avatar src={pic || undefined}
          sx={{
            width:     compact ? 32 : isLarge ? 120 : 68,
            height:    compact ? 32 : isLarge ? 120 : 68,
            fontSize:  compact ? 13 : isLarge ? 44  : 26,
            fontWeight: 800,
            bgcolor: avatarColor(name),
            border: "3px solid rgba(255,255,255,0.13)",
          }}>
          {!pic && getInitials(name)}
        </Avatar>
      )}

      {isHandRaised && (
        <Box sx={{
          position: "absolute", top: 6, right: 6,
          width: compact ? 22 : 34, height: compact ? 22 : 34,
          borderRadius: "50%", bgcolor: GOLD,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: compact ? 12 : 18, boxShadow: "0 2px 8px rgba(0,0,0,0.35)",
          animation: "handPulse 1s ease-in-out infinite",
          "@keyframes handPulse": {
            "0%,100%": { transform: "scale(1)" },
            "50%":     { transform: "scale(1.12)" },
          },
        }}>✋</Box>
      )}

      {reaction && !compact && (
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
        px: compact ? 0.75 : 1.5, py: compact ? 0.5 : 1,
        display: "flex", alignItems: "center", gap: 0.5,
      }}>
        <Typography sx={{ fontSize: compact ? 10 : 13, fontWeight: 700, color: TEXT, flex: 1 }} noWrap>
          {isLocal ? `${name} (You)` : name}
        </Typography>
        {!compact && isHost && (
          <Chip label="Host" size="small"
            sx={{ bgcolor: GOLD, color: NAVY, fontWeight: 800, height: 20, fontSize: 11 }} />
        )}
        {participant.isMicrophoneEnabled
          ? <Mic sx={{ fontSize: compact ? 11 : 14, color: GREEN }} />
          : <MicOff sx={{ fontSize: compact ? 11 : 14, color: "#ef4444" }} />}
      </Box>
    </Box>
  );
};

// ─── ScreenShareView ──────────────────────────────────────────
const ScreenShareView = ({ trackRef, presenterName }) => (
  <Box sx={{
    flex: 1, position: "relative", bgcolor: "#000",
    display: "flex", alignItems: "center", justifyContent: "center",
    minHeight: 0,
  }}>
    <VideoTrack
      trackRef={trackRef}
      style={{ width: "100%", height: "100%", objectFit: "contain" }}
    />
    <Chip
      label={`${presenterName} is presenting`}
      size="small"
      sx={{
        position: "absolute", top: 12, left: 12,
        bgcolor: "rgba(0,0,0,0.65)", color: TEXT,
        fontWeight: 700, fontSize: 12,
        "& .MuiChip-label": { px: 1.5 },
      }}
    />
  </Box>
);

// ─── ParticipantGrid ─────────────────────────────────────────
const ParticipantGrid = ({ raisedHands, reactions }) => {
  const participants         = useParticipants();
  const { localParticipant } = useLocalParticipant();

  const isAdmitted = (p) => getMetadata(p).role !== "lobby";

  const all = [
    localParticipant,
    ...participants.filter((p) => p.identity !== localParticipant?.identity),
  ].filter(Boolean).filter(isAdmitted);

  const screenTracks = useTracks([{
    source: Track.Source.ScreenShare,
    withPlaceholder: false,
  }]);

  const activeScreenTrack = screenTracks.find((t) => t.publication.track);
  const isPresenting      = !!activeScreenTrack;

  if (isPresenting) {
    const presenter     = activeScreenTrack.participant;
    const sharerMeta    = getMetadata(presenter);
    const presenterName = sharerMeta.fullName || presenter.identity;

    return (
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}>
        <ScreenShareView trackRef={activeScreenTrack} presenterName={presenterName} />
        <Box sx={{
          height: 120, bgcolor: DARK,
          borderTop: "1px solid rgba(255,255,255,0.08)",
          display: "flex", alignItems: "center",
          gap: 1, px: 1.5, overflowX: "auto", flexShrink: 0,
          "&::-webkit-scrollbar": { height: 4 },
          "&::-webkit-scrollbar-track": { bgcolor: "transparent" },
          "&::-webkit-scrollbar-thumb": { bgcolor: DARK3, borderRadius: 2 },
        }}>
          {all.map((p) => (
            <Box key={p.identity} sx={{ width: 140, flexShrink: 0, borderRadius: 2, overflow: "hidden" }}>
              <ParticipantTile
                participant={p}
                isLocal={p.identity === localParticipant?.identity}
                compact
                isHandRaised={!!raisedHands[p.identity]}
                reaction={reactions[p.identity] || null}
              />
            </Box>
          ))}
        </Box>
      </Box>
    );
  }

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

// ─── WhiteboardDrawer ────────────────────────────────────────
const WhiteboardDrawer = ({
  open, onClose, isHost,
  onLocalStroke, onLocalClear,
  remoteStroke, remoteClear, syncStrokes,
}) => {
  const canvasRef  = useRef(null);
  const isDrawing  = useRef(false);
  const lastPos    = useRef({ x: 0, y: 0 });
  const [tool, setTool]           = useState("pen");
  const [color, setColor]         = useState("#000000");
  const [thickness, setThickness] = useState(3);

  const COLORS = ["#000000","#ffffff","#ef4444","#f97316","#eab308","#22c55e","#3b82f6","#8b5cf6"];

  const getPos = (e, canvas) => {
    const rect    = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (canvas.width  / rect.width),
      y: (clientY - rect.top)  * (canvas.height / rect.height),
    };
  };

  const toNorm   = (pos, canvas) => ({ nx: pos.x / canvas.width,  ny: pos.y / canvas.height });
  const fromNorm = (nx, ny, canvas) => ({ x: nx * canvas.width, y: ny * canvas.height });

  const strokeOnCanvas = useCallback((from, to, strokeColor, strokeWidth) => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth   = strokeWidth;
    ctx.lineCap     = "round"; ctx.lineJoin = "round";
    ctx.stroke();
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    canvas.getContext("2d").fillStyle = "#ffffff";
    canvas.getContext("2d").fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    canvas.width  = canvas.offsetWidth  || canvas.clientWidth  || 700;
    canvas.height = canvas.offsetHeight || canvas.clientHeight || 500;
    clearCanvas();
  }, [clearCanvas]);

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
    const canvas = canvasRef.current; if (!canvas) return;
    const pos    = getPos(e, canvas);
    const strokeColor = tool === "eraser" ? "#ffffff" : color;
    const strokeWidth = tool === "eraser" ? thickness * 5 : thickness;

    strokeOnCanvas(lastPos.current, pos, strokeColor, strokeWidth);

    onLocalStroke?.({
      from: toNorm(lastPos.current, canvas),
      to:   toNorm(pos, canvas),
      color: strokeColor,
      thickness: strokeWidth,
    });

    lastPos.current = pos;
  }, [isHost, tool, color, thickness, strokeOnCanvas, onLocalStroke]);

  const stopDraw = useCallback(() => { isDrawing.current = false; }, []);

  const handleClearClick = () => {
    if (!isHost) return;
    clearCanvas();
    onLocalClear?.();
  };

  useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current; if (!canvas) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) {
        canvas.width  = width;
        canvas.height = height;
        clearCanvas();
        if (!isHost) syncStrokes?.();
        observer.disconnect();
      }
    });

    observer.observe(canvas);
    const fallback = setTimeout(initCanvas, 300);

    return () => {
      observer.disconnect();
      clearTimeout(fallback);
    };
  }, [open, isHost, clearCanvas, syncStrokes, initCanvas]);

  // useEffect(() => {
  //   if (!remoteStroke) return;
  //   const canvas = canvasRef.current; if (!canvas) return;
  //   const from = fromNorm(remoteStroke.from.nx, remoteStroke.from.ny, canvas);
  //   const to   = fromNorm(remoteStroke.to.nx,   remoteStroke.to.ny,   canvas);
  //   strokeOnCanvas(from, to, remoteStroke.color, remoteStroke.thickness);
  // }, [remoteStroke, strokeOnCanvas]);

  // useEffect(() => { if (remoteClear) clearCanvas(); }, [remoteClear, clearCanvas]);

  // Apply remote stroke (continuous)
  useEffect(() => {
    if (!remoteStroke) return;
    const canvas = canvasRef.current; if (!canvas) return;
    const from = fromNorm(remoteStroke.from.nx, remoteStroke.from.ny, canvas);
    const to = fromNorm(remoteStroke.to.nx, remoteStroke.to.ny, canvas);
    strokeOnCanvas(from, to, remoteStroke.color, remoteStroke.thickness);
  }, [remoteStroke, strokeOnCanvas]);

  useEffect(() => { if (remoteClear) clearCanvas(); }, [remoteClear, clearCanvas]);
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
              <Slider size="small" min={1} max={20} value={thickness}
                onChange={(_, v) => setThickness(v)} sx={{ color: GOLD }} />
            </Box>
            <Tooltip title="Clear">
              <IconButton onClick={handleClearClick} sx={{ color: "#ef4444" }}><DeleteSweep /></IconButton>
            </Tooltip>
          </>
        )}

        <Box flex={1} />
        {isHost && (
          <IconButton onClick={onClose} sx={{ color: MUTED_D }}><Close /></IconButton>
        )}
      </Box>
      <Box sx={{ flex: 1, overflow: "hidden", cursor: isHost ? (tool === "eraser" ? "cell" : "crosshair") : "default" }}>
        <canvas ref={canvasRef}
          style={{ width: "100%", height: "100%", display: "block", touchAction: "none" }}
          onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
          onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw} />
      </Box>
    </Drawer>
  );
};

// ─── ChatDrawer ──────────────────────────────────────────────
const ChatDrawer = ({ open, onClose, messages, onSend, currentUser }) => {
  const [input, setInput] = useState("");
  const bottomRef         = useRef(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    onSend(text);
    setInput("");
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const formatTime = (ts) =>
    new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <Drawer anchor="right" open={open} onClose={onClose}
      PaperProps={{ sx: { width: { xs: "100vw", sm: 340 }, bgcolor: DARK2,
                          display: "flex", flexDirection: "column" } }}>
      <Box sx={{ p: 2, display: "flex", alignItems: "center", justifyContent: "space-between",
                 borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <Typography sx={{ color: TEXT, fontWeight: 800, fontSize: 16 }}>In-class Chat</Typography>
        <IconButton onClick={onClose} sx={{ color: MUTED_D }}><Close /></IconButton>
      </Box>

      <Box sx={{ flex: 1, overflowY: "auto", px: 2, py: 1.5,
                 display: "flex", flexDirection: "column", gap: 1.5 }}>
        {messages.length === 0 ? (
          <Box sx={{ flex: 1, display: "flex", alignItems: "center",
                     justifyContent: "center", minHeight: 200 }}>
            <Typography sx={{ color: MUTED_D, fontSize: 13, textAlign: "center" }}>
              No messages yet. Say hello! 👋
            </Typography>
          </Box>
        ) : (
          messages.map((msg) => {
            const isMe = msg.identity === currentUser?.identity;
            return (
              <Box key={msg.id} sx={{ display: "flex", flexDirection: "column",
                                      alignItems: isMe ? "flex-end" : "flex-start" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.25,
                           flexDirection: isMe ? "row-reverse" : "row" }}>
                  <Avatar src={msg.profilePicUrl || undefined}
                    sx={{ width: 20, height: 20, fontSize: 9, bgcolor: avatarColor(msg.fullName) }}>
                    {!msg.profilePicUrl && getInitials(msg.fullName)}
                  </Avatar>
                  <Typography sx={{ fontSize: 11, fontWeight: 700, color: MUTED_D }}>
                    {isMe ? "You" : msg.fullName}
                  </Typography>
                  <Typography sx={{ fontSize: 10, color: DARK3 }}>{formatTime(msg.timestamp)}</Typography>
                  {msg.isHost && (
                    <Chip label="Host" size="small"
                      sx={{ height: 14, fontSize: 9, fontWeight: 800,
                            bgcolor: GOLD, color: NAVY, "& .MuiChip-label": { px: 0.5 } }} />
                  )}
                </Box>
                <Box sx={{
                  maxWidth: "80%", px: 1.5, py: 1,
                  borderRadius: isMe ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                  bgcolor: isMe ? GREEN : "rgba(255,255,255,0.08)",
                  color: TEXT, fontSize: 14, wordBreak: "break-word",
                  lineHeight: 1.5, whiteSpace: "pre-wrap",
                }}>
                  {msg.text}
                </Box>
              </Box>
            );
          })
        )}
        <div ref={bottomRef} />
      </Box>

      <Box sx={{ p: 1.5, borderTop: "1px solid rgba(255,255,255,0.08)",
                 display: "flex", gap: 1, alignItems: "flex-end" }}>
        <Box component="textarea" placeholder="Type a message… (Enter to send)"
          rows={1} value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey} maxLength={500}
          sx={{ flex: 1, resize: "none", bgcolor: "rgba(255,255,255,0.06)",
                border: `1px solid ${DARK3}`, borderRadius: 2, color: TEXT,
                fontSize: 14, p: 1, outline: "none", fontFamily: "inherit",
                lineHeight: 1.5, maxHeight: 120, overflowY: "auto",
                "&:focus": { borderColor: GREEN },
                "&::placeholder": { color: MUTED_D } }} />
        <IconButton onClick={handleSend} disabled={!input.trim()}
          sx={{ bgcolor: GREEN, color: "#fff", width: 40, height: 40, borderRadius: 2,
                flexShrink: 0, "&:hover": { bgcolor: "#166d3e" },
                "&.Mui-disabled": { bgcolor: "rgba(255,255,255,0.06)", color: MUTED_D } }}>
          <Send sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>
    </Drawer>
  );
};

// ─────────────────────────────────────────────────────────────
// CHANGE 5: ParticipantsDrawer — now accepts role + sessionId
//           and renders a mute/unmute button per participant
//           (visible only when role === "host")
// ─────────────────────────────────────────────────────────────
const ParticipantsDrawer = ({ open, onClose, role, sessionId, onToast }) => {
  const participants         = useParticipants();
  const { localParticipant } = useLocalParticipant();

  // Track which identities have a pending mute request in flight
  const [mutingSet, setMutingSet] = useState(new Set());

  const isHost = role === "host";

  const all = [
    localParticipant,
    ...participants.filter((p) => p.identity !== localParticipant?.identity),
  ].filter(Boolean);

  const handleToggleMute = async (participant) => {
    const identity  = participant.identity;
    const isMuted   = !participant.isMicrophoneEnabled; // current state
    const nextMuted = !isMuted;                         // what we want

    // Mark as in-flight
    setMutingSet((prev) => new Set([...prev, identity]));

    try {
      await muteParticipant(sessionId, identity, nextMuted);
      // LiveKit server pushes "track muted" event to room automatically —
      // participant.isMicrophoneEnabled will update reactively,
      // so we don't need to flip any local state here.
      onToast?.({
        msg:      nextMuted
          ? `🔇 ${getMetadata(participant).fullName || identity} has been muted`
          : `🔊 ${getMetadata(participant).fullName || identity} has been unmuted`,
        severity: "success",
      });
    } catch (err) {
      console.error("muteParticipant error:", err);
      onToast?.({
        msg:      err?.response?.data?.message || "Failed to change mute state",
        severity: "error",
      });
    } finally {
      setMutingSet((prev) => {
        const next = new Set(prev);
        next.delete(identity);
        return next;
      });
    }
  };

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
          const isHst   = meta.role === "host";
          const isLobby = meta.role === "lobby";
          const isLocal = p.identity === localParticipant?.identity;
          const isPendingMute = mutingSet.has(p.identity);

          // Mic is "on" when isMicrophoneEnabled is true
          const micIsOn = p.isMicrophoneEnabled;

          // Show mute button if: viewer is host AND participant is not
          // the local (you can't mute yourself here) AND not in lobby
          const showMuteBtn = isHost && !isLocal && !isLobby;

          return (
            <ListItem
              key={p.identity}
              // Add right padding so the mute button doesn't crowd the text
              sx={{ pr: showMuteBtn ? 1 : 2 }}
            >
              <ListItemAvatar>
                <Avatar src={pic || undefined}
                  sx={{ bgcolor: avatarColor(name), width: 38, height: 38 }}>
                  {!pic && getInitials(name)}
                </Avatar>
              </ListItemAvatar>

              <ListItemText
                primary={
                  <Typography sx={{ color: TEXT, fontSize: 14, fontWeight: 600 }}>
                    {isLocal ? `${name} (You)` : name}
                    {isHst && (
                      <Chip label="Host" size="small"
                        sx={{ ml: 1, bgcolor: GOLD, color: NAVY, height: 18, fontSize: 10 }} />
                    )}
                    {isLobby && (
                      <Chip label="Waiting" size="small"
                        sx={{ ml: 1, bgcolor: "rgba(239,68,68,0.2)", color: "#fca5a5",
                              height: 18, fontSize: 10 }} />
                    )}
                  </Typography>
                }
                secondary={
                  <Box sx={{ display: "flex", gap: 0.5, mt: 0.25 }}>
                    {isLobby
                      ? <Typography sx={{ fontSize: 11, color: MUTED_D }}>In waiting room</Typography>
                      : <>
                          {micIsOn
                            ? <Mic        sx={{ fontSize: 13, color: GREEN    }} />
                            : <MicOff     sx={{ fontSize: 13, color: "#ef4444" }} />}
                          {p.isCameraEnabled
                            ? <Videocam   sx={{ fontSize: 13, color: GREEN    }} />
                            : <VideocamOff sx={{ fontSize: 13, color: "#ef4444" }} />}
                        </>
                    }
                  </Box>
                }
              />

              {/* ── HOST-ONLY MUTE BUTTON ────────────────── */}
              {showMuteBtn && (
                <Tooltip title={micIsOn ? "Mute participant" : "Unmute participant"}>
                  <span> {/* span wrapper needed for Tooltip when button is disabled */}
                    <IconButton
                      size="small"
                      disabled={isPendingMute}
                      onClick={() => handleToggleMute(p)}
                      sx={{
                        width:  34,
                        height: 34,
                        borderRadius: 2,
                        flexShrink: 0,
                        // Green tint when mic is on (click will mute)
                        // Red tint when mic is off (click will unmute)
                        bgcolor: micIsOn
                          ? "rgba(30,127,79,0.15)"
                          : "rgba(239,68,68,0.15)",
                        color: micIsOn ? GREEN : "#ef4444",
                        "&:hover": {
                          bgcolor: micIsOn
                            ? "rgba(30,127,79,0.28)"
                            : "rgba(239,68,68,0.28)",
                        },
                        "&.Mui-disabled": {
                          bgcolor: "rgba(255,255,255,0.04)",
                          color:   MUTED_D,
                        },
                        transition: "all 0.15s",
                      }}
                    >
                      {isPendingMute
                        ? <CircularProgress size={14} sx={{ color: MUTED_D }} />
                        : micIsOn
                          ? <VolumeUp    sx={{ fontSize: 16 }} />
                          : <VolumeOff   sx={{ fontSize: 16 }} />
                      }
                    </IconButton>
                  </span>
                </Tooltip>
              )}
            </ListItem>
          );
        })}
      </List>
    </Drawer>
  );
};

// ─── AdmitPanel ──────────────────────────────────────────────
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

  useEffect(() => { if (triggerRefresh > 0) refresh(); }, [triggerRefresh, refresh]);

  const handleAdmit = async (id) => {
    await onAdmit(id);
    setWaiting((prev) => prev.filter((w) => (w.isGuest ? w.guestId : w.userId) !== id));
  };
  const handleDeny = async (id) => {
    await onDeny(id);
    setWaiting((prev) => prev.filter((w) => (w.isGuest ? w.guestId : w.userId) !== id));
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
          {waiting.map((w) => {
            const id = w.isGuest ? w.guestId : w.userId;
            return (
              <ListItem key={id}
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
                        <Chip label="Guest" size="small"
                          sx={{ height: 18, fontSize: 10, fontWeight: 800,
                                bgcolor: "rgba(212,160,23,0.18)", color: GOLD }} />
                      )}
                    </Stack>
                    <Typography sx={{ color: MUTED_D, fontSize: 12 }}>Waiting to join</Typography>
                  </Box>
                </Stack>
                <Stack direction="row" spacing={1}>
                  <Button fullWidth variant="contained" size="small"
                    startIcon={<CheckCircle sx={{ fontSize: 15 }} />}
                    onClick={() => handleAdmit(id)}
                    sx={{ bgcolor: GREEN, textTransform: "none", fontWeight: 700, borderRadius: 2,
                          "&:hover": { bgcolor: "#166d3e" } }}>
                    Admit
                  </Button>
                  <Button fullWidth variant="outlined" size="small"
                    startIcon={<Cancel sx={{ fontSize: 15 }} />}
                    onClick={() => handleDeny(id)}
                    sx={{ borderColor: "#ef4444", color: "#ef4444", textTransform: "none",
                          fontWeight: 700, borderRadius: 2,
                          "&:hover": { borderColor: "#dc2626", bgcolor: "rgba(239,68,68,0.08)" } }}>
                    Deny
                  </Button>
                </Stack>
              </ListItem>
            );
          })}
        </List>
      )}
    </Drawer>
  );
};

// ─── ControlBar ──────────────────────────────────────────────
const ControlBar = ({
  role, sessionId, onLeave,
  onWhiteboard, onParticipants, onAdmitPanel, onChat, onReact,
  participantCount, waitingCount, chatUnread,
  handRaised, onToggleHand,
}) => {
  const { localParticipant } = useLocalParticipant();
  const room                 = useRoomContext();

  const [micOn,              setMicOn]              = useState(true);
  const [camOn,              setCamOn]              = useState(true);
  const [recording,          setRecording]          = useState(false);
  const [reactionPickerOpen, setReactionPickerOpen] = useState(false);
  const [screenShareError,   setScreenShareError]   = useState("");

  const REACTIONS = ["👋","👍","❤️","😂","🎉","🔥","❓","👏"];

  const toggleMic = async () => {
    await localParticipant?.setMicrophoneEnabled(!micOn);
    setMicOn(!micOn);
  };
  const toggleCam = async () => {
    await localParticipant?.setCameraEnabled(!camOn);
    setCamOn(!camOn);
  };

  const isCurrentlySharing = localParticipant?.isScreenShareEnabled ?? false;

  const toggleScreen = async () => {
    try {
      setScreenShareError("");
      await localParticipant?.setScreenShareEnabled(!isCurrentlySharing);
    } catch (err) {
      if (err?.name === "NotAllowedError" || err?.message?.includes("Permission denied")) {
        setScreenShareError("Screen share permission denied by browser.");
      } else if (err?.name === "AbortError" || err?.message?.toLowerCase().includes("cancel")) {
        setScreenShareError("");
      } else {
        setScreenShareError(err?.message || "Screen share failed — check browser permissions.");
        console.error("Screen share error:", err);
      }
    }
  };

  const toggleRecording = async () => {
    try {
      recording ? await stopRecording(sessionId) : await startRecording(sessionId);
      setRecording(!recording);
    } catch (err) { console.error(err); }
  };

  const handleReaction = async (emoji) => {
    setReactionPickerOpen(false);
    const identity = localParticipant?.identity;
    const fullName = getMetadata(localParticipant).fullName || identity;
    onReact?.({ identity, fullName, emoji });
    try {
      const payload = new TextEncoder().encode(JSON.stringify({
        type: MSG.REACTION, identity, fullName, emoji,
      }));
      await room?.localParticipant?.publishData(payload, { reliable: true });
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
      position: "relative",
      bgcolor: DARK2, borderTop: "1px solid rgba(255,255,255,0.06)",
      px: 3, py: 1.5, display: "flex", alignItems: "center",
      justifyContent: "center", gap: 1, flexWrap: "wrap",
    }}>
      {screenShareError && (
        <Box sx={{
          position: "absolute", bottom: "calc(100% + 8px)", left: "50%",
          transform: "translateX(-50%)", bgcolor: "#ef4444", color: "#fff",
          borderRadius: 2, px: 2, py: 0.75, fontSize: 13, fontWeight: 600,
          whiteSpace: "nowrap", zIndex: 10,
        }}>
          {screenShareError}
          <IconButton size="small" onClick={() => setScreenShareError("")}
            sx={{ color: "#fff", ml: 1, p: 0.25 }}>
            <Close sx={{ fontSize: 14 }} />
          </IconButton>
        </Box>
      )}

      <Box sx={{ display: "flex", gap: 1 }}>
        <CtrlBtn title={micOn ? "Mute" : "Unmute"} onClick={toggleMic} active={micOn}>
          {micOn ? <Mic /> : <MicOff />}
        </CtrlBtn>
        <CtrlBtn title={camOn ? "Camera off" : "Camera on"} onClick={toggleCam} active={camOn}>
          {camOn ? <Videocam /> : <VideocamOff />}
        </CtrlBtn>
        <CtrlBtn title={isCurrentlySharing ? "Stop sharing" : "Share screen"}
          onClick={toggleScreen} active={isCurrentlySharing} activeColor={GOLD}>
          {isCurrentlySharing ? <StopScreenShare /> : <ScreenShare />}
        </CtrlBtn>
      </Box>

      <Box sx={{ width: 1, height: 36, bgcolor: "rgba(255,255,255,0.08)", mx: 0.5 }} />

      <Box sx={{ display: "flex", gap: 1 }}>
        <CtrlBtn title={handRaised ? "Lower hand" : "Raise hand"}
          onClick={onToggleHand} active={handRaised} activeColor={GOLD}>
          <PanTool />
        </CtrlBtn>

        <Tooltip title="Chat">
          <Badge badgeContent={chatUnread} color="error" max={99}>
            <IconButton onClick={onChat}
              sx={{
                width: 48, height: 48, borderRadius: 2.5,
                bgcolor: chatUnread > 0 ? `${GREEN}22` : "rgba(255,255,255,0.06)",
                color:   chatUnread > 0 ? GREEN : MUTED_D,
                animation: chatUnread > 0 ? "chatPulse 1.5s infinite" : "none",
                "@keyframes chatPulse": {
                  "0%,100%": { boxShadow: `0 0 0 0 ${GREEN}55` },
                  "50%":     { boxShadow: `0 0 0 6px ${GREEN}00` },
                },
                "&:hover": { bgcolor: "rgba(255,255,255,0.12)" },
              }}>
              <Chat />
            </IconButton>
          </Badge>
        </Tooltip>

        <CtrlBtn title="Reactions"
          onClick={() => setReactionPickerOpen((o) => !o)}
          active={reactionPickerOpen} activeColor="#7C3AED">
          <EmojiEmotions />
        </CtrlBtn>

        <Tooltip title="Whiteboard">
          <IconButton onClick={onWhiteboard}
            sx={{ width: 48, height: 48, borderRadius: 2.5,
                  bgcolor: "rgba(255,255,255,0.06)", color: MUTED_D,
                  "&:hover": { bgcolor: "rgba(255,255,255,0.12)" } }}>
            <Draw />
          </IconButton>
        </Tooltip>

        <Tooltip title="Participants">
          <Badge badgeContent={participantCount} color="primary" max={99}>
            <IconButton onClick={onParticipants}
              sx={{ width: 48, height: 48, borderRadius: 2.5,
                    bgcolor: "rgba(255,255,255,0.06)", color: MUTED_D,
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
          <CtrlBtn title={recording ? "Stop recording" : "Record"}
            onClick={toggleRecording} active={recording} activeColor="#ef4444">
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

      {reactionPickerOpen && (
        <>
          <Box onClick={() => setReactionPickerOpen(false)}
            sx={{ position: "fixed", inset: 0, zIndex: 1200 }} />
          <Box sx={{
            position: "absolute", bottom: "calc(100% + 12px)", left: "50%",
            transform: "translateX(-50%)", bgcolor: DARK2,
            border: "1px solid rgba(255,255,255,0.1)", borderRadius: 3, p: 1,
            display: "flex", gap: 0.5, zIndex: 1201, boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
          }}>
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

// ─── LobbyScreen ─────────────────────────────────────────────
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
      <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: GREEN,
                 animation: "pulse 1.5s infinite",
                 "@keyframes pulse": { "0%,100%": { opacity: 1 }, "50%": { opacity: 0.3 } } }} />
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

// ─── GuestGate ───────────────────────────────────────────────
const GuestGate = ({ onSubmit, loading, error }) => {
  const [name, setName] = useState("");
  return (
    <Box sx={{ height: "100vh", bgcolor: DARK, display: "flex", flexDirection: "column",
               alignItems: "center", justifyContent: "center", gap: 3, px: 3 }}>
      <Box sx={{ width: 72, height: 72, borderRadius: "50%", bgcolor: `${GREEN}22`,
                 display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Videocam sx={{ fontSize: 32, color: GREEN }} />
      </Box>
      <Box sx={{ textAlign: "center" }}>
        <Typography sx={{ color: TEXT, fontSize: 22, fontWeight: 800, mb: 0.75 }}>Join this meeting</Typography>
        <Typography sx={{ color: MUTED_D, fontSize: 14 }}>Enter your name — no account needed.</Typography>
      </Box>
      <Box component="form" onSubmit={(e) => { e.preventDefault(); if (name.trim()) onSubmit(name.trim()); }}
        sx={{ width: "100%", maxWidth: 360 }}>
        <Box component="input" autoFocus placeholder="Your name" value={name}
          onChange={(e) => setName(e.target.value)} maxLength={80}
          sx={{ width: "100%", height: 48, borderRadius: 2.5, px: 2, bgcolor: DARK2,
                border: `1px solid ${DARK3}`, color: TEXT, fontSize: 15, outline: "none",
                mb: 2, "&:focus": { borderColor: GREEN } }} />
        {error && (
          <Typography sx={{ color: "#ef4444", fontSize: 13, mb: 2, textAlign: "center" }}>{error}</Typography>
        )}
        <Button type="submit" fullWidth variant="contained"
          disabled={loading || !name.trim()}
          sx={{ bgcolor: GREEN, color: "#fff", textTransform: "none", fontWeight: 700,
                borderRadius: 2.5, py: 1.25, "&:hover": { bgcolor: "#166d3e" } }}>
          {loading ? <CircularProgress size={20} color="inherit" /> : "Ask to Join"}
        </Button>
      </Box>
      <Typography sx={{ color: MUTED_D, fontSize: 12 }}>
        Have an account?{" "}
        <Box component="span" sx={{ color: GREEN, cursor: "pointer", fontWeight: 700 }}
          onClick={() => window.location.assign("/login")}>Log in</Box>{" "}instead
      </Typography>
    </Box>
  );
};

// ─── RoomInner ───────────────────────────────────────────────
const RoomInner = ({
  role, sessionId, navigate, currentUser, phase,
  onRequestTokenSwap, guestId,
}) => {
  const participants         = useParticipants();
  const { localParticipant } = useLocalParticipant();
  const room                 = useRoomContext();

  const [whiteboardOpen,   setWhiteboardOpen]   = useState(false);
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [admitPanelOpen,   setAdmitPanelOpen]   = useState(false);
  const [chatOpen,         setChatOpen]          = useState(false);
  const [messages,         setMessages]          = useState([]);
  const [unreadCount,      setUnreadCount]       = useState(0);
  const [waitingCount,     setWaitingCount]      = useState(0);
  const [joinRequestTick,  setJoinRequestTick]   = useState(0);
  const [toast,            setToast]             = useState(null);
  const [upgrading,        setUpgrading]         = useState(false);

  const [raisedHands,         setRaisedHands]         = useState({});
  const [reactions,           setReactions]           = useState({});
  const [myHandRaised,        setMyHandRaised]        = useState(false);
  const [whiteboardStroke,    setWhiteboardStroke]    = useState(null);
  const [whiteboardClearTick, setWhiteboardClearTick] = useState(0);

  const strokeLogRef   = useRef([]);
  const reactionTimers = useRef({});
  const myIdentityRef  = useRef(localParticipant?.identity);

  useEffect(() => { myIdentityRef.current = localParticipant?.identity; }, [localParticipant?.identity]);

  const totalParticipants = (localParticipant ? 1 : 0) + participants.length;
  const isHost = role === "host";

  const handleLeave = async () => {
    try { await leaveAttendance(sessionId); } catch { /* ignore */ }
    navigate(leaveDestination(role));
  };

  useEffect(() => {
    if (role !== "host") return;
    const poll = async () => {
      try {
        const res = await getWaitingRoom(sessionId);
        setWaitingCount((res.waiting || []).length);
      } catch { /* silent */ }
    };
    poll();
    const id = setInterval(poll, 5000);
    return () => clearInterval(id);
  }, [role, sessionId]);

  useEffect(() => {
    if (phase !== "lobby" || role === "host") return;
    const poll = async () => {
      if (upgrading) return;
      try {
        const res = guestId
          ? await guestGetParticipantToken(sessionId, guestId)
          : await getParticipantToken(sessionId);
        if (res?.token) {
          setUpgrading(true);
          onRequestTokenSwap(res.token, res.serverUrl);
        }
      } catch { /* 403 = still waiting */ }
    };
    const id = setInterval(poll, 3000);
    return () => clearInterval(id);
  }, [phase, role, sessionId, upgrading, onRequestTokenSwap, guestId]);

  const broadcast = useCallback(async (msg, reliable = true) => {
    try {
      const payload = new TextEncoder().encode(JSON.stringify(msg));
      await room?.localParticipant?.publishData(payload, { reliable });
    } catch (err) { console.error("broadcast failed:", err); }
  }, [room]);

  const handleToggleHand = useCallback(async () => {
    const next = !myHandRaised;
    setMyHandRaised(next);
    setRaisedHands((prev) => {
      const n = { ...prev };
      if (next) n[myIdentityRef.current] = true; else delete n[myIdentityRef.current];
      return n;
    });
    await broadcast({ type: MSG.RAISE_HAND, identity: myIdentityRef.current,
                      fullName: getMetadata(localParticipant).fullName, raised: next });
    try { await raiseHand(sessionId); } catch { /* best effort */ }
  }, [myHandRaised, broadcast, localParticipant, sessionId]);

  const handleOpenChat = useCallback(() => {
    setChatOpen(true);
    setUnreadCount(0);
  }, []);

  const handleSendChat = useCallback(async (text) => {
    const meta = getMetadata(localParticipant);
    const msg = {
      id:            `${localParticipant?.identity}-${Date.now()}`,
      type:          MSG.CHAT_MESSAGE,
      identity:      localParticipant?.identity,
      fullName:      meta.fullName || localParticipant?.identity,
      profilePicUrl: meta.profilePicUrl || "",
      isHost:        meta.role === "host",
      text,
      timestamp:     Date.now(),
    };
    setMessages((prev) => [...prev, msg]);
    await broadcast(msg, true);
  }, [localParticipant, broadcast]);

  const handleLocalReaction = useCallback(({ identity, fullName, emoji }) => {
    setReactions((prev) => ({ ...prev, [identity]: { emoji, fullName } }));
    clearTimeout(reactionTimers.current[identity]);
    reactionTimers.current[identity] = setTimeout(() => {
      setReactions((prev) => { const n = { ...prev }; delete n[identity]; return n; });
    }, 2500);
  }, []);

  const handleOpenWhiteboard = useCallback(async () => {
    setWhiteboardOpen(true);
    if (isHost) {
      strokeLogRef.current = [];
      await broadcast({ type: MSG.WHITEBOARD_OPEN });
    }
  }, [isHost, broadcast]);

  const handleCloseWhiteboard = useCallback(async () => {
    setWhiteboardOpen(false);
    if (isHost) await broadcast({ type: MSG.WHITEBOARD_CLOSE });
  }, [isHost, broadcast]);

  const handleLocalStroke = useCallback((stroke) => {
    strokeLogRef.current.push(stroke);
    broadcast({ type: MSG.WHITEBOARD_STROKE, stroke }, true);
  }, [broadcast]);

  const handleLocalClear = useCallback(() => {
    strokeLogRef.current = [];
    broadcast({ type: MSG.WHITEBOARD_CLEAR });
  }, [broadcast]);

  const handleRequestSync = useCallback(() => {
    if (isHost) return;
    broadcast({ type: MSG.WHITEBOARD_SYNC, requesterIdentity: myIdentityRef.current });
  }, [isHost, broadcast]);

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
        const myId = myIdentityRef.current;
        if (data.identity && data.identity !== myId) return;
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
        const myId = myIdentityRef.current;
        if (data.identity && data.identity !== myId) return;
        setToast({
          msg: `Your request to join was declined.${data.reason ? ` Reason: ${data.reason}` : ""}`,
          severity: "error",
        });
        setTimeout(() => navigate(leaveDestination(role)), 3500);
        return;
      }

      if (data.type === MSG.RAISE_HAND) {
        setRaisedHands((prev) => {
          const n = { ...prev };
          if (data.raised) n[data.identity] = true; else delete n[data.identity];
          return n;
        });
        if (data.raised) setToast({ msg: `✋ ${data.fullName || "Someone"} raised their hand`, severity: "info" });
        return;
      }

      if (data.type === MSG.REACTION) {
        const id = data.identity; if (!id) return;
        setReactions((prev) => ({ ...prev, [id]: { emoji: data.emoji, fullName: data.fullName } }));
        clearTimeout(reactionTimers.current[id]);
        reactionTimers.current[id] = setTimeout(() => {
          setReactions((prev) => { const n = { ...prev }; delete n[id]; return n; });
        }, 2500);
        return;
      }

      if (data.type === MSG.CHAT_MESSAGE) {
        if (data.identity === myIdentityRef.current) return;
        setMessages((prev) => [...prev, data]);
        setChatOpen((isOpen) => {
          if (!isOpen) setUnreadCount((c) => c + 1);
          return isOpen;
        });
        return;
      }

      if (data.type === MSG.WHITEBOARD_OPEN)  { setWhiteboardOpen(true);  if (!isHost) setToast({ msg: "Host opened the whiteboard", severity: "info" }); return; }
      if (data.type === MSG.WHITEBOARD_CLOSE) { setWhiteboardOpen(false); return; }
      if (data.type === MSG.WHITEBOARD_STROKE && !isHost) { setWhiteboardStroke(data.stroke); return; }
      if (data.type === MSG.WHITEBOARD_CLEAR  && !isHost) { setWhiteboardClearTick((t) => t + 1); return; }
      if (data.type === MSG.WHITEBOARD_SYNC   && isHost)  {
        for (const stroke of strokeLogRef.current) {
          await broadcast({ type: MSG.WHITEBOARD_STROKE, stroke }, true);
        }
        return;
      }
    };

    room.on("dataReceived", handleData);
    return () => { room.off("dataReceived", handleData); };
  }, [room, role, phase, sessionId, navigate, upgrading, onRequestTokenSwap, isHost, broadcast, guestId]);

  const handleAdmit = async (id) => {
    try {
      await admitParticipant(sessionId, id);
      setWaitingCount((c) => Math.max(0, c - 1));
      setToast({ msg: "Participant admitted ✓", severity: "success" });
    } catch (err) {
      console.error(err);
      setToast({ msg: "Failed to admit participant", severity: "error" });
    }
  };
  const handleDeny = async (id) => {
    try { await denyParticipant(sessionId, id); setWaitingCount((c) => Math.max(0, c - 1)); }
    catch (err) { console.error(err); }
  };

  if (phase === "lobby") {
    return (
      <>
        <RoomAudioRenderer />
        <LobbyScreen currentUser={currentUser} onLeave={handleLeave} />
        {upgrading && (
          <Box sx={{ position: "fixed", inset: 0, bgcolor: "rgba(0,0,0,0.75)", display: "flex",
                     flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, zIndex: 9999 }}>
            <CircularProgress sx={{ color: GREEN }} size={48} />
            <Typography sx={{ color: TEXT, fontWeight: 700, fontSize: 18 }}>Joining the class…</Typography>
          </Box>
        )}
        <Snackbar open={!!toast} autoHideDuration={5000} onClose={() => setToast(null)}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}>
          <Alert severity={toast?.severity || "info"} onClose={() => setToast(null)}>{toast?.msg}</Alert>
        </Snackbar>
      </>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh", bgcolor: DARK, overflow: "hidden" }}>
      {/* TOP BAR */}
      <Box sx={{ bgcolor: DARK2, borderBottom: "1px solid rgba(255,255,255,0.06)",
                 px: 3, py: 1.25, display: "flex", alignItems: "center", gap: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: GREEN,
                     boxShadow: `0 0 0 3px ${GREEN}44`, animation: "pulse 2s infinite",
                     "@keyframes pulse": { "0%,100%": { opacity: 1 }, "50%": { opacity: 0.4 } } }} />
          <Typography sx={{ color: TEXT, fontWeight: 800, fontSize: 15 }}>GIEVA Live</Typography>
        </Box>
        <Chip label="LIVE" size="small"
          sx={{ bgcolor: "#ef444433", color: "#ef4444", fontWeight: 800, fontSize: 11 }} />
        <Box flex={1} />
        {waitingCount > 0 && role === "host" && (
          <Chip icon={<PersonAdd sx={{ fontSize: 14 }} />} label={`${waitingCount} waiting`}
            onClick={() => setAdmitPanelOpen(true)} size="small"
            sx={{ bgcolor: "rgba(239,68,68,0.18)", color: "#fca5a5", fontWeight: 800,
                  border: "1px solid rgba(239,68,68,0.35)", cursor: "pointer",
                  "& .MuiChip-icon": { color: "#f87171" } }} />
        )}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Avatar src={currentUser?.profilePicUrl || undefined}
            sx={{ width: 30, height: 30, bgcolor: avatarColor(currentUser?.fullName || ""), fontSize: 12 }}>
            {!currentUser?.profilePicUrl && getInitials(currentUser?.fullName || "")}
          </Avatar>
          <Typography sx={{ fontSize: 13, color: MUTED_D }}>{currentUser?.fullName}</Typography>
          {role === "host" && (
            <Chip label="Host" size="small"
              sx={{ bgcolor: GOLD, color: NAVY, fontWeight: 800, height: 20, fontSize: 11 }} />
          )}
        </Box>
      </Box>

      <ParticipantGrid raisedHands={raisedHands} reactions={reactions} />
      <RoomAudioRenderer />

      <ControlBar
        role={role} sessionId={sessionId} onLeave={handleLeave}
        onWhiteboard={handleOpenWhiteboard}
        onParticipants={() => setParticipantsOpen(true)}
        onAdmitPanel={() => setAdmitPanelOpen(true)}
        onChat={handleOpenChat} chatUnread={unreadCount}
        onReact={handleLocalReaction}
        participantCount={totalParticipants} waitingCount={waitingCount}
        handRaised={myHandRaised} onToggleHand={handleToggleHand}
      />

      <WhiteboardDrawer
        open={whiteboardOpen} onClose={handleCloseWhiteboard} isHost={isHost}
        onLocalStroke={handleLocalStroke} onLocalClear={handleLocalClear}
        remoteStroke={whiteboardStroke} remoteClear={whiteboardClearTick}
        syncStrokes={handleRequestSync}
      />

      {/* ── CHANGE 5: pass role + sessionId + onToast into ParticipantsDrawer ── */}
      <ParticipantsDrawer
        open={participantsOpen}
        onClose={() => setParticipantsOpen(false)}
        role={role}
        sessionId={sessionId}
        onToast={setToast}
      />

      <ChatDrawer
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        messages={messages}
        onSend={handleSendChat}
        currentUser={{ ...currentUser, identity: localParticipant?.identity }}
      />

      <AdmitPanel
        open={admitPanelOpen} onClose={() => setAdmitPanelOpen(false)}
        sessionId={sessionId} onAdmit={handleAdmit} onDeny={handleDeny}
        triggerRefresh={joinRequestTick}
      />

      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <Alert severity={toast?.severity || "info"} onClose={() => setToast(null)}>{toast?.msg}</Alert>
      </Snackbar>
    </Box>
  );
};

// ─── Main Export ─────────────────────────────────────────────
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

  const isPublicRoom = roomName?.startsWith("public-");
  const hasAuthToken = !!localStorage.getItem("token");

  const [guestId,          setGuestId]          = useState(() => sessionStorage.getItem(`guestId:${sessionId}`));
  const [needsGuestGate,   setNeedsGuestGate]   = useState(false);
  const [guestGateLoading, setGuestGateLoading] = useState(false);
  const [guestGateError,   setGuestGateError]   = useState("");

  const isHostRole = role === "tutor" || role === "host";

  useEffect(() => {
    if (!hasAuthToken) {
      if (isPublicRoom) { setNeedsGuestGate(true); setLoading(false); return; }
      navigate("/login", { replace: true });
      return;
    }
    loadClass();
    return () => { leaveAttendance(sessionId).catch(() => {}); };
  }, [sessionId]);

  const loadClass = async () => {
    try {
      setLoading(true);
      let response;
      if (isHostRole && isPublicRoom)  response = await joinPublicMeetingAsHost(sessionId);
      else if (isHostRole)             response = await joinTutorSession(sessionId);
      else                             response = await joinClassSession(sessionId);

      setToken(response.token);
      setServerUrl(response.serverUrl);
      setPhase(response.phase || (isHostRole ? "live" : "lobby"));
      setCurrentUser(response.currentUser || null);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Failed to join class");
    } finally { setLoading(false); }
  };

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
    } finally { setGuestGateLoading(false); }
  };

  const handleTokenSwap = useCallback((newToken, newServerUrl) => {
    setToken(newToken);
    if (newServerUrl) setServerUrl(newServerUrl);
    setPhase("live");
  }, []);

  if (needsGuestGate) return <GuestGate onSubmit={handleGuestSubmit} loading={guestGateLoading} error={guestGateError} />;

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
      options={{
        publishDefaults: {
          screenShareEncoding: {
            maxBitrate:   1_500_000,
            maxFramerate: 15,
          },
        },
      }}
      onDisconnected={() => navigate(leaveDestination(role === "tutor" ? "host" : role))}
    >
      <RoomInner
        role={role === "tutor" ? "host" : role}
        sessionId={sessionId}
        navigate={navigate}
        currentUser={currentUser}
        phase={phase}
        onRequestTokenSwap={handleTokenSwap}
        guestId={guestId}
      />
    </LiveKitRoom>
  );
}

// // pages/LiveClassroom.jsx
// // ═══════════════════════════════════════════════════════════════
// // FIXES IN THIS VERSION
// // ═══════════════════════════════════════════════════════════════
// //
// // 1. WHITEBOARD STROKE BREAKS (fast drawing)
// //    Root cause: WHITEBOARD_STROKE was sent with reliable: false
// //    (UDP-like). Under fast drawing this drops/reorders packets —
// //    slow drawing works because fewer packets means fewer drops.
// //    Fix: reliable: true on WHITEBOARD_STROKE so every segment
// //    arrives in order, guaranteed. Latency cost is ~20ms, invisible.
// //
// // 2. LEAVE BUTTON WRONG DESTINATION
// //    Root cause: handleLeave only checked `role === "host"` and
// //    sent everything else to /student/live-classes, including admins
// //    ("observer"), guests, and public-meeting attendees.
// //    Fix: explicit mapping for every role value.
// //
// // 3. ALL TILES SHOWING SAME VIDEO
// //    Root cause: useTracks with { participant } + withPlaceholder:true
// //    can resolve to the same track reference across tiles in some
// //    LiveKit React SDK versions when multiple participants share the
// //    same RoomContext. Fix: use useParticipantContext() or explicit
// //    per-track lookup via participant.getTrackPublication(), bypassing
// //    the ambiguous hook entirely.
// //
// // 4. SCREEN SHARE NOT WORKING
// //    Root cause: setScreenShareEnabled() error was silently swallowed
// //    by `catch { /* user cancelled */ }`, hiding the real failure
// //    (commonly: browser permission denied, or the LiveKit room wasn't
// //    configured to allow screen share tracks). Fix: surface the error,
// //    and ensure <LiveKitRoom> is given the correct options to allow
// //    screen share track publishing.

// import {
//   LiveKitRoom,
//   RoomAudioRenderer,
//   useParticipants,
//   useLocalParticipant,
//   useRoomContext,
//   VideoTrack,
// } from "@livekit/components-react";
// import { Track } from "livekit-client";
// import "@livekit/components-styles";
// import {
//     useTracks
// } from "@livekit/components-react";

// import {
//   useEffect, useRef, useState, useCallback,
// } from "react";
// import { useParams, useLocation, useNavigate } from "react-router-dom";

// import {
//   Box, Typography, IconButton, Tooltip, Avatar, Chip, Drawer,
//   List, ListItem, ListItemAvatar, ListItemText, Badge,
//   Slider, Button, Stack, CircularProgress, Divider, Snackbar, Alert,
// } from "@mui/material";

// import {
//   Mic, MicOff, Videocam, VideocamOff, ScreenShare, StopScreenShare,
//   PeopleAlt, PanTool, EmojiEmotions, FiberManualRecord, StopCircle,
//   Draw, Close, CallEnd, DeleteSweep, CheckCircle, Cancel,
//   HourglassTop, PersonAdd, Visibility, Chat, Send,
// } from "@mui/icons-material";

// import {
//   leaveAttendance,
//   joinClassSession,
//   joinTutorSession,
//   sendSessionReaction,
//   raiseHand,
//   startRecording,
//   stopRecording,
//   admitParticipant,
//   denyParticipant,
//   getWaitingRoom,
//   getParticipantToken,
// } from "../services/classSessionService";
// import { joinPublicMeetingAsHost } from "../services/publicMeetingService";
// import {
//   guestJoinPublicMeeting,
//   guestGetParticipantToken,
// } from "../services/guestMeetingService";

// // ─── Design tokens ────────────────────────────────────────────
// const NAVY    = "#0B1F3A";
// const GREEN   = "#1E7F4F";
// const GOLD    = "#D4A017";
// const DARK    = "#0f172a";
// const DARK2   = "#1e293b";
// const DARK3   = "#334155";
// const TEXT    = "#f1f5f9";
// const MUTED_D = "#94a3b8";

// // ─── Helpers ──────────────────────────────────────────────────
// const getMetadata = (p) => {
//   try { return JSON.parse(p?.metadata || "{}"); } catch { return {}; }
// };
// const getInitials = (name = "") =>
//   name.split(" ").filter(Boolean).slice(0, 2).map((n) => n[0]).join("").toUpperCase() || "?";
// const avatarColor = (name = "") => {
//   const colors = ["#7C3AED","#0284C7","#DC2626","#D97706","#059669","#0891B2"];
//   let h = 0;
//   for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + h * 31;
//   return colors[Math.abs(h) % colors.length];
// };
// const decodeMsg = (bytes) => {
//   try { return JSON.parse(new TextDecoder().decode(bytes)); } catch { return null; }
// };
// const firstName = (name = "") => name.trim().split(" ")[0] || name;

// const MSG = {
//   JOIN_REQUEST:     "JOIN_REQUEST",
//   ADMITTED:         "ADMITTED",
//   DENIED:           "DENIED",
//   RAISE_HAND:       "RAISE_HAND",
//   REACTION:         "REACTION",
//   WHITEBOARD_OPEN:  "WHITEBOARD_OPEN",
//   WHITEBOARD_CLOSE: "WHITEBOARD_CLOSE",
//   WHITEBOARD_STROKE:"WHITEBOARD_STROKE",
//   WHITEBOARD_CLEAR: "WHITEBOARD_CLEAR",
//   WHITEBOARD_SYNC:  "WHITEBOARD_SYNC",
//   CHAT_MESSAGE:     "CHAT_MESSAGE",
// };

// // ─── Navigation helper ────────────────────────────────────────
// // BUG 2 FIX: explicit mapping for every role value.
// // Inside RoomInner, role is already normalised:
// //   "host"        → tutor or admin who started the session
// //   "observer"    → admin watching a course session
// //   "participant" → admitted student
// //   "student"     → alias used in some paths
// //   "lobby"       → waiting-room phase (guest or student)
// const leaveDestination = (role) => {
//   switch (role) {
//     case "host":        return "/tutor/live-classes";
//     case "observer":    return "/admin/live-sessions";
//     case "participant":
//     case "student":
//     case "lobby":
//     default:            return "/student/live-classes";
//   }
// };

// // ─── ParticipantTile ─────────────────────────────────────────
// // Now only shows camera / avatar — screen share is handled
// // separately in the presentation layout (ScreenShareView).
// const ParticipantTile = ({
//   participant,
//   isLocal      = false,
//   isLarge      = false,
//   isHandRaised = false,
//   reaction     = null,
//   compact      = false,   // true when in the bottom strip during screen share
// }) => {
//   const meta   = getMetadata(participant);
//   const name   = meta.fullName || participant.identity;
//   const pic    = meta.profilePicUrl;
//   const isHost = meta.role === "host";

//   const camPub = participant.getTrackPublication(Track.Source.Camera);
// // Explicitly exclude screen share — tiles only show camera, never screen
// const hasCam = camPub
//   && !camPub.isMuted
//   && camPub.track
//   && camPub.source !== Track.Source.ScreenShare  // safety guard
//   ? (isLocal ? true : !!camPub.isSubscribed)
//   : false;

//   return (
//     <Box sx={{
//       width: "100%",
//       aspectRatio: "16/9",
//       minHeight: compact ? 80  : isLarge ? 340 : undefined,
//       height:    compact ? 90  : isLarge ? "100%" : undefined,
//       position: "relative", borderRadius: compact ? 2 : 3, overflow: "hidden",
//       bgcolor: DARK2, border: `1.5px solid ${isHandRaised ? GOLD : DARK3}`,
//       display: "flex", alignItems: "center", justifyContent: "center",
//       flexShrink: 0,
//       transition: "border-color 0.2s",
//     }}>
//       {hasCam ? (
//         <Box sx={{ position: "absolute", inset: 0 }}>
//           <VideoTrack
//             trackRef={{ participant, source: Track.Source.Camera, publication: camPub }}
//             style={{ width: "100%", height: "100%", objectFit: "cover" }}
//           />
//         </Box>
//       ) : (
//         <Avatar src={pic || undefined}
//           sx={{
//             width:     compact ? 32 : isLarge ? 120 : 68,
//             height:    compact ? 32 : isLarge ? 120 : 68,
//             fontSize:  compact ? 13 : isLarge ? 44  : 26,
//             fontWeight: 800,
//             bgcolor: avatarColor(name),
//             border: "3px solid rgba(255,255,255,0.13)",
//           }}>
//           {!pic && getInitials(name)}
//         </Avatar>
//       )}

//       {/* Raised hand badge */}
//       {isHandRaised && (
//         <Box sx={{
//           position: "absolute", top: 6, right: 6,
//           width: compact ? 22 : 34, height: compact ? 22 : 34,
//           borderRadius: "50%", bgcolor: GOLD,
//           display: "flex", alignItems: "center", justifyContent: "center",
//           fontSize: compact ? 12 : 18, boxShadow: "0 2px 8px rgba(0,0,0,0.35)",
//           animation: "handPulse 1s ease-in-out infinite",
//           "@keyframes handPulse": {
//             "0%,100%": { transform: "scale(1)" },
//             "50%":     { transform: "scale(1.12)" },
//           },
//         }}>✋</Box>
//       )}

//       {/* Reaction bubble */}
//       {reaction && !compact && (
//         <Box sx={{
//           position: "absolute", top: -6, left: "50%",
//           transform: "translate(-50%, -100%)",
//           bgcolor: "rgba(15,23,42,0.92)", borderRadius: 3,
//           px: 1.5, py: 0.75, display: "flex", alignItems: "center", gap: 0.75,
//           border: `1px solid ${DARK3}`, whiteSpace: "nowrap",
//           animation: "floatUp 2.5s ease-out forwards",
//           "@keyframes floatUp": {
//             "0%":   { opacity: 0, transform: "translate(-50%, -85%)" },
//             "15%":  { opacity: 1, transform: "translate(-50%, -100%)" },
//             "80%":  { opacity: 1 },
//             "100%": { opacity: 0, transform: "translate(-50%, -120%)" },
//           },
//         }}>
//           <Typography sx={{ fontSize: 20, lineHeight: 1 }}>{reaction.emoji}</Typography>
//           <Typography sx={{ fontSize: 12, fontWeight: 700, color: TEXT }}>
//             {firstName(reaction.fullName)}
//           </Typography>
//         </Box>
//       )}

//       {/* Name bar */}
//       <Box sx={{
//         position: "absolute", bottom: 0, left: 0, right: 0,
//         background: "linear-gradient(transparent, rgba(0,0,0,0.72))",
//         px: compact ? 0.75 : 1.5, py: compact ? 0.5 : 1,
//         display: "flex", alignItems: "center", gap: 0.5,
//       }}>
//         <Typography sx={{ fontSize: compact ? 10 : 13, fontWeight: 700, color: TEXT, flex: 1 }} noWrap>
//           {isLocal ? `${name} (You)` : name}
//         </Typography>
//         {!compact && isHost && (
//           <Chip label="Host" size="small"
//             sx={{ bgcolor: GOLD, color: NAVY, fontWeight: 800, height: 20, fontSize: 11 }} />
//         )}
//         {participant.isMicrophoneEnabled
//           ? <Mic sx={{ fontSize: compact ? 11 : 14, color: GREEN }} />
//           : <MicOff sx={{ fontSize: compact ? 11 : 14, color: "#ef4444" }} />}
//       </Box>
//     </Box>
//   );
// };

// // ─── ScreenShareView ──────────────────────────────────────────
// // Full-area screen share display — shown during presentation mode.
// const ScreenShareView = ({ trackRef, presenterName }) => (
//   <Box sx={{
//     flex: 1, position: "relative", bgcolor: "#000",
//     display: "flex", alignItems: "center", justifyContent: "center",
//     minHeight: 0, // allow flex shrinking
//   }}>
//     {/* <VideoTrack
//       trackRef={{ participant, source: Track.Source.ScreenShare, publication: screenPub }}
//       style={{ width: "100%", height: "100%", objectFit: "contain" }}
//     /> */}
//     <VideoTrack
//     trackRef={trackRef}
//     style={{
//         width: "100%",
//         height: "100%",
//         objectFit: "contain",
//     }}
// />
//     <Chip
//       label={`${presenterName} is presenting`}
//       size="small"
//       sx={{
//         position: "absolute", top: 12, left: 12,
//         bgcolor: "rgba(0,0,0,0.65)", color: TEXT,
//         fontWeight: 700, fontSize: 12,
//         "& .MuiChip-label": { px: 1.5 },
//       }}
//     />
//   </Box>
// );

// // ─── ParticipantGrid (presentation-layout aware) ─────────────
// const ParticipantGrid = ({ raisedHands, reactions }) => {
//   const participants         = useParticipants();
//   const { localParticipant } = useLocalParticipant();

//   const isAdmitted = (p) => getMetadata(p).role !== "lobby";

//   const all = [
//     localParticipant,
//     ...participants.filter((p) => p.identity !== localParticipant?.identity),
//   ].filter(Boolean).filter(isAdmitted);

//   // ── Detect active screen share across all participants ──────
// const sharingParticipant = all.find((p) => {
//   const pub = p.getTrackPublication(Track.Source.ScreenShare);
//   if (!pub || pub.isMuted || !pub.track) return false;
//   // Local participant publishes (not subscribes), remote participants subscribe
//   const isLocalP = p.identity === localParticipant?.identity;
//   return isLocalP ? true : !!pub.isSubscribed;
// });

// const screenTracks = useTracks([
//     {
//         source: Track.Source.ScreenShare,
//         withPlaceholder: false,
//     },
// ]);

// const activeScreenTrack = screenTracks.find(
//     t => t.publication.track
// );

// const isPresenting = !!activeScreenTrack;

//   // const isPresenting = !!sharingParticipant;

//   // ── PRESENTATION LAYOUT ──────────────────────────────────────
//   if (isPresenting) {
//     //const screenPub      = sharingParticipant.getTrackPublication(Track.Source.ScreenShare);
//     // const sharerMeta     = getMetadata(sharingParticipant);
//     // const presenterName  = sharerMeta.fullName || sharingParticipant.identity;
//     const presenter =
//     activeScreenTrack.participant;

//     const sharerMeta =
//         getMetadata(presenter);

//     const presenterName =
//         sharerMeta.fullName
//         || presenter.identity;

//     return (
//       <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}>
//         {/* Main screen share area */}
//         <ScreenShareView
//           // participant={sharingParticipant}
//           // screenPub={screenPub}
//           trackRef={activeScreenTrack}
//           presenterName={presenterName}
//         />

//         {/* Bottom strip — all participant camera tiles */}
//         <Box sx={{
//           height: 120,
//           bgcolor: DARK,
//           borderTop: "1px solid rgba(255,255,255,0.08)",
//           display: "flex",
//           alignItems: "center",
//           gap: 1,
//           px: 1.5,
//           overflowX: "auto",
//           flexShrink: 0,
//           "&::-webkit-scrollbar": { height: 4 },
//           "&::-webkit-scrollbar-track": { bgcolor: "transparent" },
//           "&::-webkit-scrollbar-thumb": { bgcolor: DARK3, borderRadius: 2 },
//         }}>
//           {all.map((p) => (
//               <Box key={p.identity} sx={{ width: 140, flexShrink: 0, borderRadius: 2, overflow: "hidden" }}>
//                 <ParticipantTile
//                 participant={p}
//                 isLocal={p.identity === localParticipant?.identity}
//                 compact
//                 isHandRaised={!!raisedHands[p.identity]}
//                 reaction={reactions[p.identity] || null}
//               />
//             </Box>
//           ))}
//         </Box>
//       </Box>
//     );
//   }

//   // ── NORMAL GRID LAYOUT (no screen share active) ─────────────
//   const count = all.length;
//   const cols  = count === 1 ? 1 : count <= 4 ? 2 : count <= 9 ? 3 : 4;

//   return (
//     <Box sx={{
//       flex: 1, display: "grid",
//       gridTemplateColumns: `repeat(${cols}, 1fr)`,
//       gap: 1.5, p: 2, alignContent: "start", overflowY: "auto",
//     }}>
//       {all.map((p) => (
//         <ParticipantTile
//           key={p.identity}
//           participant={p}
//           isLocal={p.identity === localParticipant?.identity}
//           isLarge={count === 1}
//           isHandRaised={!!raisedHands[p.identity]}
//           reaction={reactions[p.identity] || null}
//         />
//       ))}
//     </Box>
//   );
// };

// // ─── WhiteboardDrawer ─────────────────────────────────────────
// // BUG 1 FIX: switch WHITEBOARD_STROKE to reliable: true so that
// // fast drawing never drops or reorders stroke segments on the
// // recipient's canvas. The broadcast call is in RoomInner's
// // handleLocalStroke — the change is made there (see broadcast call
// // in RoomInner). The canvas sizing now also uses a ResizeObserver
// // so the canvas dimensions are correct on the participant's side
// // even if the Drawer's CSS transition hasn't finished at mount.
// const WhiteboardDrawer = ({
//   open, onClose, isHost,
//   onLocalStroke, onLocalClear,
//   remoteStroke, remoteClear, syncStrokes,
// }) => {
//   const canvasRef  = useRef(null);
//   const isDrawing  = useRef(false);
//   const lastPos    = useRef({ x: 0, y: 0 });
//   const [tool, setTool]           = useState("pen");
//   const [color, setColor]         = useState("#000000");
//   const [thickness, setThickness] = useState(3);

//   const COLORS = ["#000000","#ffffff","#ef4444","#f97316","#eab308","#22c55e","#3b82f6","#8b5cf6"];

//   const getPos = (e, canvas) => {
//     const rect    = canvas.getBoundingClientRect();
//     const clientX = e.touches ? e.touches[0].clientX : e.clientX;
//     const clientY = e.touches ? e.touches[0].clientY : e.clientY;
//     return {
//       x: (clientX - rect.left) * (canvas.width  / rect.width),
//       y: (clientY - rect.top)  * (canvas.height / rect.height),
//     };
//   };

//   const toNorm   = (pos, canvas) => ({ nx: pos.x / canvas.width,  ny: pos.y / canvas.height });
//   const fromNorm = (nx, ny, canvas) => ({ x: nx * canvas.width, y: ny * canvas.height });

//   const strokeOnCanvas = useCallback((from, to, strokeColor, strokeWidth) => {
//     const canvas = canvasRef.current; if (!canvas) return;
//     const ctx = canvas.getContext("2d");
//     ctx.beginPath();
//     ctx.moveTo(from.x, from.y);
//     ctx.lineTo(to.x, to.y);
//     ctx.strokeStyle = strokeColor;
//     ctx.lineWidth   = strokeWidth;
//     ctx.lineCap     = "round"; ctx.lineJoin = "round";
//     ctx.stroke();
//   }, []);

//   const clearCanvas = useCallback(() => {
//     const canvas = canvasRef.current; if (!canvas) return;
//     canvas.getContext("2d").fillStyle = "#ffffff";
//     canvas.getContext("2d").fillRect(0, 0, canvas.width, canvas.height);
//   }, []);

//   const initCanvas = useCallback(() => {
//     const canvas = canvasRef.current; if (!canvas) return;
//     canvas.width  = canvas.offsetWidth  || canvas.clientWidth  || 700;
//     canvas.height = canvas.offsetHeight || canvas.clientHeight || 500;
//     clearCanvas();
//   }, [clearCanvas]);

//   const startDraw = useCallback((e) => {
//     if (!isHost) return;
//     e.preventDefault();
//     const canvas = canvasRef.current; if (!canvas) return;
//     isDrawing.current = true;
//     lastPos.current   = getPos(e, canvas);
//   }, [isHost]);

//   const draw = useCallback((e) => {
//     if (!isHost || !isDrawing.current) return;
//     e.preventDefault();
//     const canvas = canvasRef.current; if (!canvas) return;
//     const pos    = getPos(e, canvas);
//     const strokeColor = tool === "eraser" ? "#ffffff" : color;
//     const strokeWidth = tool === "eraser" ? thickness * 5 : thickness;

//     strokeOnCanvas(lastPos.current, pos, strokeColor, strokeWidth);

//     onLocalStroke?.({
//       from: toNorm(lastPos.current, canvas),
//       to:   toNorm(pos, canvas),
//       color: strokeColor,
//       thickness: strokeWidth,
//     });

//     lastPos.current = pos;
//   }, [isHost, tool, color, thickness, strokeOnCanvas, onLocalStroke]);

//   const stopDraw = useCallback(() => { isDrawing.current = false; }, []);

//   const handleClearClick = () => {
//     if (!isHost) return;
//     clearCanvas();
//     onLocalClear?.();
//   };

//   // BUG 1 FIX (canvas sizing): use ResizeObserver so the canvas
//   // reflects its actual rendered size once the MUI Drawer transition
//   // completes, rather than relying on a fixed timeout that may fire
//   // before the layout is stable.
//   useEffect(() => {
//     if (!open) return;
//     const canvas = canvasRef.current; if (!canvas) return;

//     const observer = new ResizeObserver((entries) => {
//       const entry = entries[0];
//       if (!entry) return;
//       const { width, height } = entry.contentRect;
//       if (width > 0 && height > 0) {
//         canvas.width  = width;
//         canvas.height = height;
//         clearCanvas();
//         if (!isHost) syncStrokes?.();
//         observer.disconnect(); // only need the first stable size
//       }
//     });

//     observer.observe(canvas);
//     // Fallback: if ResizeObserver never fires (e.g. element hidden),
//     // init after the Drawer transition duration (225ms) + buffer.
//     const fallback = setTimeout(initCanvas, 300);

//     return () => {
//       observer.disconnect();
//       clearTimeout(fallback);
//     };
//   }, [open, isHost, clearCanvas, syncStrokes, initCanvas]);

//   // Apply incoming stroke from host
//   useEffect(() => {
//     if (!remoteStroke) return;
//     const canvas = canvasRef.current; if (!canvas) return;
//     const from = fromNorm(remoteStroke.from.nx, remoteStroke.from.ny, canvas);
//     const to   = fromNorm(remoteStroke.to.nx,   remoteStroke.to.ny,   canvas);
//     strokeOnCanvas(from, to, remoteStroke.color, remoteStroke.thickness);
//   }, [remoteStroke, strokeOnCanvas]);

//   useEffect(() => { if (remoteClear) clearCanvas(); }, [remoteClear, clearCanvas]);

//   return (
//     <Drawer anchor="right" open={open} onClose={isHost ? onClose : undefined}
//       PaperProps={{ sx: { width: { xs: "100vw", md: 700 }, bgcolor: "#f8fafc", display: "flex", flexDirection: "column" } }}>
//       <Box sx={{ p: 1.5, bgcolor: DARK, display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
//         <Typography sx={{ color: TEXT, fontWeight: 800, fontSize: 15, mr: 1 }}>Whiteboard</Typography>

//         {!isHost && (
//           <Chip icon={<Visibility sx={{ fontSize: 13 }} />} label="View only" size="small"
//             sx={{ bgcolor: "rgba(255,255,255,0.1)", color: MUTED_D, fontWeight: 700, fontSize: 11,
//                   "& .MuiChip-icon": { color: MUTED_D } }} />
//         )}

//         {isHost && (
//           <>
//             <Tooltip title="Pen">
//               <IconButton onClick={() => setTool("pen")} sx={{ color: tool === "pen" ? GOLD : MUTED_D }}>
//                 <Draw />
//               </IconButton>
//             </Tooltip>
//             <Tooltip title="Eraser">
//               <IconButton onClick={() => setTool("eraser")} sx={{ color: tool === "eraser" ? GOLD : MUTED_D, fontSize: 18 }}>⬜</IconButton>
//             </Tooltip>
//             <Box sx={{ display: "flex", gap: 0.5 }}>
//               {COLORS.map((c) => (
//                 <Box key={c} onClick={() => { setColor(c); setTool("pen"); }}
//                   sx={{ width: 22, height: 22, borderRadius: "50%", bgcolor: c, cursor: "pointer",
//                         border: color === c ? "2px solid #fff" : "2px solid transparent",
//                         boxShadow: color === c ? `0 0 0 2px ${GOLD}` : "none" }} />
//               ))}
//             </Box>
//             <Box sx={{ width: 80 }}>
//               <Slider size="small" min={1} max={20} value={thickness}
//                 onChange={(_, v) => setThickness(v)} sx={{ color: GOLD }} />
//             </Box>
//             <Tooltip title="Clear">
//               <IconButton onClick={handleClearClick} sx={{ color: "#ef4444" }}><DeleteSweep /></IconButton>
//             </Tooltip>
//           </>
//         )}

//         <Box flex={1} />
//         {isHost && (
//           <IconButton onClick={onClose} sx={{ color: MUTED_D }}><Close /></IconButton>
//         )}
//       </Box>
//       <Box sx={{ flex: 1, overflow: "hidden", cursor: isHost ? (tool === "eraser" ? "cell" : "crosshair") : "default" }}>
//         <canvas ref={canvasRef}
//           style={{ width: "100%", height: "100%", display: "block", touchAction: "none" }}
//           onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
//           onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw} />
//       </Box>
//     </Drawer>
//   );
// };

// // ─── ChatDrawer ───────────────────────────────────────────────
// // Pure data-channel chat — no backend, no DB, no new routes.
// // Messages are sent via room.localParticipant.publishData() and
// // received via room.on("dataReceived") already wired in RoomInner.
// const ChatDrawer = ({ open, onClose, messages, onSend, currentUser }) => {
//   const [input, setInput] = useState("");
//   const bottomRef         = useRef(null);

//   useEffect(() => {
//     if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages, open]);

//   const handleSend = () => {
//     const text = input.trim();
//     if (!text) return;
//     onSend(text);
//     setInput("");
//   };

//   const handleKey = (e) => {
//     if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
//   };

//   const formatTime = (ts) =>
//     new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

//   return (
//     <Drawer anchor="right" open={open} onClose={onClose}
//       PaperProps={{ sx: { width: { xs: "100vw", sm: 340 }, bgcolor: DARK2,
//                           display: "flex", flexDirection: "column" } }}>
//       {/* Header */}
//       <Box sx={{ p: 2, display: "flex", alignItems: "center", justifyContent: "space-between",
//                  borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
//         <Typography sx={{ color: TEXT, fontWeight: 800, fontSize: 16 }}>In-class Chat</Typography>
//         <IconButton onClick={onClose} sx={{ color: MUTED_D }}><Close /></IconButton>
//       </Box>

//       {/* Messages */}
//       <Box sx={{ flex: 1, overflowY: "auto", px: 2, py: 1.5,
//                  display: "flex", flexDirection: "column", gap: 1.5 }}>
//         {messages.length === 0 ? (
//           <Box sx={{ flex: 1, display: "flex", alignItems: "center",
//                      justifyContent: "center", minHeight: 200 }}>
//             <Typography sx={{ color: MUTED_D, fontSize: 13, textAlign: "center" }}>
//               No messages yet. Say hello! 👋
//             </Typography>
//           </Box>
//         ) : (
//           messages.map((msg) => {
//             const isMe = msg.identity === currentUser?.identity;
//             return (
//               <Box key={msg.id} sx={{ display: "flex", flexDirection: "column",
//                                       alignItems: isMe ? "flex-end" : "flex-start" }}>
//                 {/* Name + time row */}
//                 <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.25,
//                            flexDirection: isMe ? "row-reverse" : "row" }}>
//                   <Avatar src={msg.profilePicUrl || undefined}
//                     sx={{ width: 20, height: 20, fontSize: 9, bgcolor: avatarColor(msg.fullName) }}>
//                     {!msg.profilePicUrl && getInitials(msg.fullName)}
//                   </Avatar>
//                   <Typography sx={{ fontSize: 11, fontWeight: 700, color: MUTED_D }}>
//                     {isMe ? "You" : msg.fullName}
//                   </Typography>
//                   <Typography sx={{ fontSize: 10, color: DARK3 }}>{formatTime(msg.timestamp)}</Typography>
//                   {msg.isHost && (
//                     <Chip label="Host" size="small"
//                       sx={{ height: 14, fontSize: 9, fontWeight: 800,
//                             bgcolor: GOLD, color: NAVY, "& .MuiChip-label": { px: 0.5 } }} />
//                   )}
//                 </Box>
//                 {/* Bubble */}
//                 <Box sx={{
//                   maxWidth: "80%", px: 1.5, py: 1,
//                   borderRadius: isMe ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
//                   bgcolor: isMe ? GREEN : "rgba(255,255,255,0.08)",
//                   color: TEXT, fontSize: 14, wordBreak: "break-word",
//                   lineHeight: 1.5, whiteSpace: "pre-wrap",
//                 }}>
//                   {msg.text}
//                 </Box>
//               </Box>
//             );
//           })
//         )}
//         <div ref={bottomRef} />
//       </Box>

//       {/* Input */}
//       <Box sx={{ p: 1.5, borderTop: "1px solid rgba(255,255,255,0.08)",
//                  display: "flex", gap: 1, alignItems: "flex-end" }}>
//         <Box component="textarea" placeholder="Type a message… (Enter to send)"
//           rows={1} value={input} onChange={(e) => setInput(e.target.value)}
//           onKeyDown={handleKey} maxLength={500}
//           sx={{ flex: 1, resize: "none", bgcolor: "rgba(255,255,255,0.06)",
//                 border: `1px solid ${DARK3}`, borderRadius: 2, color: TEXT,
//                 fontSize: 14, p: 1, outline: "none", fontFamily: "inherit",
//                 lineHeight: 1.5, maxHeight: 120, overflowY: "auto",
//                 "&:focus": { borderColor: GREEN },
//                 "&::placeholder": { color: MUTED_D } }} />
//         <IconButton onClick={handleSend} disabled={!input.trim()}
//           sx={{ bgcolor: GREEN, color: "#fff", width: 40, height: 40, borderRadius: 2,
//                 flexShrink: 0, "&:hover": { bgcolor: "#166d3e" },
//                 "&.Mui-disabled": { bgcolor: "rgba(255,255,255,0.06)", color: MUTED_D } }}>
//           <Send sx={{ fontSize: 18 }} />
//         </IconButton>
//       </Box>
//     </Drawer>
//   );
// };

// // ─── ParticipantsDrawer ───────────────────────────────────────
// const ParticipantsDrawer = ({ open, onClose }) => {
//   const participants         = useParticipants();
//   const { localParticipant } = useLocalParticipant();

//   const all = [
//     localParticipant,
//     ...participants.filter((p) => p.identity !== localParticipant?.identity),
//   ].filter(Boolean);

//   return (
//     <Drawer anchor="right" open={open} onClose={onClose}
//       PaperProps={{ sx: { width: 300, bgcolor: DARK2 } }}>
//       <Box sx={{ p: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
//         <Typography sx={{ color: TEXT, fontWeight: 800, fontSize: 16 }}>Participants ({all.length})</Typography>
//         <IconButton onClick={onClose} sx={{ color: MUTED_D }}><Close /></IconButton>
//       </Box>
//       <List>
//         {all.map((p) => {
//           const meta    = getMetadata(p);
//           const name    = meta.fullName || p.identity;
//           const pic     = meta.profilePicUrl;
//           const isHst   = meta.role === "host";
//           const isLobby = meta.role === "lobby";
//           const isLocal = p.identity === localParticipant?.identity;
//           return (
//             <ListItem key={p.identity}>
//               <ListItemAvatar>
//                 <Avatar src={pic || undefined} sx={{ bgcolor: avatarColor(name), width: 38, height: 38 }}>
//                   {!pic && getInitials(name)}
//                 </Avatar>
//               </ListItemAvatar>
//               <ListItemText
//                 primary={
//                   <Typography sx={{ color: TEXT, fontSize: 14, fontWeight: 600 }}>
//                     {isLocal ? `${name} (You)` : name}
//                     {isHst    && <Chip label="Host"    size="small" sx={{ ml: 1, bgcolor: GOLD, color: NAVY, height: 18, fontSize: 10 }} />}
//                     {isLobby  && <Chip label="Waiting" size="small" sx={{ ml: 1, bgcolor: "rgba(239,68,68,0.2)", color: "#fca5a5", height: 18, fontSize: 10 }} />}
//                   </Typography>
//                 }
//                 secondary={
//                   <Box sx={{ display: "flex", gap: 0.5, mt: 0.25 }}>
//                     {isLobby
//                       ? <Typography sx={{ fontSize: 11, color: MUTED_D }}>In waiting room</Typography>
//                       : <>
//                           {p.isMicrophoneEnabled ? <Mic sx={{ fontSize: 13, color: GREEN }} /> : <MicOff sx={{ fontSize: 13, color: "#ef4444" }} />}
//                           {p.isCameraEnabled     ? <Videocam sx={{ fontSize: 13, color: GREEN }} /> : <VideocamOff sx={{ fontSize: 13, color: "#ef4444" }} />}
//                         </>
//                     }
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

// // ─── AdmitPanel ───────────────────────────────────────────────
// const AdmitPanel = ({ open, onClose, sessionId, onAdmit, onDeny, triggerRefresh }) => {
//   const [waiting, setWaiting] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const intervalRef           = useRef(null);

//   const refresh = useCallback(async () => {
//     try {
//       setLoading(true);
//       const res = await getWaitingRoom(sessionId);
//       setWaiting(res.waiting || []);
//     } catch (err) {
//       console.error("getWaitingRoom:", err);
//     } finally {
//       setLoading(false);
//     }
//   }, [sessionId]);

//   useEffect(() => {
//     if (!open) { clearInterval(intervalRef.current); return; }
//     refresh();
//     intervalRef.current = setInterval(refresh, 4000);
//     return () => clearInterval(intervalRef.current);
//   }, [open, refresh]);

//   useEffect(() => { if (triggerRefresh > 0) refresh(); }, [triggerRefresh, refresh]);

//   const handleAdmit = async (id) => {
//     await onAdmit(id);
//     setWaiting((prev) => prev.filter((w) => (w.isGuest ? w.guestId : w.userId) !== id));
//   };
//   const handleDeny = async (id) => {
//     await onDeny(id);
//     setWaiting((prev) => prev.filter((w) => (w.isGuest ? w.guestId : w.userId) !== id));
//   };

//   return (
//     <Drawer anchor="left" open={open} onClose={onClose}
//       PaperProps={{ sx: { width: 320, bgcolor: DARK2 } }}>
//       <Box sx={{ p: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
//         <Typography sx={{ color: TEXT, fontWeight: 800, fontSize: 16 }}>
//           Waiting Room
//           {waiting.length > 0 && (
//             <Chip label={waiting.length} size="small"
//               sx={{ ml: 1.5, bgcolor: "#ef4444", color: "#fff", fontWeight: 800, height: 20, fontSize: 11 }} />
//           )}
//         </Typography>
//         <IconButton onClick={onClose} sx={{ color: MUTED_D }}><Close /></IconButton>
//       </Box>
//       <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

//       {loading && waiting.length === 0 ? (
//         <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
//           <CircularProgress size={28} sx={{ color: GREEN }} />
//         </Box>
//       ) : waiting.length === 0 ? (
//         <Box sx={{ textAlign: "center", mt: 5, px: 3 }}>
//           <HourglassTop sx={{ fontSize: 36, color: MUTED_D, mb: 1 }} />
//           <Typography sx={{ color: MUTED_D, fontSize: 14 }}>No one waiting</Typography>
//         </Box>
//       ) : (
//         <List>
//           {waiting.map((w) => {
//             const id = w.isGuest ? w.guestId : w.userId;
//             return (
//               <ListItem key={id}
//                 sx={{ flexDirection: "column", alignItems: "stretch",
//                       borderBottom: "1px solid rgba(255,255,255,0.06)", pb: 2 }}>
//                 <Stack direction="row" spacing={1.5} alignItems="center" mb={1.5}>
//                   <Avatar src={w.profilePicUrl || undefined}
//                     sx={{ width: 42, height: 42, bgcolor: avatarColor(w.fullName) }}>
//                     {!w.profilePicUrl && getInitials(w.fullName)}
//                   </Avatar>
//                   <Box>
//                     <Stack direction="row" spacing={0.75} alignItems="center">
//                       <Typography sx={{ color: TEXT, fontWeight: 700, fontSize: 14 }}>{w.fullName}</Typography>
//                       {w.isGuest && (
//                         <Chip label="Guest" size="small"
//                           sx={{ height: 18, fontSize: 10, fontWeight: 800,
//                                 bgcolor: "rgba(212,160,23,0.18)", color: GOLD }} />
//                       )}
//                     </Stack>
//                     <Typography sx={{ color: MUTED_D, fontSize: 12 }}>Waiting to join</Typography>
//                   </Box>
//                 </Stack>
//                 <Stack direction="row" spacing={1}>
//                   <Button fullWidth variant="contained" size="small"
//                     startIcon={<CheckCircle sx={{ fontSize: 15 }} />}
//                     onClick={() => handleAdmit(id)}
//                     sx={{ bgcolor: GREEN, textTransform: "none", fontWeight: 700, borderRadius: 2,
//                           "&:hover": { bgcolor: "#166d3e" } }}>
//                     Admit
//                   </Button>
//                   <Button fullWidth variant="outlined" size="small"
//                     startIcon={<Cancel sx={{ fontSize: 15 }} />}
//                     onClick={() => handleDeny(id)}
//                     sx={{ borderColor: "#ef4444", color: "#ef4444", textTransform: "none",
//                           fontWeight: 700, borderRadius: 2,
//                           "&:hover": { borderColor: "#dc2626", bgcolor: "rgba(239,68,68,0.08)" } }}>
//                     Deny
//                   </Button>
//                 </Stack>
//               </ListItem>
//             );
//           })}
//         </List>
//       )}
//     </Drawer>
//   );
// };

// // ─── ControlBar ───────────────────────────────────────────────
// const ControlBar = ({
//   role, sessionId, onLeave,
//   onWhiteboard, onParticipants, onAdmitPanel, onChat, onReact,
//   participantCount, waitingCount, chatUnread,
//   handRaised, onToggleHand,
// }) => {
//   const { localParticipant } = useLocalParticipant();
//   const room                 = useRoomContext();

//   const [micOn,             setMicOn]             = useState(true);
//   const [camOn,             setCamOn]             = useState(true);
//   const [recording,         setRecording]         = useState(false);
//   const [reactionPickerOpen, setReactionPickerOpen] = useState(false);
//   const [screenShareError,  setScreenShareError]  = useState("");

//   const REACTIONS = ["👋","👍","❤️","😂","🎉","🔥","❓","👏"];

//   const toggleMic = async () => {
//     await localParticipant?.setMicrophoneEnabled(!micOn);
//     setMicOn(!micOn);
//   };
//   const toggleCam = async () => {
//     await localParticipant?.setCameraEnabled(!camOn);
//     setCamOn(!camOn);
//   };

//   // BUG FIX: don't rely on React state for the current screen-share
//   // status — use LiveKit's authoritative value directly. Using a stale
//   // React boolean caused the track to be unpublished then immediately
//   // re-published on every click, so participants never got a stable
//   // subscription (visible in webhook log: "unpublishing" then
//   // "publishing" on the same click).
//   const isCurrentlySharing = localParticipant?.isScreenShareEnabled ?? false;

//   const toggleScreen = async () => {
//     try {
//       setScreenShareError("");
//       await localParticipant?.setScreenShareEnabled(!isCurrentlySharing);
//       // No need to call setScreenSharing() — we derive from LiveKit directly
//     } catch (err) {
//       if (err?.name === "NotAllowedError" || err?.message?.includes("Permission denied")) {
//         setScreenShareError("Screen share permission denied by browser.");
//       } else if (err?.name === "AbortError" || err?.message?.toLowerCase().includes("cancel")) {
//         setScreenShareError("");
//       } else {
//         setScreenShareError(err?.message || "Screen share failed — check browser permissions.");
//         console.error("Screen share error:", err);
//       }
//     }
//   };

//   const toggleRecording = async () => {
//     try {
//       recording ? await stopRecording(sessionId) : await startRecording(sessionId);
//       setRecording(!recording);
//     } catch (err) { console.error(err); }
//   };

//   const handleReaction = async (emoji) => {
//     setReactionPickerOpen(false);
//     const identity = localParticipant?.identity;
//     const fullName = getMetadata(localParticipant).fullName || identity;

//     // Notify RoomInner to show locally immediately (sender doesn't
//     // receive own data-channel messages, so we add it here via callback)
//     onReact?.({ identity, fullName, emoji });

//     try {
//       const payload = new TextEncoder().encode(JSON.stringify({
//         type: MSG.REACTION, identity, fullName, emoji,
//       }));
//       // reliable: true — was false, causing drops under load
//       await room?.localParticipant?.publishData(payload, { reliable: true });
//       await sendSessionReaction(sessionId, emoji);
//     } catch (err) { console.error(err); }
//   };

//   const CtrlBtn = ({ title, onClick, active, activeColor = GREEN, danger, children }) => (
//     <Tooltip title={title}>
//       <IconButton onClick={onClick} sx={{
//         width: 48, height: 48, borderRadius: 2.5,
//         bgcolor: danger ? "rgba(239,68,68,0.15)" : active ? `${activeColor}22` : "rgba(255,255,255,0.06)",
//         color:   danger ? "#ef4444"              : active ? activeColor        : MUTED_D,
//         "&:hover": { bgcolor: danger ? "rgba(239,68,68,0.28)" : `${activeColor}33` },
//         transition: "all 0.15s",
//       }}>
//         {children}
//       </IconButton>
//     </Tooltip>
//   );

//   return (
//     <Box sx={{
//       position: "relative",
//       bgcolor: DARK2, borderTop: "1px solid rgba(255,255,255,0.06)",
//       px: 3, py: 1.5, display: "flex", alignItems: "center",
//       justifyContent: "center", gap: 1, flexWrap: "wrap",
//     }}>
//       {/* Screen share error toast */}
//       {screenShareError && (
//         <Box sx={{
//           position: "absolute", bottom: "calc(100% + 8px)", left: "50%",
//           transform: "translateX(-50%)", bgcolor: "#ef4444", color: "#fff",
//           borderRadius: 2, px: 2, py: 0.75, fontSize: 13, fontWeight: 600,
//           whiteSpace: "nowrap", zIndex: 10,
//         }}>
//           {screenShareError}
//           <IconButton size="small" onClick={() => setScreenShareError("")}
//             sx={{ color: "#fff", ml: 1, p: 0.25 }}>
//             <Close sx={{ fontSize: 14 }} />
//           </IconButton>
//         </Box>
//       )}

//       <Box sx={{ display: "flex", gap: 1 }}>
//         <CtrlBtn title={micOn ? "Mute" : "Unmute"} onClick={toggleMic} active={micOn}>
//           {micOn ? <Mic /> : <MicOff />}
//         </CtrlBtn>
//         <CtrlBtn title={camOn ? "Camera off" : "Camera on"} onClick={toggleCam} active={camOn}>
//           {camOn ? <Videocam /> : <VideocamOff />}
//         </CtrlBtn>
//         <CtrlBtn title={isCurrentlySharing ? "Stop sharing" : "Share screen"}
//           onClick={toggleScreen} active={isCurrentlySharing} activeColor={GOLD}>
//           {isCurrentlySharing ? <StopScreenShare /> : <ScreenShare />}
//         </CtrlBtn>
//       </Box>

//       <Box sx={{ width: 1, height: 36, bgcolor: "rgba(255,255,255,0.08)", mx: 0.5 }} />

//       <Box sx={{ display: "flex", gap: 1 }}>
//         <CtrlBtn title={handRaised ? "Lower hand" : "Raise hand"}
//           onClick={onToggleHand} active={handRaised} activeColor={GOLD}>
//           <PanTool />
//         </CtrlBtn>

//         {/* Chat button with unread badge */}
//         <Tooltip title="Chat">
//           <Badge badgeContent={chatUnread} color="error" max={99}>
//             <IconButton onClick={onChat}
//               sx={{
//                 width: 48, height: 48, borderRadius: 2.5,
//                 bgcolor: chatUnread > 0 ? `${GREEN}22` : "rgba(255,255,255,0.06)",
//                 color:   chatUnread > 0 ? GREEN : MUTED_D,
//                 animation: chatUnread > 0 ? "chatPulse 1.5s infinite" : "none",
//                 "@keyframes chatPulse": {
//                   "0%,100%": { boxShadow: `0 0 0 0 ${GREEN}55` },
//                   "50%":     { boxShadow: `0 0 0 6px ${GREEN}00` },
//                 },
//                 "&:hover": { bgcolor: "rgba(255,255,255,0.12)" },
//               }}>
//               <Chat />
//             </IconButton>
//           </Badge>
//         </Tooltip>

//         <CtrlBtn title="Reactions"
//           onClick={() => setReactionPickerOpen((o) => !o)}
//           active={reactionPickerOpen} activeColor="#7C3AED">
//           <EmojiEmotions />
//         </CtrlBtn>

//         <Tooltip title="Whiteboard">
//           <IconButton onClick={onWhiteboard}
//             sx={{ width: 48, height: 48, borderRadius: 2.5,
//                   bgcolor: "rgba(255,255,255,0.06)", color: MUTED_D,
//                   "&:hover": { bgcolor: "rgba(255,255,255,0.12)" } }}>
//             <Draw />
//           </IconButton>
//         </Tooltip>

//         <Tooltip title="Participants">
//           <Badge badgeContent={participantCount} color="primary" max={99}>
//             <IconButton onClick={onParticipants}
//               sx={{ width: 48, height: 48, borderRadius: 2.5,
//                     bgcolor: "rgba(255,255,255,0.06)", color: MUTED_D,
//                     "&:hover": { bgcolor: "rgba(255,255,255,0.12)" } }}>
//               <PeopleAlt />
//             </IconButton>
//           </Badge>
//         </Tooltip>

//         {role === "host" && (
//           <Tooltip title="Waiting room">
//             <Badge badgeContent={waitingCount} color="error" max={99}>
//               <IconButton onClick={onAdmitPanel}
//                 sx={{
//                   width: 48, height: 48, borderRadius: 2.5,
//                   bgcolor: waitingCount > 0 ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.06)",
//                   color:   waitingCount > 0 ? "#ef4444"               : MUTED_D,
//                   animation: waitingCount > 0 ? "pulse 1.5s infinite" : "none",
//                   "@keyframes pulse": {
//                     "0%,100%": { boxShadow: "0 0 0 0 rgba(239,68,68,0.4)" },
//                     "50%":     { boxShadow: "0 0 0 8px rgba(239,68,68,0)" },
//                   },
//                   "&:hover": { bgcolor: "rgba(239,68,68,0.25)" },
//                 }}>
//                 <PersonAdd />
//               </IconButton>
//             </Badge>
//           </Tooltip>
//         )}
//       </Box>

//       <Box sx={{ width: 1, height: 36, bgcolor: "rgba(255,255,255,0.08)", mx: 0.5 }} />

//       <Box sx={{ display: "flex", gap: 1 }}>
//         {role === "host" && (
//           <CtrlBtn title={recording ? "Stop recording" : "Record"}
//             onClick={toggleRecording} active={recording} activeColor="#ef4444">
//             {recording ? <StopCircle /> : <FiberManualRecord />}
//           </CtrlBtn>
//         )}
//         <Tooltip title="Leave">
//           <Button onClick={onLeave} variant="contained"
//             sx={{ bgcolor: "#ef4444", color: "#fff", borderRadius: 2.5, px: 2.5,
//                   fontWeight: 700, textTransform: "none",
//                   "&:hover": { bgcolor: "#dc2626" }, gap: 1 }}>
//             <CallEnd sx={{ fontSize: 18 }} /> Leave
//           </Button>
//         </Tooltip>
//       </Box>

//       {/* Reaction picker — self-positioned, no Popover */}
//       {reactionPickerOpen && (
//         <>
//           <Box onClick={() => setReactionPickerOpen(false)}
//             sx={{ position: "fixed", inset: 0, zIndex: 1200 }} />
//           <Box sx={{
//             position: "absolute", bottom: "calc(100% + 12px)", left: "50%",
//             transform: "translateX(-50%)", bgcolor: DARK2,
//             border: "1px solid rgba(255,255,255,0.1)", borderRadius: 3, p: 1,
//             display: "flex", gap: 0.5, zIndex: 1201, boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
//           }}>
//             {REACTIONS.map((emoji) => (
//               <IconButton key={emoji} onClick={() => handleReaction(emoji)}
//                 sx={{ fontSize: 22, "&:hover": { bgcolor: "rgba(255,255,255,0.1)" } }}>
//                 {emoji}
//               </IconButton>
//             ))}
//           </Box>
//         </>
//       )}
//     </Box>
//   );
// };

// // ─── LobbyScreen ──────────────────────────────────────────────
// const LobbyScreen = ({ currentUser, onLeave }) => (
//   <Box sx={{ height: "100vh", bgcolor: DARK, display: "flex", flexDirection: "column",
//              alignItems: "center", justifyContent: "center", gap: 3, px: 3 }}>
//     <Box sx={{
//       width: 80, height: 80, borderRadius: "50%", bgcolor: `${GOLD}22`,
//       display: "flex", alignItems: "center", justifyContent: "center",
//       animation: "glow 2s ease-in-out infinite",
//       "@keyframes glow": {
//         "0%,100%": { boxShadow: `0 0 0 0 ${GOLD}55` },
//         "50%":     { boxShadow: `0 0 0 16px ${GOLD}00` },
//       },
//     }}>
//       <HourglassTop sx={{ fontSize: 38, color: GOLD }} />
//     </Box>
//     <Avatar src={currentUser?.profilePicUrl || undefined}
//       sx={{ width: 72, height: 72, bgcolor: avatarColor(currentUser?.fullName || ""),
//             fontSize: 26, fontWeight: 800, border: `3px solid ${GOLD}` }}>
//       {!currentUser?.profilePicUrl && getInitials(currentUser?.fullName || "")}
//     </Avatar>
//     <Box sx={{ textAlign: "center" }}>
//       <Typography sx={{ color: TEXT, fontSize: 22, fontWeight: 800, mb: 0.75 }}>
//         Waiting to be admitted
//       </Typography>
//       <Typography sx={{ color: MUTED_D, fontSize: 15 }}>
//         {currentUser?.fullName}, please wait while the host lets you in.
//       </Typography>
//       <Typography sx={{ color: MUTED_D, fontSize: 13, mt: 0.75 }}>
//         You'll join automatically once admitted.
//       </Typography>
//     </Box>
//     <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 1 }}>
//       <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: GREEN,
//                  animation: "pulse 1.5s infinite",
//                  "@keyframes pulse": { "0%,100%": { opacity: 1 }, "50%": { opacity: 0.3 } } }} />
//       <Typography sx={{ color: GREEN, fontSize: 14, fontWeight: 700 }}>
//         Connected — host will admit you shortly
//       </Typography>
//     </Box>
//     <Button variant="outlined" onClick={onLeave}
//       sx={{ borderColor: "rgba(255,255,255,0.3)", color: MUTED_D, textTransform: "none",
//             borderRadius: 2.5, mt: 1, "&:hover": { borderColor: "#ef4444", color: "#ef4444" } }}>
//       Leave waiting room
//     </Button>
//   </Box>
// );

// // ─── GuestGate ────────────────────────────────────────────────
// const GuestGate = ({ onSubmit, loading, error }) => {
//   const [name, setName] = useState("");
//   return (
//     <Box sx={{ height: "100vh", bgcolor: DARK, display: "flex", flexDirection: "column",
//                alignItems: "center", justifyContent: "center", gap: 3, px: 3 }}>
//       <Box sx={{ width: 72, height: 72, borderRadius: "50%", bgcolor: `${GREEN}22`,
//                  display: "flex", alignItems: "center", justifyContent: "center" }}>
//         <Videocam sx={{ fontSize: 32, color: GREEN }} />
//       </Box>
//       <Box sx={{ textAlign: "center" }}>
//         <Typography sx={{ color: TEXT, fontSize: 22, fontWeight: 800, mb: 0.75 }}>Join this meeting</Typography>
//         <Typography sx={{ color: MUTED_D, fontSize: 14 }}>Enter your name — no account needed.</Typography>
//       </Box>
//       <Box component="form" onSubmit={(e) => { e.preventDefault(); if (name.trim()) onSubmit(name.trim()); }}
//         sx={{ width: "100%", maxWidth: 360 }}>
//         <Box component="input" autoFocus placeholder="Your name" value={name}
//           onChange={(e) => setName(e.target.value)} maxLength={80}
//           sx={{ width: "100%", height: 48, borderRadius: 2.5, px: 2, bgcolor: DARK2,
//                 border: `1px solid ${DARK3}`, color: TEXT, fontSize: 15, outline: "none",
//                 mb: 2, "&:focus": { borderColor: GREEN } }} />
//         {error && (
//           <Typography sx={{ color: "#ef4444", fontSize: 13, mb: 2, textAlign: "center" }}>{error}</Typography>
//         )}
//         <Button type="submit" fullWidth variant="contained"
//           disabled={loading || !name.trim()}
//           sx={{ bgcolor: GREEN, color: "#fff", textTransform: "none", fontWeight: 700,
//                 borderRadius: 2.5, py: 1.25, "&:hover": { bgcolor: "#166d3e" } }}>
//           {loading ? <CircularProgress size={20} color="inherit" /> : "Ask to Join"}
//         </Button>
//       </Box>
//       <Typography sx={{ color: MUTED_D, fontSize: 12 }}>
//         Have an account?{" "}
//         <Box component="span" sx={{ color: GREEN, cursor: "pointer", fontWeight: 700 }}
//           onClick={() => window.location.assign("/login")}>Log in</Box>{" "}instead
//       </Typography>
//     </Box>
//   );
// };

// // ─── RoomInner ────────────────────────────────────────────────
// const RoomInner = ({
//   role, sessionId, navigate, currentUser, phase,
//   onRequestTokenSwap, guestId,
// }) => {
//   const participants         = useParticipants();
//   const { localParticipant } = useLocalParticipant();
//   const room                 = useRoomContext();

//   const [whiteboardOpen,   setWhiteboardOpen]   = useState(false);
//   const [participantsOpen, setParticipantsOpen] = useState(false);
//   const [admitPanelOpen,   setAdmitPanelOpen]   = useState(false);
//   const [chatOpen,         setChatOpen]          = useState(false);
//   const [messages,         setMessages]          = useState([]);
//   const [unreadCount,      setUnreadCount]       = useState(0);
//   const [waitingCount,     setWaitingCount]      = useState(0);
//   const [joinRequestTick,  setJoinRequestTick]   = useState(0);
//   const [toast,            setToast]             = useState(null);
//   const [upgrading,        setUpgrading]         = useState(false);

//   const [raisedHands, setRaisedHands]         = useState({});
//   const [reactions,   setReactions]           = useState({});
//   const [myHandRaised, setMyHandRaised]       = useState(false);
//   const [whiteboardStroke, setWhiteboardStroke] = useState(null);
//   const [whiteboardClearTick, setWhiteboardClearTick] = useState(0);

//   const strokeLogRef   = useRef([]);
//   const reactionTimers = useRef({});
//   const myIdentityRef  = useRef(localParticipant?.identity);

//   useEffect(() => { myIdentityRef.current = localParticipant?.identity; }, [localParticipant?.identity]);

//   const totalParticipants = (localParticipant ? 1 : 0) + participants.length;
//   const isHost = role === "host";

//   // ── BUG 2 FIX: use leaveDestination() for correct role-based nav ──
//   const handleLeave = async () => {
//     try { await leaveAttendance(sessionId); } catch { /* ignore */ }
//     navigate(leaveDestination(role));
//   };

//   useEffect(() => {
//     if (role !== "host") return;
//     const poll = async () => {
//       try {
//         const res = await getWaitingRoom(sessionId);
//         setWaitingCount((res.waiting || []).length);
//       } catch { /* silent */ }
//     };
//     poll();
//     const id = setInterval(poll, 5000);
//     return () => clearInterval(id);
//   }, [role, sessionId]);

//   // ── Lobby poll — branches on guest vs. registered ──
//   useEffect(() => {
//     if (phase !== "lobby" || role === "host") return;
//     const poll = async () => {
//       if (upgrading) return;
//       try {
//         const res = guestId
//           ? await guestGetParticipantToken(sessionId, guestId)
//           : await getParticipantToken(sessionId);
//         if (res?.token) {
//           setUpgrading(true);
//           onRequestTokenSwap(res.token, res.serverUrl);
//         }
//       } catch { /* 403 = still waiting */ }
//     };
//     const id = setInterval(poll, 3000);
//     return () => clearInterval(id);
//   }, [phase, role, sessionId, upgrading, onRequestTokenSwap, guestId]);

//   const broadcast = useCallback(async (msg, reliable = true) => {
//     try {
//       const payload = new TextEncoder().encode(JSON.stringify(msg));
//       await room?.localParticipant?.publishData(payload, { reliable });
//     } catch (err) { console.error("broadcast failed:", err); }
//   }, [room]);

//   const handleToggleHand = useCallback(async () => {
//     const next = !myHandRaised;
//     setMyHandRaised(next);
//     setRaisedHands((prev) => { const n = { ...prev }; if (next) n[myIdentityRef.current] = true; else delete n[myIdentityRef.current]; return n; });
//     await broadcast({ type: MSG.RAISE_HAND, identity: myIdentityRef.current, fullName: getMetadata(localParticipant).fullName, raised: next });
//     try { await raiseHand(sessionId); } catch { /* best effort */ }
//   }, [myHandRaised, broadcast, localParticipant, sessionId]);

//   // ── Chat handlers ──
//   const handleOpenChat = useCallback(() => {
//     setChatOpen(true);
//     setUnreadCount(0);
//   }, []);

//   const handleSendChat = useCallback(async (text) => {
//     const meta = getMetadata(localParticipant);
//     const msg = {
//       id:            `${localParticipant?.identity}-${Date.now()}`,
//       type:          MSG.CHAT_MESSAGE,
//       identity:      localParticipant?.identity,
//       fullName:      meta.fullName || localParticipant?.identity,
//       profilePicUrl: meta.profilePicUrl || "",
//       isHost:        meta.role === "host",
//       text,
//       timestamp:     Date.now(),
//     };
//     // Add to own list immediately (sender doesn't receive own data channel messages)
//     setMessages((prev) => [...prev, msg]);
//     // Broadcast to everyone else
//     await broadcast(msg, true);
//   }, [localParticipant, broadcast]);

//   // ── Local reaction handler — called by ControlBar so the sender
//   //    sees their own reaction bubble immediately, since the data
//   //    channel never echoes back to the sender. ──
//   const handleLocalReaction = useCallback(({ identity, fullName, emoji }) => {
//     setReactions((prev) => ({ ...prev, [identity]: { emoji, fullName } }));
//     clearTimeout(reactionTimers.current[identity]);
//     reactionTimers.current[identity] = setTimeout(() => {
//       setReactions((prev) => { const n = { ...prev }; delete n[identity]; return n; });
//     }, 2500);
//   }, []);

//   const handleOpenWhiteboard = useCallback(async () => {
//     setWhiteboardOpen(true);
//     if (isHost) {
//       strokeLogRef.current = [];
//       await broadcast({ type: MSG.WHITEBOARD_OPEN });
//     }
//   }, [isHost, broadcast]);

//   const handleCloseWhiteboard = useCallback(async () => {
//     setWhiteboardOpen(false);
//     if (isHost) await broadcast({ type: MSG.WHITEBOARD_CLOSE });
//   }, [isHost, broadcast]);

//   // BUG 1 FIX: reliable: true for stroke data (was false, causing
//   // drops/reordering under fast drawing = broken lines on participants)
//   const handleLocalStroke = useCallback((stroke) => {
//     strokeLogRef.current.push(stroke);
//     broadcast({ type: MSG.WHITEBOARD_STROKE, stroke }, true); // ← reliable: true
//   }, [broadcast]);

//   const handleLocalClear = useCallback(() => {
//     strokeLogRef.current = [];
//     broadcast({ type: MSG.WHITEBOARD_CLEAR });
//   }, [broadcast]);

//   const handleRequestSync = useCallback(() => {
//     if (isHost) return;
//     broadcast({ type: MSG.WHITEBOARD_SYNC, requesterIdentity: myIdentityRef.current });
//   }, [isHost, broadcast]);

//   // ── Data channel handler ──
//   useEffect(() => {
//     if (!room) return;

//     const handleData = async (payload) => {
//       const data = decodeMsg(payload);
//       if (!data) return;

//       if (data.type === MSG.JOIN_REQUEST && role === "host") {
//         setWaitingCount((c) => c + 1);
//         setJoinRequestTick((t) => t + 1);
//         setAdmitPanelOpen(true);
//         setToast({ msg: `✋ ${data.fullName || "Someone"} is waiting to join`, severity: "info" });
//         return;
//       }

//       if (data.type === MSG.ADMITTED && phase === "lobby") {
//         const myId = myIdentityRef.current;
//         if (data.identity && data.identity !== myId) return;
//         if (upgrading) return;
//         setUpgrading(true);
//         try {
//           const res = guestId
//             ? await guestGetParticipantToken(sessionId, guestId)
//             : await getParticipantToken(sessionId);
//           onRequestTokenSwap(res.token, res.serverUrl);
//           setToast({ msg: "You've been admitted! 🎉", severity: "success" });
//         } catch (err) {
//           console.error("Token upgrade:", err);
//           setUpgrading(false);
//           setToast({ msg: "Admission error — retrying shortly.", severity: "warning" });
//         }
//         return;
//       }

//       if (data.type === MSG.DENIED && phase === "lobby") {
//         const myId = myIdentityRef.current;
//         if (data.identity && data.identity !== myId) return;
//         setToast({ msg: `Your request to join was declined.${data.reason ? ` Reason: ${data.reason}` : ""}`, severity: "error" });
//         setTimeout(() => navigate(leaveDestination(role)), 3500);
//         return;
//       }

//       if (data.type === MSG.RAISE_HAND) {
//         setRaisedHands((prev) => { const n = { ...prev }; if (data.raised) n[data.identity] = true; else delete n[data.identity]; return n; });
//         if (data.raised) setToast({ msg: `✋ ${data.fullName || "Someone"} raised their hand`, severity: "info" });
//         return;
//       }

//       if (data.type === MSG.REACTION) {
//         const id = data.identity; if (!id) return;
//         setReactions((prev) => ({ ...prev, [id]: { emoji: data.emoji, fullName: data.fullName } }));
//         clearTimeout(reactionTimers.current[id]);
//         reactionTimers.current[id] = setTimeout(() => {
//           setReactions((prev) => { const n = { ...prev }; delete n[id]; return n; });
//         }, 2500);
//         return;
//       }

//       // ── CHAT MESSAGE ──
//       if (data.type === MSG.CHAT_MESSAGE) {
//         // Ignore echoes from ourselves
//         if (data.identity === myIdentityRef.current) return;
//         setMessages((prev) => [...prev, data]);
//         // Pulse the badge if the drawer is closed
//         setChatOpen((isOpen) => {
//           if (!isOpen) setUnreadCount((c) => c + 1);
//           return isOpen;
//         });
//         return;
//       }

//       if (data.type === MSG.WHITEBOARD_OPEN)  { setWhiteboardOpen(true);  if (!isHost) setToast({ msg: "Host opened the whiteboard", severity: "info" }); return; }
//       if (data.type === MSG.WHITEBOARD_CLOSE) { setWhiteboardOpen(false); return; }
//       if (data.type === MSG.WHITEBOARD_STROKE && !isHost) { setWhiteboardStroke(data.stroke); return; }
//       if (data.type === MSG.WHITEBOARD_CLEAR  && !isHost) { setWhiteboardClearTick((t) => t + 1); return; }
//       if (data.type === MSG.WHITEBOARD_SYNC   && isHost)  {
//         for (const stroke of strokeLogRef.current) {
//           await broadcast({ type: MSG.WHITEBOARD_STROKE, stroke }, true);
//         }
//         return;
//       }
//     };

//     room.on("dataReceived", handleData);
//     return () => { room.off("dataReceived", handleData); };
//   }, [room, role, phase, sessionId, navigate, upgrading, onRequestTokenSwap, isHost, broadcast, guestId]);

//   const handleAdmit = async (id) => {
//     try {
//       await admitParticipant(sessionId, id);
//       setWaitingCount((c) => Math.max(0, c - 1));
//       setToast({ msg: "Participant admitted ✓", severity: "success" });
//     } catch (err) { console.error(err); setToast({ msg: "Failed to admit participant", severity: "error" }); }
//   };
//   const handleDeny = async (id) => {
//     try { await denyParticipant(sessionId, id); setWaitingCount((c) => Math.max(0, c - 1)); }
//     catch (err) { console.error(err); }
//   };

//   if (phase === "lobby") {
//     return (
//       <>
//         <RoomAudioRenderer />
//         <LobbyScreen currentUser={currentUser} onLeave={handleLeave} />
//         {upgrading && (
//           <Box sx={{ position: "fixed", inset: 0, bgcolor: "rgba(0,0,0,0.75)", display: "flex",
//                      flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, zIndex: 9999 }}>
//             <CircularProgress sx={{ color: GREEN }} size={48} />
//             <Typography sx={{ color: TEXT, fontWeight: 700, fontSize: 18 }}>Joining the class…</Typography>
//           </Box>
//         )}
//         <Snackbar open={!!toast} autoHideDuration={5000} onClose={() => setToast(null)}
//           anchorOrigin={{ vertical: "top", horizontal: "center" }}>
//           <Alert severity={toast?.severity || "info"} onClose={() => setToast(null)}>{toast?.msg}</Alert>
//         </Snackbar>
//       </>
//     );
//   }

//   return (
//     <Box sx={{ display: "flex", flexDirection: "column", height: "100vh", bgcolor: DARK, overflow: "hidden" }}>
//       {/* TOP BAR */}
//       <Box sx={{ bgcolor: DARK2, borderBottom: "1px solid rgba(255,255,255,0.06)",
//                  px: 3, py: 1.25, display: "flex", alignItems: "center", gap: 2 }}>
//         <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
//           <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: GREEN,
//                      boxShadow: `0 0 0 3px ${GREEN}44`, animation: "pulse 2s infinite",
//                      "@keyframes pulse": { "0%,100%": { opacity: 1 }, "50%": { opacity: 0.4 } } }} />
//           <Typography sx={{ color: TEXT, fontWeight: 800, fontSize: 15 }}>GIEVA Live</Typography>
//         </Box>
//         <Chip label="LIVE" size="small" sx={{ bgcolor: "#ef444433", color: "#ef4444", fontWeight: 800, fontSize: 11 }} />
//         <Box flex={1} />
//         {waitingCount > 0 && role === "host" && (
//           <Chip icon={<PersonAdd sx={{ fontSize: 14 }} />} label={`${waitingCount} waiting`}
//             onClick={() => setAdmitPanelOpen(true)} size="small"
//             sx={{ bgcolor: "rgba(239,68,68,0.18)", color: "#fca5a5", fontWeight: 800,
//                   border: "1px solid rgba(239,68,68,0.35)", cursor: "pointer",
//                   "& .MuiChip-icon": { color: "#f87171" } }} />
//         )}
//         <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
//           <Avatar src={currentUser?.profilePicUrl || undefined}
//             sx={{ width: 30, height: 30, bgcolor: avatarColor(currentUser?.fullName || ""), fontSize: 12 }}>
//             {!currentUser?.profilePicUrl && getInitials(currentUser?.fullName || "")}
//           </Avatar>
//           <Typography sx={{ fontSize: 13, color: MUTED_D }}>{currentUser?.fullName}</Typography>
//           {role === "host" && (
//             <Chip label="Host" size="small" sx={{ bgcolor: GOLD, color: NAVY, fontWeight: 800, height: 20, fontSize: 11 }} />
//           )}
//         </Box>
//       </Box>

//       <ParticipantGrid raisedHands={raisedHands} reactions={reactions} />
//       <RoomAudioRenderer />

//       <ControlBar
//         role={role} sessionId={sessionId} onLeave={handleLeave}
//         onWhiteboard={handleOpenWhiteboard} onParticipants={() => setParticipantsOpen(true)}
//         onAdmitPanel={() => setAdmitPanelOpen(true)}
//         onChat={handleOpenChat} chatUnread={unreadCount}
//         onReact={handleLocalReaction}
//         participantCount={totalParticipants} waitingCount={waitingCount}
//         handRaised={myHandRaised} onToggleHand={handleToggleHand}
//       />

//       <WhiteboardDrawer
//         open={whiteboardOpen} onClose={handleCloseWhiteboard} isHost={isHost}
//         onLocalStroke={handleLocalStroke} onLocalClear={handleLocalClear}
//         remoteStroke={whiteboardStroke} remoteClear={whiteboardClearTick}
//         syncStrokes={handleRequestSync}
//       />
//       <ParticipantsDrawer open={participantsOpen} onClose={() => setParticipantsOpen(false)} />
//       <ChatDrawer
//         open={chatOpen}
//         onClose={() => setChatOpen(false)}
//         messages={messages}
//         onSend={handleSendChat}
//         currentUser={{ ...currentUser, identity: localParticipant?.identity }}
//       />
//       <AdmitPanel open={admitPanelOpen} onClose={() => setAdmitPanelOpen(false)}
//         sessionId={sessionId} onAdmit={handleAdmit} onDeny={handleDeny}
//         triggerRefresh={joinRequestTick} />

//       <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)}
//         anchorOrigin={{ vertical: "top", horizontal: "center" }}>
//         <Alert severity={toast?.severity || "info"} onClose={() => setToast(null)}>{toast?.msg}</Alert>
//       </Snackbar>
//     </Box>
//   );
// };

// // ─── Main Export ──────────────────────────────────────────────
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

//   const isPublicRoom = roomName?.startsWith("public-");
//   const hasAuthToken = !!localStorage.getItem("token");

//   const [guestId, setGuestId] = useState(() => sessionStorage.getItem(`guestId:${sessionId}`));
//   const [needsGuestGate, setNeedsGuestGate] = useState(false);
//   const [guestGateLoading, setGuestGateLoading] = useState(false);
//   const [guestGateError, setGuestGateError] = useState("");

//   const isHostRole = role === "tutor" || role === "host";

//   useEffect(() => {
//     if (!hasAuthToken) {
//       if (isPublicRoom) { setNeedsGuestGate(true); setLoading(false); return; }
//       navigate("/login", { replace: true });
//       return;
//     }
//     loadClass();
//     return () => { leaveAttendance(sessionId).catch(() => {}); };
//   }, [sessionId]);

//   const loadClass = async () => {
//     try {
//       setLoading(true);
//       let response;
//       if (isHostRole && isPublicRoom)  response = await joinPublicMeetingAsHost(sessionId);
//       else if (isHostRole)             response = await joinTutorSession(sessionId);
//       else                             response = await joinClassSession(sessionId);

//       setToken(response.token);
//       setServerUrl(response.serverUrl);
//       setPhase(response.phase || (isHostRole ? "live" : "lobby"));
//       setCurrentUser(response.currentUser || null);
//     } catch (err) {
//       console.error(err);
//       setError(err?.response?.data?.message || "Failed to join class");
//     } finally { setLoading(false); }
//   };

//   const handleGuestSubmit = async (displayName) => {
//     try {
//       setGuestGateLoading(true);
//       setGuestGateError("");
//       const response = await guestJoinPublicMeeting(sessionId, displayName);
//       sessionStorage.setItem(`guestId:${sessionId}`, response.guestId);
//       setGuestId(response.guestId);
//       setToken(response.token);
//       setServerUrl(response.serverUrl);
//       setPhase(response.phase || "lobby");
//       setCurrentUser(response.currentUser || null);
//       setNeedsGuestGate(false);
//     } catch (err) {
//       console.error(err);
//       setGuestGateError(err?.response?.data?.message || "Failed to join — please try again");
//     } finally { setGuestGateLoading(false); }
//   };

//   const handleTokenSwap = useCallback((newToken, newServerUrl) => {
//     setToken(newToken);
//     if (newServerUrl) setServerUrl(newServerUrl);
//     setPhase("live");
//   }, []);

//   if (needsGuestGate) return <GuestGate onSubmit={handleGuestSubmit} loading={guestGateLoading} error={guestGateError} />;

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
//         <Typography sx={{ color: "#ef4444", fontWeight: 700, fontSize: 18, textAlign: "center" }}>{error}</Typography>
//         <Button variant="outlined"
//           onClick={() => navigate(role === "tutor" ? "/tutor/live-classes" : "/student/live-classes")}
//           sx={{ borderColor: MUTED_D, color: MUTED_D, textTransform: "none", borderRadius: 2 }}>
//           Go back
//         </Button>
//       </Box>
//     );
//   }

//   return (
//     // BUG 4 FIX: add options prop with screenShareEncoding so the
//     // LiveKit room is configured to accept screen share tracks.
//     <LiveKitRoom
//       key={token}
//       token={token}
//       serverUrl={serverUrl}
//       connect
//       audio={phase === "live"}
//       video={phase === "live"}
//       options={{
//         publishDefaults: {
//           screenShareEncoding: {
//             maxBitrate: 1_500_000,
//             maxFramerate: 15,
//           },
//         },
//       }}
//       onDisconnected={() => navigate(leaveDestination(role === "tutor" ? "host" : role))}
//     >
//       <RoomInner
//         role={role === "tutor" ? "host" : role}
//         sessionId={sessionId}
//         navigate={navigate}
//         currentUser={currentUser}
//         phase={phase}
//         onRequestTokenSwap={handleTokenSwap}
//         guestId={guestId}
//       />
//     </LiveKitRoom>
//   );
// }
