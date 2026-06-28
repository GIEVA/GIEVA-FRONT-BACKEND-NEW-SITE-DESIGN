// controllers/publicMeetingController.js
//
// Public meetings are ClassSession rows with sessionType: "public".
// They have no courseId / tutorProfileId — instead:
//   - scheduledBy   → the admin who created it (also the default host)
//   - hostType      → "admin"
//   - visibility    → "public" | "organization"
//
// Any authenticated user (no enrollment required) can request to join
// via the normal joinClassSession() lobby flow — the admin who scheduled
// it (or any admin/superadmin) starts it as host via joinAsHostPublicMeeting.
//
// This mirrors Zoom/Meet: the scheduler is automatically the host, but
// any admin can step in and host if the original scheduler is unavailable.

import models from "../models/index.js";
import { createLiveKitToken } from "../config/livekit.js";
import { Op } from "sequelize";

const {
  ClassSession,
  SessionWaitingRoom,
  Notification,
  ActivityLog,
  User,
} = models;

const ADMIN_ROLES = ["admin", "superadmin", "operational_admin"];


export const schedulePublicMeeting = async (req, res) => {
    try {

        const ADMIN_ROLES = [
            "admin",
            "superadmin",
            "operational_admin",
        ];

        if (!ADMIN_ROLES.includes(req.user.role)) {
            return res.status(403).json({
                message: "Only administrators can schedule public meetings.",
            });
        }

        const {
            title,
            description,
            scheduledAt,
            durationMinutes,
            visibility = "public",
            recordingEnabled = true,
            enableWaitingRoom = true,
            allowChat = true,
            allowScreenShare = true,
            allowStudentCamera = true,
            allowStudentMic = true,
        } = req.body;

        if (
            !title ||
            !scheduledAt ||
            !durationMinutes
        ) {
            return res.status(400).json({
                message: "Missing required fields.",
            });
        }

        const roomName =
            `public-${uuid()}`;

        const start =
            new Date(scheduledAt);

        const end =
            new Date(
                start.getTime() +
                durationMinutes * 60000
            );

        const expiry =
            new Date(end);

        expiry.setHours(
            expiry.getHours() + 2
        );

        const session =
            await ClassSession.create({

                title,

                description,

                sessionType: "public",

                hostType: "admin",

                scheduledBy: req.user.id,

                courseId: null,

                tutorProfileId: null,

                scheduledAt,

                durationMinutes,

                startTime: start,

                endTime: end,

                roomName,

                joinLink:
                    `${process.env.FRONTEND_URL}/public-meet/${roomName}`,

                visibility,

                recordingEnabled,

                enableWaitingRoom,

                allowChat,

                allowScreenShare,

                allowStudentCamera,

                allowStudentMic,

                linkExpiresAt: expiry,

                status: "scheduled",
            });

        await ActivityLog.create({

            userId: req.user.id,

            action: "PUBLIC_MEETING_CREATED",

            meta: {
                sessionId: session.id,
            },
        });

        res.status(201).json({

            message:
                "Public meeting scheduled successfully.",

            session,
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            message:
                "Could not schedule public meeting.",
        });
    }
};

// ======================================================
// LIST PUBLIC MEETINGS  (any authenticated user)
// GET /api/session/public-meetings
//
// Returns upcoming + live public meetings so any logged-in
// user can browse and request to join — no enrollment needed.
// ======================================================

export const getPublicMeetings = async (req, res) => {
  try {
    const meetings = await ClassSession.findAll({
      where: {
        sessionType: "public",
        status: { [Op.in]: ["scheduled", "live"] },
      },
      include: [
        { model: User, as: "scheduler", attributes: ["id", "fullName"] },
      ],
      order: [["scheduledAt", "ASC"]],
    });

    res.json({ meetings });
  } catch (err) {
    console.error("getPublicMeetings error:", err);
    res.status(500).json({ message: "Failed to fetch public meetings" });
  }
};


// ======================================================
// GET ONE PUBLIC MEETING  (any authenticated user)
// GET /api/session/public-meetings/:sessionId
// ======================================================

export const getPublicMeetingById = async (req, res) => {
  try {
    const session = await ClassSession.findOne({
      where: { id: req.params.sessionId, sessionType: "public" },
      include: [{ model: User, as: "scheduler", attributes: ["id", "fullName"] }],
    });

    if (!session) return res.status(404).json({ message: "Public meeting not found" });
    res.json({ session });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch meeting" });
  }
};


// ======================================================
// JOIN AS HOST  (admin / superadmin / operational_admin)
// GET /api/session/public-meetings/:sessionId/host
//
// Mirrors joinAsTutor() — issues a "host" token. Any admin role
// can host, not just the original scheduler, so a meeting can
// still go on if the scheduler is unavailable.
// ======================================================

export const joinAsHostPublicMeeting = async (req, res) => {
  try {
    if (!ADMIN_ROLES.includes(req.user.role)) {
      return res.status(403).json({ message: "Only administrators can host public meetings" });
    }

    const session = await ClassSession.findOne({
      where: { id: req.params.sessionId, sessionType: "public" },
    });
    if (!session) return res.status(404).json({ message: "Public meeting not found" });

    if (session.status === "cancelled") {
      return res.status(403).json({ message: "This meeting has been cancelled" });
    }

    const fullName      = req.user.fullName || `Admin ${req.user.id}`;
    const profilePicUrl = req.user.profilePicUrl || "";
    const identity       = `user-${req.user.id}`;

    const token = await createLiveKitToken(
      session.roomName, identity, "host", { fullName, profilePicUrl }
    );

    session.isLive = true;
    session.status = "live";
    await session.save();

    await ActivityLog.create({
      userId: req.user.id,
      action: "PUBLIC_MEETING_HOST_JOINED",
      meta:   { sessionId: session.id },
    });

    res.json({
      token,
      roomName:    session.roomName,
      serverUrl:   process.env.LIVEKIT_URL,
      phase:       "live",
      identity,
      currentUser: { fullName, profilePicUrl, role: "host" },
      session: {
        id:    session.id,
        title: session.title,
        durationMinutes: session.durationMinutes,
        scheduledAt: session.scheduledAt,
      },
    });
  } catch (err) {
    console.error("joinAsHostPublicMeeting error:", err);
    res.status(500).json({ message: "Failed to join as host" });
  }
};


// ======================================================
// CANCEL PUBLIC MEETING  (admin / superadmin)
// PATCH /api/session/public-meetings/:sessionId/cancel
// ======================================================

export const cancelPublicMeeting = async (req, res) => {
  try {
    if (!ADMIN_ROLES.includes(req.user.role)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const session = await ClassSession.findOne({
      where: { id: req.params.sessionId, sessionType: "public" },
    });
    if (!session) return res.status(404).json({ message: "Public meeting not found" });

    session.status             = "cancelled";
    session.isLive             = false;
    session.cancellationReason = req.body.reason || null;
    await session.save();

    await ActivityLog.create({
      userId: req.user.id,
      action: "PUBLIC_MEETING_CANCELLED",
      meta:   { sessionId: session.id },
    });

    res.json({ message: "Public meeting cancelled" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to cancel meeting" });
  }
};