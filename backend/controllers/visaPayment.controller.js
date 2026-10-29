// controllers/visaPayment.controller.js   (mirrors healsPaymentController)
//
// RULE: an application becomes "submitted" ONLY inside finalizeSuccessfulPayment, which runs only
// after Paystack confirms the money (verify API call or signed webhook), and only if the amount
// matches what the server calculated. The client never sends an amount.

import axios from "axios";
import crypto from "crypto";
import models from "../models/index.js";
import { getMissingFields, getMissingDocuments } from "../config/visaRequirements.js";
import { getVisaSettings, getVisaFee } from "../service/visaSettings.js";
import { addStatusEvent, generateApplicationCode, sendSubmissionEmail, fullNameOf } from "../service/visaCore.js";

const { VisaPayment, VisaApplication, ActivityLog, Notification } = models;
const paystack = () => ({ headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } });

// POST { applicationId }
export const initializeVisaPayment = async (req, res) => {
  try {
    const settings = await getVisaSettings();
    if (!settings.isOpen) return res.status(403).json({ message: settings.closedMessage || "Visa applications are currently closed." });

    const application = await VisaApplication.findOne({ where: { id: req.body.applicationId, userId: req.user.id } });
    if (!application) return res.status(404).json({ message: "Application not found" });
    if (application.applicationFeePaid || application.status !== "draft")
      return res.status(400).json({ message: "This application has already been submitted" });

    // Nothing is paid for until the form is complete
    const problems = [
      ...getMissingFields(application).map((f) => `Missing: ${f}`),
      ...getMissingDocuments(application).map((d) => `Missing document: ${d}`),
    ];
    if (!application.consentAcceptedAt) problems.push("You must accept the declaration and data-processing consent");
    if (problems.length) return res.status(400).json({ message: "Application is incomplete", errors: problems });

    // The server decides the price, from the fee the admin configured
    const { amount, currency } = await getVisaFee(application.appointmentType);
    if (!amount || amount <= 0) return res.status(500).json({ message: "The visa fee has not been set. Please contact support." });

    // Paystack rejects reused references, so retire earlier abandoned attempts
    await VisaPayment.update({ status: "cancelled" }, { where: { applicationId: application.id, status: "pending" } });

    const transactionRef = `VISA-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
    const label = application.appointmentType === "expedited" ? "Expedited" : "Normal";
    const payment = await VisaPayment.create({
      userId: req.user.id, applicationId: application.id,
      paymentCode: `GVP-${Date.now()}-${crypto.randomBytes(2).toString("hex")}`,
      title: `Visa Service Fee (${label} appointment)`,
      description: `Administrative charge, ${label.toLowerCase()} appointment, ${application.interviewLocation} office`,
      appointmentType: application.appointmentType, amount, currency, totalAmount: amount, transactionRef, status: "pending",
    });

    const response = await axios.post(
      `${process.env.PAYSTACK_BASE}/transaction/initialize`,
      {
        email: application.email, amount: Math.round(amount * 100), currency, reference: transactionRef,
        callback_url: `${process.env.FRONTEND_URL}/visa/payment/callback`,
        metadata: { type: "visa_payment", paymentId: payment.id, applicationId: application.id },
      },
      paystack()
    );
    res.json({ message: "Payment initialized", authorization_url: response.data.data.authorization_url, reference: transactionRef, amount, currency });
  } catch (err) {
    console.error("[visa] init", err.response?.data || err);
    res.status(500).json({ message: "Payment initialization failed" });
  }
};

// Shared by verify + webhook. Safe to run twice (row lock + status check).
export const finalizeSuccessfulPayment = async (reference, gatewayData) => {
  const t = await VisaPayment.sequelize.transaction();
  let payment, application;
  try {
    payment = await VisaPayment.findOne({ where: { transactionRef: reference }, transaction: t, lock: t.LOCK.UPDATE });
    if (!payment) { await t.rollback(); return { error: "Payment not found" }; }
    if (payment.status === "success") { await t.rollback(); return { payment, alreadyDone: true }; }

    if (Math.round(Number(payment.totalAmount) * 100) !== Number(gatewayData.amount)) {
      await t.rollback();
      return { error: "Amount paid does not match the expected amount" };
    }
    if (gatewayData.currency && gatewayData.currency !== payment.currency) {
      await t.rollback();
      return { error: "Currency does not match" };
    }

    payment.status = "success";
    payment.paymentMethod = gatewayData.channel;
    payment.gatewayResponse = gatewayData;
    payment.paidAt = new Date();
    await payment.save({ transaction: t });

    application = await VisaApplication.findByPk(payment.applicationId, { transaction: t, lock: t.LOCK.UPDATE });
    if (application) {
      application.applicationFeePaid = true;
      application.applicationFeeAmount = payment.totalAmount;
      application.currency = payment.currency;
      if (application.status === "draft") {
        application.status = "submitted";
        application.submittedAt = new Date();
        application.statusUpdatedAt = new Date();
        await addStatusEvent(application.id, "draft", "submitted", { note: "Payment received. Application submitted.", actorType: "system" }, t);
      }
      if (!application.applicationCode) application.applicationCode = generateApplicationCode(application.id);
      await application.save({ transaction: t });

      await Notification?.create({
        title: "New Visa Application", message: `${fullNameOf(application)} submitted a visa application (${application.appointmentType}, ${application.interviewLocation})`,
        type: "application", entityId: application.id, entityType: "visa",
      }, { transaction: t });
    }
    await ActivityLog?.create({ userId: payment.userId, action: "VISA_PAYMENT_SUCCESS", meta: { paymentId: payment.id, applicationId: payment.applicationId, amount: payment.totalAmount } }, { transaction: t });
    await t.commit();
  } catch (err) {
    await t.rollback();
    throw err;
  }

  // After commit, so a mail failure can't undo a successful payment
  if (application) await sendSubmissionEmail(application, payment);
  return { payment, application };
};

// POST { reference }   (called by the frontend callback page)
export const verifyVisaPayment = async (req, res) => {
  try {
    const { reference } = req.body;
    if (!reference) return res.status(400).json({ message: "Reference is required" });
    const payment = await VisaPayment.findOne({ where: { transactionRef: reference, userId: req.user.id } });
    if (!payment) return res.status(404).json({ message: "Payment not found" });
    if (payment.status === "success") {
      const application = await VisaApplication.findByPk(payment.applicationId, { attributes: ["id", "applicationCode", "status"] });
      return res.json({ message: "Payment already verified", payment, application });
    }

    const { data } = await axios.get(`${process.env.PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`, paystack());
    const tx = data.data;

    if (tx.status === "success") {
      const result = await finalizeSuccessfulPayment(reference, tx);
      if (result.error) return res.status(400).json({ message: result.error });
      return res.json({
        message: "Payment verified. Your application has been submitted.", payment: result.payment,
        application: result.application && { id: result.application.id, applicationCode: result.application.applicationCode, status: result.application.status },
      });
    }
    if (tx.status === "failed") {
      payment.status = "failed"; payment.gatewayResponse = tx; await payment.save();
    }
    return res.status(400).json({ message: tx.status === "abandoned" ? "Payment was not completed" : "Payment failed. You can try again." });
  } catch (err) {
    console.error("[visa] verify", err.response?.data || err);
    res.status(500).json({ message: "Payment verification failed" });
  }
};

// For setups with ONE Paystack webhook URL: call this from your existing webhook for refs starting "VISA-".
export const processVisaChargeSuccess = async (reference) => {
  const { data } = await axios.get(`${process.env.PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`, paystack());
  if (data.data.status === "success") return finalizeSuccessfulPayment(reference, data.data);
  return null;
};

// POST /payments/webhook   (Paystack → server). Signature-checked; the transaction is then
// re-verified with Paystack's API instead of trusting the body.
export const visaPaymentWebhook = async (req, res) => {
  try {
    const raw = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body || {}));
    const expected = crypto.createHmac("sha512", process.env.PAYSTACK_SECRET_KEY).update(raw).digest("hex");
    const given = String(req.get("x-paystack-signature") || "");
    const ok = given.length === expected.length && crypto.timingSafeEqual(Buffer.from(given), Buffer.from(expected));
    if (!ok) return res.sendStatus(401);

    const event = JSON.parse(raw.toString("utf8"));
    const reference = event?.data?.reference;
    if (event.event === "charge.success" && reference?.startsWith("VISA-")) {
      await processVisaChargeSuccess(reference);
    }
    res.sendStatus(200);
  } catch (err) {
    console.error("[visa] webhook", err.response?.data || err);
    res.sendStatus(500); // Paystack will retry
  }
};

export const listMyVisaPayments = async (req, res) => {
  const payments = await VisaPayment.findAll({
    where: { userId: req.user.id }, order: [["createdAt", "DESC"]],
    attributes: ["id", "applicationId", "paymentCode", "transactionRef", "title", "status", "totalAmount", "currency", "paymentMethod", "paidAt", "createdAt"],
  });
  res.json({ payments });
};
