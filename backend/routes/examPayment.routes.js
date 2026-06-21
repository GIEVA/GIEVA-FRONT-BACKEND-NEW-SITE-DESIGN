import express from "express";

import {
initializeExamPayment,
verifyExamPayment,
downloadReceipt,
} from "../controllers/ExamRegistrationPaymentController.js";

import { authenticate } from "../middleware/auth.js";

const router = express.Router();

/**

* Initialize Paystack Payment
  */
  router.post(
  "/initialize",
  authenticate,
  initializeExamPayment
  );

/**

* Verify Payment
  */
  router.post(
  "/verify",
  authenticate,
  verifyExamPayment
  );

/**

* Download Receipt
  */
  router.get(
  "/receipt/:id",
  authenticate,
  downloadReceipt
  );

export default router;
