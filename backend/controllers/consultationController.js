// controllers/consultationController.js

import models    from "../models/index.js";
import sendEmail from "../utils/sendMail.js";
import { Op }    from "sequelize";

const { ConsultationBooking, User } = models;



// ── Helpers ────────────────────────────────────────────────────

const TYPE_LABELS = {
  career_pathway:       "Career Pathway Consultation",
  study_abroad:         "Study Abroad Advisory",
  test_preparation:     "Test Preparation Strategy",
  scholarship_guidance: "Scholarship Guidance",
  general:              "General Consultation",
};

const fmtDate = (d, tz = "Africa/Lagos") => {
  try {
    return new Date(d).toLocaleString("en-NG", {
      timeZone:     tz,
      weekday:      "long",
      day:          "numeric",
      month:        "long",
      year:         "numeric",
      hour:         "2-digit",
      minute:       "2-digit",
    });
  } catch {
    return new Date(d).toLocaleString();
  }
};

// Booking confirmation email sent to the user
const sendBookingEmail = async (booking, subject, bodyHtml) => {
  await sendEmail(booking.email, subject, bodyHtml).catch((err) =>
    console.warn("[consultation] email failed:", err.message)
  );
};

// Notify admin team of a new booking
const notifyAdminTeam = async (booking) => {
  const adminEmail = process.env.SUPPORT_EMAIL || process.env.ADMIN_EMAIL;
  if (!adminEmail) return;
  await sendEmail(
    adminEmail,
    `[New Consultation] ${booking.name} — ${TYPE_LABELS[booking.consultationType]}`,
    `<div style="font-family:sans-serif;max-width:600px">
      <h2 style="color:#0B1F3A">New Consultation Booking #${booking.id}</h2>
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:8px;font-weight:bold;color:#64748B;width:140px">Name</td><td>${booking.name}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;color:#64748B">Email</td><td>${booking.email}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;color:#64748B">Phone</td><td>${booking.phoneNumber || "—"}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;color:#64748B">Type</td><td>${TYPE_LABELS[booking.consultationType]}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;color:#64748B">Scheduled</td><td>${fmtDate(booking.scheduledAt, booking.timezone)}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;color:#64748B">Duration</td><td>${booking.duration} minutes</td></tr>
        <tr><td style="padding:8px;font-weight:bold;color:#64748B">Timezone</td><td>${booking.timezone}</td></tr>
      </table>
      ${booking.otherDetails ? `<div style="margin-top:16px;padding:16px;background:#F7F9FC;border-radius:8px"><p style="margin:0">${booking.otherDetails}</p></div>` : ""}
    </div>`
  ).catch((err) => console.warn("[consultation] admin notify failed:", err.message));
};

// ======================================================
// BOOK A CONSULTATION  (public — no auth required)
// POST /api/consultations
// ======================================================

export const bookConsultation = async (req, res) => {
  try {
    const {
      name,
      email,
      phoneNumber,
      otherDetails,
      scheduledAt,
      duration         = 60,
      timezone         = "Africa/Lagos",
      consultationType = "general",
    } = req.body;

    // Validation
    if (!name?.trim() || !email?.trim() || !scheduledAt) {
      return res.status(400).json({
        message: "name, email, and scheduledAt are required.",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Please provide a valid email address." });
    }

    const slotDate = new Date(scheduledAt);
    if (isNaN(slotDate.getTime())) {
      return res.status(400).json({ message: "Invalid scheduledAt date." });
    }
    if (slotDate <= new Date()) {
      return res.status(400).json({ message: "Please choose a future date and time." });
    }

    // Prevent double-booking the same slot (within 5 minutes either side)
    const slotStart = new Date(slotDate.getTime() - 5 * 60000);
    const slotEnd   = new Date(slotDate.getTime() + 5 * 60000);
    const conflict  = await ConsultationBooking.findOne({
      where: {
        scheduledAt: { [Op.between]: [slotStart, slotEnd] },
        status:      { [Op.in]: ["pending", "confirmed"] },
      },
    });
    if (conflict) {
      return res.status(409).json({
        message: "That time slot is already booked. Please choose another time.",
      });
    }

    const booking = await ConsultationBooking.create({
      userId:          req.user?.id || null,
      name:            name.trim(),
      email:           email.trim().toLowerCase(),
      phoneNumber:     phoneNumber?.trim() || null,
      otherDetails:    otherDetails?.trim() || null,
      scheduledAt:     slotDate,
      duration,
      timezone,
      consultationType,
      status:          "pending",
      ipAddress:       req.ip || null,
    });

    // Confirmation email to the user
    await sendBookingEmail(
      booking,
      "Your GIEVA Consultation is Booked ✓",
      `<div style="font-family:sans-serif;max-width:600px">
        <h2 style="color:#0B1F3A">Consultation Booked!</h2>
        <p>Hi ${name}, your consultation has been received. We'll confirm it shortly.</p>
        <div style="margin:20px 0;padding:20px;background:#F7F9FC;border-left:4px solid #1E7F4F;border-radius:4px">
          <p style="margin:0 0 8px"><strong>Type:</strong> ${TYPE_LABELS[consultationType]}</p>
          <p style="margin:0 0 8px"><strong>Date & Time:</strong> ${fmtDate(slotDate, timezone)}</p>
          <p style="margin:0"><strong>Duration:</strong> ${duration} minutes</p>
        </div>
        <p>Reference: <strong>#${booking.id}</strong></p>
        <p style="color:#64748B;font-size:13px">
          If you need to cancel or reschedule, please contact us at least 24 hours before your session.
        </p>
        <p style="color:#64748B;font-size:13px">— The GIEVA Team</p>
      </div>`
    );

    // Notify admin team
    await notifyAdminTeam(booking);

    res.status(201).json({
      message:   "Consultation booked successfully! Check your email for confirmation.",
      reference: `#${booking.id}`,
      booking:   {
        id:              booking.id,
        scheduledAt:     booking.scheduledAt,
        duration:        booking.duration,
        consultationType: booking.consultationType,
        status:          booking.status,
      },
    });
  } catch (err) {
    console.error("bookConsultation error:", err);
    res.status(500).json({ message: "Failed to book consultation. Please try again." });
  }
};

// ======================================================
// GET AVAILABLE SLOTS  (public — no auth required)
// GET /api/consultations/available-slots?date=2026-07-28
//
// Returns booked slots for a given date so the calendar
// can grey them out. Never exposes who booked them.
// ======================================================

export const getAvailableSlots = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ message: "date query param required (YYYY-MM-DD)" });

    const dayStart = new Date(`${date}T00:00:00.000Z`);
    const dayEnd   = new Date(`${date}T23:59:59.999Z`);

    const booked = await ConsultationBooking.findAll({
      where: {
        scheduledAt: { [Op.between]: [dayStart, dayEnd] },
        status:      { [Op.in]: ["pending", "confirmed"] },
      },
      attributes: ["scheduledAt", "duration"],
    });

    res.json({ date, bookedSlots: booked.map((b) => b.scheduledAt) });
  } catch (err) {
    console.error("getAvailableSlots error:", err);
    res.status(500).json({ message: "Failed to fetch slots" });
  }
};

// ======================================================
// GET MY BOOKINGS  (authenticated user)
// GET /api/consultations/my
// ======================================================

export const getMyBookings = async (req, res) => {
  try {
    const bookings = await ConsultationBooking.findAll({
      where: { userId: req.user.id },
      order: [["scheduledAt", "DESC"]],
    });
    res.json({ bookings });
  } catch (err) {
    console.error("getMyBookings error:", err);
    res.status(500).json({ message: "Failed to fetch your bookings" });
  }
};

// ======================================================
// CANCEL MY BOOKING  (authenticated user — own booking only)
// PATCH /api/consultations/:id/cancel
// ======================================================

export const cancelMyBooking = async (req, res) => {
  try {
    const booking = await ConsultationBooking.findByPk(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // Users can only cancel their own bookings
    if (booking.userId !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (booking.status === "cancelled") {
      return res.status(400).json({ message: "Booking is already cancelled" });
    }

    if (booking.status === "completed") {
      return res.status(400).json({ message: "Cannot cancel a completed session" });
    }

    // Warn if less than 24 hours before the session
    const hoursUntil = (new Date(booking.scheduledAt) - new Date()) / 3600000;
    if (hoursUntil < 24 && hoursUntil > 0) {
      // Still allow but note the late cancellation
      console.warn(`[consultation] Late cancellation: booking #${booking.id} is in ${hoursUntil.toFixed(1)}h`);
    }

    booking.status             = "cancelled";
    booking.cancelledBy        = "user";
    booking.cancellationReason = req.body.reason || null;
    await booking.save();

    // Notify admin
    const adminEmail = process.env.SUPPORT_EMAIL || process.env.ADMIN_EMAIL;
    if (adminEmail) {
      await sendEmail(
        adminEmail,
        `[Consultation Cancelled] #${booking.id} — ${booking.name}`,
        `<p>${booking.name} (${booking.email}) cancelled booking #${booking.id} scheduled for ${fmtDate(booking.scheduledAt, booking.timezone)}.</p>
         ${booking.cancellationReason ? `<p>Reason: ${booking.cancellationReason}</p>` : ""}`
      ).catch(() => {});
    }

    res.json({ message: "Booking cancelled successfully." });
  } catch (err) {
    console.error("cancelMyBooking error:", err);
    res.status(500).json({ message: "Failed to cancel booking" });
  }
};
