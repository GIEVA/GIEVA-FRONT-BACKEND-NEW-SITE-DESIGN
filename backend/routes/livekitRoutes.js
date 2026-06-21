// routes/livekit.routes.js

import express from "express";

import {
  livekitWebhook,
} from "../controllers/livekitWebhookController.js";

const router =
  express.Router();

router.post(
  "/livekit/webhook",
  express.json(),
  livekitWebhook
);

export default router;