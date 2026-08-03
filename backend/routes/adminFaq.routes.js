import express from "express";
import {
  adminGetFaqs,
  adminGetFaq,
  createFaq,
  updateFaq,
  deleteFaq,
  getFaqStats,
} from "../controllers/adminFaqController.js";
import { authenticate, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

router.get("/", adminGetFaqs);
router.get("/stats", getFaqStats); // before /:id
router.get("/:id", adminGetFaq);

router.post("/", authenticate, createFaq);
router.put("/:id", authenticate, updateFaq);
router.delete("/:id", authenticate, deleteFaq);

export default router;