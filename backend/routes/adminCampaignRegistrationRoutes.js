import express from "express";
import {
  getAllRegistrations,
  getRegistrationById,
  updateRegistration,
  deleteRegistration,
  getRegistrationAnalytics,
} from "../controllers/adminCampaignRegistration.controller.js";
import { authenticate, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

// ======================================================
// ADMIN ACCESS
// ======================================================
router.use(authenticate, authorizeRoles("admin", "superadmin", "agent"));

// ======================================================
// ANALYTICS — must come before /:id, or "analytics" gets
// swallowed as an :id param and 500s trying to findByPk("analytics")
// ======================================================
router.get("/analytics", getRegistrationAnalytics);

// ======================================================
// GET ALL
// ======================================================
router.get("/", getAllRegistrations);

// ======================================================
// GET ONE
// ======================================================
router.get("/:id", getRegistrationById);

// ======================================================
// UPDATE
// ======================================================
router.put("/:id", updateRegistration);

// ======================================================
// DELETE
// ======================================================
router.delete("/:id", deleteRegistration);

export default router;