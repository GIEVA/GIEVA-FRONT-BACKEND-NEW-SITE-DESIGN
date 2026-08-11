// routes/consultationRoutes.js

import express from "express";
import {
  bookConsultation,
  getAvailableSlots,
  getMyBookings,
  cancelMyBooking,
} from "../controllers/consultationController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// ── Public (no auth) ──────────────────────────────────────────
router.post("/",                    bookConsultation);   // guests + logged-in users
router.get( "/available-slots",     getAvailableSlots); // calendar slot checker

// ── Authenticated user ─────────────────────────────────────────
router.get(  "/my",            authenticate, getMyBookings);
router.patch("/:id/cancel",    authenticate, cancelMyBooking);



export default router;

// ── Add to server.js ──────────────────────────────────────────
// import consultationRoutes from "./routes/consultationRoutes.js";
// app.use("/api/consultations", consultationRoutes);
//
// import { startConsultationReminderJob } from "./jobs/consultationReminder.js";
// startConsultationReminderJob();
