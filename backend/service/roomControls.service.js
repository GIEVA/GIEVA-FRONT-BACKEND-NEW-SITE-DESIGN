// services/roomControls.service.js
// Host-only room moderation: mute everyone, and ask one person to unmute.
//
// Mute is enforced by the server (mutePublishedTrack), so a student cannot ignore it.
// UNMUTE is deliberately a *request*: the person's browser shows "Host asks you to unmute" and they
// accept with one click. Forcing a microphone on is a privacy problem, and LiveKit blocks it unless
// the project enables "Admins can remotely unmute tracks" (self-hosted: room.enable_remote_unmute).

import { RoomServiceClient, DataPacket_Kind, TrackSource } from "livekit-server-sdk";

let svc;
const rooms = () => {
  if (!svc) {
    svc = new RoomServiceClient(
      process.env.LIVEKIT_URL,
      process.env.LIVEKIT_API_KEY,
      process.env.LIVEKIT_API_SECRET
    );
  }
  return svc;
};

const micTracks = (participant) =>
  (participant.tracks || []).filter((t) => t.source === TrackSource.MICROPHONE);

// Mutes every microphone in the room except the identities in `exceptIdentities`.
export const muteAll = async (roomName, exceptIdentities = []) => {
  const skip = new Set(exceptIdentities);
  const participants = await rooms().listParticipants(roomName);
  let muted = 0;

  for (const p of participants) {
    if (skip.has(p.identity)) continue;
    for (const track of micTracks(p)) {
      if (track.muted) continue;
      try {
        await rooms().mutePublishedTrack(roomName, p.identity, track.sid, true);
        muted += 1;
      } catch (err) {
        console.error(`[roomControls] mute ${p.identity} failed:`, err.message);
      }
    }
  }
  return muted;
};

// Sends a private data message to one participant (topic "control").
export const sendControl = async (roomName, identity, payload) => {
  await rooms().sendData(
    roomName,
    new TextEncoder().encode(JSON.stringify(payload)),
    DataPacket_Kind.RELIABLE,
    { topic: "control", destinationIdentities: [identity] }
  );
};

// Tells everyone (topic "control") that the host muted the room, so UIs can show a toast.
export const announce = async (roomName, payload) => {
  await rooms().sendData(
    roomName,
    new TextEncoder().encode(JSON.stringify(payload)),
    DataPacket_Kind.RELIABLE,
    { topic: "control" }
  );
};
