// controllers/adminVisa.controller.js  (admin side; routes are behind requireAdmin)
import { Op, fn, col, literal } from "sequelize";
import models from "../models/index.js";
import { ALLOWED_TRANSITIONS, STATUS_LABELS } from "../config/visaRequirements.js";
import { addStatusEvent, buildApplicationPdf, sendSubmissionEmail, sendStatusEmail } from "../service/visaCore.js";

const { VisaApplication, VisaPayment, VisaStatusEvent, VisaNote, User, ActivityLog } = models;

// Postgres needs iLike for case-insensitive search; MySQL/MariaDB are already case-insensitive with like.
const IS_PG = VisaApplication.sequelize.getDialect() === "postgres";
const LIKE = IS_PG ? Op.iLike : Op.like;
// "2026-10" style month bucket for each dialect (your database is MySQL)
const MONTH_EXPR = IS_PG ? `TO_CHAR("submittedAt", 'YYYY-MM')` : "DATE_FORMAT(`submittedAt`, '%Y-%m')";
const clampInt = (v, d, min, max) => Math.min(max, Math.max(min, parseInt(v, 10) || d));
const like = (s) => `%${String(s).replace(/[%_\\]/g, "\\$&")}%`;

const buildWhere = (q) => {
  const where = {};
  if (q.includeDrafts !== "true") where.status = { [Op.ne]: "draft" };
  if (q.status && q.status !== "all") where.status = q.status;
  if (["normal", "expedited"].includes(q.appointmentType)) where.appointmentType = q.appointmentType;
  if (["abuja", "lagos"].includes(q.location)) where.interviewLocation = q.location;
  if (q.assignedTo) where.assignedTo = Number(q.assignedTo);
  if (q.from || q.to) {
    where.submittedAt = {};
    if (q.from) where.submittedAt[Op.gte] = new Date(q.from);
    if (q.to) where.submittedAt[Op.lte] = new Date(`${q.to}T23:59:59.999Z`);
  }
  if (q.search?.trim()) {
    const s = like(q.search.trim().slice(0, 80));
    where[Op.or] = [
      { applicationCode: { [LIKE]: s } }, { firstName: { [LIKE]: s } }, { lastName: { [LIKE]: s } },
      { email: { [LIKE]: s } }, { phone: { [LIKE]: s } },
    ];
  }
  return where;
};

const LIST_ATTRS = ["id", "applicationCode", "status", "appointmentType", "interviewLocation", "firstName", "lastName", "email", "phone", "applicationFeePaid", "applicationFeeAmount", "currency", "interviewDate", "assignedTo", "submittedAt", "statusUpdatedAt", "createdAt"];

// GET /admin/visa/applications?status&search&appointmentType&location&from&to&page&limit&sort
export const adminListApplications = async (req, res) => {
  try {
    const page = clampInt(req.query.page, 1, 1, 100000);
    const limit = clampInt(req.query.limit, 20, 1, 100);
    const dir = req.query.dir === "asc" ? "ASC" : "DESC";
    const sortCol = ["submittedAt", "createdAt", "lastName", "status"].includes(req.query.sort) ? req.query.sort : "submittedAt";
    const { rows, count } = await VisaApplication.findAndCountAll({
      where: buildWhere(req.query), attributes: LIST_ATTRS, limit, offset: (page - 1) * limit,
      order: [[sortCol, dir], ["id", "DESC"]],
    });
    res.json({ applications: rows, total: count, page, pages: Math.ceil(count / limit) });
  } catch (err) {
    console.error("[visa-admin] list", err);
    res.status(500).json({ message: "Could not load applications" });
  }
};

// GET /admin/visa/applications/:id  (everything, incl. timeline, internal notes, payments)
export const adminGetApplication = async (req, res) => {
  try {
    const app = await VisaApplication.findByPk(req.params.id);
    if (!app) return res.status(404).json({ message: "Application not found" });
    const [events, notes, payments, applicant] = await Promise.all([
      VisaStatusEvent.findAll({ where: { applicationId: app.id }, order: [["createdAt", "ASC"]] }),
      VisaNote.findAll({ where: { applicationId: app.id }, order: [["createdAt", "DESC"]], include: User ? [{ model: User, as: "author", attributes: ["id", "fullName", "firstName", "lastName"], required: false }] : [] }),
      VisaPayment.findAll({ where: { applicationId: app.id }, order: [["createdAt", "DESC"]], attributes: { exclude: ["gatewayResponse"] } }),
      User ? User.findByPk(app.userId, { attributes: ["id", "email", "fullName", "firstName", "lastName"] }).catch(() => null) : null,
    ]);
    const j = app.toJSON();
    // Admin sees document metadata; the file itself is fetched through a short-lived signed link
    Object.keys(j.documents || {}).forEach((k) => { j.documents[k] = { name: j.documents[k].name, mime: j.documents[k].mime, size: j.documents[k].size, uploadedAt: j.documents[k].uploadedAt }; });
    res.json({ application: j, events, notes, payments, applicant, allowedNext: ALLOWED_TRANSITIONS[app.status] || [] });
  } catch (err) {
    console.error("[visa-admin] get", err);
    res.status(500).json({ message: "Could not load the application" });
  }
};

// PATCH /admin/visa/applications/:id/status  { status, note, interviewDate, notify }
export const adminUpdateStatus = async (req, res) => {
  const t = await VisaApplication.sequelize.transaction();
  try {
    const { status, note = "", interviewDate, notify = true } = req.body || {};
    const app = await VisaApplication.findByPk(req.params.id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!app) { await t.rollback(); return res.status(404).json({ message: "Application not found" }); }

    if (!STATUS_LABELS[status] || !(ALLOWED_TRANSITIONS[app.status] || []).includes(status)) {
      await t.rollback();
      return res.status(400).json({ message: `Cannot move from "${STATUS_LABELS[app.status]}" to "${STATUS_LABELS[status] || status}"` });
    }
    const cleanNote = String(note).trim().slice(0, 2000);
    if (["info_required", "rejected"].includes(status) && !cleanNote) {
      await t.rollback();
      return res.status(400).json({ message: "Add a message for the applicant explaining this decision" });
    }
    let when = null;
    if (status === "interview_scheduled") {
      when = interviewDate ? new Date(interviewDate) : null;
      if (!when || Number.isNaN(when.getTime()) || when < new Date()) {
        await t.rollback();
        return res.status(400).json({ message: "Choose a valid future interview date and time" });
      }
    }

    const from = app.status;
    app.status = status;
    app.statusNote = cleanNote || null;
    app.statusUpdatedAt = new Date();
    if (status === "interview_scheduled") app.interviewDate = when;
    await app.save({ transaction: t });
    await addStatusEvent(app.id, from, status, { note: cleanNote || null, actorId: req.user.id, actorType: "admin" }, t);
    await ActivityLog?.create({ userId: req.user.id, action: "VISA_STATUS_CHANGED", meta: { applicationId: app.id, from, to: status } }, { transaction: t });
    await t.commit();

    // The applicant is told about EVERY change (set notify:false only for silent corrections)
    let emailed = false;
    if (notify !== false) emailed = await sendStatusEmail(app, { note: cleanNote, status });
    res.json({ message: "Status updated", emailed, application: { id: app.id, status: app.status, statusNote: app.statusNote, interviewDate: app.interviewDate, statusUpdatedAt: app.statusUpdatedAt }, allowedNext: ALLOWED_TRANSITIONS[app.status] || [] });
  } catch (err) {
    await t.rollback().catch(() => {});
    console.error("[visa-admin] status", err);
    res.status(500).json({ message: "Could not update the status" });
  }
};

export const adminAddNote = async (req, res) => {
  const body = String(req.body?.body || "").trim().slice(0, 3000);
  if (!body) return res.status(400).json({ message: "Note cannot be empty" });
  const app = await VisaApplication.findByPk(req.params.id, { attributes: ["id"] });
  if (!app) return res.status(404).json({ message: "Application not found" });
  const note = await VisaNote.create({ applicationId: app.id, authorId: req.user.id, body });
  res.status(201).json({ note });
};

export const adminAssign = async (req, res) => {
  const app = await VisaApplication.findByPk(req.params.id);
  if (!app) return res.status(404).json({ message: "Application not found" });
  app.assignedTo = req.body?.adminId ? Number(req.body.adminId) : null;
  await app.save();
  res.json({ message: "Assigned", assignedTo: app.assignedTo });
};

export const adminGetDocumentUrl = async (req, res) => {
  const app = await VisaApplication.findByPk(req.params.id);
  const d = app?.documents?.[req.params.type];
  if (!d) return res.status(404).json({ message: "Document not found" });
  await ActivityLog?.create({ userId: req.user.id, action: "VISA_DOCUMENT_VIEWED", meta: { applicationId: app.id, type: req.params.type } }).catch(() => {});
  res.json({ url: d.url, name: d.name, mime: d.mime });
};

export const adminDownloadPdf = async (req, res) => {
  try {
    const app = await VisaApplication.findByPk(req.params.id);
    if (!app) return res.status(404).json({ message: "Application not found" });
    const pdf = await buildApplicationPdf(app);
    res.set({ "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${app.applicationCode || `draft-${app.id}`}.pdf"`, "Cache-Control": "no-store" });
    res.send(pdf);
  } catch (err) {
    console.error("[visa-admin] pdf", err);
    res.status(500).json({ message: "Could not generate the PDF" });
  }
};

export const adminResendSubmissionEmail = async (req, res) => {
  const app = await VisaApplication.findByPk(req.params.id);
  if (!app || app.status === "draft") return res.status(404).json({ message: "Submitted application not found" });
  const payment = await VisaPayment.findOne({ where: { applicationId: app.id, status: "success" }, order: [["paidAt", "DESC"]] });
  if (!payment) return res.status(400).json({ message: "No successful payment on this application" });
  const ok = await sendSubmissionEmail(app, payment);
  res.status(ok ? 200 : 502).json({ message: ok ? "Email sent" : "Email failed. Check mail settings." });
};

// GET /admin/visa/stats
export const adminStats = async (_req, res) => {
  try {
    const byStatus = await VisaApplication.findAll({ where: { status: { [Op.ne]: "draft" } }, attributes: ["status", [fn("COUNT", col("id")), "count"]], group: ["status"], raw: true });
    const byLocation = await VisaApplication.findAll({ where: { status: { [Op.ne]: "draft" } }, attributes: ["interviewLocation", [fn("COUNT", col("id")), "count"]], group: ["interviewLocation"], raw: true });
    const [rev] = await VisaPayment.findAll({ where: { status: "success" }, attributes: [[fn("COALESCE", fn("SUM", col("totalAmount")), 0), "total"], [fn("COUNT", col("id")), "count"]], raw: true });
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const [month] = await VisaPayment.findAll({ where: { status: "success", paidAt: { [Op.gte]: monthStart } }, attributes: [[fn("COALESCE", fn("SUM", col("totalAmount")), 0), "total"], [fn("COUNT", col("id")), "count"]], raw: true });
    const drafts = await VisaApplication.count({ where: { status: "draft" } });
    const monthly = await VisaApplication.findAll({
      where: { status: { [Op.ne]: "draft" } },
      attributes: [[literal(MONTH_EXPR), "month"], [fn("COUNT", col("id")), "count"]],
      group: [literal(MONTH_EXPR)], order: [[literal(MONTH_EXPR), "DESC"]], limit: 6, raw: true,
    });
    const status = Object.fromEntries(byStatus.map((r) => [r.status, Number(r.count)]));
    res.json({
      total: Object.values(status).reduce((a, b) => a + b, 0), status, drafts,
      needsAttention: status.submitted || 0,
      byLocation: Object.fromEntries(byLocation.map((r) => [r.interviewLocation || "unset", Number(r.count)])),
      revenue: { total: Number(rev.total), payments: Number(rev.count), thisMonth: Number(month.total), thisMonthPayments: Number(month.count) },
      monthly: monthly.reverse().map((m) => ({ month: m.month, count: Number(m.count) })),
    });
  } catch (err) {
    console.error("[visa-admin] stats", err);
    res.status(500).json({ message: "Could not load stats" });
  }
};

// GET /admin/visa/payments
export const adminListPayments = async (req, res) => {
  const page = clampInt(req.query.page, 1, 1, 100000), limit = clampInt(req.query.limit, 20, 1, 100);
  const where = {};
  if (["pending", "success", "failed", "cancelled", "refunded"].includes(req.query.status)) where.status = req.query.status;
  const { rows, count } = await VisaPayment.findAndCountAll({
    where, limit, offset: (page - 1) * limit, order: [["createdAt", "DESC"]],
    attributes: { exclude: ["gatewayResponse"] },
    include: [{ model: VisaApplication, as: "application", attributes: ["id", "applicationCode", "firstName", "lastName", "email"] }],
  });
  res.json({ payments: rows, total: count, page, pages: Math.ceil(count / limit) });
};

// GET /admin/visa/export.csv  (same filters as the list)
const csvCell = (v) => {
  let s = v == null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; // neutralise spreadsheet formula injection
  return `"${s.replace(/"/g, '""')}"`;
};
export const adminExportCsv = async (req, res) => {
  const rows = await VisaApplication.findAll({ where: buildWhere(req.query), attributes: LIST_ATTRS, order: [["submittedAt", "DESC"]], limit: 5000 });
  const head = ["Application", "Status", "First name", "Last name", "Email", "Phone", "Appointment", "Location", "Paid", "Amount", "Submitted", "Interview"];
  const lines = [head.map(csvCell).join(",")];
  rows.forEach((r) => lines.push([
    r.applicationCode, STATUS_LABELS[r.status], r.firstName, r.lastName, r.email, r.phone, r.appointmentType, r.interviewLocation,
    r.applicationFeePaid ? "Yes" : "No", r.applicationFeeAmount, r.submittedAt?.toISOString?.() || "", r.interviewDate?.toISOString?.() || "",
  ].map(csvCell).join(",")));
  res.set({ "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="visa-applications-${new Date().toISOString().slice(0, 10)}.csv"` });
  res.send(`﻿${lines.join("\r\n")}`);
};
