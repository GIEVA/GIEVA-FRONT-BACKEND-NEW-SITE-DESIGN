// routes/adminPartner.routes.js
import express from "express";
import {
    adminGetPartners,
    adminGetPartner,
    createPartner,
    updatePartner,
    deletePartner,
    getPartnerStats,
} from "../controllers/adminPartner.controller.js";

import { authenticate, authorizeRoles } from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.get("/", adminGetPartners);
router.get("/stats", getPartnerStats);   // before /:id
router.get("/:id", adminGetPartner);

router.post("/", authenticate, upload.single("image"), createPartner);
router.put("/:id", authenticate, upload.single("image"), updatePartner);
router.delete("/:id", authenticate, deletePartner);

export default router;