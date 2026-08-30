// controllers/contactController.js

import models    from "../models/index.js";
import sendEmail from "../utils/sendMail.js";
import { cloudinary } from "../config/cloudinary.js";
import sequelize from "../config/db.js";
const { ContactMessage, User } = models;

const ADMIN_ROLES = ["admin", "superadmin", "operational_admin"];
const isAdmin = (user) => user && ADMIN_ROLES.includes(user.role);

// ======================================================
// SUBMIT CONTACT FORM  (public — no auth required)
// POST /api/contact
//
// Accepts multipart/form-data when category === "complaint"
// so an optional file can be attached. For all other categories
// it also works as regular JSON (multer passes non-file fields
// through to req.body regardless).
// ======================================================

export const submitContactForm = async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      subject,
      message,
      category = "general",
    } = req.body;

    if (!fullName?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
      // If multer uploaded a file before we hit this error, clean it up
      if (req.file?.filename) {
        await cloudinary.uploader.destroy(req.file.filename).catch(() => {});
      }
      return res.status(400).json({
        message: "fullName, email, subject, and message are required.",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      if (req.file?.filename) {
        await cloudinary.uploader.destroy(req.file.filename).catch(() => {});
      }
      return res.status(400).json({ message: "Please provide a valid email address." });
    }

    if (message.trim().length < 10) {
      if (req.file?.filename) {
        await cloudinary.uploader.destroy(req.file.filename).catch(() => {});
      }
      return res.status(400).json({ message: "Message must be at least 10 characters." });
    }

    // ── Attachment (only accepted for category === "complaint") ──
    // req.file is set by multer when fieldname is "complaintAttachment"
    let attachmentUrl          = null;
    let attachmentCloudinaryId = null;
    let attachmentOriginalName = null;

    if (req.file) {
      if (category !== "complaint") {
        // Discard the upload — attachments are only for complaints
        await cloudinary.uploader.destroy(req.file.filename).catch(() => {});
      } else {
        // Matches the TutorProfile pattern exactly
        attachmentUrl          = req.file.path;        // Cloudinary secure URL
        attachmentCloudinaryId = req.file.filename;    // public_id for future deletion
        attachmentOriginalName = req.file.originalname;
      }
    }

    const contact = await ContactMessage.create({
      fullName:  fullName.trim(),
      email:     email.trim().toLowerCase(),
      phone:     phone?.trim() || null,
      subject:   subject.trim(),
      message:   message.trim(),
      category,
      userId:    req.user?.id || null,
      ipAddress: req.ip || null,
      status:    "new",
      attachmentUrl,
      attachmentCloudinaryId,
      attachmentOriginalName,
    });

    // ── Notify support team ──
    const supportEmail = process.env.SUPPORT_EMAIL || process.env.ADMIN_EMAIL;
    if (supportEmail) {
      await sendEmail(
        supportEmail,
        `[Contact Form${category === "complaint" ? " — COMPLAINT" : ""}] ${subject}`,
        `<div style="font-family:sans-serif;max-width:600px">
          <h2 style="color:#0B1F3A">New Contact Message${category === "complaint" ? " 🚨" : ""}</h2>
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:8px;font-weight:bold;color:#64748B;width:120px">Name</td><td>${fullName}</td></tr>
            <tr><td style="padding:8px;font-weight:bold;color:#64748B">Email</td><td>${email}</td></tr>
            ${phone ? `<tr><td style="padding:8px;font-weight:bold;color:#64748B">Phone</td><td>${phone}</td></tr>` : ""}
            <tr><td style="padding:8px;font-weight:bold;color:#64748B">Category</td><td><strong>${category}</strong></td></tr>
            <tr><td style="padding:8px;font-weight:bold;color:#64748B">Subject</td><td>${subject}</td></tr>
          </table>
          <div style="margin-top:16px;padding:16px;background:#F7F9FC;border-radius:8px">
            <p style="white-space:pre-wrap;margin:0">${message}</p>
          </div>
          ${attachmentUrl
            ? `<div style="margin-top:16px">
                <strong>Attachment:</strong>
                <a href="${attachmentUrl}" style="color:#1E7F4F">${attachmentOriginalName || "View attachment"}</a>
              </div>`
            : ""}
          <p style="margin-top:16px;font-size:12px;color:#94a3b8">
            Message ID: #${contact.id} · ${new Date().toLocaleString()}
          </p>
        </div>`
      ).catch((err) => console.warn("[contact] Support email failed:", err.message));
    }

    // ── Auto-reply to sender ──
    await sendEmail(
      email,
      "We received your message — GIEVA",
      `<div style="font-family:sans-serif;max-width:600px">
        <h2 style="color:#0B1F3A">Thanks for reaching out, ${fullName}!</h2>
        <p>We've received your message and will get back to you within 24–48 business hours.</p>
        <div style="margin:20px 0;padding:16px;background:#F7F9FC;border-left:4px solid #1E7F4F;border-radius:4px">
          <p style="margin:0;font-weight:bold;color:#0B1F3A">Your subject:</p>
          <p style="margin:4px 0 0">${subject}</p>
        </div>
        ${category === "complaint" && attachmentUrl
          ? `<p>Your attachment was received and will be reviewed by our team.</p>`
          : ""}
        <p>Your reference number is <strong>#${contact.id}</strong>. Please keep this for your records.</p>
        <p style="color:#64748B;font-size:13px">— The GIEVA Team</p>
      </div>`
    ).catch((err) => console.warn("[contact] Auto-reply failed:", err.message));

    res.status(201).json({
      message:         "Your message has been sent. We'll be in touch soon!",
      reference:       `#${contact.id}`,
      attachmentSaved: !!attachmentUrl,
    });
  } catch (err) {
    // If DB save failed but file was uploaded, clean it up
    if (req.file?.filename) {
      await cloudinary.uploader.destroy(req.file.filename).catch(() => {});
    }
    console.error("submitContactForm error:", err);
    res.status(500).json({ message: "Failed to send message. Please try again." });
  }
};

