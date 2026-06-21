import dotenv from "dotenv";
dotenv.config();

import axios from "axios";
import crypto from "crypto";
import models from "../models/index.js";
import sendEmail from "../utils/sendMail.js";
import { paymentReceiptTemplate } from "../utils/emailTemplates.js";
import { generateReceiptPDF } from "../utils/generateReceipt.js";
import sequelize from "../config/db.js";

const { Payment, Course, Enrollment, ActivityLog, User,  Notification, TutorProfile } = models;

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE = process.env.PAYSTACK_BASE || "https://api.paystack.co";



/**
 * ================================
 * INITIALIZE COURSE PAYMENT
 * ================================
 * Body: { courseId }
 */
export const initializeCoursePayment = async (req, res) => {
  try {
     const {
        courseId,
        durationMonths = 1,
        tutorialMode,
      } = req.body;

      const userId = req.user.id;

      const course =
        await Course.findByPk(courseId);

      if (!course) {
        return res.status(404).json({
          message: "Course not found",
        });
      }

    const monthlyPrice = Number(course.monthlyPrice);

    let amount = monthlyPrice * durationMonths;

    // 🔥 virtual surcharge
    if (tutorialMode === "virtual") {
      amount += amount * 0.5;
    }
    if (!amount || amount <= 0)
      return res.status(400).json({ message: "Course price not set" });

    // 2️⃣ Get user email
    const user = await User.findByPk(userId);

    const existingPayment = await Payment.findOne({
        where: {
          userId,
          courseId,
          status: "success",
        },
      });

      if (existingPayment) {
        return res.status(400).json({
          message: "You already paid for this course",
        });
      }

    // 3️⃣ Create pending payment in DB
    const transactionRef = "TXN-" + crypto.randomBytes(8).toString("hex");

    const payment = await Payment.create({
      userId,
      courseId,
      amount, // 🔥 AUTO FROM COURSE MODEL
      durationMonths,
      tutorialMode,
      currency: "NGN",
      paymentMethod: "paystack",
      transactionRef,
      status: "pending",
    });

    // 4️⃣ Initialize Paystack
    const payload = {
      email: user.email,
      amount: Math.round(amount * 100), // kobo
      callback_url: `${process.env.FRONTEND_URL}/payment/callback`,
     metadata: {
      paymentId: payment.id,
      userId,
      courseId,
      custom_fields: [
        {
          display_name: "Course",
          variable_name: "course",
          value: course.title,
        },
      ],
    },
    };

    const response = await axios.post(
      `${PAYSTACK_BASE}/transaction/initialize`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          "Content-Type": "application/json",
        },
      }
    );

    const paystackData = response.data.data;

    // 5️⃣ Save paystack reference
    payment.transactionRef = paystackData.reference;
    await payment.save();

    // 6️⃣ Log
    await ActivityLog.create({
      userId,
      action: "PAYMENT_INITIALIZED",
      meta: { paymentId: payment.id, courseId },
    });

    return res.json({
      message: "Payment initialized",
      paymentId: payment.id,
      authorization_url: paystackData.authorization_url,
      reference: paystackData.reference,
      amount,
    });
  } catch (err) {
    console.error(err.response?.data || err.message);
    return res.status(500).json({ message: "Payment initialization failed" });
  }
};



/**
 * ================================
 * VERIFY PAYMENT
 * ================================
 * Body: { reference }
 */
export const verifyPayment = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { reference } = req.body;

    if (!reference) {
      return res.status(400).json({
        message: "Payment reference required",
      });
    }

    // ================= VERIFY WITH PAYSTACK =================
    const response = await axios.get(
      `${PAYSTACK_BASE}/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
        },
      }
    );

    const paymentData = response.data.data;

    if (!paymentData || paymentData.status !== "success") {
      await Payment.update(
        { status: "failed" },
        { where: { transactionRef: reference } }
      );

      return res.status(400).json({
        message: "Payment failed",
      });
    }

    const amountPaid = paymentData.amount / 100;

    // ================= LOCK PAYMENT ROW =================
    const payment = await Payment.findOne({
      where: { transactionRef: reference },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!payment) {
      await t.rollback();
      return res.status(404).json({
        message: "Payment not found",
      });
    }

    // ================= IDEMPOTENCY =================
    if (payment.status === "success") {
      await t.commit();
      return res.json({
        message: "Payment already verified",
        amountPaid,
      });
    }

    const startDate = new Date();

    const endDate = new Date();

    endDate.setMonth(
      endDate.getMonth() + payment.durationMonths
    );

    payment.subscriptionStartDate = startDate;
    payment.subscriptionEndDate = endDate;

    // ================= SECURITY CHECK =================
    if (amountPaid !== Number(payment.amount)) {
      await t.rollback();
      return res.status(400).json({
        message: "Amount mismatch. Possible fraud detected.",
      });
    }

    // ================= FETCH RELATED DATA =================
    const user = await User.findByPk(payment.userId, { transaction: t });
    const course = await Course.findByPk(payment.courseId, { transaction: t });

    if (!user || !course) {
      await t.rollback();
      return res.status(404).json({
        message: "User or Course not found",
      });
    }

    // ================= UPDATE PAYMENT =================
    payment.status = "success";
    payment.paidAt = new Date();
    payment.gatewayResponse = paymentData;

    await payment.save({ transaction: t });

    // ================= ENROLL USER =================
    const existingEnrollment = await Enrollment.findOne({
      where: {
        studentId: payment.userId,
        courseId: payment.courseId,
      },
      transaction: t,
    });

    if (!existingEnrollment) {
      await Enrollment.create(
        {
          studentId: payment.userId,
          courseId: payment.courseId,
          status: "active",
          durationMonths: payment.durationMonths,
          expiresAt: endDate,
        },
        { transaction: t }
      );
    }

    // ================= LOG =================
    await ActivityLog.create(
      {
        userId: payment.userId,
        action: "PAYMENT_SUCCESS",
        meta: {
          paymentId: payment.id,
          courseId: payment.courseId,
        },
      },
      { transaction: t }
    );

    // ================= NOTIFICATION =================
    await Notification.create(
      {
        userId: payment.userId,
        title: "Payment Successful",
        message: `You paid ₦${amountPaid} successfully`,
        type: "payment",
        entityId: payment.id,
      },
      { transaction: t }
    );

    // ✅ COMMIT BEFORE EXTERNAL CALLS
    await t.commit();

    // ================= SIDE EFFECTS (OUTSIDE TX) =================

    // 📄 Generate receipt
    const pdfBuffer = await generateReceiptPDF({
      fullName: user.fullName,
      email: user.email,
      courseTitle: course.title,
      amount: amountPaid,
      currency: payment.currency,
      reference: payment.transactionRef,
      paymentMethod: payment.paymentMethod,
      date: new Date().toLocaleString(),
      duration: payment.durationMonths,
    });

    // 📧 Send receipt email
    await sendEmail(
      user.email,
      "🧾 Payment Receipt",
      paymentReceiptTemplate(user.fullName, course.title, amountPaid),
      [
        {
          filename: "receipt.pdf",
          content: pdfBuffer,
        },
      ]
    );

    // 👨‍🏫 Notify tutor
    if (course.tutorProfileId) {
      const tutor = await TutorProfile.findOne({
        where: { id: course.tutorProfileId },
        include: [{ model: User }],
      });

      if (tutor?.User?.email) {
        await sendEmail(
          tutor.User.email,
          "📢 New Student Enrolled",
          `<p>${user.fullName} just enrolled in <b>${course.title}</b></p>`
        );
      }
    }

    return res.json({
      message: "Payment verified successfully",
      amountPaid,
      courseUnlocked: true,
    });

  } catch (err) {
    console.error(err.response?.data || err.message);

    // 🔥 VERY IMPORTANT
    try {
      await t.rollback();
    } catch (rollbackErr) {
      console.error("Rollback failed:", rollbackErr.message);
    }

    return res.status(500).json({
      message: "Payment verification failed",
    });
  }
};


// controllers/payment.controller.js

export const downloadReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    

    const payment = await Payment.findByPk(id, {
      include: [User, Course],
    });

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // 🔐 Only owner or admin
    if (
      payment.userId !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const pdfBuffer = await generateReceiptPDF({
      fullName: payment.User.fullName,
      email: payment.User.email,
      courseTitle: payment.Course?.title,
      amount: payment.amount,
      currency: payment.currency,
      reference: payment.transactionRef,
      paymentMethod: payment.paymentMethod,
      date: payment.createdAt.toLocaleString(),
      duration: payment.durationMonths,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=receipt-${payment.id}.pdf`
    );

    res.send(pdfBuffer);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to generate receipt" });
  }
};