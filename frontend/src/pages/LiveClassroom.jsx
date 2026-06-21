// pages/LiveClassroom.jsx
//
// ROOT CAUSE FIXES:
//  1. room.connect() does NOT exist in LiveKit v2 — you cannot swap tokens
//     on a live Room instance. Fix: lift token + phase state up to the
//     LiveKitRoom level. When ADMITTED arrives, we fetch a new token and
//     set it on the parent, which remounts <LiveKitRoom> with the correct
//     participant-level token. This is the ONLY reliable way.
//
//  2. sendData destination — admitParticipant() on the backend calls
//     roomService.sendData(roomName, payload, 0) which broadcasts to ALL
//     participants. The student must filter on their own identity.
//     We now compare data.userId (Number) vs req.user.id consistently.
//
//  3. Backend admitParticipant sends:
//       { type: "ADMITTED", userId: "user-3", identity: "user-3" }
//     But the student's localParticipant.identity is also "user-3".
//     We now match on BOTH userId (numeric) and identity (string).
//
//  4. Lobby participants (role === "lobby") are filtered out of the
//     video grid but correctly shown in the Participants drawer.
//
//  5. Poll-based fallback: student polls /participant-token every 3s
//     while in lobby. If the DB shows admitted=true, it upgrades even
//     if the data message was lost.

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
  HourglassTop, PersonAdd,
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

// ─── Participant Tile ─────────────────────────────────────────
const ParticipantTile = ({ participant, isLocal = false, isLarge = false }) => {
  const meta   = getMetadata(participant);
  const name   = meta.fullName || participant.identity;
  const pic    = meta.profilePicUrl;
  const isHost = meta.role === "host";

  const tracks   = useTracks(
    [{ source: Track.Source.Camera, withPlaceholder: true }],
    { participant }
  );
  const camTrack = tracks.find((t) => t.source === Track.Source.Camera);
  const hasCam   = camTrack && !camTrack.isMuted && camTrack.publication;

  return (
    <Box sx={{
      width: "100%", aspectRatio: isLarge ? undefined : "16/9",
      minHeight: isLarge ? 340 : undefined, height: isLarge ? "100%" : undefined,
      position: "relative", borderRadius: 3, overflow: "hidden",
      bgcolor: DARK2, border: `1px solid ${DARK3}`,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      {hasCam ? (
        <Box sx={{ position: "absolute", inset: 0 }}>
          <VideoTrack trackRef={camTrack} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </Box>
      ) : (
        <Avatar src={pic || undefined}
          sx={{ width: isLarge ? 120 : 68, height: isLarge ? 120 : 68,
                fontSize: isLarge ? 44 : 26, fontWeight: 800,
                bgcolor: avatarColor(name), border: "3px solid rgba(255,255,255,0.13)" }}>
          {!pic && getInitials(name)}
        </Avatar>
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

// ─── Participant Grid — lobby users EXCLUDED from video grid ──
const ParticipantGrid = () => {
  const participants         = useParticipants();
  const { localParticipant } = useLocalParticipant();

  const isAdmitted = (p) => getMetadata(p).role !== "lobby";

  const all = [
    localParticipant,
    ...participants.filter((p) => p.identity !== localParticipant?.identity),
  ].filter(Boolean).filter(isAdmitted);

  const count = all.length;
  const cols  = count === 1 ? 1 : count <= 4 ? 2 : count <= 9 ? 3 : 4;

  return (
    <Box sx={{
      flex: 1, display: "grid",
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gap: 1.5, p: 2, alignContent: "start", overflowY: "auto",
    }}>
      {all.map((p) => (
        <ParticipantTile key={p.identity} participant={p}
          isLocal={p.identity === localParticipant?.identity}
          isLarge={count === 1} />
      ))}
    </Box>
  );
};

// ─── Whiteboard ───────────────────────────────────────────────
const WhiteboardDrawer = ({ open, onClose }) => {
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

  const startDraw = useCallback((e) => {
    e.preventDefault();
    const canvas = canvasRef.current; if (!canvas) return;
    isDrawing.current = true;
    lastPos.current   = getPos(e, canvas);
  }, []);

  const draw = useCallback((e) => {
    e.preventDefault();
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext("2d");
    const pos    = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = tool === "eraser" ? "#ffffff" : color;
    ctx.lineWidth   = tool === "eraser" ? thickness * 5 : thickness;
    ctx.lineCap     = "round"; ctx.lineJoin = "round";
    ctx.stroke();
    lastPos.current = pos;
  }, [tool, color, thickness]);

  const stopDraw = useCallback(() => { isDrawing.current = false; }, []);

  const clearCanvas = () => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx    = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  useEffect(() => {
    if (!open) return;
    setTimeout(() => {
      const canvas = canvasRef.current; if (!canvas) return;
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      clearCanvas();
    }, 120);
  }, [open]);

  return (
    <Drawer anchor="right" open={open} onClose={onClose}
      PaperProps={{ sx: { width: { xs: "100vw", md: 700 }, bgcolor: "#f8fafc", display: "flex", flexDirection: "column" } }}>
      <Box sx={{ p: 1.5, bgcolor: DARK, display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
        <Typography sx={{ color: TEXT, fontWeight: 800, fontSize: 15, mr: 1 }}>Whiteboard</Typography>
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
        <Tooltip title="Clear"><IconButton onClick={clearCanvas} sx={{ color: "#ef4444" }}><DeleteSweep /></IconButton></Tooltip>
        <Box flex={1} />
        <IconButton onClick={onClose} sx={{ color: MUTED_D }}><Close /></IconButton>
      </Box>
      <Box sx={{ flex: 1, overflow: "hidden", cursor: tool === "eraser" ? "cell" : "crosshair" }}>
        <canvas ref={canvasRef}
          style={{ width: "100%", height: "100%", display: "block", touchAction: "none" }}
          onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
          onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw} />
      </Box>
    </Drawer>
  );
};

// ─── Participants Drawer ──────────────────────────────────────
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

// ─── Admit Panel ──────────────────────────────────────────────
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
                  <Typography sx={{ color: TEXT, fontWeight: 700, fontSize: 14 }}>{w.fullName}</Typography>
                  <Typography sx={{ color: MUTED_D, fontSize: 12 }}>Waiting to join</Typography>
                </Box>
              </Stack>
              <Stack direction="row" spacing={1}>
                <Button fullWidth variant="contained" size="small"
                  startIcon={<CheckCircle sx={{ fontSize: 15 }} />}
                  onClick={() => handleAdmit(w.userId)}
                  sx={{ bgcolor: GREEN, textTransform: "none", fontWeight: 700, borderRadius: 2,
                        "&:hover": { bgcolor: "#166d3e" } }}>
                  Admit
                </Button>
                <Button fullWidth variant="outlined" size="small"
                  startIcon={<Cancel sx={{ fontSize: 15 }} />}
                  onClick={() => handleDeny(w.userId)}
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

// ─── Control Bar ──────────────────────────────────────────────
const ControlBar = ({
  role, sessionId, onLeave,
  onWhiteboard, onParticipants, onAdmitPanel,
  participantCount, waitingCount,
}) => {
  const { localParticipant } = useLocalParticipant();
  const room                 = useRoomContext();

  const [micOn,         setMicOn]         = useState(true);
  const [camOn,         setCamOn]         = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [recording,     setRecording]     = useState(false);
  const [reactionAnchor, setReactionAnchor] = useState(null);

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
  const handleRaiseHand = async () => {
    try {
      const payload = new TextEncoder().encode(
        JSON.stringify({ type: "RAISE_HAND", identity: localParticipant?.identity })
      );
      await room?.localParticipant?.publishData(payload, { reliable: true });
      await raiseHand(sessionId);
    } catch (err) { console.error(err); }
  };
  const handleReaction = async (emoji) => {
    setReactionAnchor(null);
    try {
      const payload = new TextEncoder().encode(JSON.stringify({ type: "REACTION", emoji }));
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
    <Box sx={{ bgcolor: DARK2, borderTop: "1px solid rgba(255,255,255,0.06)",
               px: 3, py: 1.5, display: "flex", alignItems: "center",
               justifyContent: "center", gap: 1, flexWrap: "wrap" }}>
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
        <CtrlBtn title="Raise hand" onClick={handleRaiseHand} activeColor={GOLD}><PanTool /></CtrlBtn>
        <CtrlBtn title="Reactions" onClick={(e) => setReactionAnchor(e.currentTarget)} activeColor="#7C3AED">
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

      <Popover open={Boolean(reactionAnchor)} anchorEl={reactionAnchor}
        onClose={() => setReactionAnchor(null)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        transformOrigin={{ vertical: "bottom", horizontal: "center" }}
        PaperProps={{ sx: { bgcolor: DARK2, border: "1px solid rgba(255,255,255,0.1)", borderRadius: 3, p: 1 } }}>
        <Box sx={{ display: "flex", gap: 0.5 }}>
          {REACTIONS.map((emoji) => (
            <IconButton key={emoji} onClick={() => handleReaction(emoji)}
              sx={{ fontSize: 22, "&:hover": { bgcolor: "rgba(255,255,255,0.1)" } }}>
              {emoji}
            </IconButton>
          ))}
        </Box>
      </Popover>
    </Box>
  );
};

// ─── Lobby Screen ─────────────────────────────────────────────
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

// ─── RoomInner ────────────────────────────────────────────────
// Must stay inside <LiveKitRoom> for hooks to work.
// KEY CHANGE: instead of calling room.connect() (which doesn't exist
// in LiveKit v2), we call onRequestTokenSwap(newToken) which lifts
// state up to the parent, causing <LiveKitRoom> to remount with the
// new token. This is the only correct way.

const RoomInner = ({
  role, sessionId, navigate, currentUser, phase,
  onRequestTokenSwap,   // ← NEW: (newToken, newServerUrl) => void
}) => {
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

  // my identity — stable ref so useEffect closures don't stale-capture it
  const myIdentityRef = useRef(localParticipant?.identity);
  useEffect(() => { myIdentityRef.current = localParticipant?.identity; }, [localParticipant?.identity]);

  const totalParticipants = (localParticipant ? 1 : 0) + participants.length;

  // ── 1. Poll waiting-room count badge (host only) ──
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

  // ── 2. STUDENT POLL FALLBACK — check every 3s if admitted ────
  // This guarantees the student gets in even if the data message
  // was dropped (server not yet in room when sendData was called).
  useEffect(() => {
    if (phase !== "lobby" || role === "host") return;

    const poll = async () => {
      if (upgrading) return;
      try {
        // getParticipantToken returns 200 only if status === "admitted"
        // and 403 if still waiting — we use that as our signal.
        const res = await getParticipantToken(sessionId);
        if (res?.token) {
          setUpgrading(true);
          onRequestTokenSwap(res.token, res.serverUrl);
        }
      } catch {
        // 403 = still waiting, just continue polling
      }
    };

    const id = setInterval(poll, 3000);
    return () => clearInterval(id);
  }, [phase, role, sessionId, upgrading, onRequestTokenSwap]);

  // ── 3. Data message handler ────────────────────────────────
  useEffect(() => {
    if (!room) return;

    const handleData = async (payload) => {
      const data = decodeMsg(payload);
      if (!data) return;

      // HOST receives JOIN_REQUEST
      if (data.type === "JOIN_REQUEST" && role === "host") {
        setWaitingCount((c) => c + 1);
        setJoinRequestTick((t) => t + 1);
        setAdmitPanelOpen(true);
        setToast({ msg: `✋ ${data.fullName || "Someone"} is waiting to join`, severity: "info" });
      }

      // STUDENT receives ADMITTED
      // Match on identity string ("user-3") — both sides produce the same format
      if (data.type === "ADMITTED" && phase === "lobby") {
        const myId = myIdentityRef.current;
        // If the backend sends a targeted identity, check it; otherwise accept broadcast
        if (data.identity && data.identity !== myId) return;

        if (upgrading) return; // already handling
        setUpgrading(true);
        try {
          const res = await getParticipantToken(sessionId);
          onRequestTokenSwap(res.token, res.serverUrl);
          setToast({ msg: "You've been admitted! 🎉", severity: "success" });
        } catch (err) {
          console.error("Token upgrade:", err);
          setUpgrading(false);
          setToast({ msg: "Admission error — retrying shortly.", severity: "warning" });
        }
      }

      // STUDENT receives DENIED
      if (data.type === "DENIED" && phase === "lobby") {
        const myId = myIdentityRef.current;
        if (data.identity && data.identity !== myId) return;
        setToast({ msg: `Your request to join was declined.${data.reason ? ` Reason: ${data.reason}` : ""}`, severity: "error" });
        setTimeout(() => navigate("/student/live-classes"), 3500);
      }

      // HOST receives RAISE_HAND
      if (data.type === "RAISE_HAND" && role === "host") {
        setToast({ msg: `✋ ${data.name || "Someone"} raised their hand`, severity: "info" });
      }
    };

    room.on("dataReceived", handleData);
    return () => { room.off("dataReceived", handleData); };
  }, [room, role, phase, sessionId, navigate, upgrading, onRequestTokenSwap]);

  const handleAdmit = async (userId) => {
    try {
      await admitParticipant(sessionId, userId);
      setWaitingCount((c) => Math.max(0, c - 1));
      setToast({ msg: "Participant admitted ✓", severity: "success" });
    } catch (err) {
      console.error(err);
      setToast({ msg: "Failed to admit participant", severity: "error" });
    }
  };

  const handleDeny = async (userId) => {
    try {
      await denyParticipant(sessionId, userId);
      setWaitingCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleLeave = async () => {
    try { await leaveAttendance(sessionId); } catch { /* ignore */ }
    navigate(role === "host" ? "/tutor/live-classes" : "/student/live-classes");
  };

  // ── LOBBY PHASE ─────────────────────────────────────────────
  if (phase === "lobby") {
    return (
      <>
        <RoomAudioRenderer />
        <LobbyScreen currentUser={currentUser} onLeave={handleLeave} />
        {upgrading && (
          <Box sx={{
            position: "fixed", inset: 0, bgcolor: "rgba(0,0,0,0.75)",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 2, zIndex: 9999,
          }}>
            <CircularProgress sx={{ color: GREEN }} size={48} />
            <Typography sx={{ color: TEXT, fontWeight: 700, fontSize: 18 }}>
              Joining the class…
            </Typography>
          </Box>
        )}
        <Snackbar open={!!toast} autoHideDuration={5000} onClose={() => setToast(null)}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}>
          <Alert severity={toast?.severity || "info"} onClose={() => setToast(null)}>
            {toast?.msg}
          </Alert>
        </Snackbar>
      </>
    );
  }

  // ── LIVE PHASE ──────────────────────────────────────────────
  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh", bgcolor: DARK, overflow: "hidden" }}>

      {/* TOP BAR */}
      <Box sx={{ bgcolor: DARK2, borderBottom: "1px solid rgba(255,255,255,0.06)",
                 px: 3, py: 1.25, display: "flex", alignItems: "center", gap: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box sx={{
            width: 10, height: 10, borderRadius: "50%", bgcolor: GREEN,
            boxShadow: `0 0 0 3px ${GREEN}44`, animation: "pulse 2s infinite",
            "@keyframes pulse": { "0%,100%": { opacity: 1 }, "50%": { opacity: 0.4 } },
          }} />
          <Typography sx={{ color: TEXT, fontWeight: 800, fontSize: 15 }}>GIEVA Live</Typography>
        </Box>

        <Chip label="LIVE" size="small"
          sx={{ bgcolor: "#ef444433", color: "#ef4444", fontWeight: 800, fontSize: 11 }} />

        <Box flex={1} />

        {waitingCount > 0 && role === "host" && (
          <Chip
            icon={<PersonAdd sx={{ fontSize: 14 }} />}
            label={`${waitingCount} waiting`}
            onClick={() => setAdmitPanelOpen(true)}
            size="small"
            sx={{
              bgcolor: "rgba(239,68,68,0.18)", color: "#fca5a5", fontWeight: 800,
              border: "1px solid rgba(239,68,68,0.35)", cursor: "pointer",
              "& .MuiChip-icon": { color: "#f87171" },
              animation: "pulse 1.5s infinite",
              "@keyframes pulse": {
                "0%,100%": { boxShadow: "0 0 0 0 rgba(239,68,68,0.4)" },
                "50%":     { boxShadow: "0 0 0 8px rgba(239,68,68,0)" },
              },
            }}
          />
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

      <ParticipantGrid />
      <RoomAudioRenderer />

      <ControlBar
        role={role}
        sessionId={sessionId}
        onLeave={handleLeave}
        onWhiteboard={() => setWhiteboardOpen(true)}
        onParticipants={() => setParticipantsOpen(true)}
        onAdmitPanel={() => setAdmitPanelOpen(true)}
        participantCount={totalParticipants}
        waitingCount={waitingCount}
      />

      <WhiteboardDrawer   open={whiteboardOpen}   onClose={() => setWhiteboardOpen(false)} />
      <ParticipantsDrawer open={participantsOpen} onClose={() => setParticipantsOpen(false)} />
      <AdmitPanel
        open={admitPanelOpen}
        onClose={() => setAdmitPanelOpen(false)}
        sessionId={sessionId}
        onAdmit={handleAdmit}
        onDeny={handleDeny}
        triggerRefresh={joinRequestTick}
      />

      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <Alert severity={toast?.severity || "info"} onClose={() => setToast(null)}>
          {toast?.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

// ─── Main Export ──────────────────────────────────────────────
// THE KEY ARCHITECTURAL FIX:
// Token + phase state live HERE, outside <LiveKitRoom>.
// When the student is admitted, onRequestTokenSwap() updates
// `token` and `phase`, React unmounts the old <LiveKitRoom>
// and mounts a new one with the participant token.
// This is the ONLY correct way to "upgrade" a connection in LiveKit v2.

export default function LiveClassroom() {
  const { sessionId } = useParams();
  const location      = useLocation();
  const navigate      = useNavigate();
  const role          = location.state?.role || "student";

  const [token,       setToken]       = useState("");
  const [serverUrl,   setServerUrl]   = useState("");
  const [phase,       setPhase]       = useState("lobby");
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    loadClass();
    return () => { leaveAttendance(sessionId).catch(() => {}); };
  }, [sessionId]);

  const loadClass = async () => {
    try {
      setLoading(true);
      let response;
      if (role === "tutor" || role === "host") {
        response = await joinTutorSession(sessionId);
      } else {
        response = await joinClassSession(sessionId);
      }
      setToken(response.token);
      setServerUrl(response.serverUrl);
      setPhase(response.phase || (role === "host" || role === "tutor" ? "live" : "lobby"));
      setCurrentUser(response.currentUser || null);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Failed to join class");
    } finally {
      setLoading(false);
    }
  };

  // ── Called by RoomInner when the student is admitted ────────
  // Updating token causes React to key-change <LiveKitRoom>,
  // which disconnects the lobby connection and reconnects as a
  // full participant. Phase change causes RoomInner to render
  // the live view instead of the lobby screen.
  const handleTokenSwap = useCallback((newToken, newServerUrl) => {
    setToken(newToken);
    if (newServerUrl) setServerUrl(newServerUrl);
    setPhase("live");
  }, []);

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
    // KEY PROP is critical — when token changes, React fully
    // unmounts and remounts <LiveKitRoom> with the new token,
    // creating a clean new WebRTC connection as a participant.
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
      />
    </LiveKitRoom>
  );
}





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