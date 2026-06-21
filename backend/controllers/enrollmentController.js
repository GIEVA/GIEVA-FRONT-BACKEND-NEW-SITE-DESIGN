import models from "../models/index.js";
import sendEmail from "../utils/sendMail.js";


const { Enrollment, Course, Payment, User } = models;
/**
 * Enroll student into a course (after payment success)
 * Body: { courseId, paymentId }
 */
export const enrollStudent = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { courseId, paymentId } = req.body;

    if (!courseId)
      return res.status(400).json({ message: "courseId is required" });

    // 1️⃣ Check course exists
    const course = await Course.findByPk(courseId);
    if (!course)
      return res.status(404).json({ message: "Course not found" });

    // 2️⃣ Prevent duplicate enrollment
    const existing = await Enrollment.findOne({
      where: { studentId, courseId },
    });

    if (existing) {
      return res.status(400).json({
        message: "You are already enrolled in this course",
      });
    }

    // 3️⃣ If payment provided → verify success
    if (paymentId) {
      const payment = await Payment.findOne({
        where: { id: paymentId, userId: studentId },
      });

      // Auto-enroll student after successful payment
      const [enrollment, created] = await Enrollment.findOrCreate({
        where: {
          studentId: payment.userId,
          courseId: payment.courseId,
        },
        defaults: {
          status: "active",
          paymentId: payment.id,
        },
      });

      // Fetch user + course info for email
      const user = await User.findByPk(payment.userId);
      const course = await Course.findByPk(payment.courseId);

      // Send Enrollment Email
      await sendEmail(
        user.email,
        "🎓 Course Enrollment Confirmation",
        `
          <h2>Hello ${user.fullName},</h2>

          <p>✅ Your payment was successful and you are now officially enrolled.</p>

          <h3>Course Details:</h3>
          <ul>
            <li><b>Course:</b> ${course.title}</li>
            <li><b>Amount Paid:</b> ₦${payment.amount}</li>
            <li><b>Status:</b> Active</li>
          </ul>

          <p>You now have full access to:</p>
          <ul>
            <li>📚 Course materials</li>
            <li>🧠 Quizzes & CBT exams</li>
            <li>📅 Class session schedules</li>
          </ul>

          <p>Login to your dashboard to start learning immediately.</p>

          <br/>
          <p>Best regards,<br/>Your Learning Platform</p>
        `
      );


      if (!payment || payment.status !== "success") {
        return res.status(400).json({
          message: "Payment not successful or invalid",
        });
      }
    }

    // 4️⃣ Create enrollment
    const enrollment = await Enrollment.create({
      studentId,
      courseId,
      paymentId: paymentId || null,
      status: paymentId ? "active" : "pending",
    });

    res.json({
      message: "Enrollment successful",
      enrollment,
    });
  } catch (err) {
    console.error("Enroll Student Error:", err);
    res.status(500).json({ message: "Could not enroll student" });
  }
};

/**
 * Get logged-in student's enrollments
 */
export const getMyEnrollments = async (req, res) => {
  try {
    const studentId = req.user.id;

    const enrollments = await Enrollment.findAll({
      where: { studentId },
      include: [
        {
          model: Course,
          attributes: ["id", "title", "category", "price"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json(enrollments);
  } catch (err) {
    console.error("Get Enrollments Error:", err);
    res.status(500).json({ message: "Could not fetch enrollments" });
  }
};

/**
 * Admin / Tutor → Get all enrollments
 */
export const getAllEnrollments = async (req, res) => {
  try {
    const enrollments = await Enrollment.findAll({
      include: [
        {
          model: User,
          attributes: ["id", "fullName", "email"],
        },
        {
          model: Course,
          attributes: ["id", "title", "category", "price"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json(enrollments);
  } catch (err) {
    console.error("Get All Enrollments Error:", err);
    res.status(500).json({ message: "Could not fetch enrollments" });
  }
};

/**
 * Cancel enrollment
 */
export const cancelEnrollment = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { id } = req.params;

    const enrollment = await Enrollment.findOne({
      where: { id, studentId },
    });

    if (!enrollment)
      return res.status(404).json({ message: "Enrollment not found" });

    enrollment.status = "cancelled";
    await enrollment.save();

    res.json({ message: "Enrollment cancelled" });
  } catch (err) {
    console.error("Cancel Enrollment Error:", err);
    res.status(500).json({ message: "Could not cancel enrollment" });
  }
};

/**
 * Activate enrollment (Admin only)
 */
export const activateEnrollment = async (req, res) => {
  try {
    const { id } = req.params;

    const enrollment = await Enrollment.findByPk(id);
    if (!enrollment)
      return res.status(404).json({ message: "Enrollment not found" });

    enrollment.status = "active";
    await enrollment.save();

    res.json({ message: "Enrollment activated" });
  } catch (err) {
    console.error("Activate Enrollment Error:", err);
    res.status(500).json({ message: "Could not activate enrollment" });
  }
};
