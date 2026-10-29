// services/webinarPermissions.js
// What each role may do inside the LiveKit room, and the calls that change it live.
//
//   host / alt_host / cohost / panelist -> can publish camera, mic and screen share
//   attendee                            -> view and listen only (can still use chat via the data channel)
//
// Enforcement is server-side: LiveKit refuses to publish a track the participant has no permission for,
// so a modified browser cannot unmute itself. Two places apply it:
//   1. onParticipantJoined()  : called from the LiveKit webhook the moment someone connects
//   2. setPublishPermission() : promote / demote while the webinar is running
// Optional but stricter: also build the token with webinarGrantFor() so the permission is correct from
// the first millisecond (see README section on the token controller).

import { RoomServiceClient, TrackSource } from "livekit-server-sdk";
import models from "../models/index.js";
import { sessionRoleOf } from "./sessionAccess.js";
import { sendControl } from "./roomControls.service.js";

const { User, SessionRole } = models;

let svc;
const rooms = () => {
  if (!svc) svc = new RoomServiceClient(process.env.LIVEKIT_URL, process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET);
  return svc;
};

export const identityOf = (userId) => `user-${userId}`;
export const userIdFromIdentity = (identity) => {
  const m = /^user-(\d+)$/.exec(String(identity || ""));
  return m ? Number(m[1]) : null;
};

const SPEAKER_SOURCES = [TrackSource.MICROPHONE, TrackSource.CAMERA, TrackSource.SCREEN_SHARE, TrackSource.SCREEN_SHARE_AUDIO];

export const canSpeak = (role) => role !== "attendee";

// Permission object for LiveKit (updateParticipant)
export const permissionFor = (role) => ({
  canSubscribe: true,
  canPublish: canSpeak(role),
  canPublishData: true,
  canPublishSources: canSpeak(role) ? SPEAKER_SOURCES : [],
});

// Video grant fields for AccessToken.addGrant({ room, roomJoin: true, ...webinarGrantFor(role) })
export const webinarGrantFor = (role) => ({
  canSubscribe: true,
  canPublish: canSpeak(role),
  canPublishData: true,
  canPublishSources: canSpeak(role) ? ["microphone", "camera", "screen_share", "screen_share_audio"] : [],
});

export const roleForIdentity = async (session, identity) => {
  const userId = userIdFromIdentity(identity);
  if (!userId) return "attendee"; // guests are always attendees
  const user = await User.findByPk(userId, { attributes: ["id", "role"] });
  if (!user) return "attendee";
  return sessionRoleOf({ id: user.id, role: user.role }, session);
};

// Webhook hook: lock attendees to view-only as soon as they connect to a webinar.
export const onParticipantJoined = async (session, identity) => {
  if (!session?.isWebinar || !identity) return;
  try {
    const role = await roleForIdentity(session, identity);
    await rooms().updateParticipant(session.roomName, identity, undefined, permissionFor(role));
  } catch (err) {
    console.error("[webinar] enforce permissions failed:", err.message);
  }
};

// Promote an attendee to panelist, or send a panelist back to the audience.
export const setPublishPermission = async (session, userId, makePanelist, addedBy) => {
  const identity = identityOf(userId);
  const role = makePanelist ? "panelist" : "attendee";

  if (makePanelist) {
    await SessionRole.findOrCreate({ where: { classSessionId: session.id, userId }, defaults: { role: "panelist", addedBy } });
  } else {
    // Only a panelist goes back to the audience; hosts and co-hosts keep their rows.
    await SessionRole.destroy({ where: { classSessionId: session.id, userId, role: "panelist" } });
  }

  // The person may not be connected yet; that is fine, the row applies when they join.
  try {
    await rooms().updateParticipant(session.roomName, identity, undefined, permissionFor(role));
    await sendControl(session.roomName, identity, { type: makePanelist ? "promoted" : "demoted" });
  } catch (err) {
    if (!/not found|does not exist/i.test(err.message)) throw err;
  }
  return role;
};
