import express from "express";
import {
  initializeCoursePayment,
  verifyPayment,
  downloadReceipt,
} from "../controllers/paymentController.js";
import {authenticate} from "../middleware/auth.js";

const router = express.Router();

router.post("/initialize", authenticate, initializeCoursePayment);
router.post("/verify", authenticate, verifyPayment);

router.get("/:id/receipt", authenticate, downloadReceipt);

export default router;
