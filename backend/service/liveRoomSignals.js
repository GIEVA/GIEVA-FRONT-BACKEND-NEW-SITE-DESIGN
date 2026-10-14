// services/liveRoomSignals.js
// Server-authoritative realtime signals to everyone in the LiveKit room, over the data channel.
// The frontend listens for these topics: "poll" and "recording".
// A failure here is never fatal: clients also re-fetch on an interval.

import { RoomServiceClient, DataPacket_Kind } from "livekit-server-sdk";

let roomService;
const getRoomService = () => {
  if (!roomService) {
    roomService = new RoomServiceClient(
      process.env.LIVEKIT_URL,
      process.env.LIVEKIT_API_KEY,
      process.env.LIVEKIT_API_SECRET
    );
  }
  return roomService;
};

export const broadcast = async (roomName, topic, payload) => {
  if (!roomName) return;
  try {
    await getRoomService().sendData(
      roomName,
      new TextEncoder().encode(JSON.stringify(payload)),
      DataPacket_Kind.RELIABLE,
      { topic }
    );
  } catch (err) {
    console.error(`[liveRoomSignals] ${topic} broadcast failed:`, err.message);
  }
};
