// controllers/consultationController.js

import models    from "../models/index.js";
import sendEmail from "../utils/sendMail.js";
import { Op }    from "sequelize";

const { ConsultationBooking, User } = models;

const ADMIN_ROLES = ["admin", "superadmin", "operational_admin"];
const isAdmin = (user) => user && ADMIN_ROLES.includes(user.role);

// ── Helpers ────────────────────────────────────────────────────

const TYPE_LABELS = {
  career_pathway:       "Career Pathway Consultation",
  study_abroad:         "Study Abroad Advisory",
  test_preparation:     "Test Preparation Strategy",
  scholarship_guidance: "Scholarship Guidance",
  general:              "General Consultation",
};

// Formats a date for display in emails, respecting the booking's timezone.
const fmtDate = (date, timezone) => {
  if (!date) return "—";
  try {
    return new Date(date).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: timezone || "UTC",
    });
  } catch {
    // Falls back if timezone is an invalid/unrecognized IANA string
    return new Date(date).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }
};

// Booking confirmation email sent to the user
const sendBookingEmail = async (booking, subject, bodyHtml) => {
  await sendEmail(booking.email, subject, bodyHtml).catch((err) =>
    console.warn("[consultation] email failed:", err.message)
  );
};


// ======================================================
// ─── ADMIN ENDPOINTS ──────────────────────────────────
// ======================================================

// GET /api/admin/consultations
// Query params: status, consultationType, page, limit, search
export const adminListBookings = async (req, res) => {
  try {
    if (!isAdmin(req.user)) return res.status(403).json({ message: "Unauthorized" });

    const {
      status, consultationType, search,
      page  = 1,
      limit = 20,
    } = req.query;

    const where = {};
    if (status)           where.status           = status;
    if (consultationType) where.consultationType = consultationType;

    if (search) {
      const like = { [Op.like]: `%${search}%` };
      where[Op.or] = [
        { name:  like },
        { email: like },
      ];
    }

    const { count, rows } = await ConsultationBooking.findAndCountAll({
      where,
      include: [
        { model: User, as: "booker",     attributes: ["id", "fullName", "email"], required: false },
        { model: User, as: "consultant", attributes: ["id", "fullName"],          required: false },
      ],
      order:  [["scheduledAt", "DESC"]],
      limit:  Number(limit),
      offset: (Number(page) - 1) * Number(limit),
    });

    res.json({
      bookings:   rows,
      total:      count,
      page:       Number(page),
      totalPages: Math.ceil(count / Number(limit)),
    });
  } catch (err) {
    console.error("adminListBookings error:", err);
    res.status(500).json({ message: "Failed to fetch bookings" });
  }
};

// GET /api/admin/consultations/:id
export const adminGetBooking = async (req, res) => {
  try {
    if (!isAdmin(req.user)) return res.status(403).json({ message: "Unauthorized" });

    const booking = await ConsultationBooking.findByPk(req.params.id, {
      include: [
        { model: User, as: "booker",     attributes: ["id", "fullName", "email"], required: false },
        { model: User, as: "consultant", attributes: ["id", "fullName"],          required: false },
        { model: User, as: "replier",    attributes: ["id", "fullName"],          required: false },
      ],
    });

    if (!booking) return res.status(404).json({ message: "Booking not found" });
    res.json({ booking });
  } catch (err) {
    console.error("adminGetBooking error:", err);
    res.status(500).json({ message: "Failed to fetch booking" });
  }
};

// PATCH /api/admin/consultations/:id/status
// Body: { status, meetingLink?, reason? }
export const adminUpdateStatus = async (req, res) => {
  try {
    if (!isAdmin(req.user)) return res.status(403).json({ message: "Unauthorized" });

    const { status, meetingLink, reason } = req.body;
    const allowed = ["pending", "confirmed", "cancelled", "completed", "no_show"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${allowed.join(", ")}` });
    }

    const booking = await ConsultationBooking.findByPk(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const prevStatus = booking.status;
    booking.status = status;
    if (meetingLink) booking.meetingLink = meetingLink;
    if (reason)      booking.cancellationReason = reason;
    if (status === "cancelled") booking.cancelledBy = "admin";
    await booking.save();

    // Email user when confirmed (include meeting link if provided)
    if (status === "confirmed" && prevStatus !== "confirmed") {
      await sendBookingEmail(
        booking,
        "Your GIEVA Consultation is Confirmed ✓",
        `<div style="font-family:sans-serif;max-width:600px">
          <h2 style="color:#0B1F3A">Consultation Confirmed!</h2>
          <p>Hi ${booking.name}, your consultation session has been confirmed.</p>
          <div style="margin:20px 0;padding:20px;background:#F7F9FC;border-left:4px solid #1E7F4F;border-radius:4px">
            <p style="margin:0 0 8px"><strong>Type:</strong> ${TYPE_LABELS[booking.consultationType]}</p>
            <p style="margin:0 0 8px"><strong>Date & Time:</strong> ${fmtDate(booking.scheduledAt, booking.timezone)}</p>
            <p style="margin:0 0 8px"><strong>Duration:</strong> ${booking.duration} minutes</p>
            ${booking.meetingLink ? `<p style="margin:0"><strong>Meeting Link:</strong> <a href="${booking.meetingLink}">${booking.meetingLink}</a></p>` : ""}
          </div>
          <p style="color:#64748B;font-size:13px">Please be available 5 minutes before your scheduled time.</p>
          <p style="color:#64748B;font-size:13px">— The GIEVA Team</p>
        </div>`
      );
    }

    // Email user when cancelled by admin
    if (status === "cancelled" && prevStatus !== "cancelled") {
      await sendBookingEmail(
        booking,
        "Your GIEVA Consultation Has Been Cancelled",
        `<div style="font-family:sans-serif;max-width:600px">
          <h2 style="color:#0B1F3A">Consultation Cancelled</h2>
          <p>Hi ${booking.name}, we're sorry to inform you that your consultation session on ${fmtDate(booking.scheduledAt, booking.timezone)} has been cancelled.</p>
          ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
          <p>Please <a href="${process.env.FRONTEND_URL}/consultations">book a new slot</a> at your convenience.</p>
          <p style="color:#64748B;font-size:13px">— The GIEVA Team</p>
        </div>`
      );
    }

    res.json({ message: "Status updated", status });
  } catch (err) {
    console.error("adminUpdateStatus error:", err);
    res.status(500).json({ message: "Failed to update status" });
  }
};

// POST /api/admin/consultations/:id/reply
// Body: { reply, internalNote?, meetingLink? }
export const adminReplyToBooking = async (req, res) => {
  try {
    if (!isAdmin(req.user)) return res.status(403).json({ message: "Unauthorized" });

    const { reply, internalNote, meetingLink } = req.body;
    if (!reply?.trim()) return res.status(400).json({ message: "Reply text is required." });

    const booking = await ConsultationBooking.findByPk(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    await sendBookingEmail(
      booking,
      `Re: Your GIEVA Consultation #${booking.id}`,
      `<div style="font-family:sans-serif;max-width:600px">
        <h2 style="color:#0B1F3A">Message from GIEVA</h2>
        <p>Hi ${booking.name},</p>
        <div style="margin:16px 0;padding:16px;background:#F7F9FC;border-radius:8px;white-space:pre-wrap">${reply}</div>
        ${meetingLink ? `<p><strong>Meeting Link:</strong> <a href="${meetingLink}">${meetingLink}</a></p>` : ""}
        <hr style="border:none;border-top:1px solid #E6E9F0;margin:20px 0"/>
        <p style="color:#64748B;font-size:12px">Regarding your consultation #${booking.id} scheduled for ${fmtDate(booking.scheduledAt, booking.timezone)}.</p>
        <p style="color:#64748B;font-size:12px">— The GIEVA Team</p>
      </div>`
    );

    booking.adminReply  = reply.trim();
    booking.repliedAt   = new Date();
    booking.repliedBy   = req.user.id;
    if (internalNote) booking.internalNote = internalNote.trim();
    if (meetingLink)  booking.meetingLink  = meetingLink;
    await booking.save();

    res.json({ message: "Reply sent successfully." });
  } catch (err) {
    console.error("adminReplyToBooking error:", err);
    res.status(500).json({ message: "Failed to send reply" });
  }
};

// PATCH /api/admin/consultations/:id/note
export const adminAddNote = async (req, res) => {
  try {
    if (!isAdmin(req.user)) return res.status(403).json({ message: "Unauthorized" });

    const { note } = req.body;
    if (!note?.trim()) return res.status(400).json({ message: "Note is required." });

    const booking = await ConsultationBooking.findByPk(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    booking.internalNote = note.trim();
    await booking.save();
    res.json({ message: "Note saved." });
  } catch (err) {
    console.error("adminAddNote error:", err);
    res.status(500).json({ message: "Failed to save note" });
  }
};

// DELETE /api/admin/consultations/:id  (superadmin only)
export const adminDeleteBooking = async (req, res) => {
  try {
    if (req.user?.role !== "superadmin") {
      return res.status(403).json({ message: "Only a superadmin can permanently delete bookings." });
    }

    const booking = await ConsultationBooking.findByPk(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    await booking.destroy();
    res.json({ message: "Booking deleted." });
  } catch (err) {
    console.error("adminDeleteBooking error:", err);
    res.status(500).json({ message: "Failed to delete booking" });
  }
};

// GET /api/admin/consultations/summary
export const adminGetSummary = async (req, res) => {
  try {
    if (!isAdmin(req.user)) return res.status(403).json({ message: "Unauthorized" });

    const { sequelize } = models;

    const now       = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd   = new Date(todayStart.getTime() + 86400000);

    const [total, byStatus, todayCount, upcoming] = await Promise.all([
      ConsultationBooking.count(),

      ConsultationBooking.findAll({
        attributes: [
          "status",
          [sequelize.fn("COUNT", sequelize.col("id")), "count"],
        ],
        group: ["status"],
        raw:   true,
      }),

      ConsultationBooking.count({
        where: { scheduledAt: { [Op.between]: [todayStart, todayEnd] } },
      }),

      ConsultationBooking.count({
        where: {
          scheduledAt: { [Op.gte]: now },
          status:      { [Op.in]: ["pending", "confirmed"] },
        },
      }),
    ]);

    res.json({ total, byStatus, todayCount, upcoming });
  } catch (err) {
    console.error("adminGetSummary error:", err);
    res.status(500).json({ message: "Failed to fetch summary" });
  }
};
