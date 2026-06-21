// routes/moduleRoutes.js

import express from "express";
import {
  createModule,
  getCourseModules,
  updateModule,
  deleteModule,
  toggleModulePublishStatus
} from "../controllers/moduleController.js";

import {authenticate, authorizeRoles} from "../middleware/auth.js";

const router = express.Router();

router.post("/create", authenticate, createModule);
router.get("/course/:courseId", authenticate, getCourseModules);
router.put("/:id", authenticate, updateModule);
router.delete("/delete/:id", authenticate, deleteModule);
router.patch(
  "/:id/publish",
  authenticate,
  toggleModulePublishStatus
);

export default router;