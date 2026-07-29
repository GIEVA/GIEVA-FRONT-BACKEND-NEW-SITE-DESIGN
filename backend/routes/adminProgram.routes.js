// routes/adminProgram.routes.js
import express from "express";
import {
    adminGetPrograms,
    adminGetProgram,
    createProgram,
    updateProgram,
    deleteProgram,
    getProgramStats,
} from "../controllers/adminProgram.controller.js";

import { authenticate, authorizeRoles } from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.get("/", adminGetPrograms);
router.get("/stats", getProgramStats);   // must come before /:id
router.get("/:id", adminGetProgram);

// upload.any() — needed because we don't know section image field names
// in advance (they're keyed by section id: sectionImage_<id>)
router.post("/", authenticate, upload.any(), createProgram);
router.put("/:id", authenticate, upload.any(), updateProgram);
router.delete("/:id", authenticate, deleteProgram);

export default router;