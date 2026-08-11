// jobs/consultationReminder.js
//
// Runs every 30 minutes via node-cron.
// Sends two reminder emails per booking:
//   1. 24 hours before the session
//   2. 3 hours before the session
//
// Add to server.js:
//   import { startConsultationReminderJob } from "./jobs/consultationReminder.js";
//   startConsultationReminderJob();

import cron     from "node-cron";
import { Op }   from "sequelize";
import models   from "../models/index.js";
import sendEmail from "../utils/sendMail.js";

const { ConsultationBooking } = models;

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
      timeZone: tz, weekday: "long", day: "numeric",
      month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return new Date(d).toLocaleString();
  }
};

const sendReminder = async (booking, type) => {
  const isOneDay      = type === "one_day";
  const timeLabel     = isOneDay ? "tomorrow" : "in 3 hours";
  const subject       = `Reminder: Your GIEVA Consultation is ${isOneDay ? "Tomorrow" : "in 3 Hours"}`;
  const typeLabel     = TYPE_LABELS[booking.consultationType] || "Consultation";
  const scheduledFmt  = fmtDate(booking.scheduledAt, booking.timezone);

  await sendEmail(
    booking.email,
    subject,
    `<div style="font-family:sans-serif;max-width:600px">
      <h2 style="color:#0B1F3A">Consultation Reminder 🗓️</h2>
      <p>Hi ${booking.name}, this is a reminder that your GIEVA consultation is <strong>${timeLabel}</strong>.</p>
      <div style="margin:20px 0;padding:20px;background:#F7F9FC;border-left:4px solid #1E7F4F;border-radius:4px">
        <p style="margin:0 0 8px"><strong>Type:</strong> ${typeLabel}</p>
        <p style="margin:0 0 8px"><strong>Date & Time:</strong> ${scheduledFmt}</p>
        <p style="margin:0 0 8px"><strong>Duration:</strong> ${booking.duration} minutes</p>
        ${booking.meetingLink
          ? `<p style="margin:0"><strong>Meeting Link:</strong> <a href="${booking.meetingLink}" style="color:#1E7F4F">${booking.meetingLink}</a></p>`
          : ""}
      </div>
      <p>Please be available 5 minutes before your scheduled time.</p>
      <p>Need to reschedule? Contact us as soon as possible.</p>
      <p style="color:#64748B;font-size:13px">— The GIEVA Team</p>
    </div>`
  );

  console.log(`[consultationReminder] Sent ${type} reminder to ${booking.email} for booking #${booking.id}`);
};

const runReminderCheck = async () => {
  try {
    const now = new Date();

    // ── 1-day reminder window: sessions 23h to 25h from now ────
    const oneDayStart = new Date(now.getTime() + 23 * 3600000);
    const oneDayEnd   = new Date(now.getTime() + 25 * 3600000);

    const oneDayBookings = await ConsultationBooking.findAll({
      where: {
        scheduledAt:          { [Op.between]: [oneDayStart, oneDayEnd] },
        status:               { [Op.in]: ["pending", "confirmed"] },
        reminderOneDaySent:   false,
      },
    });

    for (const booking of oneDayBookings) {
      try {
        await sendReminder(booking, "one_day");
        booking.reminderOneDaySent = true;
        await booking.save();
      } catch (err) {
        console.warn(`[consultationReminder] 1-day reminder failed for #${booking.id}:`, err.message);
      }
    }

    // ── 3-hour reminder window: sessions 2.5h to 3.5h from now ─
    const threeHrStart = new Date(now.getTime() + 2.5 * 3600000);
    const threeHrEnd   = new Date(now.getTime() + 3.5 * 3600000);

    const threeHrBookings = await ConsultationBooking.findAll({
      where: {
        scheduledAt:              { [Op.between]: [threeHrStart, threeHrEnd] },
        status:                   { [Op.in]: ["pending", "confirmed"] },
        reminderThreeHoursSent:   false,
      },
    });

    for (const booking of threeHrBookings) {
      try {
        await sendReminder(booking, "three_hours");
        booking.reminderThreeHoursSent = true;
        await booking.save();
      } catch (err) {
        console.warn(`[consultationReminder] 3-hour reminder failed for #${booking.id}:`, err.message);
      }
    }

    if (oneDayBookings.length + threeHrBookings.length > 0) {
      console.log(
        `[consultationReminder] Sent ${oneDayBookings.length} 1-day + ${threeHrBookings.length} 3-hour reminders`
      );
    }
  } catch (err) {
    console.error("[consultationReminder] Job error:", err);
  }
};

export const startConsultationReminderJob = () => {
  // Run every 30 minutes — fine-grained enough without over-querying
  cron.schedule("*/30 * * * *", runReminderCheck);
  console.log("[consultationReminder] Reminder job started (every 30 minutes)");
};
