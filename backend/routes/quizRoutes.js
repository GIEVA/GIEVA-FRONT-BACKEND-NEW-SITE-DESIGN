import express from "express";
import {authenticate} from "../middleware/auth.js";

import {
  createQuiz,
  addQuestion,
  startQuiz,
  submitQuiz,
  getQuizResult,
  resumeQuiz,
  getQuizById,
  getQuizzesByCourse
} from "../controllers/quizController.js";

import quizTimerGuard from "../middleware/quizTimerGuard.js";
import checkEnrollment from "../middleware/checkEnrollment.js";


const router = express.Router();

// Admin / Tutor
router.post("/", authenticate, createQuiz);
router.post("/:quizId/question", authenticate, addQuestion);

// Student
router.post("/:quizId/start", authenticate, startQuiz);
router.post("/submit/:attemptId", authenticate, quizTimerGuard, submitQuiz);
router.get("/resume/:quizId", authenticate, quizTimerGuard, resumeQuiz);

router.get("/result/:attemptId", authenticate, getQuizResult);
router.get(
  "/course/:courseId/quizzes",
  authenticate,
  getQuizzesByCourse
);

router.get(
  "/:quizId",
  authenticate,
  getQuizById
);

export default router;
