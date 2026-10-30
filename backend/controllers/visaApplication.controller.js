// controllers/visaApplication.controller.js  (applicant side)
import models from "../models/index.js";
import {
  sanitizeDraft, DOCUMENT_TYPES, MAX_UPLOAD_BYTES, getMissingFields, getMissingDocuments,
} from "../config/visaRequirements.js";
import { cloudinary } from "../config/cloudinary.js";
import { getVisaSettings } from "../service/visaSettings.js";
import { toApplicantView, addStatusEvent, buildApplicationPdf } from "../service/visaCore.js";

const { VisaApplication, VisaPayment, VisaStatusEvent, User, Notification, ActivityLog } = models;

const OPEN_FOR_EDIT = ["draft"];            // answers can only be edited before payment
const OPEN_FOR_DOCS = ["draft", "info_required"]; // documents can be replaced when admin asks for more info

const findMine = (req) => VisaApplication.findOne({ where: { id: req.params.id, userId: req.user.id } });

// Public (logged-in) settings: fees + whether applications are open
export const getPublicSettings = async (_req, res) => {
  const s = await getVisaSettings();
  res.json({
    normalFee: s.normalFee, expeditedFee: s.expeditedFee, currency: s.currency,
    isOpen: s.isOpen, closedMessage: s.closedMessage, instructions: s.instructions,
    documents: Object.entries(DOCUMENT_TYPES).map(([key, d]) => ({ key, label: d.label })),
  });
};

// No login needed: powers the public guideline page (/visa). Only what is safe to show anyone.
export const getPublicVisaInfo = async (_req, res) => {
  try {
    const s = await getVisaSettings();
    res.json({
      normalFee: s.normalFee, expeditedFee: s.expeditedFee, currency: s.currency,
      isOpen: s.isOpen, closedMessage: s.closedMessage,
      documents: Object.values(DOCUMENT_TYPES).map((d) => d.label),
    });
  } catch (err) {
    console.error("[visa] public info", err);
    res.status(500).json({ message: "Could not load visa information" });
  }
};

// Start (or resume) a draft. One open draft per user keeps things tidy.
export const startApplication = async (req, res) => {
  try {
    const settings = await getVisaSettings();
    if (!settings.isOpen) return res.status(403).json({ message: settings.closedMessage || "Visa applications are currently closed." });

    const existing = await VisaApplication.findOne({ where: { userId: req.user.id, status: "draft" }, order: [["updatedAt", "DESC"]] });
    if (existing) return res.json({ application: toApplicantView(existing), resumed: true });

    // Pre-fill from the account so the applicant types less
    const user = await User.findByPk(req.user.id).catch(() => null);
    const app = await VisaApplication.create({
      userId: req.user.id,
      email: (user?.email || "").toLowerCase(),
      firstName: user?.firstName || (user?.fullName || "").split(" ")[0] || "",
      lastName: user?.lastName || (user?.fullName || "").split(" ").slice(1).join(" ") || "",
      phone: user?.phone || user?.phoneNumber || "",
    });
    res.status(201).json({ application: toApplicantView(app), resumed: false });
  } catch (err) {
    console.error("[visa] start", err);
    res.status(500).json({ message: "Could not start the application" });
  }
};

export const listMyApplications = async (req, res) => {
  const rows = await VisaApplication.findAll({
    where: { userId: req.user.id },
    order: [["createdAt", "DESC"]],
    attributes: ["id", "applicationCode", "status", "appointmentType", "interviewLocation", "firstName", "lastName", "applicationFeePaid", "applicationFeeAmount", "currency", "interviewDate", "statusNote", "statusUpdatedAt", "submittedAt", "createdAt", "updatedAt"],
  });
  res.json({ applications: rows });
};

export const getMyApplication = async (req, res) => {
  const app = await findMine(req);
  if (!app) return res.status(404).json({ message: "Application not found" });
  const [events, payments] = await Promise.all([
    VisaStatusEvent.findAll({ where: { applicationId: app.id }, order: [["createdAt", "ASC"]], attributes: ["id", "fromStatus", "toStatus", "note", "actorType", "createdAt"] }),
    VisaPayment.findAll({ where: { applicationId: app.id }, order: [["createdAt", "DESC"]], attributes: ["id", "paymentCode", "transactionRef", "status", "totalAmount", "currency", "paymentMethod", "paidAt", "createdAt"] }),
  ]);
  res.json({
    application: toApplicantView(app), events, payments,
    missing: app.status === "draft" ? { fields: getMissingFields(app), documents: getMissingDocuments(app) } : undefined,
  });
};

// Autosave. Whitelisted + cleaned; status/fee/userId can never be set from here.
export const saveDraft = async (req, res) => {
  try {
    const app = await findMine(req);
    if (!app) return res.status(404).json({ message: "Application not found" });
    if (!OPEN_FOR_EDIT.includes(app.status)) return res.status(400).json({ message: "A submitted application can no longer be edited" });
    await app.update(sanitizeDraft(req.body));
    res.json({ application: toApplicantView(app), savedAt: new Date() });
  } catch (err) {
    console.error("[visa] save", err);
    res.status(500).json({ message: "Could not save your changes" });
  }
};

export const deleteDraft = async (req, res) => {
  const app = await findMine(req);
  if (!app) return res.status(404).json({ message: "Application not found" });
  if (app.status !== "draft") return res.status(400).json({ message: "Only drafts can be deleted" });
  const hasPayment = await VisaPayment.count({ where: { applicationId: app.id, status: "success" } });
  if (hasPayment) return res.status(400).json({ message: "This application has a payment and cannot be deleted" });
  await Promise.all(Object.values(app.documents || {}).map((d) => deleteDocument(d.publicId)));
  await app.destroy();
  res.json({ message: "Draft deleted" });
};

// Removes a file from Cloudinary. PDFs may be stored as "raw", so try that too. Never throws.
const destroyAsset = async (publicId) => {
  if (!publicId) return;
  try {
    const r = await cloudinary.uploader.destroy(publicId);
    if (r?.result === "not found") await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
  } catch (e) {
    console.error("Cloudinary cleanup failed:", e.message);
  }
};
const deleteDocument = destroyAsset; // (name kept for the calls below)

// The file is already in Cloudinary when this runs (your `upload` middleware stores it):
// file.path = the URL, file.filename = the public id. We validate it and keep both in the database.
export const uploadDocument = async (req, res) => {
  const file = req.file;
  try {
    const type = DOCUMENT_TYPES[req.params.type];
    if (!type) { await destroyAsset(file?.filename); return res.status(400).json({ message: "Unknown document type" }); }
    const app = await findMine(req);
    if (!app) { await destroyAsset(file?.filename); return res.status(404).json({ message: "Application not found" }); }
    if (!OPEN_FOR_DOCS.includes(app.status)) { await destroyAsset(file?.filename); return res.status(400).json({ message: "Documents can no longer be changed" }); }
    if (!file) return res.status(400).json({ message: "No file received" });

    if (file.size && file.size > MAX_UPLOAD_BYTES) { await destroyAsset(file.filename); return res.status(400).json({ message: "File is larger than 5 MB" }); }
    const mime = file.mimetype || "";
    if (!type.mimes.includes(mime)) {
      await destroyAsset(file.filename);
      return res.status(400).json({ message: `This document must be: ${type.mimes.map((m) => m.split("/")[1].toUpperCase()).join(", ")}` });
    }

    const previous = app.documents?.[req.params.type]?.publicId;
    const doc = {
      url: file.path, publicId: file.filename,
      name: String(file.originalname || req.params.type).replace(/[^\w.\- ]/g, "_").slice(0, 120),
      mime, size: file.size || 0, uploadedAt: new Date(),
    };
    app.documents = { ...(app.documents || {}), [req.params.type]: doc };
    app.changed("documents", true);
    await app.save();
    if (previous && previous !== doc.publicId) await destroyAsset(previous);

    res.json({ message: "Uploaded", document: { name: doc.name, mime: doc.mime, size: doc.size, uploadedAt: doc.uploadedAt } });
  } catch (err) {
    console.error("[visa] upload", err);
    await destroyAsset(file?.filename);
    res.status(500).json({ message: "Upload failed" });
  }
};

export const removeDocument = async (req, res) => {
  const app = await findMine(req);
  if (!app) return res.status(404).json({ message: "Application not found" });
  if (app.status !== "draft") return res.status(400).json({ message: "Documents can no longer be removed" });
  const d = app.documents?.[req.params.type];
  if (!d) return res.status(404).json({ message: "Document not found" });
  await deleteDocument(d.publicId);
  const next = { ...app.documents }; delete next[req.params.type];
  app.documents = next; app.changed("documents", true); await app.save();
  res.json({ message: "Removed" });
};

export const getMyDocumentUrl = async (req, res) => {
  const app = await findMine(req);
  const d = app?.documents?.[req.params.type];
  if (!d) return res.status(404).json({ message: "Document not found" });
  res.json({ url: d.url });
};

// The applicant answered an "info required" request: back to the review queue
export const resubmitAfterInfo = async (req, res) => {
  try {
    const app = await findMine(req);
    if (!app) return res.status(404).json({ message: "Application not found" });
    if (app.status !== "info_required") return res.status(400).json({ message: "Nothing is waiting on you" });
    const reply = String(req.body?.message || "").trim().slice(0, 1000);

    await app.update({ status: "under_review", statusUpdatedAt: new Date() });
    await addStatusEvent(app.id, "info_required", "under_review", { note: reply || "Applicant provided the requested information.", actorId: req.user.id, actorType: "user" });
    await Notification?.create({ title: "Applicant replied", message: `${app.firstName} ${app.lastName} responded on ${app.applicationCode}`, type: "application", entityId: app.id, entityType: "visa" }).catch(() => {});
    res.json({ message: "Thank you. We'll review your update.", application: toApplicantView(app) });
  } catch (err) {
    console.error("[visa] resubmit", err);
    res.status(500).json({ message: "Could not send your update" });
  }
};

export const downloadMyPdf = async (req, res) => {
  try {
    const app = await findMine(req);
    if (!app) return res.status(404).json({ message: "Application not found" });
    if (app.status === "draft") return res.status(400).json({ message: "Submit and pay first to get your PDF" });
    const pdf = await buildApplicationPdf(app);
    res.set({ "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${app.applicationCode}.pdf"`, "Cache-Control": "no-store" });
    res.send(pdf);
  } catch (err) {
    console.error("[visa] pdf", err);
    res.status(500).json({ message: "Could not generate the PDF" });
  }
};