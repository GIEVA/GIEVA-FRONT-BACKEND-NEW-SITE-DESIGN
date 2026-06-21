import models from "../models/index.js";
import { cloudinary } from "../config/cloudinary.js";
import sequelize from "../config/db.js";

import { generateSecureUrl } from "../utils/mediaSigner.js";

const {
  Lesson,
  LessonProgress,
  CourseModule,
  Course,
  Payment,
  Enrollment,
  ActivityLog,
} = models;

//
// CREATE LESSON
//
export const createLesson = async (req, res) => {
  const transaction =
    await sequelize.transaction();

  try {
    const userId = req.user.id;

    const {
      title,
      moduleId,
      type,
      contentText,
      youtubeUrl,
      orderIndex,
      durationSeconds,
      isPreview,
      quizId,
    } = req.body;

    if (!title || !type || !moduleId) {
      return res.status(400).json({
        message: "Missing required fields",
      });
    }

    const allowedTypes = [
      "video",
      "pdf",
      "image",
      "link",
      "text",
      "quiz",
    ];

    if (!allowedTypes.includes(type)) {
      return res.status(400).json({
        message: "Invalid lesson type",
      });
    }

    const module =
      await models.CourseModule.findByPk(
        moduleId,
        {
          include: [
            {
              model: models.Course,
            },
          ],
          transaction,
        }
      );

    if (!module) {
      return res.status(404).json({
        message: "Module not found",
      });
    }

    const course = module.Course;

    // 🔐 AUTHORIZATION
    if (
      req.user.role !== "superadmin" &&
      course.userId !== userId
    ) {
      return res.status(403).json({
        message: "Unauthorized",
      });
    }

    // 🔥 AUTO ORDER INDEX
    let finalOrderIndex = orderIndex;

    if (!finalOrderIndex) {
      const lastLesson =
        await Lesson.findOne({
          where: { moduleId },
          order: [["orderIndex", "DESC"]],
          transaction,
        });

      finalOrderIndex = lastLesson
        ? lastLesson.orderIndex + 1
        : 1;
    }

    const exists = await Lesson.findOne({
      where: {
        moduleId,
        orderIndex: finalOrderIndex,
      },
      transaction,
    });

    if (exists) {
      return res.status(400).json({
        message: "Order already exists",
      });
    }

    let contentUrl = null;
    let cloudinaryPublicId = null;
    let cloudinaryResourceType = null;
    let youtubeVideoId = null;

    // ✅ FILE UPLOAD
    if (req.file) {
      contentUrl = req.file.path;
      cloudinaryPublicId = req.file.filename;
      cloudinaryResourceType =
        req.file.resource_type;
    }

    // ✅ YOUTUBE VIDEO
    if (type === "video" && youtubeUrl) {
      const isYoutube =
        /youtube\.com|youtu\.be/.test(
          youtubeUrl
        );

      if (!isYoutube) {
        return res.status(400).json({
          message: "Invalid YouTube URL",
        });
      }

      const match = youtubeUrl.match(
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/i
      );

      youtubeVideoId = match
        ? match[1]
        : null;

      contentUrl = youtubeUrl;
    }

    const lesson = await Lesson.create(
      {
        title,
        moduleId,
        type,
        contentText,
        contentUrl,
        youtubeVideoId,
        orderIndex: finalOrderIndex,
        durationSeconds,
        isPreview: isPreview || false,
        quizId,
        cloudinaryPublicId,
        cloudinaryResourceType,
      },
      { transaction }
    );

    await models.ActivityLog.create(
      {
        userId,
        action: "CREATE_LESSON",
        meta: {
          lessonId: lesson.id,
        },
      },
      { transaction }
    );

    await transaction.commit();

    res.status(201).json(lesson);

  } catch (err) {
    await transaction.rollback();

    console.error(err);

    res.status(500).json({
      message: "Lesson creation failed",
    });
  }
};


//
// ADMIN - GET MODULE LESSONS
//
export const getModuleLessons = async (
  req,
  res
) => {
  try {
    const lessons = await Lesson.findAll({
      where: {
        moduleId: req.params.moduleId,
      },

      order: [["orderIndex", "ASC"]],
    });

    res.json(lessons);

  } catch (err) {
    console.error(err);

    res.status(500).json({
      message:
        "Failed to fetch lessons",
    });
  }
};

//
// GET MODULE LESSONS
//
export const getModuleLessonsStudent = async (req, res) => {
  const userId = req.user.id;

  const lessons = await Lesson.findAll({
    where: { moduleId: req.params.moduleId },
    order: [["orderIndex", "ASC"]],
    include: [
      {
        model: LessonProgress,
        where: { userId },
        required: false,
      },
    ],
  });

  res.json(lessons);
};


//
// UPDATE LESSON
//
export const updateLesson = async (
  req,
  res
) => {
  try {
    const userId = req.user.id;

    const lesson = await Lesson.findByPk(
      req.params.id,
      {
        include: [
          {
            model: models.CourseModule,
            include: [
              {
                model: models.Course,
              },
            ],
          },
        ],
      }
    );

    if (!lesson) {
      return res.status(404).json({
        message: "Lesson not found",
      });
    }

    const course =
      lesson.CourseModule.Course;

    // 🔐 AUTHORIZATION
    if (
      req.user.role !== "superadmin" &&
      course.userId !== userId
    ) {
      return res.status(403).json({
        message: "Unauthorized",
      });
    }

    const oldLesson = lesson.toJSON();

    // ✅ REPLACE CLOUDINARY FILE
    if (req.file) {
      if (lesson.cloudinaryPublicId) {
        await cloudinary.uploader.destroy(
          lesson.cloudinaryPublicId,
          {
            resource_type:
              lesson.cloudinaryResourceType ||
              "image",
          }
        );
      }

      lesson.contentUrl = req.file.path;
      lesson.cloudinaryPublicId =
        req.file.filename;

      lesson.cloudinaryResourceType =
        req.file.resource_type;
    }

    await lesson.update(req.body);

    await models.ActivityLog.create({
      userId,
      action: "UPDATE_LESSON",
      meta: {
        lessonId: lesson.id,
        before: oldLesson,
        after: lesson.toJSON(),
      },
    });

    res.json(lesson);

  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Lesson update failed",
    });
  }
};


//
// DELETE LESSON
//
export const deleteLesson = async (
  req,
  res
) => {
  try {
    const userId = req.user.id;

    const lesson = await Lesson.findByPk(
      req.params.id,
      {
        include: [
          {
            model: models.CourseModule,
            include: [
              {
                model: models.Course,
              },
            ],
          },
        ],
      }
    );

    if (!lesson) {
      return res.status(404).json({
        message: "Lesson not found",
      });
    }

    const course =
      lesson.CourseModule.Course;

    // 🔐 AUTHORIZATION
    if (
      req.user.role !== "superadmin" &&
      course.userId !== userId
    ) {
      return res.status(403).json({
        message: "Unauthorized",
      });
    }

    // ✅ DELETE CLOUDINARY ASSET
    if (lesson.cloudinaryPublicId) {
      await cloudinary.uploader.destroy(
        lesson.cloudinaryPublicId,
        {
          resource_type:
            lesson.cloudinaryResourceType ||
            "image",
        }
      );
    }

    await lesson.destroy();

    await models.ActivityLog.create({
      userId,
      action: "DELETE_LESSON",
      meta: {
        lessonId: lesson.id,
      },
    });

    res.json({
      message:
        "Lesson deleted successfully",
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Lesson delete failed",
    });
  }
};

export const getCourseModulesForStudent =
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { courseId } = req.params;

      // ===============================
      // ACTIVE PAYMENT / SUBSCRIPTION
      // ===============================

      const payment =
        await models.Payment.findOne({
          where: {
            userId,
            courseId,
            status: "success",
          },

          order: [["createdAt", "DESC"]],
        });

      let hasActiveSubscription =
        false;

      if (
        payment &&
        payment.subscriptionEndDate
      ) {
        hasActiveSubscription =
          new Date(
            payment.subscriptionEndDate
          ) > new Date();
      }

      // ===============================
      // ENROLLMENT
      // ===============================

      const enrollment =
        await models.Enrollment.findOne({
          where: {
            studentId: userId,
            courseId,
            status: "active",
          },
        });

      // ===============================
      // FETCH PUBLISHED MODULES ONLY
      // ===============================

      const modules =
        await models.CourseModule.findAll({
          where: {
            courseId,
            isPublished: true,
          },

          include: [
            {
              model: models.Lesson,

              where: {
                isPublished: true,
              },

              required: false,

              attributes: [
                "id",
                "title",
                "type",
                "isPreview",
                "orderIndex",
                "durationSeconds",
              ],
            },
          ],

          order: [
            ["orderIndex", "ASC"],
            [
              models.Lesson,
              "orderIndex",
              "ASC",
            ],
          ],
        });

      // ===============================
      // FORMAT RESPONSE
      // ===============================

      const formatted =
        modules.map((module) => {
          let isDripLocked = false;

          // drip logic
          if (enrollment) {
            const unlockDate =
              new Date(
                enrollment.createdAt
              );

            unlockDate.setDate(
              unlockDate.getDate() +
                module.unlockDays
            );

            isDripLocked =
              new Date() < unlockDate;
          }

          const lessons =
            module.Lessons.map(
              (lesson) => {
                // 🔥 preview lessons bypass locks
                const isLocked =
                  !lesson.isPreview &&
                  (!hasActiveSubscription ||
                    isDripLocked);

                return {
                  id: lesson.id,
                  title: lesson.title,
                  type: lesson.type,
                  durationSeconds:
                    lesson.durationSeconds,
                  isPreview:
                    lesson.isPreview,

                  isLocked,

                  accessType:
                    lesson.isPreview
                      ? "preview"
                      : isLocked
                      ? "locked"
                      : "full",
                };
              }
            );

          return {
            id: module.id,
            title: module.title,
            description:
              module.description,

            unlockDays:
              module.unlockDays,

            isDripLocked,

            lessons,

            totalLessons:
              lessons.length,
          };
        });

      res.json({
        success: true,

        enrolled: !!enrollment,

        hasActiveSubscription,

        modules: formatted,
      });

    } catch (err) {
      console.error(err);

      res.status(500).json({
        success: false,
        message:
          "Failed to fetch modules",
      });
    }
  };

export const getLessonMeta = async (req, res) => {
  try {
    const lesson = await models.Lesson.findByPk(req.params.lessonId, {
      attributes: ["id", "title", "type", "durationSeconds"],
    });

    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found" });
    }

    res.json(lesson);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch lesson" });
  }
};


//
// MARK LESSON COMPLETE
//
export const completeLesson = async (req, res) => {
  try {
    const userId = req.user.id;
    const { lessonId, watchTime = 0 } = req.body;

    if (!lessonId) {
      return res.status(400).json({ message: "Lesson ID required" });
    }

    const lesson = await Lesson.findByPk(lessonId, {
      include: [
        {
          model: models.CourseModule,
          include: [{ model: models.Course }],
        },
      ],
    });

    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found" });
    }

    const courseId = lesson.CourseModule.courseId;

    // 🔐 PAYMENT CHECK
    const payment = await models.Payment.findOne({
      where: {
        userId,
        courseId,
        status: "success",
      },
    });

    if (!payment && !lesson.isPreview) {
      return res.status(403).json({
        message: "You must purchase this course first",
      });
    }

    let progress = await LessonProgress.findOne({
      where: { userId, lessonId },
    });

    if (!progress) {
      progress = await LessonProgress.create({
        userId,
        lessonId,
        completed: true,
        watchTime,
        progressPercent: 100,
        lastAccessedAt: new Date(),
      });
    } else {
      progress.completed = true;
      progress.watchTime += watchTime;
      progress.progressPercent = 100;
      progress.lastAccessedAt = new Date();
      await progress.save();
    }

    await models.ActivityLog.create({
      userId,
      action: "LESSON_COMPLETED",
      meta: { lessonId },
    });

    res.json({ message: "Lesson completed" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to complete lesson" });
  }
};


export const getSecureLesson = async (req, res) => {
  try {
    const userId = req.user.id;
    const lesson = req.lesson; // from middleware

    const module = await models.CourseModule.findByPk(lesson.moduleId);

    // 🔐 PAYMENT CHECK
    const payment = await models.Payment.findOne({
      where: {
        userId,
        courseId: module.courseId,
        status: "success",
      },
    });

    // 🔐 DRIP CHECK
    const enrollment = await models.Enrollment.findOne({
      where: {
        studentId: userId,
        courseId: module.courseId,
      },
    });

    let isDripLocked = false;

    if (enrollment) {
      const unlockDate = new Date(enrollment.createdAt);
      unlockDate.setDate(
        unlockDate.getDate() + module.unlockDays
      );

      isDripLocked = new Date() < unlockDate;
    }

    if ((!payment || isDripLocked) && !lesson.isPreview) {
      return res.status(403).json({
        message: "Lesson locked",
      });
    }

    let secureContentUrl = lesson.contentUrl;

    if (lesson.cloudinaryPublicId) {
      secureContentUrl = generateSecureUrl(lesson);
    }

    const embedUrl = lesson.youtubeVideoId
      ? `https://www.youtube.com/embed/${lesson.youtubeVideoId}`
      : null;

    res.json({
      id: lesson.id,
      title: lesson.title,
      type: lesson.type,
      contentUrl: secureContentUrl,
      embedUrl,
      contentText: lesson.contentText,
      quizId: lesson.quizId,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lesson delivery failed" });
  }
};

export const getCourseProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { courseId } = req.params;

    const modules = await models.CourseModule.findAll({
      where: { courseId },
      include: [
        {
          model: Lesson,
          attributes: ["id"],
        },
      ],
    });

    const lessonIds = modules.flatMap((m) =>
      m.Lessons.map((l) => l.id)
    );

    const completedCount = await LessonProgress.count({
      where: {
        userId,
        lessonId: lessonIds,
        completed: true,
      },
    });

    const total = lessonIds.length;

    res.json({
      progress: total
        ? Number(((completedCount / total) * 100).toFixed(2))
        : 0,
      completed: completedCount,
      total,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Progress fetch failed" });
  }
};

export const getEnrollmentStatus =
async (req, res) => {
  try {
    const enrollment =
      await Enrollment.findOne({
        where: {
          studentId: req.user.id,
          courseId: req.params.courseId,
        },
      });

    res.json({
      enrolled: !!enrollment,
      status:
        enrollment?.status || null,
      expiresAt:
        enrollment?.expiresAt || null,
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      message:
        "Failed to fetch enrollment",
    });
  }
};

export const getLessonProgress =
async (req, res) => {
  try {
    const progress =
      await LessonProgress.findOne({
        where: {
          userId: req.user.id,
          lessonId: req.params.lessonId,
        },
      });

    res.json(progress || {});

  } catch (err) {
    console.error(err);

    res.status(500).json({
      message:
        "Failed to fetch progress",
    });
  }
};

export const getContinueLearningLesson =
async (req, res) => {
  try {
    const progress =
      await LessonProgress.findOne({
        where: {
          userId: req.user.id,
          completed: false,
        },

        include: [
          {
            model: Lesson,
            include: [
              {
                model: CourseModule,
                where: {
                  courseId:
                    req.params.courseId,
                },
              },
            ],
          },
        ],

        order: [["updatedAt", "DESC"]],
      });

    res.json(progress);

  } catch (err) {
    console.error(err);

    res.status(500).json({
      message:
        "Failed to fetch continue learning",
    });
  }
};

export const getCourseCompletionStatus =
async (req, res) => {
  try {
    const modules =
      await CourseModule.findAll({
        where: {
          courseId:
            req.params.courseId,
        },

        include: [
          {
            model: Lesson,
          },
        ],
      });

    const lessonIds =
      modules.flatMap((m) =>
        m.Lessons.map((l) => l.id)
      );

    const completed =
      await LessonProgress.count({
        where: {
          userId: req.user.id,
          lessonId: lessonIds,
          completed: true,
        },
      });

    const total =
      lessonIds.length;

    const percentage =
      total === 0
        ? 0
        : Math.round(
            (completed / total) * 100
          );

    res.json({
      completed,
      total,
      percentage,
      isCompleted:
        percentage === 100,
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      message:
        "Failed to fetch completion status",
    });
  }
};


//
// TOGGLE LESSON PUBLISH STATUS
//
export const toggleLessonPublishStatus =
  async (req, res) => {
    try {

      const lesson =
        await Lesson.findByPk(
          req.params.id
        );

      if (!lesson) {
        return res.status(404).json({
          message:
            "Lesson not found",
        });
      }

      // toggle
      lesson.isPublished =
        !lesson.isPublished;

      await lesson.save();

      // activity log
      await models.ActivityLog.create({
        userId: req.user.id,

        action:
          lesson.isPublished
            ? "LESSON_PUBLISHED"
            : "LESSON_UNPUBLISHED",

        meta: {
          lessonId: lesson.id,
          moduleId: lesson.moduleId,
        },
      });

      res.json({
        message:
          lesson.isPublished
            ? "Lesson published successfully"
            : "Lesson unpublished successfully",

        lesson,
      });

    } catch (err) {
      console.error(err);

      res.status(500).json({
        message:
          "Failed to update lesson publish status",
      });
    }
  };

  export const updateLessonAccess =
  async (req, res) => {

    try {

      const userId =
        req.user.id;

      const { lessonId } =
        req.body;

      let progress =
        await models.LessonProgress.findOne({
          where: {
            userId,
            lessonId,
          },
        });

      if (!progress) {

        progress =
          await models.LessonProgress.create({
            userId,
            lessonId,

            lastAccessedAt:
              new Date(),
          });

      } else {

        progress.lastAccessedAt =
          new Date();

        await progress.save();
      }

      res.json({
        success: true,
      });

    } catch (err) {

      console.error(err);

      res.status(500).json({
        message:
          "Failed to update lesson access",
      });
    }
  };