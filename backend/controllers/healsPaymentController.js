// controllers/healsPaymentController.js

import axios from "axios";
import crypto from "crypto";
import models from "../models/index.js";
import { healsPaymentReceiptTemplate } from "../utils/emailTemplates.js";

const {
  HealsPayment,
  HealsApplication,
  ActivityLog,
  Notification,
} = models;

// ======================================================
// INITIALIZE PAYMENT
// ======================================================

export const initializeHealsPayment =
  async (req, res) => {
    try {

      const userId = req.user.id;

      const {
        applicationId,
        type,
        amount,
        title,
        description,
      } = req.body;

      // VALIDATION
      if (
        !applicationId ||
        !type ||
        !amount ||
        !title
      ) {
        return res.status(400).json({
          message:
            "Missing required fields",
        });
      }

      if (
        application.status !==
        "approved_for_payment"
      ) {
        return res.status(403).json({
          message:
            "Application not yet approved for payment",
        });
      }

      // ======================================================
      // APPLICATION
      // ======================================================

      const application =
        await HealsApplication.findByPk(
          applicationId
        );

      if (!application) {
        return res.status(404).json({
          message:
            "Application not found",
        });
      }

      // ======================================================
      // PAYMENT CODE
      // ======================================================

      const paymentCode =
        `GHP-${Date.now()}`;

      const transactionRef =
        `HEALS-${Date.now()}-${crypto
          .randomBytes(4)
          .toString("hex")}`;

      // ======================================================
      // CREATE PAYMENT
      // ======================================================

      const payment =
        await HealsPayment.create({
          userId,

          applicationId,

          assignedAgentId:
            application.assignedAgentId,

          paymentCode,

          type,

          title,

          description,

          amount,

          quantity: 1,

          totalAmount: amount,

          transactionRef,

          status: "pending",
        });

      // ======================================================
      // PAYSTACK INITIALIZE
      // ======================================================

      const response = await axios.post(
        `${process.env.PAYSTACK_BASE}/transaction/initialize`,

        {
          email: application.email,

          amount:
            Number(amount) * 100,

          reference:
            transactionRef,

          callback_url:
            `${process.env.FRONTEND_URL}/heals/payment/callback`,

          metadata: {
            type: "heals_payment",

            paymentId:
              payment.id,

            applicationId,
          },
        },

        {
          headers: {
            Authorization:
              `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,

            "Content-Type":
              "application/json",
          },
        }
      );

      res.json({
        message:
          "Payment initialized",

        authorization_url:
          response.data.data
            .authorization_url,

        access_code:
          response.data.data
            .access_code,

        reference:
          transactionRef,

        payment,
      });

    } catch (err) {

      console.error(
        err.response?.data || err
      );

      res.status(500).json({
        message:
          "Payment initialization failed",
      });
    }
  };


// ======================================================
// VERIFY PAYMENT
// ======================================================

export const verifyHealsPayment =
  async (req, res) => {
    try {

      const { reference } =
        req.body;

      if (!reference) {
        return res.status(400).json({
          message:
            "Reference is required",
        });
      }

      // ======================================================
      // VERIFY WITH PAYSTACK
      // ======================================================

      const response = await axios.get(
        `${process.env.PAYSTACK_BASE}/transaction/verify/${reference}`,

        {
          headers: {
            Authorization:
              `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          },
        }
      );

      const data =
        response.data.data;

      // ======================================================
      // FIND PAYMENT
      // ======================================================

      const payment =
        await HealsPayment.findOne({
          where: {
            transactionRef:
              reference,
          },
        });

      if (!payment) {
        return res.status(404).json({
          message:
            "Payment not found",
        });
      }

      // already verified
      if (
        payment.status ===
        "success"
      ) {
        return res.json({
          message:
            "Payment already verified",

          payment,
        });
      }

      // ======================================================
      // SUCCESS
      // ======================================================

      if (
        data.status ===
        "success"
      ) {

        payment.status =
          "success";

        payment.paymentMethod =
          data.channel;

        payment.gatewayResponse =
          data;

        payment.paidAt =
          new Date();

        await sendEmail(
          application.email,

          "HEALS Payment Receipt",

          healsPaymentReceiptTemplate({
            fullName:
              application.fullName,

            amount:
              payment.totalAmount,

            paymentCode:
              payment.paymentCode,

            transactionRef:
              payment.transactionRef,

            paidAt:
              payment.paidAt,
          })
        );

        await payment.save();

        // ======================================================
        // UPDATE APPLICATION
        // ======================================================

        const application =
          await HealsApplication.findByPk(
            payment.applicationId
          );

        if (
          payment.type ===
          "application_fee"
        ) {

          application.applicationFeePaid =
            true;

          application.status = "paid";

          application.submittedAt =
            new Date();

          await application.save();
        }

        // ======================================================
        // ACTIVITY LOG
        // ======================================================

        await ActivityLog.create({
          userId:
            payment.userId,

          action:
            "HEALS_PAYMENT_SUCCESS",

          meta: {
            paymentId:
              payment.id,

            applicationId:
              payment.applicationId,

            amount:
              payment.totalAmount,
          },
        });

        // ======================================================
        // NOTIFICATION
        // ======================================================

        if (Notification) {

          await Notification.create({
            title:
              "HEALS Payment Successful",

            message:
              `Payment of ₦${payment.totalAmount} was successful`,

            type:
              "heals_payment",

            entityId:
              payment.id,

            entityType:
              "heals_payment",
          });
        }

        return res.json({
          message:
            "Payment verified successfully",

          payment,
        });
      }

      // ======================================================
      // FAILED
      // ======================================================

      payment.status =
        "failed";

      payment.gatewayResponse =
        data;

      await payment.save();

      return res.status(400).json({
        message:
          "Payment failed",
      });

    } catch (err) {

      console.error(
        err.response?.data || err
      );

      res.status(500).json({
        message:
          "Payment verification failed",
      });
    }
  };


// ======================================================
// GET MY PAYMENTS
// ======================================================

export const getMyHealsPayments =
  async (req, res) => {
    try {

      const payments =
        await HealsPayment.findAll({
          where: {
            userId:
              req.user.id,
          },

          include: [
            {
              model:
                HealsApplication,
            },
          ],

          order: [
            ["createdAt", "DESC"],
          ],
        });

      res.json(payments);

    } catch (err) {

      console.error(err);

      res.status(500).json({
        message:
          "Failed to fetch payments",
      });
    }
  };


// ======================================================
// GET PAYMENT BY ID
// ======================================================

export const getHealsPaymentById =
  async (req, res) => {
    try {

      const payment =
        await HealsPayment.findByPk(
          req.params.id,
          {
            include: [
              {
                model:
                  HealsApplication,
              },
            ],
          }
        );

      if (!payment) {
        return res.status(404).json({
          message:
            "Payment not found",
        });
      }

      res.json(payment);

    } catch (err) {

      console.error(err);

      res.status(500).json({
        message:
          "Failed to fetch payment",
      });
    }
  };