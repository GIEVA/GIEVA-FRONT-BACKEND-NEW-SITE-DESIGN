import models from "../models/index.js";
import sendEmail from "../utils/sendMail.js";
import { failedExamPaymentTemplate } from "../utils/emailTemplates.js";
import { examReceiptTemplate } from "../utils/emailTemplates.js";
import { internalExamRegistrationTemplate } from "../utils/emailTemplates.js";
import dotenv from "dotenv";
dotenv.config();

import axios from "axios";
import crypto from "crypto";
import sequelize from "../config/db.js";
import { generateReceiptPDF } from "../utils/generateReceipt.js";
import { convertUsdToNgn } from "../utils/exchangeRate.js";

const {
  ExamPayment,
  ExamRegistration,
  ActivityLog,
  User,
  Notification,
} = models;


const PAYSTACK_SECRET =
  process.env.PAYSTACK_SECRET_KEY;

const PAYSTACK_BASE =
  process.env.PAYSTACK_BASE ||
  "https://api.paystack.co";




export const initializeExamPayment = async (req, res) => {
  try {
    const { registrationId } = req.body;
    const userId = req.user.id;

    const registration = await ExamRegistration.findByPk(registrationId);

    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    if (registration.userId !== userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (registration.paymentStatus === "success") {
      return res.status(400).json({ message: "Registration already paid" });
    }

    const user = await User.findByPk(userId);

    // ---------------- CONVERT USD → NGN AT THE CURRENT LIVE RATE ----------------
    let ngnAmount, rate;
    try {
      ({ ngnAmount, rate } = await convertUsdToNgn(registration.amount));
    } catch (rateErr) {
      console.error("Rate conversion failed:", rateErr.message);
      return res.status(503).json({
        message: "Unable to fetch current exchange rate. Please try again shortly.",
      });
    }

    // Paystack expects kobo (smallest NGN unit). Round FIRST, then store
    // that exact rounded value as the charged amount — this keeps
    // verifyExamPayment's amount-match check exact later, since Paystack
    // will echo back precisely what we send here.
    const amountInKobo = Math.round(ngnAmount * 100);
    const chargedNgnAmount = amountInKobo / 100;

    const transactionRef =
      "EXAM-" + crypto.randomBytes(8).toString("hex");

    const payment = await ExamPayment.create({
      registrationId,
      userId,
      amount: chargedNgnAmount,   // what's actually charged, in NGN
      currency: "NGN",
      paymentMethod: "paystack",
      transactionRef,
      status: "pending",
    });

    const payload = {
      email: user.email,
      amount: amountInKobo,
      currency: "NGN",

      callback_url:
        `${process.env.FRONTEND_URL}/exam-payment/callback`,

      metadata: {
        paymentId: payment.id,
        registrationId: registration.id,
        examType: registration.examType,
        userId,
        amountUSD: registration.amount,
        exchangeRate: rate,
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

    payment.transactionRef = paystackData.reference;
    await payment.save();

    await ActivityLog.create({
      userId,
      action: "EXAM_PAYMENT_INITIALIZED",
      meta: {
        paymentId: payment.id,
        registrationId,
        examType: registration.examType,
        amountUSD: registration.amount,
        amountNGN: chargedNgnAmount,
        exchangeRate: rate,
      },
    });

    return res.json({
      message: "Payment initialized",
      paymentId: payment.id,
      authorization_url: paystackData.authorization_url,
      reference: paystackData.reference,
      amountUSD: registration.amount,
      amountNGN: chargedNgnAmount,
      exchangeRate: rate,
    });
  } catch (err) {
    console.error(err.response?.data || err.message);
    return res.status(500).json({ message: "Payment initialization failed" });
  }
};

export const verifyExamPayment = async (req, res) => {
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

// ================= PAYMENT FAILED =================
if (!paymentData || paymentData.status !== "success") {
  const payment = await ExamPayment.findOne({
    where: {
      transactionRef: reference,
    },
  });

  if (payment) {
    payment.status = "failed";
    await payment.save();

    const registration =
      await ExamRegistration.findByPk(
        payment.registrationId
      );

    if (registration) {
      registration.paymentStatus = "failed";
      await registration.save();
    }

    const user = await User.findByPk(
      payment.userId
    );

    if (user && registration) {
      await sendEmail(
        user.email,
        "❌ Exam Payment Failed",
        failedExamPaymentTemplate(
          user.fullName,
          registration.examType
        )
      );
    }
  }

  return res.status(400).json({
    message: "Payment failed",
  });
}

const amountPaid =
  paymentData.amount / 100;

// ================= LOCK PAYMENT =================
const payment =
  await ExamPayment.findOne({
    where: {
      transactionRef: reference,
    },
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

// ================= SECURITY CHECK =================
if (
  Number(amountPaid) !==
  Number(payment.amount)
) {
  await t.rollback();

  return res.status(400).json({
    message:
      "Amount mismatch detected",
  });
}

// ================= FETCH RELATED DATA =================
const registration =
  await ExamRegistration.findByPk(
    payment.registrationId,
    {
      transaction: t,
    }
  );

const user =
  await User.findByPk(
    payment.userId,
    {
      transaction: t,
    }
  );

if (!registration || !user) {
  await t.rollback();

  return res.status(404).json({
    message:
      "Registration or user not found",
  });
}

// ================= UPDATE PAYMENT =================
payment.status = "success";
payment.paidAt = new Date();
payment.gatewayResponse =
  paymentData;

await payment.save({
  transaction: t,
});

// ================= UPDATE REGISTRATION =================
registration.paymentStatus =
  "success";

registration.status =
  "submitted";

registration.submittedAt =
  new Date();

await registration.save({
  transaction: t,
});

// ================= ACTIVITY LOG =================
await ActivityLog.create(
  {
    userId: payment.userId,

    action:
      "EXAM_PAYMENT_SUCCESS",

    meta: {
      paymentId: payment.id,
      registrationId:
        registration.id,
      examType:
        registration.examType,
    },
  },
  {
    transaction: t,
  }
);

// ================= NOTIFICATION =================
await Notification.create(
  {
    userId:
      payment.userId,

    title:
      "Exam Registration Submitted",

    message:
      `${registration.examType} registration payment successful.`,

    type:
      "exam_registration",

    entityId:
      registration.id,
  },
  {
    transaction: t,
  }
);

// ================= COMMIT FIRST =================
await t.commit();

// ===================================================
// SIDE EFFECTS (EMAILS, PDFS, EXTERNAL ACTIONS)
// ===================================================

try {
  // Generate Receipt PDF
  const pdfBuffer =
    await generateReceiptPDF({
      fullName:
        user.fullName,

      email:
        user.email,

      examType:
        registration.examType,

      amount:
        amountPaid,

      currency:
        payment.currency,

      reference:
        payment.transactionRef,

      paymentMethod:
        payment.paymentMethod,

      date:
        new Date().toLocaleString(),
    });

  // Applicant Receipt Email
  await sendEmail(
    user.email,
    `🧾 ${registration.examType} Registration Receipt`,
    examReceiptTemplate(
      user.fullName,
      registration.examType,
      amountPaid,
      registration.registrationCode
    ),
    [
      {
        filename:
          "exam-receipt.pdf",
        content:
          pdfBuffer,
      },
    ]
  );

  // Internal GIEVA Email
  if (
    process.env
      .EXAM_REGISTRATION_EMAIL
  ) {
    await sendEmail(
      process.env
        .EXAM_REGISTRATION_EMAIL,

      `📥 New ${registration.examType} Registration`,

      internalExamRegistrationTemplate(
        registration,
        user
      )
    );
  }
} catch (emailError) {
  console.error(
    "Email/Receipt Error:",
    emailError.message
  );
}

return res.json({
  message:
    "Payment verified successfully",

  registrationSubmitted:
    true,

  amountPaid,

  paymentId:
    payment.id,

  registration: {
    id:
      registration.id,

    registrationCode:
      registration.registrationCode,

    examType:
      registration.examType,

    status:
      registration.status,
  },
});


} catch (err) {
console.error(
err.response?.data ||
err.message
);


try {
  await t.rollback();
} catch (rollbackErr) {
  console.error(
    "Rollback failed:",
    rollbackErr.message
  );
}

return res.status(500).json({
  message:
    "Payment verification failed",
});


}
};


  export const downloadReceipt =
  async (req, res) => {

    try {
      const { id } =
        req.params;

      const payment =
        await ExamPayment.findByPk(
          id,
          {
            include: [
              User,
              ExamRegistration,
            ],
          }
        );

      if (!payment) {
        return res.status(404).json({
          message:
            "Payment not found",
        });
      }

      if (
        payment.userId !==
          req.user.id &&
        req.user.role !==
          "superadmin"
      ) {
        return res.status(403).json({
          message:
            "Unauthorized",
        });
      }

      const pdfBuffer =
        await generateReceiptPDF({
          fullName:
            payment.User
              .fullName,

          email:
            payment.User
              .email,

          examType:
            payment
              .ExamRegistration
              ?.examType,

          amount:
            payment.amount,

          currency:
            payment.currency,

          reference:
            payment.transactionRef,

          paymentMethod:
            payment.paymentMethod,

          date:
            payment.createdAt.toLocaleString(),
        });

      res.setHeader(
        "Content-Type",
        "application/pdf"
      );

      res.setHeader(
        "Content-Disposition",
        `attachment; filename=exam-receipt-${payment.id}.pdf`
      );

      res.send(pdfBuffer);

    } catch (error) {
      console.error(error);

      res.status(500).json({
        message:
          "Failed to generate receipt",
      });
    }
  };