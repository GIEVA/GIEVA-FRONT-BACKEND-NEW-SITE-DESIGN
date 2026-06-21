import express from "express";

import {getAllUsers} from "../controllers/userRegController.js";

import {    exportRegistrationsCSV, 
            exportRegistrationsExcel, 
            getNotifications,
            markNotificationRead,
            createCourse,
            getAllCoursesAdmin,
            getCourseByIdAdmin,
            updateCourseAdmin,
            deleteCourseAdmin,
             getAllApplications,
             getApplicationById,
            verifyDocuments,
            updateApplicationStatus,
            //sendPaymentRequest,
            startProcessing,
            markApplicationCompleted,
            getApplicationPayments,
            getActivityLogs
        } from "../controllers/adminPrivilegeController.js";
import { sendPaymentRequest } from "../controllers/healsApplication.controller.js";

import { authenticate, authorizeRoles} from "../middleware/auth.js";

const router = express.Router();


// ======================================================
// ACTIVITY LOGS
// ======================================================

router.get(

  "/activity-logs",

  authenticate,

  authorizeRoles(
    "admin",
    "superadmin"
  ),

  getActivityLogs
);

// export routes
router.get("/export/csv", authenticate,  exportRegistrationsCSV);
router.get("/export/excel", authenticate, exportRegistrationsExcel);

// notification routes
router.get("/notifications", authenticate, getNotifications);
router.put("/notifications/:id/read", authenticate, markNotificationRead);




// Get all users (admin only)
router.get('/', authenticate, authorizeRoles("superadmin"), getAllUsers);


// =============================================
// APPLICATIONS
// =============================================

router.get(
  "/heals/applications",
  authorizeRoles(
    "admin",
    "superadmin"
  ),
  getAllApplications
);

router.get(
  "/heals/applications/:id",
  authorizeRoles(
    "admin",
    "superadmin"
  ),
  getApplicationById
);

// =============================================
// VERIFY DOCUMENTS
// =============================================

router.put(
  "/heals/applications/:id/verify-documents",
  authorizeRoles(
    "admin",
    "superadmin"
  ),
  verifyDocuments
);


// =============================================
// STATUS UPDATE
// =============================================

router.put(
  "/heals/applications/:id/status",
  authorizeRoles(
    "admin",
    "superadmin"
  ),
  updateApplicationStatus
);


// =============================================
// SEND PAYMENT REQUEST
// =============================================

router.post(
  "/heals/applications/:id/send-payment-request",
  authorizeRoles(
    "admin",
    "superadmin"
  ),
  sendPaymentRequest
);


// =============================================
// START PROCESSING
// =============================================

router.put(
  "/heals/applications/:id/start-processing",
  authorizeRoles(
    "admin",
    "superadmin"
  ),
  startProcessing
);


// =============================================
// COMPLETE APPLICATION
// =============================================

router.put(
  "/heals/applications/:id/complete",
  authorizeRoles(
    "admin",
    "superadmin"
  ),
  markApplicationCompleted
);


// =============================================
// PAYMENTS
// =============================================

router.get(
  "/applications/:id/payments",
  authorizeRoles(
    "admin",
    "superadmin"
  ),
  getApplicationPayments
);

export default router;