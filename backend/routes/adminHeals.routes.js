import express from "express";
import {
  adminGetApplications,
  adminGetApplicationById,
  verifyApplicationDocuments,
  updateApplicationStatus,
  sendPaymentRequest,
  startProcessing,
  completeApplication,
  getApplicationPayments,
  
} from "../controllers/adminHealsApplication.controller.js";

import { authenticate, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticate, authorizeRoles("admin", "superadmin", "operational_admin", "reviewer"));

router.get("/applications", adminGetApplications);
router.get("/applications/:id", adminGetApplicationById);
router.put("/applications/:id/verify-documents", verifyApplicationDocuments);
router.put("/applications/:id/status", updateApplicationStatus);
router.post("/:id/send-payment-request", sendPaymentRequest);
router.put("/applications/:id/start-processing", startProcessing);
router.put("/applications/:id/complete", completeApplication);
router.get("/applications/:id/payments", getApplicationPayments);

export default router;