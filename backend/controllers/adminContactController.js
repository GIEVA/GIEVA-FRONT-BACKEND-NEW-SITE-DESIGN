// controllers/contactController.js

import models    from "../models/index.js";
import sendEmail from "../utils/sendMail.js";
import { cloudinary } from "../config/cloudinary.js";
import sequelize from "../config/db.js";

const { ContactMessage, User } = models;

const ADMIN_ROLES = ["admin", "superadmin", "operational_admin"];
const isAdmin = (user) => user && ADMIN_ROLES.includes(user.role);



// ======================================================
// LIST ALL MESSAGES  (admin)
// GET /api/contact/admin?status=new&category=complaint&page=1&limit=20
// ======================================================

export const listContactMessages = async (req, res) => {
  try {
    if (!isAdmin(req.user)) return res.status(403).json({ message: "Unauthorized" });

    const { status, category, search, page = 1, limit = 20 } = req.query;
    const where = {};
    if (status)   where.status   = status;
    if (category) where.category = category;

    if (search) {
      const { Op } = await import("sequelize");
      const like   = { [Op.like]: `%${search}%` };
      where[Op.or] = [{ fullName: like }, { email: like }, { subject: like }];
    }

    const { count, rows } = await ContactMessage.findAndCountAll({
      where,
      include: [
        { model: User, as: "sender",   attributes: ["id", "fullName", "email"], required: false },
        { model: User, as: "assignee", attributes: ["id", "fullName"],          required: false },
      ],
      order:  [["createdAt", "DESC"]],
      limit:  Number(limit),
      offset: (Number(page) - 1) * Number(limit),
    });

    res.json({ messages: rows, total: count, page: Number(page), totalPages: Math.ceil(count / Number(limit)) });
  } catch (err) {
    console.error("listContactMessages error:", err);
    res.status(500).json({ message: "Failed to fetch messages" });
  }
};

// ======================================================
// GET SINGLE MESSAGE  (admin)
// GET /api/contact/admin/:id
// ======================================================

export const getContactMessage = async (req, res) => {
  try {
    if (!isAdmin(req.user)) return res.status(403).json({ message: "Unauthorized" });

    const msg = await ContactMessage.findByPk(req.params.id, {
      include: [
        { model: User, as: "sender",   attributes: ["id", "fullName", "email"], required: false },
        { model: User, as: "assignee", attributes: ["id", "fullName"],          required: false },
        { model: User, as: "replier",  attributes: ["id", "fullName"],          required: false },
      ],
    });

    if (!msg) return res.status(404).json({ message: "Message not found" });
    res.json({ message: msg });
  } catch (err) {
    console.error("getContactMessage error:", err);
    res.status(500).json({ message: "Failed to fetch message" });
  }
};

// ======================================================
// UPDATE STATUS  (admin)
// PATCH /api/contact/admin/:id/status
// ======================================================

export const updateContactStatus = async (req, res) => {
  try {
    if (!isAdmin(req.user)) return res.status(403).json({ message: "Unauthorized" });

    const { status } = req.body;
    const allowed    = ["new", "in_progress", "resolved", "closed"];
    if (!allowed.includes(status))
      return res.status(400).json({ message: `Status must be one of: ${allowed.join(", ")}` });

    const msg = await ContactMessage.findByPk(req.params.id);
    if (!msg) return res.status(404).json({ message: "Message not found" });

    msg.status = status;
    await msg.save();
    res.json({ message: "Status updated", status });
  } catch (err) {
    console.error("updateContactStatus error:", err);
    res.status(500).json({ message: "Failed to update status" });
  }
};

// ======================================================
// ASSIGN TO ADMIN  (admin)
// PATCH /api/contact/admin/:id/assign
// ======================================================

export const assignContactMessage = async (req, res) => {
  try {
    if (!isAdmin(req.user)) return res.status(403).json({ message: "Unauthorized" });

    const { adminId } = req.body;
    const msg = await ContactMessage.findByPk(req.params.id);
    if (!msg) return res.status(404).json({ message: "Message not found" });

    if (adminId) {
      const admin = await User.findByPk(adminId);
      if (!admin || !ADMIN_ROLES.includes(admin.role))
        return res.status(400).json({ message: "Target user is not an admin" });
    }

    msg.assignedTo = adminId || null;
    if (msg.status === "new") msg.status = "in_progress";
    await msg.save();
    res.json({ message: adminId ? "Message assigned" : "Assignment removed" });
  } catch (err) {
    console.error("assignContactMessage error:", err);
    res.status(500).json({ message: "Failed to assign message" });
  }
};

// ======================================================
// REPLY TO SENDER  (admin)
// POST /api/contact/admin/:id/reply
// ======================================================

export const replyToContactMessage = async (req, res) => {
  try {
    if (!isAdmin(req.user)) return res.status(403).json({ message: "Unauthorized" });

    const { reply, internalNote } = req.body;
    if (!reply?.trim()) return res.status(400).json({ message: "Reply text is required." });

    const msg = await ContactMessage.findByPk(req.params.id);
    if (!msg) return res.status(404).json({ message: "Message not found" });

    await sendEmail(
      msg.email,
      `Re: ${msg.subject} — GIEVA Support`,
      `<div style="font-family:sans-serif;max-width:600px">
        <h2 style="color:#0B1F3A">Reply from GIEVA Support</h2>
        <p>Hi ${msg.fullName},</p>
        <div style="margin:16px 0;padding:16px;background:#F7F9FC;border-radius:8px;white-space:pre-wrap">${reply}</div>
        <hr style="border:none;border-top:1px solid #E6E9F0;margin:20px 0"/>
        <p style="color:#64748B;font-size:12px">
          Reply to your message #${msg.id} submitted on ${new Date(msg.createdAt).toLocaleDateString()}.
        </p>
        <p style="color:#64748B;font-size:12px">— The GIEVA Team</p>
      </div>`
    );

    msg.adminReply    = reply.trim();
    msg.repliedAt     = new Date();
    msg.repliedBy     = req.user.id;
    msg.status        = "resolved";
    if (internalNote) msg.internalNote = internalNote.trim();
    await msg.save();

    res.json({ message: "Reply sent and message marked as resolved." });
  } catch (err) {
    console.error("replyToContactMessage error:", err);
    res.status(500).json({ message: "Failed to send reply" });
  }
};

// ======================================================
// ADD INTERNAL NOTE  (admin)
// PATCH /api/contact/admin/:id/note
// ======================================================

export const addInternalNote = async (req, res) => {
  try {
    if (!isAdmin(req.user)) return res.status(403).json({ message: "Unauthorized" });

    const { note } = req.body;
    if (!note?.trim()) return res.status(400).json({ message: "Note is required." });

    const msg = await ContactMessage.findByPk(req.params.id);
    if (!msg) return res.status(404).json({ message: "Message not found" });

    msg.internalNote = note.trim();
    await msg.save();
    res.json({ message: "Internal note saved." });
  } catch (err) {
    console.error("addInternalNote error:", err);
    res.status(500).json({ message: "Failed to save note" });
  }
};

// ======================================================
// DELETE MESSAGE  (superadmin only)
// DELETE /api/contact/admin/:id
// Also deletes the Cloudinary attachment if one exists.
// ======================================================

export const deleteContactMessage = async (req, res) => {
  try {
    if (req.user?.role !== "superadmin")
      return res.status(403).json({ message: "Only a superadmin can permanently delete contact messages." });

    const msg = await ContactMessage.findByPk(req.params.id);
    if (!msg) return res.status(404).json({ message: "Message not found" });

    // Delete Cloudinary attachment if it exists
    if (msg.attachmentCloudinaryId) {
      await cloudinary.uploader.destroy(msg.attachmentCloudinaryId).catch((err) =>
        console.warn("[contact] Cloudinary attachment delete failed:", err.message)
      );
    }

    await msg.destroy();
    res.json({ message: "Message permanently deleted." });
  } catch (err) {
    console.error("deleteContactMessage error:", err);
    res.status(500).json({ message: "Failed to delete message" });
  }
};

// ======================================================
// ANALYTICS SUMMARY  (admin)
// GET /api/contact/admin/summary
// ======================================================

export const getContactSummary = async (req, res) => {
  try {
    if (!isAdmin(req.user)) return res.status(403).json({ message: "Unauthorized" });

    const { Op } = await import("sequelize");
    const { sequelize } = models;

    const [total, byStatus, byCategory, recentUnreplied] = await Promise.all([
      ContactMessage.count(),
      ContactMessage.findAll({
        attributes: ["status", [sequelize.fn("COUNT", sequelize.col("id")), "count"]],
        group: ["status"], raw: true,
      }),
      ContactMessage.findAll({
        attributes: ["category", [sequelize.fn("COUNT", sequelize.col("id")), "count"]],
        group: ["category"], raw: true,
      }),
      ContactMessage.count({
        where: {
          status:     { [Op.in]: ["new", "in_progress"] },
          adminReply: null,
          createdAt:  { [Op.lte]: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    res.json({ total, byStatus, byCategory, recentUnreplied });
  } catch (err) {
    console.error("getContactSummary error:", err);
    res.status(500).json({ message: "Failed to fetch summary" });
  }
};
