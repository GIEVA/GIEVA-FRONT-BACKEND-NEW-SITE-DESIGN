import models from "../models/index.js";
import { cloudinary } from "../config/cloudinary.js";
import sendEmail from "../utils/sendEmail.js";
const { ActivityLog, Notification, SupportTicket, TicketAttachment } = models;




export const createTicket = async (req, res) => {
  const transaction = await SupportTicket.sequelize.transaction();

  try {
    const { subject, message, type, priority } = req.body;

    // ---------------- VALIDATION ----------------
    if (!subject || !message) {
      return res.status(400).json({
        message: "Subject and message are required",
      });
    }

    // ---------------- SMART PRIORITY ----------------
    const resolvedPriority =
      type === "complaint" ? "high" : priority || "medium";

    // ---------------- FILE VALIDATION ----------------
    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];

    if (req.files?.attachments) {
      for (const file of req.files.attachments) {
        if (!allowedTypes.includes(file.mimetype)) {
          throw new Error(
            "Unsupported file type. Only JPG, PNG, PDF allowed."
          );
        }
      }
    }

    // ---------------- CREATE TICKET ----------------
    const ticket = await SupportTicket.create(
      {
        userId: req.user?.id || null,
        fullName: req.user?.fullName || req.body.fullName,
        email: req.user?.email || req.body.email,
        subject,
        message,
        type: type || "contact",
        priority: resolvedPriority,
        meta: {
          ip: req.ip,
          userAgent: req.headers["user-agent"],
        },
      },
      { transaction }
    );

    // ---------------- HANDLE ATTACHMENTS ----------------
    let uploadedAttachments = [];

    if (req.files?.attachments) {
      const attachments = req.files.attachments.map((file) => ({
        ticketId: ticket.id,
        url: file.path,
        publicId: file.filename,
        fileType: file.mimetype,
      }));

      uploadedAttachments = await TicketAttachment.bulkCreate(attachments, {
        transaction,
      });
    }

    // ---------------- EMAIL TO USER ----------------
    await sendEmail(
      ticket.email,
      "Support Ticket Received 🎫",
      `
        <h2>We received your request</h2>
        <p>Hello ${ticket.fullName},</p>
        <p>Your support ticket has been created successfully.</p>
        <p><b>Subject:</b> ${ticket.subject}</p>
        <p>Our team will get back to you shortly.</p>
      `
    );

    // ---------------- EMAIL TO ADMIN ----------------
    await sendEmail(
      "admin@yourapp.com",
      "New Support Ticket 🚨",
      `
        <h3>New Ticket Submitted</h3>
        <p><b>Name:</b> ${ticket.fullName}</p>
        <p><b>Email:</b> ${ticket.email}</p>
        <p><b>Type:</b> ${ticket.type}</p>
        <p><b>Subject:</b> ${ticket.subject}</p>
        <p><b>Message:</b> ${ticket.message}</p>
      `
    );

    // ---------------- NOTIFICATION ----------------
    await Notification.create(
      {
        title: "New Support Ticket",
        message: `${ticket.fullName} submitted a ${ticket.type}`,
        type: "support",
        entityId: ticket.id,
      },
      { transaction }
    );

    // ---------------- ACTIVITY LOG ----------------
    await ActivityLog.create(
      {
        userId: req.user?.id || null,
        action: "SUPPORT_TICKET_CREATED",
        meta: {
          ticketId: ticket.id,
          type: ticket.type,
          attachmentsCount: uploadedAttachments.length,
        },
      },
      { transaction }
    );

    await transaction.commit();

    // ---------------- RESPONSE ----------------
    res.status(201).json({
      message: "Ticket created successfully",
      ticket,
      attachments: uploadedAttachments,
    });

  } catch (error) {
    await transaction.rollback();
    console.error(error);

    res.status(500).json({
      message: error.message || "Failed to create ticket",
    });
  }
};

export const getMyTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket.findAll({
      where: { userId: req.user.id },
      include: [
        { model: Attachment, as: "attachments" },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json(tickets);

  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch tickets",
    });
  }
};

export const deleteMyTicket = async (req, res) => {
  try {
    const ticket = await SupportTicket.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!ticket) {
      return res.status(404).json({
        message: "Ticket not found",
      });
    }

    if (ticket.status !== "open") {
      return res.status(400).json({
        message: "Cannot delete ticket once it's being processed",
      });
    }

    await ticket.destroy();

    await ActivityLog.create({
      userId: req.user.id,
      action: "SUPPORT_TICKET_DELETED",
      meta: { ticketId: ticket.id },
    });

    res.json({ message: "Ticket deleted successfully" });

  } catch (error) {
    res.status(500).json({
      message: "Failed to delete ticket",
    });
  }
};