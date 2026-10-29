// services/webinarStream.js
// Live-stream the webinar to YouTube, Facebook, Twitch or any custom RTMP(S) endpoint, using LiveKit Egress.
// Stream keys are secrets: they are passed to LiveKit and never stored or logged here.

import { EgressClient, StreamOutput, StreamProtocol } from "livekit-server-sdk";

let client;
const egress = () => {
  if (!client) client = new EgressClient(process.env.LIVEKIT_URL, process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET);
  return client;
};

export const validateRtmpUrls = (urls) => {
  const list = (Array.isArray(urls) ? urls : []).map((u) => String(u || "").trim()).filter(Boolean);
  if (!list.length) return { error: "Add at least one RTMP URL" };
  if (list.length > 3) return { error: "At most 3 destinations at once" };
  if (!list.every((u) => /^rtmps?:\/\/[^\s]{6,500}$/i.test(u))) return { error: "Each URL must start with rtmp:// or rtmps://" };
  return { urls: list };
};

const activeStreams = async (roomName) => {
  const all = await egress().listEgress({ roomName, active: true });
  return all.filter((e) => e.result?.case === "stream" || e.request?.case === "roomComposite" && e.request.value?.output?.case === "stream");
};

export const startStream = async (roomName, urls) => {
  if ((await activeStreams(roomName)).length) return { error: "A live stream is already running" };
  const info = await egress().startRoomCompositeEgress(
    roomName,
    { stream: new StreamOutput({ protocol: StreamProtocol.RTMP, urls }) },
    { layout: "speaker" }
  );
  return { egressId: info.egressId };
};

export const stopStream = async (roomName) => {
  const list = await activeStreams(roomName);
  for (const e of list) await egress().stopEgress(e.egressId);
  return list.length;
};

export const streamActive = async (roomName) => (await activeStreams(roomName)).length > 0;
