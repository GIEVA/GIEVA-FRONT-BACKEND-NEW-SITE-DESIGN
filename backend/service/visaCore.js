// service/visaCore.js
// Logic shared by the applicant, payment and admin controllers.

import models from "../models/index.js";
import { buildVisaPdf } from "../utils/visaPdf.js";
import { sendVisaMail } from "../utils/visaMailer.js";
import { visaSubmittedTemplate, visaStatusTemplate } from "../utils/visaEmailTemplates.js";
import { STATUS_LABELS } from "../config/visaRequirements.js";

const { VisaApplication, VisaPayment, VisaStatusEvent } = models;

export const ADMIN_ROLES = ["admin", "superadmin", "operational_admin"];
export const isAdmin = (user) => ADMIN_ROLES.includes(user?.role);

export const appLink = (id) => `${process.env.FRONTEND_URL}/visa/applications/${id}`;
export const fullNameOf = (a) => [a.firstName, a.middleName, a.lastName].filter(Boolean).join(" ");

// Never expose storage keys or internal fields to applicants.
export const toApplicantView = (app) => {
  const j = typeof app.toJSON === "function" ? app.toJSON() : { ...app };
  const documents = {};
  Object.entries(j.documents || {}).forEach(([k, d]) => {
    documents[k] = { name: d.name, mime: d.mime, size: d.size, uploadedAt: d.uploadedAt };
  });
  delete j.assignedTo;
  return { ...j, documents };
};

export const addStatusEvent = (applicationId, fromStatus, toStatus, { note = null, actorId = null, actorType = "system" } = {}, transaction) =>
  VisaStatusEvent.create({ applicationId, fromStatus, toStatus, note, actorId, actorType }, { transaction });

const MAX_PHOTO_BYTES = 1.5 * 1024 * 1024;

// Downloads the photo for the PDF. Only https Cloudinary links are fetched (no arbitrary URLs).
const fetchCloudinaryImage = async (url) => {
  const u = new URL(url);
  if (u.protocol !== "https:" || !u.hostname.endsWith("cloudinary.com")) throw new Error("not a Cloudinary URL");
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  // Keep the emailed PDF small (Brevo limits attachment size). A bigger photo is simply left out.
  if (buf.length > MAX_PHOTO_BYTES) throw new Error("photo too large to embed in the PDF");
  return buf;
};

// PDF for an application: embeds the passport photo when it is an image.
export const buildApplicationPdf = async (app) => {
  const payment = await VisaPayment.findOne({ where: { applicationId: app.id, status: "success" }, order: [["paidAt", "DESC"]] });
  let photo = null;
  const url = app.documents?.passportPhoto?.url;
  if (url) {
    try { photo = await fetchCloudinaryImage(url); } catch (e) { console.error("[visa] photo for PDF:", e.message); }
  }
  return buildVisaPdf(app.toJSON ? app.toJSON() : app, { photo, payment: payment?.toJSON() });
};

// "Application received" email with the PDF attached. Never throws (a mail failure must not undo a payment).
export const sendSubmissionEmail = async (app, payment) => {
  try {
    const pdf = await buildApplicationPdf(app);
    await sendVisaMail({
      to: app.email,
      subject: `Your GIEVA visa application ${app.applicationCode} has been received`,
      html: visaSubmittedTemplate({
        fullName: fullNameOf(app), applicationCode: app.applicationCode, appointmentType: app.appointmentType,
        interviewLocation: app.interviewLocation, amount: payment.totalAmount, currency: payment.currency,
        paymentCode: payment.paymentCode, transactionRef: payment.transactionRef, paidAt: payment.paidAt, link: appLink(app.id),
      }),
      attachments: [{ filename: `${app.applicationCode}.pdf`, content: pdf, contentType: "application/pdf" }],
    });
    return true;
  } catch (e) {
    console.error("[visa] submission email failed:", e.message);
    return false;
  }
};

export const sendStatusEmail = async (app, { note, status }) => {
  try {
    await sendVisaMail({
      to: app.email,
      subject: `Visa application ${app.applicationCode}: ${STATUS_LABELS[status] || status}`,
      html: visaStatusTemplate({
        fullName: fullNameOf(app), applicationCode: app.applicationCode, status, statusLabel: STATUS_LABELS[status] || status,
        note, interviewDate: status === "interview_scheduled" ? app.interviewDate : null,
        interviewLocation: app.interviewLocation, link: appLink(app.id),
      }),
    });
    return true;
  } catch (e) {
    console.error("[visa] status email failed:", e.message);
    return false;
  }
};

export const generateApplicationCode = (id) => `VISA-${new Date().getFullYear()}-${String(id).padStart(5, "0")}`;
