// services/livekitEgress.service.js
// Thin wrapper over LiveKit Egress (livekit-server-sdk v2.x).
// Starts a room-composite MP4 (what people watch) and, optionally, an audio-only OGG
// (what gets sent to Whisper — much smaller than extracting audio from the video).
//
// Requires a running LiveKit Egress service (LiveKit Cloud has it built in; self-hosted
// needs the livekit-egress container). Files are uploaded straight to the S3-compatible bucket.

import { EgressClient, EncodedFileOutput, EncodedFileType, S3Upload } from "livekit-server-sdk";
import { getStorageConfig } from "../config/storage.js";

let egressClient;
const getClient = () => {
  if (!egressClient) {
    egressClient = new EgressClient(
      process.env.LIVEKIT_URL,
      process.env.LIVEKIT_API_KEY,
      process.env.LIVEKIT_API_SECRET
    );
  }
  return egressClient;
};

const fileOutput = (filepath, fileType) => {
  const s = getStorageConfig();
  if (!s.accessKey || !s.secret || !s.bucket) {
    throw new Error("Recording storage is not configured (RECORDING_S3_* env vars missing)");
  }
  return new EncodedFileOutput({
    fileType,
    filepath,
    output: {
      case: "s3",
      value: new S3Upload({
        accessKey: s.accessKey,
        secret: s.secret,
        bucket: s.bucket,
        region: s.region,
        endpoint: s.endpoint,
        forcePathStyle: s.forcePathStyle,
      }),
    },
  });
};

export const startRoomRecording = async (roomName, sessionId, recordingId, { audio = true } = {}) => {
  const client = getClient();
  const base = `recordings/session-${sessionId}/rec-${recordingId}`;

  const videoKey = `${base}.mp4`;
  const video = await client.startRoomCompositeEgress(
    roomName,
    { file: fileOutput(videoKey, EncodedFileType.MP4) },
    { layout: "speaker" }
  );

  let audioKey = null;
  let audioEgressId = null;

  if (audio) {
    try {
      audioKey = `${base}-audio.ogg`;
      const a = await client.startRoomCompositeEgress(
        roomName,
        { file: fileOutput(audioKey, EncodedFileType.OGG) },
        { audioOnly: true }
      );
      audioEgressId = a.egressId;
    } catch (err) {
      // Video is already recording — keep it, just skip AI notes for this run.
      console.error("[egress] audio-only egress failed, continuing without AI notes:", err.message);
      audioKey = null;
    }
  }

  return { videoEgressId: video.egressId, videoKey, audioEgressId, audioKey };
};

export const stopEgress = (egressId) => getClient().stopEgress(egressId);
