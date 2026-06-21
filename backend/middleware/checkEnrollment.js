

import models from "../models/index.js";

const { Enrollment } = models;


export default async function checkEnrollment(req, res, next) {
  const studentId = req.user.id;
  const { courseId } = req.params;

  const enrollment = await Enrollment.findOne({
    where: { studentId, courseId, status: "active" },
  });

  if (!enrollment) {
    return res.status(403).json({
      message: "You must purchase this course to access content",
    });
  }

  next();
}



export const requireActiveEnrollment = async (req, res, next) => {
  const studentId = req.user.id;
  const { courseId } = req.params;

  const enrollment = await Enrollment.findOne({
    where: { studentId, courseId, status: "active" },
  });

  if (!enrollment) {
    return res.status(403).json({
      message: "You must purchase this course to access content",
    });
  }

  next();
};