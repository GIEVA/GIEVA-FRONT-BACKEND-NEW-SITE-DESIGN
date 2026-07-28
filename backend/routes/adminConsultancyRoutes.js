// routes/consultationRoutes.js

import express from "express";
import {
  adminListBookings,
  adminGetBooking,
  adminUpdateStatus,
  adminReplyToBooking,
  adminAddNote,
  adminDeleteBooking,
  adminGetSummary,
} from "../controllers/adminConsultancyController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();


// ── Admin ──────────────────────────────────────────────────────
router.get(   "/admin/summary",       authenticate, adminGetSummary);
router.get(   "/admin",               authenticate, adminListBookings);
router.get(   "/admin/:id",           authenticate, adminGetBooking);
router.patch( "/admin/:id/status",    authenticate, adminUpdateStatus);
router.post(  "/admin/:id/reply",     authenticate, adminReplyToBooking);
router.patch( "/admin/:id/note",      authenticate, adminAddNote);
router.delete("/admin/:id",           authenticate, adminDeleteBooking);

export default router;

// ── Add to server.js ──────────────────────────────────────────
// import consultationRoutes from "./routes/consultationRoutes.js";
// app.use("/api/consultations", consultationRoutes);
//
// import { startConsultationReminderJob } from "./jobs/consultationReminder.js";
// startConsultationReminderJob();
