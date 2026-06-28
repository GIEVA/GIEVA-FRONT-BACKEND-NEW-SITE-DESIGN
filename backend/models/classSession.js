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
          allowNull: true,
        },

        tutorProfileId: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },

        scheduledBy: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },

        hostType: {
          type: DataTypes.ENUM(
              "tutor",
              "admin"
          ),
          defaultValue: "tutor",
      },

        sessionType: {
            type: DataTypes.ENUM(
                "course",
                "public"
            ),
            defaultValue: "course",
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
            "private",
            "public",
            "organization",
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

