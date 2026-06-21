import express from "express";

import {
  getTutorDashboardSummary,
} from "../controllers/tutorDashboard.controller.js";

import {
  authenticate, authorizeRoles
} from "../middleware/auth.js";

const router =
  express.Router();



// ======================================================
// TUTOR DASHBOARD
// ======================================================

router.get(
  "/dashboard/me",
  authenticate,
  authorizeRoles("tutor"),
  getTutorDashboardSummary
);



export default router;