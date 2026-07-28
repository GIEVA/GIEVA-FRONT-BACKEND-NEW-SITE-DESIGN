// routes/adminStaff.routes.js
import express from "express";

import {
    adminGetStaffList,
    adminGetStaff,
    createStaff,
    updateStaff,
    deleteStaff,
    getStaffStats,
} from "../controllers/adminStaff.controller.js";

import { authenticate, authorizeRoles } from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.get("/", adminGetStaffList);
router.get("/stats", getStaffStats);
router.get("/:id", adminGetStaff);

router.post("/", authenticate, upload.single("image"), createStaff);
router.put("/:id", authenticate, upload.single("image"), updateStaff);
router.delete("/:id", authenticate, deleteStaff);

export default router;