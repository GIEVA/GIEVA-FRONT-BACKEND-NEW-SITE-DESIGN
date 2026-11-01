// controllers/roomControls.controller.js
import { loadSession, canManageSession } from "../services/sessionAccess.js";
import { muteAll, muteOne, sendControl, announce } from "../services/roomControls.service.js";

const identityOf = (userId) => `user-${userId}`;

const guard = async (req, res) => {
  const session = await loadSession(req.params.sessionId);
  if (!session) {
    res.status(404).json({ message: "Session not found" });
    return null;
  }
  if (!canManageSession(req.user, session)) {
    res.status(403).json({ message: "Only the host can do this" });
    return null;
  }
  return session;
};

// POST /sessions/:sessionId/room/mute-all
export const muteAllParticipants = async (req, res) => {
  try {
    const session = await guard(req, res);
    if (!session) return;

    // Never mute the requester or the session's tutor.
    const except = [identityOf(req.user.id)];
    if (session.TutorProfile?.userId) except.push(identityOf(session.TutorProfile.userId));

    const muted = await muteAll(session.roomName, except);
    announce(session.roomName, { type: "muted-all" }).catch(() => {});
    res.json({ message: muted ? `Muted ${muted} participant(s)` : "Everyone is already muted", muted });
  } catch (err) {
    console.error("[roomControls] muteAll", err);
    res.status(500).json({ message: "Could not mute participants" });
  }
};

// POST /sessions/:sessionId/room/mute/:identity   (host, alt host, co-host; works for guests too)
export const muteOneParticipant = async (req, res) => {
  try {
    const session = await guard(req, res);
    if (!session) return;
    const { identity } = req.params;
    if (!/^[\w-]{1,100}$/.test(identity)) return res.status(400).json({ message: "Bad identity" });
    if (identity === identityOf(req.user.id)) return res.status(400).json({ message: "Use your own mic button to mute yourself" });

    const r = await muteOne(session.roomName, identity);
    if (!r.found) return res.status(404).json({ message: "That person is no longer in the room" });
    sendControl(session.roomName, identity, { type: "muted-by-host" }).catch(() => {});
    res.json({ message: r.muted ? "Muted" : "Already muted", muted: r.muted });
  } catch (err) {
    console.error("[roomControls] muteOne", err);
    res.status(500).json({ message: "Could not mute this person" });
  }
};

// POST /sessions/:sessionId/room/ask-unmute/:identity
export const askToUnmute = async (req, res) => {
  try {
    const session = await guard(req, res);
    if (!session) return;
    const { identity } = req.params;
    if (!/^[\w-]{1,100}$/.test(identity)) return res.status(400).json({ message: "Bad identity" });

    await sendControl(session.roomName, identity, { type: "ask-unmute" });
    res.json({ message: "Request sent" });
  } catch (err) {
    console.error("[roomControls] askToUnmute", err);
    res.status(500).json({ message: "Could not send the request" });
  }
};