import express from "express";
import {
  createQuiz,
  addQuestion,
  startQuiz,
  getQuizzesByCourse,
  getQuizById,
  submitQuiz,
  getQuizResult,
  resumeQuiz,
  getRemainingTime,
  getNextQuestionAdaptive,
} from "../controllers/quizController.js"; // adjust path if your filename differs

import { authenticate, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

// ---------------- ADMIN / TUTOR: build quizzes ----------------
router.post(
  "/",
  authenticate,
  authorizeRoles("admin", "superadmin", "tutor"),
  createQuiz
);

router.post(
  "/:quizId/questions",
  authenticate,
  authorizeRoles("admin", "superadmin", "tutor"),
  addQuestion
);

// ---------------- STUDENT-FACING ----------------
router.get("/course/:courseId", authenticate, getQuizzesByCourse);
router.get("/:quizId", authenticate, getQuizById);

router.post("/:quizId/start", authenticate, startQuiz);
router.post("/:quizId/resume", authenticate, resumeQuiz);

router.post("/attempts/:attemptId/submit", authenticate, submitQuiz);
router.get("/attempts/:attemptId/result", authenticate, getQuizResult);
router.get("/attempts/:attemptId/remaining-time", authenticate, getRemainingTime);

router.post("/next-question", authenticate, getNextQuestionAdaptive);

export default router;