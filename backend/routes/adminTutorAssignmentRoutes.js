// routes/tutorAssignmentRoutes.js

import express from "express";

import {
  assignStudentToTutor,
  getTutorStudents,
  getAvailableTutors,
  getAssignableCourses,
  getAssignableStudents
} from "../controllers/admin.tutorAssignment.controller.js";

import {
  authenticate,
} from "../middleware/auth.js";

const router =
  express.Router();



// ======================================================
// ASSIGN STUDENT TO TUTOR
// ======================================================

router.post(
  "/assign-student",
  authenticate,
  assignStudentToTutor
);



// ======================================================
// GET TUTOR STUDENTS
// ======================================================

router.get(
  "/:tutorProfileId/students",
  authenticate,
  getTutorStudents
);



// ======================================================
// GET AVAILABLE TUTORS
// ======================================================

router.get(
  "/available",
  authenticate,
  getAvailableTutors
);

// ======================================================
// GET STUDENTS
// ======================================================

router.get(
  "/students",
  authenticate,
  getAssignableStudents
);


// ======================================================
// GET COURSES
// ======================================================

router.get(
  "/courses",
  authenticate,
  getAssignableCourses
);

export default router;