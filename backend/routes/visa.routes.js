// routes/visa.routes.js
// Mount:  app.use("/api/visa", visaRoutes);
//
// ⚠️ The Paystack webhook needs the RAW body to check the signature, so mount this router
//    BEFORE app.use(express.json()), or add the raw parser for that one path yourself:
//      app.post("/api/visa/payments/webhook", express.raw({ type: "*/*" }), visaPaymentWebhook);

import express from "express";
import rateLimit from "express-rate-limit";

// Same helpers your HEALS routes use
import { authenticate, authorizeRoles } from "../middleware/auth.js";
import upload from "../middleware/upload.js";   // your Cloudinary upload middleware

import {
  getPublicSettings, startApplication, listMyApplications, getMyApplication, saveDraft, deleteDraft,
  uploadDocument, removeDocument, getMyDocumentUrl, resubmitAfterInfo, downloadMyPdf,
} from "../controllers/visaApplication.controller.js";
import { initializeVisaPayment, verifyVisaPayment, visaPaymentWebhook, listMyVisaPayments } from "../controllers/visaPayment.controller.js";
import {
  adminListApplications, adminGetApplication, adminUpdateStatus, adminAddNote, adminAssign, adminGetDocumentUrl,
  adminDownloadPdf, adminResendSubmissionEmail, adminStats, adminListPayments, adminExportCsv,
} from "../controllers/adminVisa.controller.js";
import { getAdminFee, updateFee, getAdminAvailability, updateAvailability } from "../controllers/adminVisaSettings.controller.js";

const router = express.Router();
const payLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false });
const uploadLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 40, standardHeaders: true, legacyHeaders: false });

// Public: Paystack calls this (signature-verified inside)
router.post("/payments/webhook", express.raw({ type: "*/*" }), visaPaymentWebhook);

// Everything below needs a logged-in user ("protected service")
router.use(authenticate);

// ── Applicant ──
router.get("/settings", getPublicSettings);
router.post("/applications", startApplication);
router.get("/applications", listMyApplications);
router.get("/applications/:id", getMyApplication);
router.patch("/applications/:id", saveDraft);
router.delete("/applications/:id", deleteDraft);
router.post("/applications/:id/documents/:type", uploadLimiter, upload.single("file"), uploadDocument);
router.delete("/applications/:id/documents/:type", removeDocument);
router.get("/applications/:id/documents/:type/url", getMyDocumentUrl);
router.post("/applications/:id/resubmit", resubmitAfterInfo);
router.get("/applications/:id/pdf", downloadMyPdf);

router.post("/payments/initialize", payLimiter, initializeVisaPayment);
router.post("/payments/verify", payLimiter, verifyVisaPayment);
router.get("/payments", listMyVisaPayments);

// ── Admin ──
const admin = express.Router();
admin.use(authorizeRoles("admin", "superadmin", "operational_admin"));
admin.get("/stats", adminStats);
admin.get("/export.csv", adminExportCsv);
admin.get("/payments", adminListPayments);
// Fees and availability: admin / superadmin only (operational admins can work applications but not change prices)
const settingsRoles = authorizeRoles("admin", "superadmin");
admin.get("/settings/fee", settingsRoles, getAdminFee);
admin.put("/settings/fee", settingsRoles, updateFee);
admin.get("/settings/availability", settingsRoles, getAdminAvailability);
admin.put("/settings/availability", settingsRoles, updateAvailability);
admin.get("/applications", adminListApplications);
admin.get("/applications/:id", adminGetApplication);
admin.patch("/applications/:id/status", adminUpdateStatus);
admin.post("/applications/:id/notes", adminAddNote);
admin.patch("/applications/:id/assign", adminAssign);
admin.get("/applications/:id/documents/:type/url", adminGetDocumentUrl);
admin.get("/applications/:id/pdf", adminDownloadPdf);
admin.post("/applications/:id/resend-email", adminResendSubmissionEmail);
router.use("/admin", admin);

export default router;
