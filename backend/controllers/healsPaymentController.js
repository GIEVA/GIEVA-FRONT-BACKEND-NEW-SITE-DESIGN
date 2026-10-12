// controllers/healsPaymentController.js

import axios from "axios";
import crypto from "crypto";
import models from "../models/index.js";
import sendEmail from "../utils/sendMail.js";
import { healsPaymentReceiptTemplate, submissionTemplate } from "../utils/emailTemplates.js";
import {
  HEALS_REQUIREMENTS, getMissingDocuments, getMissingFields,
} from "../config/healsRequirements.js";

import { getHealsFee } from "../service/healsSettings.js";

const { HealsPayment, HealsApplication, ActivityLog, Notification } = models;

// ======================================================
// START CHECKOUT
// POST { applicationId }
// ======================================================
export const initializeApplicationPayment = async (req, res) => {
  try {
    const { applicationId } = req.body;
    const application = await HealsApplication.findOne({
      where: { id: applicationId, userId: req.user.id },
    });
    if (!application) return res.status(404).json({ message: "Application not found" });
    if (application.applicationFeePaid || application.status !== "draft")
      return res.status(400).json({ message: "This application has already been submitted" });

    // Nothing gets paid for until the form is ready to submit
    const problems = [];
    if (!HEALS_REQUIREMENTS[application.applicantCategory]) problems.push("Select a degree program");
    getMissingFields(application).forEach((f) => problems.push(`Missing: ${f}`));
    getMissingDocuments(application).forEach((d) => problems.push(`Missing document: ${d}`));
    if (!application.termsAcceptedAt) problems.push("Terms and conditions must be accepted");
    if (problems.length)
      return res.status(400).json({ message: "Application is incomplete", errors: problems });

    // The server decides the amount, never the client
    const { amount, currency } = await getHealsFee();
    if (!amount)
      return res.status(500).json({ message: "Application fee is not set. Please contact support." });

    // Paystack rejects reused references, so retire earlier abandoned attempts
    await HealsPayment.update(
      { status: "cancelled" },
      { where: { applicationId: application.id, type: "application_fee", status: "pending" } }
    );

    const transactionRef = `HEALS-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
    const payment = await HealsPayment.create({
      userId: req.user.id,
      applicationId: application.id,
      paymentCode: `GHP-${Date.now()}-${crypto.randomBytes(2).toString("hex")}`,
      type: "application_fee",
      title: "HEALS Application Fee",
      description: "Enrolment fee for the HEALS programme",
      amount,
      currency,
      quantity: 1,
      totalAmount: amount,
      transactionRef,
      status: "pending",
    });

    const response = await axios.post(
      `${process.env.PAYSTACK_BASE}/transaction/initialize`,
      {
        email: application.email,
        amount: Math.round(amount * 100),
        currency,
        reference: transactionRef,
        callback_url: `${process.env.FRONTEND_URL}/heals/payment/callback`,
        metadata: { type: "heals_payment", paymentId: payment.id, applicationId: application.id },
      },
      { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
    );

    res.json({
      message: "Payment initialized",
      authorization_url: response.data.data.authorization_url,
      reference: transactionRef,
    });
  } catch (err) {
    console.error(err.response?.data || err);
    res.status(500).json({ message: "Payment initialization failed" });
  }
};

// ======================================================
// FINALIZE: the only place a draft becomes "submitted".
// Shared by verify + webhook; safe to run twice.
// ======================================================
export const finalizeSuccessfulPayment = async (reference, gatewayData) => {
  const t = await HealsPayment.sequelize.transaction();
  let payment, application;
  try {
    payment = await HealsPayment.findOne({
      where: { transactionRef: reference }, transaction: t, lock: t.LOCK.UPDATE,
    });
    if (!payment) { await t.rollback(); return { error: "Payment not found" }; }
    if (payment.status === "success") { await t.rollback(); return { payment, alreadyDone: true }; }

    if (Math.round(Number(payment.totalAmount) * 100) !== Number(gatewayData.amount)) {
      await t.rollback();
      return { error: "Amount paid does not match the expected amount" };
    }

    payment.status = "success";
    payment.paymentMethod = gatewayData.channel;
    payment.gatewayResponse = gatewayData;
    payment.paidAt = new Date();
    await payment.save({ transaction: t });

    application = await HealsApplication.findByPk(payment.applicationId, { transaction: t });
    if (payment.type === "application_fee" && application) {
      application.applicationFeePaid = true;
      application.applicationFeeAmount = payment.totalAmount;
      if (application.status === "draft") {
        application.status = "submitted";
        application.submittedAt = new Date();
      }
      if (!application.applicationCode) {
        application.applicationCode =
          `HEALS-${new Date().getFullYear()}-${String(application.id).padStart(5, "0")}`;
      }
      await application.save({ transaction: t });

      await Notification.create({
        title: "New Application Submitted",
        message: `${application.fullName} submitted a HEALS application (${application.applicantCategory})`,
        type: "application", entityId: application.id, entityType: "application",
      }, { transaction: t });
    }

    await ActivityLog.create({
      userId: payment.userId, action: "HEALS_PAYMENT_SUCCESS",
      meta: { paymentId: payment.id, applicationId: payment.applicationId, amount: payment.totalAmount },
    }, { transaction: t });

    await t.commit();
  } catch (err) {
    await t.rollback();
    throw err;
  }

  // Emails go out after commit, so a mail failure can't undo a successful payment
  try {
    if (application) {
      await sendEmail(application.email, "HEALS Payment Receipt", healsPaymentReceiptTemplate({
        fullName: application.fullName, amount: payment.totalAmount,
        paymentCode: payment.paymentCode, transactionRef: payment.transactionRef, paidAt: payment.paidAt,
      }));
      await sendEmail(application.email, "HEALS Application Submitted", submissionTemplate(application.fullName));
    }
  } catch (e) { console.error("Post-payment email failed:", e.message); }

  return { payment, application };
};

// ======================================================
// VERIFY (called by the callback page)
// POST { reference }
// ======================================================
export const verifyHealsPayment = async (req, res) => {
  try {
    const { reference } = req.body;
    if (!reference) return res.status(400).json({ message: "Reference is required" });

    const payment = await HealsPayment.findOne({
      where: { transactionRef: reference, userId: req.user.id },
    });
    if (!payment) return res.status(404).json({ message: "Payment not found" });
    if (payment.status === "success")
      return res.json({ message: "Payment already verified", payment });

    const response = await axios.get(
      `${process.env.PAYSTACK_BASE}/transaction/verify/${reference}`,
      { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
    );
    const data = response.data.data;

    if (data.status === "success") {
      const result = await finalizeSuccessfulPayment(reference, data);
      if (result.error) return res.status(400).json({ message: result.error });
      return res.json({
        message: "Payment verified. Your application has been submitted.",
        payment: result.payment,
      });
    }

    if (data.status === "failed") {
      payment.status = "failed";
      payment.gatewayResponse = data;
      await payment.save();
    }
    return res.status(400).json({ message: "Payment was not completed" });
  } catch (err) {
    console.error(err.response?.data || err);
    res.status(500).json({ message: "Payment verification failed" });
  }
};

// ======================================================
// WEBHOOK (catches students who pay and close the tab)
// Needs the RAW body; see index.js
// ======================================================
export const healsPaystackWebhook = async (req, res) => {
  const hash = crypto.createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
    .update(req.body).digest("hex");
  if (hash !== req.headers["x-paystack-signature"]) return res.sendStatus(401);

  try {
    const event = JSON.parse(req.body.toString());
    if (event.event === "charge.success" && event.data?.metadata?.type === "heals_payment") {
      await finalizeSuccessfulPayment(event.data.reference, event.data);
    }
  } catch (e) { console.error("HEALS webhook error:", e); }
  res.sendStatus(200);
};

// ======================================================
// READ
// ======================================================
export const getMyHealsPayments = async (req, res) => {
  try {
    const payments = await HealsPayment.findAll({
      where: { userId: req.user.id },
      include: [{ model: HealsApplication }],
      order: [["createdAt", "DESC"]],
    });
    res.json(payments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch payments" });
  }
};

export const getHealsPaymentById = async (req, res) => {
  try {
    const payment = await HealsPayment.findOne({
      where: { id: req.params.id, userId: req.user.id }, // owners only
      include: [{ model: HealsApplication }],
    });
    if (!payment) return res.status(404).json({ message: "Payment not found" });
    res.json(payment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch payment" });
  }
};

// // controllers/healsPaymentController.js

// import axios from "axios";
// import crypto from "crypto";
// import models from "../models/index.js";
// import { healsPaymentReceiptTemplate } from "../utils/emailTemplates.js";
// import {
//   HEALS_REQUIREMENTS, getMissingDocuments, getMissingFields,
// } from "../config/healsRequirements.js";

// const {
//   HealsPayment,
//   HealsApplication,
//   ActivityLog,
//   Notification,
// } = models;

// // ======================================================
// // INITIALIZE PAYMENT
// // ======================================================

// export const initializeHealsPayment =
//   async (req, res) => {
//     try {

//       const userId = req.user.id;

//       const {
//         applicationId,
//         type,
//         amount,
//         title,
//         description,
//       } = req.body;

//       // VALIDATION
//       if (
//         !applicationId ||
//         !type ||
//         !amount ||
//         !title
//       ) {
//         return res.status(400).json({
//           message:
//             "Missing required fields",
//         });
//       }

//       if (
//         application.status !==
//         "approved_for_payment"
//       ) {
//         return res.status(403).json({
//           message:
//             "Application not yet approved for payment",
//         });
//       }

//       // ======================================================
//       // APPLICATION
//       // ======================================================

//       const application =
//         await HealsApplication.findByPk(
//           applicationId
//         );

//       if (!application) {
//         return res.status(404).json({
//           message:
//             "Application not found",
//         });
//       }

//       // ======================================================
//       // PAYMENT CODE
//       // ======================================================

//       const paymentCode =
//         `GHP-${Date.now()}`;

//       const transactionRef =
//         `HEALS-${Date.now()}-${crypto
//           .randomBytes(4)
//           .toString("hex")}`;

//       // ======================================================
//       // CREATE PAYMENT
//       // ======================================================

//       const payment =
//         await HealsPayment.create({
//           userId,

//           applicationId,

//           assignedAgentId:
//             application.assignedAgentId,

//           paymentCode,

//           type,

//           title,

//           description,

//           amount,

//           quantity: 1,

//           totalAmount: amount,

//           transactionRef,

//           status: "pending",
//         });

//       // ======================================================
//       // PAYSTACK INITIALIZE
//       // ======================================================

//       const response = await axios.post(
//         `${process.env.PAYSTACK_BASE}/transaction/initialize`,

//         {
//           email: application.email,

//           amount:
//             Number(amount) * 100,

//           reference:
//             transactionRef,

//           callback_url:
//             `${process.env.FRONTEND_URL}/heals/payment/callback`,

//           metadata: {
//             type: "heals_payment",

//             paymentId:
//               payment.id,

//             applicationId,
//           },
//         },

//         {
//           headers: {
//             Authorization:
//               `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,

//             "Content-Type":
//               "application/json",
//           },
//         }
//       );

//       res.json({
//         message:
//           "Payment initialized",

//         authorization_url:
//           response.data.data
//             .authorization_url,

//         access_code:
//           response.data.data
//             .access_code,

//         reference:
//           transactionRef,

//         payment,
//       });

//     } catch (err) {

//       console.error(
//         err.response?.data || err
//       );

//       res.status(500).json({
//         message:
//           "Payment initialization failed",
//       });
//     }
//   };


// // ======================================================
// // VERIFY PAYMENT
// // ======================================================

// export const verifyHealsPayment =
//   async (req, res) => {
//     try {

//       const { reference } =
//         req.body;

//       if (!reference) {
//         return res.status(400).json({
//           message:
//             "Reference is required",
//         });
//       }

//       // ======================================================
//       // VERIFY WITH PAYSTACK
//       // ======================================================

//       const response = await axios.get(
//         `${process.env.PAYSTACK_BASE}/transaction/verify/${reference}`,

//         {
//           headers: {
//             Authorization:
//               `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
//           },
//         }
//       );

//       const data =
//         response.data.data;

//       // ======================================================
//       // FIND PAYMENT
//       // ======================================================

//       const payment =
//         await HealsPayment.findOne({
//           where: {
//             transactionRef:
//               reference,
//           },
//         });

//       if (!payment) {
//         return res.status(404).json({
//           message:
//             "Payment not found",
//         });
//       }

//       // already verified
//       if (
//         payment.status ===
//         "success"
//       ) {
//         return res.json({
//           message:
//             "Payment already verified",

//           payment,
//         });
//       }

//       // ======================================================
//       // SUCCESS
//       // ======================================================

//       if (
//         data.status ===
//         "success"
//       ) {

//         payment.status =
//           "success";

//         payment.paymentMethod =
//           data.channel;

//         payment.gatewayResponse =
//           data;

//         payment.paidAt =
//           new Date();

//         await sendEmail(
//           application.email,

//           "HEALS Payment Receipt",

//           healsPaymentReceiptTemplate({
//             fullName:
//               application.fullName,

//             amount:
//               payment.totalAmount,

//             paymentCode:
//               payment.paymentCode,

//             transactionRef:
//               payment.transactionRef,

//             paidAt:
//               payment.paidAt,
//           })
//         );

//         await payment.save();

//         // ======================================================
//         // UPDATE APPLICATION
//         // ======================================================

//         const application =
//           await HealsApplication.findByPk(
//             payment.applicationId
//           );

//         if (
//           payment.type ===
//           "application_fee"
//         ) {

//           application.applicationFeePaid =
//             true;

//           application.status = "paid";

//           application.submittedAt =
//             new Date();

//           await application.save();
//         }

//         // ======================================================
//         // ACTIVITY LOG
//         // ======================================================

//         await ActivityLog.create({
//           userId:
//             payment.userId,

//           action:
//             "HEALS_PAYMENT_SUCCESS",

//           meta: {
//             paymentId:
//               payment.id,

//             applicationId:
//               payment.applicationId,

//             amount:
//               payment.totalAmount,
//           },
//         });

//         // ======================================================
//         // NOTIFICATION
//         // ======================================================

//         if (Notification) {

//           await Notification.create({
//             title:
//               "HEALS Payment Successful",

//             message:
//               `Payment of ₦${payment.totalAmount} was successful`,

//             type:
//               "heals_payment",

//             entityId:
//               payment.id,

//             entityType:
//               "heals_payment",
//           });
//         }

//         return res.json({
//           message:
//             "Payment verified successfully",

//           payment,
//         });
//       }

//       // ======================================================
//       // FAILED
//       // ======================================================

//       payment.status =
//         "failed";

//       payment.gatewayResponse =
//         data;

//       await payment.save();

//       return res.status(400).json({
//         message:
//           "Payment failed",
//       });

//     } catch (err) {

//       console.error(
//         err.response?.data || err
//       );

//       res.status(500).json({
//         message:
//           "Payment verification failed",
//       });
//     }
//   };


// // ======================================================
// // GET MY PAYMENTS
// // ======================================================

// export const getMyHealsPayments =
//   async (req, res) => {
//     try {

//       const payments =
//         await HealsPayment.findAll({
//           where: {
//             userId:
//               req.user.id,
//           },

//           include: [
//             {
//               model:
//                 HealsApplication,
//             },
//           ],

//           order: [
//             ["createdAt", "DESC"],
//           ],
//         });

//       res.json(payments);

//     } catch (err) {

//       console.error(err);

//       res.status(500).json({
//         message:
//           "Failed to fetch payments",
//       });
//     }
//   };


// // ======================================================
// // GET PAYMENT BY ID
// // ======================================================

// export const getHealsPaymentById =
//   async (req, res) => {
//     try {

//       const payment =
//         await HealsPayment.findByPk(
//           req.params.id,
//           {
//             include: [
//               {
//                 model:
//                   HealsApplication,
//               },
//             ],
//           }
//         );

//       if (!payment) {
//         return res.status(404).json({
//           message:
//             "Payment not found",
//         });
//       }

//       res.json(payment);

//     } catch (err) {

//       console.error(err);

//       res.status(500).json({
//         message:
//           "Failed to fetch payment",
//       });
//     }
//   };