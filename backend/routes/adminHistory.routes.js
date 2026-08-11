import { Router } from "express";
import { adminGetHistory, upsertHistory, resetHistory } from "../controllers/adminHistoryController.js";
import { authenticate, authorizeRoles } from "../middleware/auth.js"; // adjust to your actual auth middleware

import upload from "../middleware/upload.js";

const router = Router();

router.use(authenticate, authorizeRoles("superadmin", "admin"));

router.get("/", adminGetHistory);
router.put("/", upload.any(), upsertHistory);
router.post("/reset", resetHistory);

export default router;