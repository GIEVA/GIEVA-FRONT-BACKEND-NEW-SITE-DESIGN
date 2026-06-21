import models from "../models/index.js";

const { Course, ActivityLog } = models;

//
// CREATE COURSE (ADMIN / TUTOR)
//
export const createCourse = async (req, res) => {
  try {
    const userId = req.user.id;

    // const tutorProfile = await models.TutorProfile.findOne({
    //   where: { userId },
    // });

    // if (!tutorProfile) {
    //   return res.status(403).json({
    //     message: "Only tutors can create courses",
    //   });
    // }

    const course = await Course.create({
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      monthlyPrice: req.body.monthlyPrice,
      tutorialMode: req.body.tutorialMode,
      maxDurationMonths: req.body.maxDurationMonths,
      level: req.body.level,
      thumbnail: req.body.thumbnail,
      userId,
      tutorProfileId: req.body.tutorProfileId || null,
      isPublished: req.body.isPublished || false,
    });

    await ActivityLog.create({
      userId,
      action: "CREATE_COURSE",
      meta: { courseId: course.id },
    });

    res.status(201).json(course);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not create course" });
  }
};


//
// GET ALL COURSES
//
export const getCourses = async (
  req,
  res
) => {
  try {
    const courses = await Course.findAll({
      order: [["createdAt", "DESC"]],
    });

    res.json(courses);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed to fetch courses",
    });
  }
};


//
// GET COURSE BY ID
//
export const getCourseById = async (req, res) => {
  const course = await Course.findByPk(req.params.id);

  if (!course)
    return res.status(404).json({ message: "Course not found" });

  res.json(course);
};


//
// UPDATE COURSE
//
export const updateCourse = async (req, res) => {
  const course = await Course.findByPk(req.params.id);

  if (!course)
    return res.status(404).json({ message: "Course not found" });

  Object.assign(course, req.body);

  await course.save();

  res.json(course);
};


//
// DELETE COURSE
//
export const deleteCourse = async (req, res) => {
  const course = await Course.findByPk(req.params.id);

  if (!course)
    return res.status(404).json({ message: "Course not found" });

  await course.destroy();

  res.json({ message: "Course deleted" });
};

//
// TOGGLE COURSE PUBLISH STATUS
//
export const toggleCoursePublishStatus =
  async (req, res) => {
    try {
      const course = await Course.findByPk(
        req.params.id
      );

      if (!course) {
        return res.status(404).json({
          message: "Course not found",
        });
      }

      // toggle publish status
      course.isPublished =
        !course.isPublished;

      await course.save();

      await ActivityLog.create({
        userId: req.user.id,
        action: course.isPublished
          ? "COURSE_PUBLISHED"
          : "COURSE_UNPUBLISHED",

        meta: {
          courseId: course.id,
        },
      });

      res.json({
        message: course.isPublished
          ? "Course published successfully"
          : "Course unpublished successfully",

        isPublished:
          course.isPublished,

        course,
      });
    } catch (err) {
      console.error(err);

      res.status(500).json({
        message:
          "Failed to update publish status",
      });
    }
  };