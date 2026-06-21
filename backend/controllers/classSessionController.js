// controllers/classSessionController.js

import models from "../models/index.js";
import dotenv from "dotenv";
dotenv.config();
import {
  createLiveKitToken,
} from "../config/livekit.js";
import { RoomServiceClient } from "livekit-server-sdk";   // ← NEW


import { Op } from "sequelize";

import {
  v4 as uuid,
} from "uuid";

import sendEmail
from "../utils/sendMail.js";

const {
  ClassSession,
  SessionWaitingRoom,
  Course,
  TutorProfile,
  TutorStudent,
  Enrollment,
  Notification,
  ActivityLog,
  User,
  SessionAttendance,
  StudentProfile,
} = models;



// Server-side LiveKit client for sending data messages to rooms
const roomService = new RoomServiceClient(
  process.env.LIVEKIT_URL,
  process.env.LIVEKIT_API_KEY,
  process.env.LIVEKIT_API_SECRET
);

// ======================================================
// SCHEDULE CLASS SESSION
// ======================================================

export const scheduleClassSession =
  async (req, res) => {

    try {

      // ==================================================
      // VERIFY TUTOR
      // ==================================================

      const tutorProfile =
        await TutorProfile.findOne({
          where: {
            userId: req.user.id,
          },
        });

      if (!tutorProfile) {

        return res.status(403).json({
          message:
            "Only tutors can schedule classes",
        });
      }



      // ==================================================
      // REQUEST BODY
      // ==================================================

      const {
        title,
        description,
        courseId,
        scheduledAt,
        durationMinutes,
        visibility,
      } = req.body;



      // ==================================================
      // VALIDATION
      // ==================================================

      if (
        !title ||
        !courseId ||
        !scheduledAt ||
        !durationMinutes
      ) {

        return res.status(400).json({
          message:
            "Missing required fields",
        });
      }



      // ==================================================
      // VERIFY COURSE
      // ==================================================

      const course =
        await Course.findByPk(
          courseId
        );

      if (!course) {

        return res.status(404).json({
          message:
            "Course not found",
        });
      }



      // ==================================================
      // CREATE ROOM
      // ==================================================

      const roomName =
        `course-${courseId}-${uuid()}`;



      // ==================================================
      // TIME HANDLING
      // ==================================================

      const start =
        new Date(
          scheduledAt
        );

      const end =
        new Date(
          start.getTime() +
          durationMinutes * 60000
        );

      const linkExpiry =
        new Date(end);

      linkExpiry.setHours(
        linkExpiry.getHours() + 2
      );



      // ==================================================
      // CREATE SESSION
      // ==================================================

      const session =
        await ClassSession.create({

          title,

          description,

          courseId,

          tutorProfileId:
            tutorProfile.id,

          scheduledBy:
            req.user.id,

          scheduledAt,

          durationMinutes,

          startTime:
            start,

          endTime:
            end,

          roomName,

          joinLink:
            `${process.env.FRONTEND_URL}/live/${roomName}`,

          linkExpiresAt:
            linkExpiry,

          visibility:
            visibility ||
            "assigned_students",

          status:
            "scheduled",
        });



      // ==================================================
      // GET ASSIGNED STUDENTS
      // ==================================================

      const assignedStudents =
        await TutorStudent.findAll({

          where: {
            tutorProfileId:
              tutorProfile.id,

            courseId,

            status:
              "active",
          },

          include: [
            {
              model: User,
              as: "student",
            },
          ],
        });



      // ==================================================
      // CREATE ATTENDANCE RECORDS
      // ==================================================

      for (const assignment of assignedStudents) {

        await SessionAttendance.create({

          classSessionId:
            session.id,

          userId:
            assignment.student.id,

          role:
            "student",

          wasPresent:
            false,
        });
      }



      // ==================================================
      // SEND NOTIFICATIONS
      // ==================================================

      for (const assignment of assignedStudents) {

        const student =
          assignment.student;

        if (!student)
          continue;



        // ================================================
        // IN-APP NOTIFICATION
        // ================================================

        await Notification.create({

          userId:
            student.id,

          title:
            "New Live Class Scheduled",

          message:
            `${title} has been scheduled for ${course.title}`,

          type:
            "live_class",

          entityId:
            session.id,

          entityType:
            "class_session",
        });



        // ================================================
        // EMAIL
        // ================================================

        await sendEmail(

          student.email,

          "Upcoming Live Class Session",

          `
            <div style="font-family:sans-serif">

              <h2>Upcoming Live Class</h2>

              <p>Hello ${student.fullName},</p>

              <p>
                A new live class session has been scheduled.
              </p>

              <p>
                <strong>Course:</strong>
                ${course.title}
              </p>

              <p>
                <strong>Class:</strong>
                ${title}
              </p>

              <p>
                <strong>Date:</strong>
                ${start.toLocaleString()}
              </p>

              <p>
                <strong>Duration:</strong>
                ${durationMinutes} minutes
              </p>

              <a
                href="${session.joinLink}"
                style="
                  display:inline-block;
                  padding:12px 20px;
                  background:#6C2BD9;
                  color:white;
                  text-decoration:none;
                  border-radius:8px;
                "
              >
                Join Class
              </a>

              <p>
                Please join a few minutes early.
              </p>

              <p>
                GIEVA Learning Team
              </p>

            </div>
          `
        );
      }



      // ==================================================
      // ACTIVITY LOG
      // ==================================================

      await ActivityLog.create({

        userId:
          req.user.id,

        action:
          "CLASS_SESSION_SCHEDULED",

        meta: {
          sessionId:
            session.id,

          courseId,

          tutorProfileId:
            tutorProfile.id,
        },
      });



      // ==================================================
      // RESPONSE
      // ==================================================

      res.status(201).json({

        message:
          "Class session scheduled successfully",

        session,
      });

    } catch (err) {

      console.error(err);

      res.status(500).json({
        message:
          "Could not schedule class session",
      });
    }
  };




 
// ──────────────────────────────────────────────────────────────
// JOIN CLASS SESSION  →  issues a LOBBY token
// ──────────────────────────────────────────────────────────────
 
export const joinClassSession = async (req, res) => {
  try {
    const userId    = req.user.id;
    const sessionId = req.params.sessionId;
 
    const session = await ClassSession.findByPk(sessionId);
    if (!session) return res.status(404).json({ message: "Session not found" });
 
    const now = new Date();
    if (now > session.linkExpiresAt)
      return res.status(403).json({ message: "Class link has expired" });
 
    // Enrollment + assignment checks
    const enrollment = await Enrollment.findOne({
      where: { studentId: userId, courseId: session.courseId, status: "active" },
    });
    if (!enrollment)
      return res.status(403).json({ message: "You are not enrolled in this course" });
 
    const assignment = await TutorStudent.findOne({
      where: {
        studentId:      userId,
        tutorProfileId: session.tutorProfileId,
        courseId:       session.courseId,
        status:         "active",
      },
    });
    if (!assignment)
      return res.status(403).json({ message: "You are not assigned to this tutor" });
 
    // Fetch real name + avatar
    const user           = await User.findByPk(userId, { attributes: ["id", "fullName"] });
    const studentProfile = await StudentProfile.findOne({
      where: { userId },
      attributes: ["fullName", "profilePicUrl"],
    });
 
    const fullName      = studentProfile?.fullName || user?.fullName || `User ${userId}`;
    const profilePicUrl = studentProfile?.profilePicUrl || "";
 
    // Issue LOBBY token (canPublish: false)
    const identity   = `user-${userId}`;
    const lobbyToken = await createLiveKitToken(
      session.roomName,
      identity,
      "lobby",
      { fullName, profilePicUrl }
    );
 
    // Upsert waiting-room record
    await SessionWaitingRoom.upsert({
      classSessionId: sessionId,
      userId,
      fullName,
      profilePicUrl,
      status:      "waiting",
      requestedAt: new Date(),
    });
 
    // ── Push real-time JOIN_REQUEST to the room via Server SDK ──
    // This means the host receives the notification INSTANTLY
    // without waiting for the next 5-second poll.
    try {
      const payload = Buffer.from(
        JSON.stringify({
          type:         "JOIN_REQUEST",
          userId:       userId,
          identity:     identity,
          fullName:     fullName,
          profilePicUrl: profilePicUrl,
        })
      );
      await roomService.sendData(
        session.roomName,
        payload,
        0   // DataPacket_Kind.RELIABLE = 0
      );
    } catch (dataErr) {
      // Non-fatal — host will still see the request via DB poll
      console.warn("sendData JOIN_REQUEST failed (host may not be online yet):", dataErr.message);
    }
 
    // In-app notification to tutor
    const tutorProfile = await TutorProfile.findByPk(session.tutorProfileId);
    if (tutorProfile) {
      await Notification.create({
        userId:     tutorProfile.userId,
        title:      "Student Waiting to Join",
        message:    `${fullName} is waiting to join "${session.title}"`,
        type:       "live_class",
        entityId:   session.id,
        entityType: "class_session",
      });
    }
 
    await ActivityLog.create({
      userId,
      action: "JOIN_SESSION_LOBBY",
      meta:   { sessionId },
    });
 
    res.json({
      token:       lobbyToken,
      roomName:    session.roomName,
      serverUrl:   process.env.LIVEKIT_URL,
      phase:       "lobby",
      currentUser: { fullName, profilePicUrl, role: "lobby" },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Join failed" });
  }
};
 
// ──────────────────────────────────────────────────────────────
// GET FULL PARTICIPANT TOKEN  (after host admits)
// ──────────────────────────────────────────────────────────────
 
export const getParticipantToken = async (req, res) => {
  try {
    const userId    = req.user.id;
    const sessionId = req.params.sessionId;
 
    const session = await ClassSession.findByPk(sessionId);
    if (!session) return res.status(404).json({ message: "Session not found" });
 
    const waitingEntry = await SessionWaitingRoom.findOne({
      where: { classSessionId: sessionId, userId, status: "admitted" },
    });
    if (!waitingEntry)
      return res.status(403).json({ message: "You have not been admitted yet" });
 
    const user           = await User.findByPk(userId, { attributes: ["id", "fullName"] });
    const studentProfile = await StudentProfile.findOne({
      where: { userId },
      attributes: ["fullName", "profilePicUrl"],
    });
 
    const fullName      = studentProfile?.fullName || user?.fullName || `User ${userId}`;
    const profilePicUrl = studentProfile?.profilePicUrl || "";
    const identity      = `user-${userId}`;
 
    const token = await createLiveKitToken(
      session.roomName,
      identity,
      "participant",
      { fullName, profilePicUrl }
    );
 
    // Record attendance
    await SessionAttendance.upsert({
      classSessionId: sessionId,
      userId,
      role:       "student",
      joinTime:   new Date(),
      wasPresent: true,
    });
 
    await ActivityLog.create({
      userId,
      action: "JOIN_SESSION_ADMITTED",
      meta:   { sessionId },
    });
 
    res.json({
      token,
      roomName:    session.roomName,
      serverUrl:   process.env.LIVEKIT_URL,
      phase:       "live",
      currentUser: { fullName, profilePicUrl, role: "participant" },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Token upgrade failed" });
  }
};
 
// ──────────────────────────────────────────────────────────────
// GET WAITING ROOM  —  FIX: defensive req.user check
// ──────────────────────────────────────────────────────────────
 
export const getWaitingRoom = async (req, res) => {
  try {
    // Guard: this should never be reached without authenticate middleware,
    // but if it is, return 401 instead of crashing.
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
 
    const sessionId = req.params.sessionId;
    const session   = await ClassSession.findByPk(sessionId);
    if (!session) return res.status(404).json({ message: "Session not found" });
 
    // Auth: tutor who owns this session OR admin
    const adminRoles = ["admin", "superadmin", "operational_admin"];
    const isAdmin    = adminRoles.includes(req.user.role);
 
    if (!isAdmin) {
      const tutorProfile = await TutorProfile.findOne({
        where: { userId: req.user.id },
      });
      if (!tutorProfile || tutorProfile.id !== session.tutorProfileId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
    }
 
    const waiting = await SessionWaitingRoom.findAll({
      where:  { classSessionId: sessionId, status: "waiting" },
      order:  [["requestedAt", "ASC"]],
    });
 
    res.json({ waiting });
  } catch (err) {
    console.error("getWaitingRoom error:", err);
    res.status(500).json({ message: "Failed to fetch waiting room" });
  }
};
 
// ──────────────────────────────────────────────────────────────
// ADMIT PARTICIPANT
// ──────────────────────────────────────────────────────────────
 
export const admitParticipant = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
 
    const { sessionId, userId } = req.params;
 
    const session = await ClassSession.findByPk(sessionId);
    if (!session) return res.status(404).json({ message: "Session not found" });
 
    const adminRoles = ["admin", "superadmin", "operational_admin"];
    const isAdmin    = adminRoles.includes(req.user.role);
 
    if (!isAdmin) {
      const tutorProfile = await TutorProfile.findOne({ where: { userId: req.user.id } });
      if (!tutorProfile || tutorProfile.id !== session.tutorProfileId)
        return res.status(403).json({ message: "Unauthorized" });
    }
 
    const entry = await SessionWaitingRoom.findOne({
      where: { classSessionId: sessionId, userId },
    });
    if (!entry) return res.status(404).json({ message: "User not in waiting room" });
 
    entry.status     = "admitted";
    entry.admittedAt = new Date();
    await entry.save();
 
    // Push ADMITTED signal via Server SDK so student gets it immediately
    try {
      const payload = Buffer.from(
        JSON.stringify({
          type:     "ADMITTED",
          userId:   `user-${userId}`,
          identity: `user-${userId}`,
        })
      );
      await roomService.sendData(
        session.roomName,
        payload,
        0   // RELIABLE
      );
    } catch (dataErr) {
      console.warn("sendData ADMITTED failed:", dataErr.message);
    }
 
    // In-app notification
    await Notification.create({
      userId:     Number(userId),
      title:      "You've Been Admitted",
      message:    `You have been admitted to "${session.title}"`,
      type:       "live_class",
      entityId:   session.id,
      entityType: "class_session",
    });
 
    await ActivityLog.create({
      userId:  req.user.id,
      action:  "PARTICIPANT_ADMITTED",
      meta:    { sessionId, admittedUserId: userId },
    });
 
    res.json({ message: "Participant admitted", userId: Number(userId) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to admit participant" });
  }
};
 
// ──────────────────────────────────────────────────────────────
// DENY PARTICIPANT
// ──────────────────────────────────────────────────────────────
 
export const denyParticipant = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
 
    const { sessionId, userId } = req.params;
    const { reason = "" }       = req.body;
 
    const session = await ClassSession.findByPk(sessionId);
    if (!session) return res.status(404).json({ message: "Session not found" });
 
    const adminRoles = ["admin", "superadmin", "operational_admin"];
    const isAdmin    = adminRoles.includes(req.user.role);
 
    if (!isAdmin) {
      const tutorProfile = await TutorProfile.findOne({ where: { userId: req.user.id } });
      if (!tutorProfile || tutorProfile.id !== session.tutorProfileId)
        return res.status(403).json({ message: "Unauthorized" });
    }
 
    const entry = await SessionWaitingRoom.findOne({
      where: { classSessionId: sessionId, userId },
    });
    if (!entry) return res.status(404).json({ message: "User not in waiting room" });
 
    entry.status   = "denied";
    entry.deniedAt = new Date();
    entry.reason   = reason;
    await entry.save();
 
    // Push DENIED signal
    try {
      const payload = Buffer.from(
        JSON.stringify({
          type:     "DENIED",
          userId:   `user-${userId}`,
          identity: `user-${userId}`,
          reason,
        })
      );
      await roomService.sendData(session.roomName, payload, 0);
    } catch (dataErr) {
      console.warn("sendData DENIED failed:", dataErr.message);
    }
 
    await Notification.create({
      userId:     Number(userId),
      title:      "Join Request Declined",
      message:    `Your request to join "${session.title}" was declined.${reason ? ` Reason: ${reason}` : ""}`,
      type:       "live_class",
      entityId:   session.id,
      entityType: "class_session",
    });
 
    await ActivityLog.create({
      userId:  req.user.id,
      action:  "PARTICIPANT_DENIED",
      meta:    { sessionId, deniedUserId: userId, reason },
    });
 
    res.json({ message: "Participant denied", userId: Number(userId) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to deny participant" });
  }
};
 
// ──────────────────────────────────────────────────────────────
// JOIN AS TUTOR  (unchanged)
// ──────────────────────────────────────────────────────────────
 
export const joinAsTutor = async (req, res) => {
  try {
    const tutorProfile = await TutorProfile.findOne({ where: { userId: req.user.id } });
    if (!tutorProfile)
      return res.status(403).json({ message: "Tutor profile not found" });
 
    const session = await ClassSession.findByPk(req.params.sessionId);
    if (!session) return res.status(404).json({ message: "Session not found" });
 
    if (session.tutorProfileId !== tutorProfile.id)
      return res.status(403).json({ message: "You are not assigned to this session" });
 
    const fullName      = tutorProfile.fullName || `Tutor ${req.user.id}`;
    const profilePicUrl = tutorProfile.profilePicUrl || "";
    const identity      = `user-${req.user.id}`;
 
    const token = await createLiveKitToken(
      session.roomName,
      identity,
      "host",
      { fullName, profilePicUrl }
    );
 
    session.isLive = true;
    session.status = "live";
    await session.save();
 
    await ActivityLog.create({
      userId: req.user.id,
      action: "TUTOR_JOINED_SESSION",
      meta:   { sessionId: session.id },
    });
 
    res.json({
      token,
      roomName:    session.roomName,
      serverUrl:   process.env.LIVEKIT_URL,
      phase:       "live",
      currentUser: { fullName, profilePicUrl, role: "host" },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Join failed" });
  }
};

  // ======================================================
// GET TUTOR SESSIONS
// ======================================================

export const getTutorSessions =
  async (req, res) => {

    try {

      const tutorProfile =
        await TutorProfile.findOne({

          where: {
            userId: req.user.id,
          },
        });

      if (!tutorProfile) {

        return res.status(403).json({
          message:
            "Tutor profile not found",
        });
      }

      const sessions =
        await ClassSession.findAll({

          where: {
            tutorProfileId:
              tutorProfile.id,
          },

          include: [
            {
              model: Course,
              attributes: [
                "id",
                "title",
              ],
            },
          ],

          order: [
            ["scheduledAt", "DESC"],
          ],
        });

      res.json({
        sessions,
      });

    } catch (err) {

      console.error(err);

      res.status(500).json({
        message:
          "Failed to fetch tutor sessions",
      });
    }
  };

  // ======================================================
// GET STUDENT SESSIONS
// ======================================================

export const getStudentSessions =
  async (req, res) => {

    try {

      const userId =
        req.user.id;

      // ==================================================
      // ACTIVE ENROLLMENTS
      // ==================================================

      const enrollments =
        await Enrollment.findAll({

          where: {
            studentId:
              userId,

            status:
              "active",
          },
        });

      const courseIds =
        enrollments.map(
          (e) => e.courseId
        );

      if (!courseIds.length) {

        return res.json({
          sessions: [],
        });
      }

      // ==================================================
      // SESSIONS
      // ==================================================

      const sessions =
        await ClassSession.findAll({

          where: {

            courseId: {
              [Op.in]:
                courseIds,
            },

            status: {
              [Op.ne]:
                "cancelled",
            },
          },

          include: [

            {
              model: Course,
              attributes: [
                "id",
                "title",
              ],
            },

            {
              model: TutorProfile,
              include: [
                {
                  model: User,
                  attributes: [
                    "id",
                    "fullName",
                    "email",
                  ],
                },
              ],
            },
          ],

          order: [
            ["scheduledAt", "ASC"],
          ],
        });

      res.json({
        sessions,
      });

    } catch (err) {

      console.error(err);

      res.status(500).json({
        message:
          "Failed to fetch sessions",
      });
    }
  };

  // ======================================================
// GET SESSION BY ID
// ======================================================

export const getSessionById =
  async (req, res) => {

    try {

      const session =
        await ClassSession.findByPk(

          req.params.sessionId,

          {

            include: [

              {
                model: Course,
              },

              {
                model: TutorProfile,
                include: [
                  {
                    model: User,
                    attributes: [
                      "id",
                      "fullName",
                      "email",
                    ],
                  },
                ],
              },

              {
                model:
                  SessionAttendance,

                include: [
                  {
                    model: User,
                    attributes: [
                      "id",
                      "fullName",
                      "email",
                    ],
                  },
                ],
              },
            ],
          }
        );

      if (!session) {

        return res.status(404).json({
          message:
            "Session not found",
        });
      }

      res.json(session);

    } catch (err) {

      console.error(err);

      res.status(500).json({
        message:
          "Failed to fetch session",
      });
    }
  };

  // ======================================================
// CANCEL SESSION
// ======================================================

export const cancelSession =
  async (req, res) => {

    try {

      const session =
        await ClassSession.findByPk(
          req.params.sessionId
        );

      if (!session) {

        return res.status(404).json({
          message:
            "Session not found",
        });
      }

      // ==================================================
      // VERIFY TUTOR
      // ==================================================

      const tutorProfile =
        await TutorProfile.findOne({

          where: {
            userId:
              req.user.id,
          },
        });

      const isAdmin =
        [
          "admin",
          "superadmin",
        ].includes(
          req.user.role
        );

      if (
        !isAdmin &&
        session.tutorProfileId !==
        tutorProfile?.id
      ) {

        return res.status(403).json({
          message:
            "Unauthorized",
        });
      }

      session.status =
        "cancelled";

      session.isLive =
        false;

      session.cancellationReason =
        req.body.reason || null;

      await session.save();

      // ==================================================
      // LOG
      // ==================================================

      await ActivityLog.create({

        userId:
          req.user.id,

        action:
          "SESSION_CANCELLED",

        meta: {
          sessionId:
            session.id,
        },
      });

      res.json({
        message:
          "Session cancelled successfully",
      });

    } catch (err) {

      console.error(err);

      res.status(500).json({
        message:
          "Failed to cancel session",
      });
    }
  };

  // ======================================================
// END SESSION
// ======================================================

export const endSession =
  async (req, res) => {

    try {

      const session =
        await ClassSession.findByPk(
          req.params.sessionId
        );

      if (!session) {

        return res.status(404).json({
          message:
            "Session not found",
        });
      }

      const tutorProfile =
        await TutorProfile.findOne({

          where: {
            userId:
              req.user.id,
          },
        });

      if (
        session.tutorProfileId !==
        tutorProfile?.id
      ) {

        return res.status(403).json({
          message:
            "Unauthorized",
        });
      }

      session.status =
        "ended";

      session.isLive =
        false;

      session.endTime =
        new Date();

      session.endedReason =
        "Tutor manually ended session";

      await session.save();

      // ==================================================
      // LOG
      // ==================================================

      await ActivityLog.create({

        userId:
          req.user.id,

        action:
          "SESSION_MANUALLY_ENDED",

        meta: {
          sessionId:
            session.id,
        },
      });

      res.json({
        message:
          "Session ended successfully",
      });

    } catch (err) {

      console.error(err);

      res.status(500).json({
        message:
          "Failed to end session",
      });
    }
  };

  // ======================================================
// GET SESSION ATTENDANCE
// ======================================================

export const getSessionAttendance =
  async (req, res) => {

    try {

      const attendance =
        await SessionAttendance.findAll({

          where: {
            classSessionId:
              req.params.sessionId,
          },

          include: [
            {
              model: User,
              attributes: [
                "id",
                "fullName",
                "email",
              ],
            },
          ],

          order: [
            ["createdAt", "ASC"],
          ],
        });

      res.json({
        attendance,
      });

    } catch (err) {

      console.error(err);

      res.status(500).json({
        message:
          "Failed to fetch attendance",
      });
    }
  };

  // ======================================================
// GET SESSION RECORDING
// ======================================================

export const getSessionRecording =
  async (req, res) => {

    try {

      const session =
        await ClassSession.findByPk(
          req.params.sessionId
        );

      if (!session) {

        return res.status(404).json({
          message:
            "Session not found",
        });
      }

      if (
        !session.recordingUrl
      ) {

        return res.status(404).json({
          message:
            "Recording not available",
        });
      }

      res.json({

        recordingUrl:
          session.recordingUrl,

        duration:
          session.recordingDuration,

        status:
          session.recordingStatus,
      });

    } catch (err) {

      console.error(err);

      res.status(500).json({
        message:
          "Failed to fetch recording",
      });
    }
  };

  export const markAttendance =
  async (req, res) => {
    try {

      const session =
        await ClassSession.findByPk(
          req.params.id
        );

      if (!session) {
        return res.status(404).json({
          message:
            "Session not found",
        });
      }

      const existing =
        await SessionAttendance.findOne({
          where: {
            classSessionId:
              session.id,
            userId:
              req.user.id,
          },
        });

      if (existing) {
        return res.json({
          message:
            "Attendance already recorded",
        });
      }

      await SessionAttendance.create({
        classSessionId:
          session.id,
        userId:
          req.user.id,
        joinedAt:
          new Date(),
      });

      session.totalParticipants += 1;

      await session.save();

      await ActivityLog.create({
        userId:
          req.user.id,
        action:
          "SESSION_ATTENDANCE",
        meta: {
          sessionId:
            session.id,
        },
      });

      res.json({
        message:
          "Attendance recorded",
      });

    } catch (error) {
      console.error(error);

      res.status(500).json({
        message:
          "Attendance failed",
      });
    }
  };

  export const leaveSession =
  async (req, res) => {

    try {

      const attendance =
        await SessionAttendance.findOne({
          where: {
            classSessionId:
              req.params.id,
            userId:
              req.user.id,
          },
        });

      if (!attendance) {
        return res.status(404).json({
          message:
            "Attendance not found",
        });
      }

      attendance.leftAt =
        new Date();

      const minutes =
        Math.round(
          (
            attendance.leftAt -
            attendance.joinedAt
          ) /
          1000 /
          60
        );

      attendance.minutesAttended =
        minutes;

      await attendance.save();

      res.json({
        message:
          "Leave recorded",
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        message:
          "Leave failed",
      });
    }
  };

  export const getSessionParticipants =
  async (req, res) => {

    try {

      const participants =
        await SessionAttendance.findAll({
          where: {
            classSessionId:
              req.params.id,
          },

          include: [
            {
              model: User,
              attributes: [
                "id",
                "fullName",
                "email",
              ],
            },
          ],

          order: [
            ["joinedAt", "DESC"],
          ],
        });

      res.json({
        participants,
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        message:
          "Failed to fetch participants",
      });
    }
  };

  export const raiseHand =
  async (req, res) => {

    try {

      await SessionEventLog.create({
        classSessionId:
          req.params.id,

        userId:
          req.user.id,

        eventType:
          "RAISE_HAND",

        meta: {
          raisedAt:
            new Date(),
        },
      });

      res.json({
        message:
          "Hand raised",
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        message:
          "Failed",
      });
    }
  };

  export const sendReaction =
  async (req, res) => {

    try {

      const { emoji } =
        req.body;

      await SessionEventLog.create({
        classSessionId:
          req.params.id,

        userId:
          req.user.id,

        eventType:
          "REACTION",

        meta: {
          emoji,
        },
      });

      res.json({
        message:
          "Reaction sent",
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        message:
          "Failed",
      });
    }
  };

  export const startRecording =
  async (req, res) => {

    try {

      const session =
        await ClassSession.findByPk(
          req.params.id
        );

      if (!session) {
        return res.status(404).json({
          message:
            "Session not found",
        });
      }

      session.recordingStatus =
        "processing";

      await session.save();

      await ActivityLog.create({
        userId:
          req.user.id,

        action:
          "SESSION_RECORDING_STARTED",

        meta: {
          sessionId:
            session.id,
        },
      });

      res.json({
        message:
          "Recording started",
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        message:
          "Failed to start recording",
      });
    }
  };

  export const stopRecording =
  async (req, res) => {

    try {

      const session =
        await ClassSession.findByPk(
          req.params.id
        );

      if (!session) {
        return res.status(404).json({
          message:
            "Session not found",
        });
      }

      session.recordingStatus =
        "ready";

      session.recordingDuration =
        Math.round(
          (
            new Date() -
            session.startTime
          ) /
          1000 /
          60
        );

      await session.save();

      await ActivityLog.create({
        userId:
          req.user.id,

        action:
          "SESSION_RECORDING_STOPPED",

        meta: {
          sessionId:
            session.id,
        },
      });

      res.json({
        message:
          "Recording stopped",
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        message:
          "Failed to stop recording",
      });
    }
  };