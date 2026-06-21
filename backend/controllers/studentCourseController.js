import models from "../models/index.js";

const {
  Course,
  TutorProfile,
  Enrollment,
  CourseModule,
} = models;

//
// GET PUBLIC COURSES
//
export const getPublicCourses = async (
  req,
  res
) => {
  try {
    const userId = req.user?.id || null;

    const courses = await Course.findAll({
      where: {
        isPublished: true,
      },

      include: [
        {
          model: TutorProfile,
          attributes: [
            "id",
            "fullName",
            "profilePicUrl",
            "bio",
          ],
        },

        {
          model: CourseModule,
          attributes: ["id"],
        },
      ],

      order: [["createdAt", "DESC"]],
    });

    // 🔥 enhance course data
    const formattedCourses = await Promise.all(
      courses.map(async (course) => {
        let enrolled = false;

        // check enrollment if logged in
        if (userId) {
          const enrollment =
            await Enrollment.findOne({
              where: {
                studentId: userId,
                courseId: course.id,
                status: "active",
              },
            });

          enrolled = !!enrollment;
        }

        return {
          id: course.id,
          title: course.title,
          description: course.description,
          category: course.category,
          monthlyPrice: course.monthlyPrice,
          tutorialMode: course.tutorialMode,
          maxDurationMonths:
            course.maxDurationMonths,
          level: course.level,
          thumbnail: course.thumbnail,
          isPublished: course.isPublished,

          modulesCount:
            course.CourseModules?.length || 0,

          tutor: course.TutorProfile
            ? {
                id: course.TutorProfile.id,
                fullName:
                  course.TutorProfile.fullName,
                profilePicUrl:
                  course.TutorProfile
                    .profilePicUrl,
                bio: course.TutorProfile.bio,
              }
            : null,

          enrolled,
        };
      })
    );

    res.json(formattedCourses);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed to fetch courses",
    });
  }
};


//
// GET SINGLE PUBLIC COURSE
//
export const getPublicCourseById = async (
  req,
  res
) => {
  try {
    const userId = req.user?.id || null;

    const course = await Course.findOne({
      where: {
        id: req.params.id,
        isPublished: true,
      },

      include: [
        {
          model: TutorProfile,
          attributes: [
            "id",
            "fullName",
            "profilePicUrl",
            "bio",
          ],
        },

        {
          model: CourseModule,

          where: {
            isPublished: true,
          },

          required: false,

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
                "durationSeconds",
                "orderIndex",
              ],
            },
          ],
        },
      ],

      order: [
        [CourseModule, "orderIndex", "ASC"],
        [
          CourseModule,
          models.Lesson,
          "orderIndex",
          "ASC",
        ],
      ],
    });

    if (!course) {
      return res.status(404).json({
        message: "Course not found",
      });
    }

    let enrollment = null;

    let hasActiveSubscription = false;

    if (userId) {
      enrollment = await Enrollment.findOne({
        where: {
          studentId: userId,
          courseId: course.id,
          status: "active",
        },
      });

      const payment =
        await models.Payment.findOne({
          where: {
            userId,
            courseId: course.id,
            status: "success",
          },

          order: [["createdAt", "DESC"]],
        });

      if (
        payment?.subscriptionEndDate
      ) {
        hasActiveSubscription =
          new Date(
            payment.subscriptionEndDate
          ) > new Date();
      }
    }

    res.json({
      id: course.id,

      title: course.title,

      description:
        course.description,

      category:
        course.category,

      monthlyPrice:
        course.monthlyPrice,

      tutorialMode:
        course.tutorialMode,

      maxDurationMonths:
        course.maxDurationMonths,

      level: course.level,

      thumbnail:
        course.thumbnail,

      tutor:
        course.TutorProfile,

      modules:
        course.CourseModules,

      enrolled: !!enrollment,

      enrollmentStatus:
        enrollment?.status || null,

      expiresAt:
        enrollment?.expiresAt || null,

      hasActiveSubscription,
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed to fetch course",
    });
  }
};