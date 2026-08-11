// routes/admin/service.routes.js

import express from "express";

import {
    adminGetServices,
    adminGetService,
    createService,
    updateService,
    deleteService,
    getServiceStats,
} from "../controllers/adminService.controller.js";

import { authenticate, authorizeRoles} from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// router.use(authenticate);
// router.use(authorizeRoles);

router.get("/", adminGetServices);

router.get("/stats", getServiceStats);

router.get("/:id", adminGetService);

router.post("/", authenticate, upload.single("image"), createService);

router.put("/:id",authenticate, upload.single("image"), updateService);

router.delete("/:id", deleteService);

export default router;