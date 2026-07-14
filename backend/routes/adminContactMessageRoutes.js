// routes/contactRoutes.js

import express from "express";
import {

  listContactMessages,
  getContactMessage,
  updateContactStatus,
  assignContactMessage,
  replyToContactMessage,
  addInternalNote,
  deleteContactMessage,
  getContactSummary,
} from "../controllers/contactController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();



// ── Admin ─────────────────────────────────────────────────────
router.get(   "/admin/summary",        authenticate, getContactSummary);
router.get(   "/admin",                authenticate, listContactMessages);
router.get(   "/admin/:id",            authenticate, getContactMessage);
router.patch( "/admin/:id/status",     authenticate, updateContactStatus);
router.patch( "/admin/:id/assign",     authenticate, assignContactMessage);
router.post(  "/admin/:id/reply",      authenticate, replyToContactMessage);
router.patch( "/admin/:id/note",       authenticate, addInternalNote);
router.delete("/admin/:id",            authenticate, deleteContactMessage);

export default router;

// ── Add to server.js / app.js ─────────────────────────────────
// import contactRoutes from "./routes/contactRoutes.js";
// app.use("/api/contact", contactRoutes);
