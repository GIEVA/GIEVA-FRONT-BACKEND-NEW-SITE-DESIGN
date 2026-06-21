import express from "express";

import {
  getPublicCourses,
  getPublicCourseById,
} from "../controllers/studentCourseController.js";

import {authenticate, authorizeRoles} from "../middleware/auth.js";


const router = express.Router();

// PUBLIC
router.get(
  "/courses",
  authenticate,
  getPublicCourses
);

router.get(
  "/courses/:id",
  authenticate,
  getPublicCourseById
);

export default router;