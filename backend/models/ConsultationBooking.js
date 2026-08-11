// models/ConsultationBooking.js

import { DataTypes } from "sequelize";

export default (sequelize) => {
  const ConsultationBooking = sequelize.define(
    "ConsultationBooking",
    {
      id: {
        type:          DataTypes.INTEGER,
        primaryKey:    true,
        autoIncrement: true,
      },

      // ── Who booked ────────────────────────────────────────────
      // Nullable — guests (non-logged-in) can also book
      userId: {
        type:      DataTypes.INTEGER,
        allowNull: true,
      },

      // Contact details submitted in the "Details" form step
      name: {
        type:      DataTypes.STRING(120),
        allowNull: false,
      },

      email: {
        type:      DataTypes.STRING(200),
        allowNull: false,
        validate:  { isEmail: true },
      },

      phoneNumber: {
        type:      DataTypes.STRING(30),
        allowNull: true,
      },

      otherDetails: {
        type:      DataTypes.TEXT,
        allowNull: true,
      },

      // ── Slot ──────────────────────────────────────────────────
      // Stored as UTC ISO string — displayed in user's timezone on frontend
      scheduledAt: {
        type:      DataTypes.DATE,
        allowNull: false,
      },

      // Duration in minutes (default 60 as shown in the screenshot)
      duration: {
        type:         DataTypes.INTEGER,
        defaultValue: 60,
      },

      // User's timezone (e.g. "Europe/Berlin", "Africa/Lagos")
      timezone: {
        type:         DataTypes.STRING(60),
        defaultValue: "Africa/Lagos",
      },

      // Consultation type — matches the options shown under "Consultation Options"
      consultationType: {
        type: DataTypes.ENUM(
          "career_pathway",
          "study_abroad",
          "test_preparation",
          "scholarship_guidance",
          "general"
        ),
        defaultValue: "general",
      },

      // ── Status ────────────────────────────────────────────────
      status: {
        type: DataTypes.ENUM(
          "pending",     // just booked, awaiting confirmation
          "confirmed",   // admin confirmed
          "cancelled",   // cancelled by user or admin
          "completed",   // session took place
          "no_show"      // user didn't show up
        ),
        defaultValue: "pending",
      },

      cancellationReason: {
        type:      DataTypes.TEXT,
        allowNull: true,
      },

      cancelledBy: {
        type:      DataTypes.ENUM("user", "admin"),
        allowNull: true,
      },

      // ── Admin interaction ──────────────────────────────────────
      // Admin reply / confirmation message sent to the user
      adminReply:   { type: DataTypes.TEXT,    allowNull: true },
      repliedAt:    { type: DataTypes.DATE,    allowNull: true },
      repliedBy:    { type: DataTypes.INTEGER, allowNull: true },

      // Internal note visible only to admins
      internalNote: { type: DataTypes.TEXT,    allowNull: true },

      // Admin who the booking is assigned to
      assignedTo:   { type: DataTypes.INTEGER, allowNull: true },

      // ── Reminders ─────────────────────────────────────────────
      // Flags so the cron job knows which reminders have been sent
      reminderOneDaySent: {
        type:         DataTypes.BOOLEAN,
        defaultValue: false,
      },

      reminderThreeHoursSent: {
        type:         DataTypes.BOOLEAN,
        defaultValue: false,
      },

      // ── Meeting link ───────────────────────────────────────────
      // e.g. a Zoom/Google Meet link sent after confirmation
      meetingLink: {
        type:      DataTypes.STRING(500),
        allowNull: true,
      },

      // Source IP for spam prevention
      ipAddress: {
        type:      DataTypes.STRING(45),
        allowNull: true,
      },
    },
    {
      tableName:  "consultation_bookings",
      timestamps: true,
    }
  );

  ConsultationBooking.associate = (models) => {
    ConsultationBooking.belongsTo(models.User, {
      foreignKey: "userId",
      as:         "booker",
    });
    ConsultationBooking.belongsTo(models.User, {
      foreignKey: "assignedTo",
      as:         "consultant",
    });
    ConsultationBooking.belongsTo(models.User, {
      foreignKey: "repliedBy",
      as:         "replier",
    });
  };

  return ConsultationBooking;
};
