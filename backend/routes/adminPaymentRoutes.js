// routes/adminPaymentRoutes.js
//
// Mount in server.js / app.js as:
//   import adminPaymentRoutes from "./routes/adminPaymentRoutes.js";
//   app.use("/api/admin/payments", adminPaymentRoutes);
//
// All routes require:  authenticate (JWT) + admin role (enforced in controller)

import express from "express";
import { authenticate } from "../middleware/auth.js";

import {
  getPaymentOverview,
  getCoursePayments,
  getCoursePaymentById,
  getHealsPayments,
  getHealsPaymentById,
  getExamPayments,
  getExamPaymentById,
  getRecentPayments,
  getUserPaymentHistory,
  markPaymentRefunded,
} from "../controllers/adminPaymentController.js";

const router = express.Router();

// ── All routes require a valid admin JWT ──────────────────────
router.use(authenticate);

// ─────────────────────────────────────────────────────────────
// OVERVIEW & ANALYTICS
// ─────────────────────────────────────────────────────────────

/**
 * GET /api/admin/payments/overview
 * Platform-wide revenue summary across all three domains.
 * Query: from?, to?  (ISO date strings)
 *
 * Returns:
 *   summary    { totalRevenue, totalTransactions, totalSuccess,
 *                totalPending, totalFailed, successRate }
 *   byDomain   { course, heals, exam }  — each with { total, success, pending, failed, revenue }
 *   monthlyRevenue  [{ month, course, heals, exam, total }]  — last 6 months
 */
router.get("/overview", getPaymentOverview);

/**
 * GET /api/admin/payments/recent
 * Merged feed of the most recent transactions across all three tables.
 * Query: limit? (default 20, max 50)
 *
 * Returns: payments[]  — normalized to a common shape with a `domain` field
 */
router.get("/recent", getRecentPayments);

// ─────────────────────────────────────────────────────────────
// COURSE PAYMENTS
// ─────────────────────────────────────────────────────────────

/**
 * GET /api/admin/payments/course
 * Paginated list of course/LMS payments.
 * Query: page, limit, status (pending|success|failed|refunded),
 *        search (name or email), from, to
 */
router.get("/course", getCoursePayments);

/**
 * GET /api/admin/payments/course/:id
 * Full detail for one course payment including user + course info.
 */
router.get("/course/:id", getCoursePaymentById);

// ─────────────────────────────────────────────────────────────
// HEALS PAYMENTS
// ─────────────────────────────────────────────────────────────

/**
 * GET /api/admin/payments/heals
 * Paginated list of HEALS application payments.
 * Query: page, limit, status, type (application_fee|visa_processing|…),
 *        search, from, to
 */
router.get("/heals", getHealsPayments);

/**
 * GET /api/admin/payments/heals/:id
 * Full detail for one HEALS payment including user + application info.
 */
router.get("/heals/:id", getHealsPaymentById);

// ─────────────────────────────────────────────────────────────
// EXAM PAYMENTS
// ─────────────────────────────────────────────────────────────

/**
 * GET /api/admin/payments/exam
 * Paginated list of exam registration payments.
 * Query: page, limit, status, examType (partial match),
 *        search, from, to
 */
router.get("/exam", getExamPayments);

/**
 * GET /api/admin/payments/exam/:id
 * Full detail for one exam payment including user + registration info.
 */
router.get("/exam/:id", getExamPaymentById);

// ─────────────────────────────────────────────────────────────
// PER-USER HISTORY
// ─────────────────────────────────────────────────────────────

/**
 * GET /api/admin/payments/user/:userId
 * All payments (all three domains) for a single user.
 * Returns per-domain arrays + a spending summary.
 */
router.get("/user/:userId", getUserPaymentHistory);

// ─────────────────────────────────────────────────────────────
// REFUND OVERRIDE
// ─────────────────────────────────────────────────────────────

/**
 * PATCH /api/admin/payments/:domain/:id/refund
 * Manually mark a successful payment as refunded.
 * :domain  must be "course" | "heals" | "exam"
 * Body:    { reason?: string }
 *
 * Only works on payments with status === "success".
 * Creates an ActivityLog entry for the audit trail.
 */
router.patch("/:domain/:id/refund", markPaymentRefunded);

export default router;
