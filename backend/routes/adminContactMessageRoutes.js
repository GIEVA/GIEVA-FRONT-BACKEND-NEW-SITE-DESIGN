// routes/adminContactMessageRoutes.js
//
// Mounted in server.js as:
//   app.use("/api/message-contacts/admin", adminContactMessageRoutes);
// so paths here are relative to that — no "/admin" prefix needed.

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

router.get(   "/summary",     authenticate, getContactSummary);
router.get(   "/",            authenticate, listContactMessages);
router.get(   "/:id",         authenticate, getContactMessage);
router.patch( "/:id/status",  authenticate, updateContactStatus);
router.patch( "/:id/assign",  authenticate, assignContactMessage);
router.post(  "/:id/reply",   authenticate, replyToContactMessage);
router.patch( "/:id/note",    authenticate, addInternalNote);
router.delete("/:id",         authenticate, deleteContactMessage);

export default router;