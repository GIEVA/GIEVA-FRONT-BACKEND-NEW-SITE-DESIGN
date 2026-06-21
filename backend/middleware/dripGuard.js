// middleware/dripGuard.js
import models from "../models/index.js";

const { Enrollment, CourseModule } = models;

export default async function dripGuard(req, res, next) {
  try {
    const userId = req.user.id;
    const lesson = req.lesson;

    const module = await CourseModule.findByPk(lesson.moduleId);

    const enrollment = await Enrollment.findOne({
      where: {
        studentId: userId,
        courseId: module.courseId,
      },
    });

    if (!enrollment) {
      return res.status(403).json({ message: "Not enrolled" });
    }

    const unlockDate = new Date(enrollment.createdAt);
    unlockDate.setDate(unlockDate.getDate() + module.unlockDays);

    if (new Date() < unlockDate && !lesson.isPreview) {
      return res.status(403).json({
        message: "Lesson locked (drip schedule)",
      });
    }

    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Drip check failed" });
  }
}