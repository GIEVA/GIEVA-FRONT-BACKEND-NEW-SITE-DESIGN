// controllers/tutorAssignment.controller.js

import models from "../models/index.js";

const {
  TutorStudent,
  TutorProfile,
  User,
  Course,
  Enrollment,
  Notification,
  ActivityLog,
} = models;



// ======================================================
// ASSIGN STUDENT TO TUTOR
// ======================================================

export const assignStudentToTutor =
  async (req, res) => {

    try {

      const adminId =
        req.user.id;

      const {
        studentId,
        tutorProfileId,
        courseId,
      } = req.body;



      // ============================================
      // VALIDATION
      // ============================================

      if (
        !studentId ||
        !tutorProfileId ||
        !courseId
      ) {

        return res.status(400).json({
          message:
            "studentId, tutorProfileId and courseId are required",
        });
      }



      // ============================================
      // CHECK STUDENT
      // ============================================

      const student =
        await User.findByPk(
          studentId
        );

      if (!student) {

        return res.status(404).json({
          message:
            "Student not found",
        });
      }



      // ============================================
      // CHECK COURSE
      // ============================================

      const course =
        await Course.findByPk(
          courseId
        );

      if (!course) {

        return res.status(404).json({
          message:
            "Course not found",
        });
      }



      // ============================================
      // CHECK TUTOR
      // ============================================

      const tutor =
        await TutorProfile.findByPk(
          tutorProfileId
        );

      if (!tutor) {

        return res.status(404).json({
          message:
            "Tutor not found",
        });
      }



      // ============================================
      // MUST BE APPROVED
      // ============================================

      if (!tutor.approved) {

        return res.status(400).json({
          message:
            "Tutor is not approved",
        });
      }



      // ============================================
      // CHECK ENROLLMENT
      // ============================================

      const enrollment =
        await Enrollment.findOne({
          where: {
            studentId,
            courseId,
            status: "active",
          },
        });

      if (!enrollment) {

        return res.status(400).json({
          message:
            "Student is not actively enrolled in this course",
        });
      }



      // ============================================
      // CHECK EXISTING ASSIGNMENT
      // ============================================

      const existing =
        await TutorStudent.findOne({
          where: {
            studentId,
            tutorProfileId,
            courseId,
            status: "active",
          },
        });

      if (existing) {

        return res.status(400).json({
          message:
            "Student already assigned to this tutor for this course",
        });
      }



      // ============================================
      // CREATE ASSIGNMENT
      // ============================================

      const assignment =
        await TutorStudent.create({
          tutorProfileId,
          studentId,
          courseId,

          assignedBy:
            adminId,

          status:
            "active",
        });



      // ============================================
      // UPDATE TUTOR STATS
      // ============================================

      tutor.totalStudents += 1;

      await tutor.save();



      // ============================================
      // NOTIFICATION
      // ============================================

      await Notification.create({
        userId: studentId,

        title:
          "Tutor Assigned",

        message:
          `${tutor.fullName} has been assigned as your tutor for ${course.title}`,

        type:
          "tutor_assignment",
      });



      // ============================================
      // ACTIVITY LOG
      // ============================================

      await ActivityLog.create({
        userId:
          adminId,

        action:
          "ASSIGN_STUDENT_TO_TUTOR",

        meta: {
          studentId,
          tutorProfileId,
          courseId,
        },
      });



      // ============================================
      // RESPONSE
      // ============================================

      res.status(201).json({
        message:
          "Student assigned successfully",

        assignment,
      });

    } catch (err) {

      console.error(err);

      res.status(500).json({
        message:
          "Failed to assign student",
      });
    }
  };



// ======================================================
// GET TUTOR STUDENTS
// ======================================================

export const getTutorStudents =
  async (req, res) => {

    try {

      const { tutorProfileId } =
        req.params;



      const assignments =
        await TutorStudent.findAll({
          where: {
            tutorProfileId,
            status: "active",
          },

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
                "thumbnail",
              ],
            },
          ],

          order: [
            ["createdAt", "DESC"],
          ],
        });



      res.json({
        students:
          assignments,
      });

    } catch (err) {

      console.error(err);

      res.status(500).json({
        message:
          "Failed to fetch tutor students",
      });
    }
  };



// ======================================================
// GET AVAILABLE TUTORS
// ======================================================

export const getAvailableTutors =
  async (req, res) => {

    try {

      const tutors =
        await TutorProfile.findAll({
          where: {
            approved: true,
          },

          attributes: [
            "id",
            "fullName",
            "email",
            "profilePicUrl",
            "bio",
            "expertise",
            "yearsOfExperience",
            "totalStudents",
            "averageRating",
            "availabilityStatus",
          ],

          order: [
            ["createdAt", "DESC"],
          ],
        });



      res.json({
        tutors,
      });

    } catch (err) {

      console.error(err);

      res.status(500).json({
        message:
          "Failed to fetch tutors",
      });
    }
  };

  // ======================================================
// GET ASSIGNABLE STUDENTS
// ======================================================

export const getAssignableStudents =
  async (req, res) => {

    try {

      const enrollments =
        await Enrollment.findAll({
          where: {
            status: "active",
          },

          include: [
            {
              model: User,

              attributes: [
                "id",
                "fullName",
                "email",
                "role",
              ],

              where: {
                role: "student",
              },
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

      // remove duplicates
      const uniqueStudents =
        [];

      const seen =
        new Set();

      enrollments.forEach(
        (e) => {

          if (
            !seen.has(
              e.User.id
            )
          ) {

            seen.add(
              e.User.id
            );

            uniqueStudents.push({
              id:
                e.User.id,

              fullName:
                e.User.fullName,

              email:
                e.User.email,

              enrolledCourse:
                e.Course?.title,
            });
          }
        }
      );

      res.json({
        students:
          uniqueStudents,
      });

    } catch (err) {

      console.error(err);

      res.status(500).json({
        message:
          "Failed to fetch students",
      });
    }
  };

  // ======================================================
// GET ASSIGNABLE COURSES
// ======================================================

export const getAssignableCourses =
  async (req, res) => {

    try {

      const courses =
        await Course.findAll({
          where: {
            isPublished: true,
          },

          attributes: [
            "id",
            "title",
            "category",
            "monthlyPrice",
            "thumbnail",
          ],

          order: [
            ["createdAt", "DESC"],
          ],
        });

      res.json({
        courses,
      });

    } catch (err) {

      console.error(err);

      res.status(500).json({
        message:
          "Failed to fetch courses",
      });
    }
  };