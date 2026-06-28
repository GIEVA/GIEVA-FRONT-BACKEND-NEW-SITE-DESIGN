// config/livekit.js

import { AccessToken } from "livekit-server-sdk";

// ──────────────────────────────────────────────────────────────────
// ROLES
//   "host"        → full admin of the room (tutor)
//   "participant" → can publish audio/video (admitted student)
//   "lobby"       → connected but CANNOT publish audio/video;
//                   used for the waiting-room phase before admission
//   "observer"    → subscribe-only (admin observer)
// ──────────────────────────────────────────────────────────────────

export const createLiveKitToken = async (
  roomName,
  identity,
  role = "participant",
  metadata = {}
) => {
  const at = new AccessToken(
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET,
    {
      identity,
      metadata: JSON.stringify({
        fullName:      metadata.fullName      || identity,
        profilePicUrl: metadata.profilePicUrl || "",
        role,
      }),
      ttl: "10h",
    }
  );

  const isHost = role === "host";

  at.addGrant({
    roomJoin: true,
    room:     roomName,

    // lobby participants cannot publish audio/video tracks
    canPublish:     isHost || role === "participant",

    // everyone can subscribe (even lobby / observer)
    canSubscribe:   true,

    // data messages needed for join-requests / admit signals
    canPublishData: true,

    // only host has room-admin power (remote mute, kick, etc.)
    roomAdmin:      isHost,
  });

  return await at.toJwt();
};

// // config/livekit.js

// import { AccessToken } from "livekit-server-sdk";

// // ──────────────────────────────────────────────────────────────────
// // ROLES
// //   "host"        → full admin of the room (tutor)
// //   "participant" → can publish audio/video (admitted student)
// //   "lobby"       → connected but CANNOT publish audio/video;
// //                   used for the waiting-room phase before admission
// //   "observer"    → subscribe-only (admin observer)
// // ──────────────────────────────────────────────────────────────────

// export const createLiveKitToken = async (
//   roomName,
//   identity,
//   role = "participant",
//   metadata = {}
// ) => {
//   const at = new AccessToken(
//     process.env.LIVEKIT_API_KEY,
//     process.env.LIVEKIT_API_SECRET,
//     {
//       identity,
//       metadata: JSON.stringify({
//         fullName:      metadata.fullName      || identity,
//         profilePicUrl: metadata.profilePicUrl || "",
//         role,
//       }),
//     }
//   );

//   const isHost = role === "host";

//   at.addGrant({
//     roomJoin: true,
//     room:     roomName,

//     // lobby participants cannot publish audio/video tracks
//     canPublish:     isHost || role === "participant",

//     // everyone can subscribe (even lobby / observer)
//     canSubscribe:   true,

//     // data messages needed for join-requests / admit signals
//     canPublishData: true,

//     // only host has room-admin power (remote mute, kick, etc.)
//     roomAdmin:      isHost,
//   });

//   return await at.toJwt();
// };