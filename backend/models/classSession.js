// models/ClassSession.js

import { DataTypes } from "sequelize";
import { Op } from "sequelize";

export default (sequelize) => {

  const ClassSession =
    sequelize.define(
      "ClassSession",
      {

        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },



        // ==================================================
        // BASIC INFO
        // ==================================================

        title: {
          type: DataTypes.STRING,
          allowNull: false,
        },

        description:
          DataTypes.TEXT,



        // ==================================================
        // RELATIONS
        // ==================================================

        courseId: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },

        tutorProfileId: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },

        scheduledBy: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },



        // ==================================================
        // SCHEDULING
        // ==================================================

        scheduledAt:
          DataTypes.DATE,

        sessionCode: {
          type: DataTypes.STRING,
          unique: true,
        },

      
        attendanceReportGenerated: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },

        recordingStatus: {
          type: DataTypes.ENUM(
            "pending",
            "processing",
            "ready",
            "failed"
          ),
          defaultValue: "pending",
        },

        enableWaitingRoom: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },

        thumbnailUrl: DataTypes.STRING,
        aiSummary: DataTypes.TEXT,

        tags: {
          type: DataTypes.JSON,
          defaultValue: [],
        },

        attendanceRate: {
          type: DataTypes.FLOAT,
          defaultValue: 0,
        },

        durationMinutes: {
          type: DataTypes.INTEGER,
          defaultValue: 60,
        },


        startTime:
          DataTypes.DATE,

        endTime:
          DataTypes.DATE,

        timezone: {
          type: DataTypes.STRING,
          defaultValue:
            "Africa/Lagos",
        },



        // ==================================================
        // LIVE PROVIDER
        // ==================================================

        meetingProvider: {
          type: DataTypes.ENUM(
            "livekit",
            "zoom",
            "agora"
          ),

          defaultValue:
            "livekit",
        },

        roomName:
          DataTypes.STRING,

        joinLink:
          DataTypes.STRING,

        meetingPassword:
          DataTypes.STRING,



        // ==================================================
        // TOKENS
        // ==================================================

        hostToken:
          DataTypes.TEXT,

        participantToken:
          DataTypes.TEXT,



        // ==================================================
        // ACCESS CONTROL
        // ==================================================

        linkExpiresAt:
          DataTypes.DATE,

        allowChat: {
          type: DataTypes.BOOLEAN,
          defaultValue: true,
        },

        allowScreenShare: {
          type: DataTypes.BOOLEAN,
          defaultValue: true,
        },

        allowStudentCamera: {
          type: DataTypes.BOOLEAN,
          defaultValue: true,
        },

        allowStudentMic: {
          type: DataTypes.BOOLEAN,
          defaultValue: true,
        },

        enableWhiteboard: {
          type: DataTypes.BOOLEAN,
          defaultValue: true,
        },



        // ==================================================
        // SESSION STATUS
        // ==================================================

        isLive: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },

        status: {
          type: DataTypes.ENUM(
            "scheduled",
            "live",
            "ended",
            "cancelled",
            "missed"
          ),

          defaultValue:
            "scheduled",
        },



        // ==================================================
        // RECORDINGS
        // ==================================================

        recordingEnabled: {
          type: DataTypes.BOOLEAN,
          defaultValue: true,
        },

        recordingUrl:
          DataTypes.STRING,

        recordingDuration:
          DataTypes.INTEGER,



        // ==================================================
        // ANALYTICS
        // ==================================================

        totalParticipants: {
          type: DataTypes.INTEGER,
          defaultValue: 0,
        },

        totalAttendanceMinutes: {
          type: DataTypes.INTEGER,
          defaultValue: 0,
        },



        // ==================================================
        // REMINDERS
        // ==================================================

        reminderSent24h: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },

        reminderSent1h: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },

        reminderSent10m: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        



        // ==================================================
        // RECURRING
        // ==================================================

        isRecurring: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },

        recurrenceRule:
          DataTypes.STRING,



        // ==================================================
        // VISIBILITY
        // ==================================================

        visibility: {
          type: DataTypes.ENUM(
            "assigned_students",
            "course_students",
            "private"
          ),

          defaultValue:
            "assigned_students",
        },



        // ==================================================
        // SESSION NOTES
        // ==================================================

        tutorNotes:
          DataTypes.TEXT,

        adminNotes:
          DataTypes.TEXT,



        // ==================================================
        // POST SESSION
        // ==================================================

        endedReason:
          DataTypes.STRING,

        cancellationReason:
          DataTypes.TEXT,

      },
      {
        tableName:
          "class_sessions",

        timestamps: true,
      }
    );



  // ======================================================
  // ASSOCIATIONS
  // ======================================================

  ClassSession.associate =
    (models) => {

      ClassSession.belongsTo(
        models.Course,
        {
          foreignKey:
            "courseId",
        }
      );

      ClassSession.belongsTo(
        models.TutorProfile,
        {
          foreignKey:
            "tutorProfileId",
        }
      );

      ClassSession.belongsTo(
        models.User,
        {
          foreignKey:
            "scheduledBy",

          as: "scheduler",
        }
      );

      ClassSession.hasMany(
        models.SessionAttendance,
        {
          foreignKey:
            "classSessionId",
        }
      );

      ClassSession.hasMany(
        models.SessionEventLog,
        {
          foreignKey:
            "classSessionId",
        }
      );
    };



  return ClassSession;
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