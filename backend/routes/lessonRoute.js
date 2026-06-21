// routes/lesson.routes.js

import express from "express";
import {
  getCourseModulesForStudent,
  getCourseProgress,
  getLessonMeta,
  getSecureLesson,
  completeLesson,
  getContinueLearningLesson,
  getCourseCompletionStatus,
  getEnrollmentStatus,
  getLessonProgress,
  toggleLessonPublishStatus,
  getModuleLessonsStudent,
  updateLessonAccess
  
} from "../controllers/lessonController.js";

import upload from "../middleware/upload.js"; 

import {
  createLesson,
  getModuleLessons,
  updateLesson,
  deleteLesson,
} from "../controllers/lessonController.js";

import { authenticate } from "../middleware/auth.js";
import { loadLesson } from "../middleware/loadLesson.js";
import { secureLessonAccess } from "../middleware/secureLessonAccess.js";

const router = express.Router();

// ================= ADMIN LESSON CRUD =================

// CREATE LESSON
router.post(
  "/create",
  authenticate,
  upload.single("file"),
  createLesson
);

// GET MODULE LESSONS
router.get(
  "/module/:moduleId",
  authenticate,
  getModuleLessons
);

// UPDATE LESSON
router.put(
  "/:id",
  authenticate,
  upload.single("file"),
  updateLesson
);

router.patch(
  "/:id/publish",
  authenticate,
  toggleLessonPublishStatus
);

router.post(
  "/access",
  authenticate,
  updateLessonAccess
);

// DELETE LESSON
router.delete(
  "/:id",
  authenticate,
  deleteLesson
);


// ================= STUDENT COURSE EXPERIENCE =================

// 📦 Get all modules + lessons with lock states
// MODULES
router.get(
  "/courses/:courseId/modules",
  authenticate,
  getCourseModulesForStudent
);

// PROGRESS
router.get(
  "/courses/:courseId/progress",
  authenticate,
  getCourseProgress
);

// ENROLLMENT
router.get(
  "/courses/:courseId/enrollment",
  authenticate,
  getEnrollmentStatus
);

// CONTINUE
router.get(
  "/courses/:courseId/continue",
  authenticate,
  getContinueLearningLesson
);

// COMPLETION
router.get(
  "/courses/:courseId/completion-status",
  authenticate,
  getCourseCompletionStatus
);

// LESSON META
router.get(
  "/meta/:lessonId",
  authenticate,
  getLessonMeta
);

// SECURE LESSON
router.get(
  "/:lessonId",
  authenticate,
  loadLesson,
  secureLessonAccess,
  getSecureLesson
);

// COMPLETE
router.post(
  "/complete",
  authenticate,
  completeLesson
);

// LESSON PROGRESS
router.get(
  "/:lessonId/progress",
  authenticate,
  getLessonProgress
);


export default router;