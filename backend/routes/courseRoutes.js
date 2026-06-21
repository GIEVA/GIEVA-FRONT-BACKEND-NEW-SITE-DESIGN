import express from "express";
import {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  toggleCoursePublishStatus
} from "../controllers/courseController.js";

import {authenticate, authorizeRoles} from "../middleware/auth.js";

const router = express.Router();


console.log("✅ COURSE ROUTES LOADED");

router.post("/courses", authenticate, createCourse);

router.get("/courses", getCourses);

router.get("/courses/:id", getCourseById);

router.put(
  "/courses/:id",
  authenticate,
  authorizeRoles("admin"),
  updateCourse
);

router.delete(
  "/courses/:id",
  authenticate,
  authorizeRoles("admin"),
  deleteCourse
);


router.patch(
  "/courses/:id/publish",
  authenticate,
  toggleCoursePublishStatus
);

export default router;