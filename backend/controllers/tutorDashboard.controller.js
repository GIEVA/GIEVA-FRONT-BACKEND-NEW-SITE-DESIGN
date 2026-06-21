import models from "../models/index.js";
import { Op } from "sequelize";

const {
  TutorProfile,
  TutorStudent,
  ClassSession,
  SessionAttendance,
  Course,
  User,
} = models;



// ======================================================
// GET TUTOR DASHBOARD SUMMARY
// ======================================================

export const getTutorDashboardSummary =
  async (req, res) => {

    try {

      const userId =
        req.user.id;

      // ======================================================
      // TUTOR PROFILE
      // ======================================================

      const tutorProfile =
        await TutorProfile.findOne({
          where: {
            userId,
          },
        });

      if (!tutorProfile) {

  return res.status(200).json({

    tutorProfile: null,

    stats: {

      assignedStudents: 0,

      activeCourses: 0,

      totalSessions: 0,

      completedSessions: 0,

      attendanceRate: 0,

      totalLectureMinutes: 0,

      totalAttendanceMinutes: 0,

      estimatedEarnings: 0,
      liveSessions: 0,
      upcomingSessionsCount: 0,
    },

    upcomingSessions: [],

    recentSessions: [],

    recentStudents: [],
  });
}

 const now = new Date();

      // ======================================================
      // ASSIGNED STUDENTS
      // ======================================================

      const assignedStudents =
        await TutorStudent.count({
          where: {
            tutorProfileId:
              tutorProfile.id,

            status:
              "active",
          },
        });

      // ======================================================
      // ACTIVE COURSES
      // ======================================================

      const activeCourses =
        await TutorStudent.count({
          distinct: true,

          col: "courseId",

          where: {
            tutorProfileId:
              tutorProfile.id,
          },
        });

      // ======================================================
      // UPCOMING SESSIONS
      // ======================================================

      const upcomingSessions =
        await ClassSession.findAll({

          where: {

            tutorProfileId:
              tutorProfile.id,

            scheduledAt: {
              [Op.gt]:
                new Date(),
            },

            status:
              "scheduled",
          },

          limit: 5,

          order: [
            ["scheduledAt", "ASC"],
          ],

          include: [
            {
              model: Course,
              attributes: [
                "id",
                "title",
              ],
            },
          ],
        });

      // ======================================================
      // RECENT SESSIONS
      // ======================================================

      const recentSessions =
        await ClassSession.findAll({

          where: {
            tutorProfileId:
              tutorProfile.id,
          },

          limit: 5,

          order: [
            ["createdAt", "DESC"],
          ],

          include: [
            {
              model: Course,
              attributes: [
                "id",
                "title",
              ],
            },
          ],
        });

      // ======================================================
      // TOTAL SESSIONS
      // ======================================================

      const totalSessions =
        await ClassSession.count({

          where: {
            tutorProfileId:
              tutorProfile.id,
          },
        });

        const allSessions =
  await ClassSession.findAll({
    where: {
      tutorProfileId:
        tutorProfile.id,
    },
  });



      // ======================================================
      // COMPLETED SESSIONS
      // ======================================================


const completedSessions =
  allSessions.filter(
    (session) => {

      const start =
        new Date(
          session.scheduledAt
        );

      const end =
        new Date(
          start.getTime() +
          (
            session.durationMinutes ||
            60
          ) *
            60000
        );

      return (
        now > end ||
        session.status ===
          "ended"
      );
    }
  ).length;
      // ======================================================
      // ATTENDANCE STATS
      // ======================================================

      const attendanceRecords =
        await SessionAttendance.findAll({

          include: [

            {
              model: ClassSession,

              where: {
                tutorProfileId:
                  tutorProfile.id,
              },
            },
          ],
        });

      const totalAttendanceMinutes =
        attendanceRecords.reduce(
          (sum, item) =>
            sum + item.totalMinutes,
          0
        );

      const attendanceRate =
        tutorProfile.attendanceRate || 0;

      // ======================================================
      // RECENT STUDENTS
      // ======================================================

      const recentStudents =
        await TutorStudent.findAll({

          where: {
            tutorProfileId:
              tutorProfile.id,
          },

          limit: 5,

          order: [
            ["createdAt", "DESC"],
          ],

          include: [

            {
              model: User,

              as: "student",

              attributes: [
                "id",
                "fullName",
                "email",
              ],
            },

            {
              model: Course,

              attributes: [
                "id",
                "title",
              ],
            },
          ],
        });

      // ======================================================
      // ESTIMATED EARNINGS
      // ======================================================

      const estimatedEarnings =
        (
          tutorProfile.totalLectureMinutes / 60
        ) *
        Number(
          tutorProfile.hourlyRate || 0
        );





const liveSessions =
  allSessions.filter(
    (session) => {

      const start =
        new Date(
          session.scheduledAt
        );

      const end =
        new Date(
          start.getTime() +
          (
            session.durationMinutes ||
            60
          ) *
            60000
        );

      return (
        now >= start &&
        now <= end &&
        session.status !==
          "cancelled" &&
        session.status !==
          "ended"
      );
    }
  ).length;

const upcomingSessionsCount =
  allSessions.filter(
    (session) =>
      new Date(
        session.scheduledAt
      ) > now
  ).length;

      // ======================================================
      // RESPONSE
      // ======================================================

      res.json({

        tutorProfile,

        stats: {

          assignedStudents,

          activeCourses,

          totalSessions,

          completedSessions,
          liveSessions,
          upcomingSessionsCount,
          attendanceRate,
          totalLectureMinutes:
          tutorProfile.totalLectureMinutes,
          totalAttendanceMinutes,
          estimatedEarnings,
        },

        upcomingSessions,

        recentSessions,

        recentStudents,
      });

    } catch (err) {

      console.error(
        "Tutor Dashboard Error:",
        err
      );

      res.status(500).json({
        message:
          "Failed to load tutor dashboard",
      });
    }
  };