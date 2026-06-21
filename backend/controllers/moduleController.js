import models from "../models/index.js";
import sequelize from "../config/db.js";

const {
  CourseModule,
  Course,
  Lesson,
  ActivityLog,
} = models;


//
// CREATE MODULE
//
export const createModule = async (
  req,
  res
) => {
  const transaction =
  await sequelize.transaction();

  try {
    const userId = req.user.id;

    const {
      courseId,
      title,
      description,
      orderIndex,
      unlockDays,
      isPublished,
    } = req.body;

    if (!courseId || !title) {
      return res.status(400).json({
        message:
          "Course ID and title are required",
      });
    }

    if (
      unlockDays &&
      Number(unlockDays) < 0
    ) {
      return res.status(400).json({
        message:
          "Unlock days cannot be negative",
      });
    }

    const course = await Course.findByPk(
      courseId,
      { transaction }
    );

    if (!course) {
      return res.status(404).json({
        message: "Course not found",
      });
    }

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
      const lastModule =
        await CourseModule.findOne({
          where: { courseId },
          order: [["orderIndex", "DESC"]],
          transaction,
        });

      finalOrderIndex = lastModule
        ? lastModule.orderIndex + 1
        : 1;
    }

    // 🔥 DUPLICATE ORDER CHECK
    const existing =
      await CourseModule.findOne({
        where: {
          courseId,
          orderIndex: finalOrderIndex,
        },
        transaction,
      });

    if (existing) {
      return res.status(400).json({
        message:
          "Module order already exists",
      });
    }

    const module =
      await CourseModule.create(
        {
          courseId,
          title,
          description,
          orderIndex: finalOrderIndex,
          unlockDays:
            Number(unlockDays) || 0,
          isPublished:
            isPublished || false,
        },
        { transaction }
      );

    await ActivityLog.create(
      {
        userId,
        action: "CREATE_MODULE",
        meta: {
          moduleId: module.id,
          courseId,
        },
      },
      { transaction }
    );

    await transaction.commit();

    res.status(201).json(module);

  } catch (err) {
    await transaction.rollback();

    console.error(err);

    res.status(500).json({
      message:
        "Module creation failed",
    });
  }
};


//
// GET MODULES BY COURSE
//
export const getCourseModules =
  async (req, res) => {
    try {
      const modules =
        await CourseModule.findAll({
          where: {
            courseId: req.params.courseId,
          },

          order: [
            ["orderIndex", "ASC"],
          ],

          include: [
            {
              model: Lesson,
              attributes: [
                "id",
                "title",
                "type",
                "orderIndex",
                "isPublished",
              ],
            },
          ],
        });

      const formatted = modules.map(
        (module) => ({
          id: module.id,
          title: module.title,
          description:
            module.description,

          orderIndex:
            module.orderIndex,

          unlockDays:
            module.unlockDays,

          isPublished:
            module.isPublished,

          lessonsCount:
            module.Lessons?.length || 0,

          lessons: module.Lessons,
        })
      );

      res.json(formatted);

    } catch (err) {
      console.error(err);

      res.status(500).json({
        message:
          "Failed to fetch modules",
      });
    }
  };


//
// UPDATE MODULE
//
export const updateModule =
  async (req, res) => {
    try {
      const userId = req.user.id;

      const module =
        await CourseModule.findByPk(
          req.params.id,
          {
            include: [
              {
                model: Course,
              },
            ],
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
        req.user.role !==
          "superadmin" &&
        course.userId !== userId
      ) {
        return res.status(403).json({
          message: "Unauthorized",
        });
      }

      const oldData =
        module.toJSON();

      // 🔥 DUPLICATE ORDER CHECK
      if (req.body.orderIndex) {
        const exists =
          await CourseModule.findOne({
            where: {
              courseId:
                module.courseId,
              orderIndex:
                req.body.orderIndex,
            },
          });

        if (
          exists &&
          exists.id !== module.id
        ) {
          return res.status(400).json({
            message:
              "Order index already used",
          });
        }
      }

      // 🔥 SAFE FIELD UPDATE
      const allowedFields = [
        "title",
        "description",
        "orderIndex",
        "unlockDays",
        "isPublished",
      ];

      allowedFields.forEach((field) => {
        if (
          req.body[field] !== undefined
        ) {
          module[field] =
            req.body[field];
        }
      });

      await module.save();

      await ActivityLog.create({
        userId,
        action: "UPDATE_MODULE",
        meta: {
          moduleId: module.id,
          before: oldData,
          after: module.toJSON(),
        },
      });

      res.json(module);

    } catch (err) {
      console.error(err);

      res.status(500).json({
        message: "Update failed",
      });
    }
  };


//
// DELETE MODULE
//
export const deleteModule =
  async (req, res) => {
    try {
      const userId = req.user.id;

      const module =
        await CourseModule.findByPk(
          req.params.id,
          {
            include: [
              {
                model: Course,
              },
              {
                model: Lesson,
              },
            ],
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
        req.user.role !==
          "superadmin" &&
        course.userId !== userId
      ) {
        return res.status(403).json({
          message: "Unauthorized",
        });
      }

      const lessonCount =
        module.Lessons?.length || 0;

      await module.destroy();

      await ActivityLog.create({
        userId,
        action: "DELETE_MODULE",
        meta: {
          moduleId: module.id,
          courseId:
            module.courseId,
          deletedLessons:
            lessonCount,
        },
      });

      res.json({
        message:
          "Module deleted successfully",
      });

    } catch (err) {
      console.error(err);

      res.status(500).json({
        message: "Delete failed",
      });
    }
  };


//
// TOGGLE MODULE PUBLISH STATUS
//
export const toggleModulePublishStatus =
  async (req, res) => {
    try {
      const userId = req.user.id;

      const module =
        await CourseModule.findByPk(
          req.params.id,
          {
            include: [
              {
                model: Course,
              },
            ],
          }
        );

      if (!module) {
        return res.status(404).json({
          message: "Module not found",
        });
      }

      const course = module.Course;

      if (
        req.user.role !==
          "superadmin" &&
        course.userId !== userId
      ) {
        return res.status(403).json({
          message: "Unauthorized",
        });
      }

      module.isPublished =
        !module.isPublished;

      await module.save();

      await ActivityLog.create({
        userId,
        action:
          module.isPublished
            ? "MODULE_PUBLISHED"
            : "MODULE_UNPUBLISHED",

        meta: {
          moduleId: module.id,
        },
      });

      res.json({
        message:
          module.isPublished
            ? "Module published"
            : "Module unpublished",

        isPublished:
          module.isPublished,
      });

    } catch (err) {
      console.error(err);

      res.status(500).json({
        message:
          "Failed to update module status",
      });
    }
  };