import models from "../models/index.js";
import { Op } from "sequelize";

const {
  StudentProfile,
  Enrollment,
  Course,
  CourseModule,
  Lesson,
  LessonProgress,
  QuizAttempt,
  TutorStudent,
  TutorProfile,
  ClassSession,
  Notification,
  HealsApplication,
  ExamRegistration,
  ExamPayment,
  Article,
} = models;

export const getStudentDashboard = async (
  req,
  res
) => {
  try {
    const userId = req.user.id;

    // =====================================================
    // PROFILE
    // =====================================================

    const profile =
      await StudentProfile.findOne({
        where: { userId },
      });

    // =====================================================
    // ENROLLMENTS
    // =====================================================

    const enrollments =
      await Enrollment.findAll({
        where: {
          studentId: userId,
          status: "active",
        },

        include: [
          {
            model: Course,
          },
        ],

        order: [["createdAt", "DESC"]],
      });

    const enrolledCourseIds =
      enrollments.map(
        (e) => e.courseId
      );

    // =====================================================
    // LESSON ANALYTICS
    // =====================================================

    let totalLessons = 0;

    if (
      enrolledCourseIds.length > 0
    ) {
      const modules =
        await CourseModule.findAll({
          where: {
            courseId:
              enrolledCourseIds,
          },
        });

      const moduleIds =
        modules.map(
          (m) => m.id
        );

      if (
        moduleIds.length > 0
      ) {
        totalLessons =
          await Lesson.count({
            where: {
              moduleId:
                moduleIds,
            },
          });
      }
    }

    const completedLessons =
      await LessonProgress.count({
        where: {
          userId,
          completed: true,
        },
      });

    const overallProgress =
      totalLessons > 0
        ? Math.round(
            (
              completedLessons /
              totalLessons
            ) * 100
          )
        : 0;

    // =====================================================
    // CONTINUE LEARNING
    // =====================================================

    const latestProgress =
      await LessonProgress.findOne({
        where: {
          userId,
        },

        include: [
          {
            model: Lesson,
          },
        ],

        order: [
          ["updatedAt", "DESC"],
        ],
      });

    let continueLearning =
      null;

    if (
      latestProgress &&
      latestProgress.Lesson
    ) {
      continueLearning = {
        lessonId:
          latestProgress.lessonId,

        lessonTitle:
          latestProgress.Lesson
            .title,

        progress:
          latestProgress.progress ||
          0,
      };
    }

    // =====================================================
    // QUIZZES
    // =====================================================

    const recentQuizAttempts =
      await QuizAttempt.findAll({
        where: {
          userId,
        },

        order: [
          ["createdAt", "DESC"],
        ],

        limit: 5,
      });

    const totalQuizAttempts =
      await QuizAttempt.count({
        where: {
          userId,
        },
      });

    const averageQuizScore =
      recentQuizAttempts.length >
      0
        ? (
            recentQuizAttempts.reduce(
              (sum, attempt) =>
                sum +
                Number(
                  attempt.score || 0
                ),
              0
            ) /
            recentQuizAttempts.length
          ).toFixed(1)
        : 0;

    // =====================================================
    // ASSIGNED TUTORS
    // =====================================================

    const assignedTutors =
      await TutorStudent.findAll({
        where: {
          studentId: userId,
          status: "active",
        },

        include: [
          {
            model:
              TutorProfile,
          },
          {
            model: Course,
          },
        ],
      });

    // =====================================================
    // UPCOMING LIVE CLASSES
    // =====================================================

    const upcomingSessions =
      await ClassSession.findAll({
        where: {
          status: "scheduled",

          scheduledAt: {
            [Op.gt]:
              new Date(),
          },
        },

        include: [
          {
            model: Course,
          },

          {
            model:
              TutorProfile,
          },
        ],

        order: [
          ["scheduledAt", "ASC"],
        ],

        limit: 5,
      });

    // =====================================================
    // HEALS
    // =====================================================

    const latestHealsApplication =
      await HealsApplication.findOne({
        where: {
          userId,
        },

        order: [
          ["createdAt", "DESC"],
        ],
      });

    // =====================================================
    // EXAM REGISTRATIONS
    // =====================================================

    const recentExamRegistrations =
      await ExamRegistration.findAll({
        where: {
          userId,
        },

        order: [
          ["createdAt", "DESC"],
        ],

        limit: 5,
      });

    const latestExamRegistration =
      recentExamRegistrations[0] ||
      null;

    const totalExamRegistrations =
      await ExamRegistration.count({
        where: {
          userId,
        },
      });

    const successfulExamPayments =
      await ExamPayment.count({
        where: {
          userId,
          status: "success",
        },
      });

    // =====================================================
    // ARTICLES
    // =====================================================

    const latestArticles =
      await Article.findAll({
        where: {
          status:
            "published",
        },

        order: [
          ["publishedAt", "DESC"],
        ],

        limit: 5,
      });

    // =====================================================
    // NOTIFICATIONS
    // =====================================================

    const notifications =
      await Notification.findAll({
        where: {
          [Op.or]: [
            {
              userId,
            },
            {
              userId: null,
            },
          ],
        },

        order: [
          ["createdAt", "DESC"],
        ],

        limit: 10,
      });

    const unreadNotifications =
      await Notification.count({
        where: {
          userId,
          isRead: false,
        },
      });

    // =====================================================
    // HERO
    // =====================================================

    const hero = {
      name:
        profile?.fullName ||
        req.user.fullName,

      totalCourses:
        enrollments.length,

      completedLessons,

      overallProgress,

      averageQuizScore,
    };

    // =====================================================
    // DASHBOARD CARDS
    // =====================================================

    const stats = {
      enrolledCourses:
        enrollments.length,

      completedLessons,

      totalLessons,

      overallProgress,

      quizAttempts:
        totalQuizAttempts,

      assignedTutors:
        assignedTutors.length,

      upcomingClasses:
        upcomingSessions.length,

      examRegistrations:
        totalExamRegistrations,

      unreadNotifications,
    };

    // =====================================================
    // RESPONSE
    // =====================================================

    return res.json({
      profile,

      hero,

      stats,

      continueLearning,

      enrolledCourses:
        enrollments,

      recentQuizAttempts,

      analytics: {
        overallProgress,
        totalLessons,
        completedLessons,
        averageQuizScore,
      },

      assignedTutors,

      upcomingSessions,

      latestHealsApplication,

      latestExamRegistration,

      recentExamRegistrations,

      examStats: {
        totalRegistrations:
          totalExamRegistrations,

        successfulPayments:
          successfulExamPayments,
      },

      latestArticles,

      notifications,
    });

  } catch (error) {

    console.error(
      "Dashboard Error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to load dashboard",
    });
  }
};