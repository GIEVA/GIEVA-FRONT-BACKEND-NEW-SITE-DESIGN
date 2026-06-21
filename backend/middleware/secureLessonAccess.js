import models from "../models/index.js";

const {
  Lesson,
  CourseModule,
  Course,
  Enrollment,
  Payment,
} = models;

export const secureLessonAccess =
  async (req, res, next) => {
    try {

      const userId =
        req.user.id;

      const lessonId =
        req.params.lessonId;

      // =====================================
      // GET LESSON
      // =====================================

      const lesson =
        await Lesson.findByPk(
          lessonId,
          {
            include: {
              model:
                CourseModule,

              include: Course,
            },
          }
        );

      if (!lesson) {
        return res.status(404).json({
          message:
            "Lesson not found",
        });
      }

      // =====================================
      // PUBLISHED CHECK
      // =====================================

      if (!lesson.isPublished) {
        return res.status(403).json({
          message:
            "Lesson not published",
        });
      }

      const module =
        lesson.CourseModule;

      if (!module.isPublished) {
        return res.status(403).json({
          message:
            "Module not published",
        });
      }

      const courseId =
        module.courseId;

      // =====================================
      // PREVIEW LESSONS
      // =====================================

      // 🔥 allow preview lessons
      if (lesson.isPreview) {
        req.lesson = lesson;

        return next();
      }

      // =====================================
      // ENROLLMENT
      // =====================================

      const enrollment =
        await Enrollment.findOne({
          where: {
            studentId: userId,
            courseId,
            status: "active",
          },
        });

      if (!enrollment) {
        return res.status(403).json({
          message:
            "You are not enrolled in this course",
        });
      }

      // =====================================
      // ACTIVE SUBSCRIPTION
      // =====================================

      const payment =
        await Payment.findOne({
          where: {
            userId,
            courseId,
            status: "success",
          },

          order: [
            ["createdAt", "DESC"],
          ],
        });

      if (!payment) {
        return res.status(403).json({
          message:
            "No active subscription found",
        });
      }

      // expired subscription
      if (
        payment.subscriptionEndDate &&
        new Date(
          payment.subscriptionEndDate
        ) < new Date()
      ) {
        return res.status(403).json({
          message:
            "Subscription expired",
        });
      }

      // =====================================
      // DRIP LOCK
      // =====================================

      const unlockDate =
        new Date(
          enrollment.createdAt
        );

      unlockDate.setDate(
        unlockDate.getDate() +
          module.unlockDays
      );

      if (new Date() < unlockDate) {
        return res.status(403).json({
          message:
            "This module is still locked",
        });
      }

      // =====================================
      // ACCESS GRANTED
      // =====================================

      req.lesson = lesson;

      next();

    } catch (err) {

      console.error(err);

      res.status(500).json({
        message:
          "Access validation failed",
      });
    }
  };