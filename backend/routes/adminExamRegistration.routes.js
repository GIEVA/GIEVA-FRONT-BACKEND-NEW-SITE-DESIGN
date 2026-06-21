import express from "express";

import {
  getRegistrations,
  adminGetRegistration,
  adminDownloadExamReceipt,
  assignRegistration,

  updateRegistrationStatusController,

  updateAdminNotes,

  deleteRegistration,

  getExamRegistrationStats,
  exportRegistrations,

  getExamPayments,
  getExamPaymentById,

  resendRegistrationEmail,
  

  addComment,
} from "../controllers/adminExamRegistration.controller.js";

import {
  authenticate, authorizeRoles
} from "../middleware/auth.js";



const router = express.Router();

/**
 * =====================================================
 * REGISTRATION DASHBOARD
 * =====================================================
 */

// Dashboard Stats
router.get(
  "/exam-registrations/stats",
  authenticate,
  authorizeRoles(
    "superadmin",
    "operational_admin"
  ),
  getExamRegistrationStats
);

// Export Registrations
router.get(
  "/exam-registrations/export",
  authenticate,
  authorizeRoles(
    "superadmin",
    "operational_admin"
  ),
  exportRegistrations
);

// All Registrations
router.get(
  "/exam-registrations",
  authenticate,
  authorizeRoles(
    "superadmin",
    "operational_admin"
  ),
  getRegistrations
);

// Single Registration
router.get(
  "/exam-registrations/:id",
  authenticate,
  authorizeRoles(
    "superadmin",
    "operational_admin"
  ),
  adminGetRegistration
);

/**
 * =====================================================
 * PROCESSING ACTIONS
 * =====================================================
 */

// Assign Registration
router.patch(
  "/exam-registrations/:id/assign",
  authenticate,
  authorizeRoles(
    "superadmin",
    "operational_admin"
  ),
  assignRegistration
);

router.patch(
  "/exam-registrations/:id/status",
  authenticate,
  authorizeRoles(
    "superadmin",
    "operational_admin"
  ),
  updateRegistrationStatusController
);

// Update Notes
router.patch(
  "/exam-registrations/:id/notes",
  authenticate,
  authorizeRoles(
    "superadmin",
    "operational_admin"
  ),
  updateAdminNotes
);

/**
 * =====================================================
 * COMMENTS
 * =====================================================
 */

router.post(
  "/exam-registrations/:id/comments",
  authenticate,
  authorizeRoles(
    "superadmin",
    "operational_admin"
  ),
  addComment
);

/**
 * =====================================================
 * EMAILS
 * =====================================================
 */

router.post(
  "/exam-registrations/:id/resend-email",
  authenticate,
  authorizeRoles(
    "superadmin",
    "operational_admin"
  ),
  resendRegistrationEmail
);

/**
 * =====================================================
 * PAYMENTS
 * =====================================================
 */

// All Exam Payments
router.get(
  "/exam-registrations/payments/all",
  authenticate,
  authorizeRoles(
    "superadmin",
    "operational_admin"
  ),
  getExamPayments
);

// Single Exam Payment
router.get(
  "/exam-registrations/payments/:id",
  authenticate,
  authorizeRoles(
    "superadmin",
    "operational_admin"
  ),
  getExamPaymentById
);

/**
 * =====================================================
 * DELETE
 * =====================================================
 */

router.delete(
  "/del/exam-registrations/:id",
  authenticate,
  authorizeRoles("superadmin"),
  deleteRegistration
);

router.get(
  "/exam-registrations/payments/:id/receipt",
  authenticate,
  authorizeRoles(
    "superadmin",
    "operational_admin"
  ),
  adminDownloadExamReceipt
);

export default router;