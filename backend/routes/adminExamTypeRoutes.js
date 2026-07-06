// routes/examTypeRoutes.js

import express from "express";
import {
  listPublishedExams,
  getExamTypeBySlug,
  adminListExams,
  adminCreateExam,
  adminUpdateExam,
  adminSetExamStatus,
  adminDeleteExam,
} from "../controllers/adminExamTypeController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// ── Public (no auth) ──────────────────────────────────────────
router.get("/",          listPublishedExams);   // student catalog
router.get("/:examType", getExamTypeBySlug);    // single exam + field schema

// ── Admin ─────────────────────────────────────────────────────
router.get(    "/admin/all",          authenticate, adminListExams);
router.post(   "/admin",              authenticate, adminCreateExam);
router.put(    "/admin/:id",          authenticate, adminUpdateExam);
router.patch(  "/admin/:id/status",   authenticate, adminSetExamStatus);
router.delete( "/admin/:id",          authenticate, adminDeleteExam);

export default router;

// ── Add to server.js / app.js ─────────────────────────────────
// import examTypeRoutes from "./routes/examTypeRoutes.js";
// app.use("/api/exam-types", examTypeRoutes);