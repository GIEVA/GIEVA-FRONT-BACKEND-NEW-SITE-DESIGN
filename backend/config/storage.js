// config/storage.js
// S3-compatible storage for recordings. Works with AWS S3, Cloudflare R2, GCS (interop mode),
// MinIO, Backblaze B2 — pick one and fill in the env vars. LiveKit Egress uploads straight to
// this bucket; this backend only reads from it (transcription + signed playback links).
//
// Env:
//   RECORDING_S3_ACCESS_KEY, RECORDING_S3_SECRET, RECORDING_S3_BUCKET
//   RECORDING_S3_REGION            (S3: e.g. eu-west-1 | R2: "auto")
//   RECORDING_S3_ENDPOINT          (blank for AWS S3 | R2: https://<account>.r2.cloudflarestorage.com)
//   RECORDING_S3_FORCE_PATH_STYLE  ("true" for MinIO / some providers)

import { S3Client, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const getStorageConfig = () => ({
  accessKey: process.env.RECORDING_S3_ACCESS_KEY,
  secret: process.env.RECORDING_S3_SECRET,
  bucket: process.env.RECORDING_S3_BUCKET,
  region: process.env.RECORDING_S3_REGION || "auto",
  endpoint: process.env.RECORDING_S3_ENDPOINT || "",
  forcePathStyle: process.env.RECORDING_S3_FORCE_PATH_STYLE === "true",
});

let client;
const getClient = () => {
  if (client) return client;
  const c = getStorageConfig();
  if (!c.accessKey || !c.secret || !c.bucket) {
    throw new Error("Recording storage is not configured (RECORDING_S3_* env vars missing)");
  }
  client = new S3Client({
    region: c.region,
    endpoint: c.endpoint || undefined,
    forcePathStyle: c.forcePathStyle,
    credentials: { accessKeyId: c.accessKey, secretAccessKey: c.secret },
  });
  return client;
};

// Download an object fully into memory (audio files only — they are small).
export const downloadObject = async (key) => {
  const { bucket } = getStorageConfig();
  const res = await getClient().send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  const chunks = [];
  for await (const chunk of res.Body) chunks.push(chunk);
  return Buffer.concat(chunks);
};

// Time-limited playback/download link. The bucket can stay private.
export const getPlaybackUrl = (key, expiresInSeconds = 3600) => {
  const { bucket } = getStorageConfig();
  return getSignedUrl(getClient(), new GetObjectCommand({ Bucket: bucket, Key: key }), {
    expiresIn: expiresInSeconds,
  });
};

// Best-effort delete (used when a session is deleted). Never throws.
export const deleteObject = async (key) => {
  if (!key) return;
  try {
    const { bucket } = getStorageConfig();
    await getClient().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  } catch (err) {
    console.error("[storage] delete failed:", key, err.message);
  }
};
