import express from "express";
import { authenticate } from "../middleware/auth.js";
import {
  initializeApplicationPayment,
  verifyHealsPayment,
  getMyHealsPayments,
  getHealsPaymentById,
} from "../controllers/healsPaymentController.js";

const router = express.Router();

// Start checkout for a draft application
router.post("/checkout", authenticate, initializeApplicationPayment);

// Called by the payment callback page after Paystack redirects back
router.post("/verify", authenticate, verifyHealsPayment);

// Payment history
router.get("/my-payments", authenticate, getMyHealsPayments);
router.get("/:id", authenticate, getHealsPaymentById);

export default router;