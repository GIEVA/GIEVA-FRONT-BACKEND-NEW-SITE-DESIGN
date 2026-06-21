import models from "../models/index.js";

const {
  Lesson,
  CourseModule,
  Course,
} = models;

export const loadLesson =
  async (req, res, next) => {
    try {

      const lesson =
        await Lesson.findByPk(
          req.params.lessonId,
          {
            include: [
              {
                model:
                  CourseModule,

                include: [
                  Course,
                ],
              },
            ],
          }
        );

      if (!lesson) {
        return res.status(404).json({
          message:
            "Lesson not found",
        });
      }

      req.lesson = lesson;

      next();

    } catch (err) {

      console.error(err);

      res.status(500).json({
        message:
          "Failed to load lesson",
      });
    }
  };