import express from "express";
import {
  adminGetProjects, adminGetProject,
  createProject, updateProject, deleteProject, getProjectStats,
} from "../controllers/adminProjectController.js";
import { authenticate } from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.get("/", adminGetProjects);
router.get("/stats", getProjectStats); // before /:id
router.get("/:id", adminGetProject);

router.post("/", authenticate, upload.single("image"), createProject);
router.put("/:id", authenticate, upload.single("image"), updateProject);
router.delete("/:id", authenticate, deleteProject);

export default router;