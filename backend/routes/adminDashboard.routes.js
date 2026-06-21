import express from "express";

import {
  getAdminDashboardSummary,
} from "../controllers/adminDashboardController.js";

import {
  authenticate, authorizeRoles
} from "../middleware/auth.js";



const router =
  express.Router();



// ======================================================
// ADMIN DASHBOARD SUMMARY
// ======================================================

router.get(
  "/summary",
  authenticate,
  authorizeRoles(
    "admin",
    "superadmin"
  ),
  getAdminDashboardSummary
);



export default router;
