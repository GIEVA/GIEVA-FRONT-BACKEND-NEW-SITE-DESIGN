// controllers/adminHealsApplication.controller.js

import models from "../models/index.js";
import sendEmail from "../utils/sendMail.js";
import {
  approvalTemplate,
  rejectionTemplate,
  infoRequestTemplate,
  paymentRequestTemplate,
} from "../utils/emailTemplates.js";
import { Op } from "sequelize";

const { HealsApplication, HealsPayment, ActivityLog, Notification, User } = models;

// ======================================================
// GET ALL APPLICATIONS (ADMIN)
// ======================================================

export const adminGetApplications = async (req, res) => {
  try {
    let { page = 1, limit = 10, status, currentStage, search } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);
    const offset = (page - 1) * limit;

    const where = {};

    if (status) {
      where.status = status;
    }

    if (currentStage) {
      where.currentStage = currentStage;
    }

    if (search) {
      where[Op.or] = [
        { fullName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
        { applicationCode: { [Op.like]: `%${search}%` } },
        { desiredCountry: { [Op.like]: `%${search}%` } },
      ];
    }

    const { rows, count } = await HealsApplication.findAndCountAll({
      where,
      limit,
      offset,
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: User,
          as: "applicant",
          attributes: ["id", "fullName", "email", "phone"],
        },
      ],
    });

    res.status(200).json({
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
      applications: rows,
    });
  } catch (error) {
    console.error("Admin Get Applications Error:", error);
    res.status(500).json({
      message: "Failed to fetch applications",
    });
  }
};

// ======================================================
// GET SINGLE APPLICATION (ADMIN)
// ======================================================

export const adminGetApplicationById = async (req, res) => {
  try {
    const { id } = req.params;

    const application = await HealsApplication.findByPk(id, {
      include: [
        {
          model: User,
          as: "applicant",
          attributes: ["id", "fullName", "email", "phone"],
        },
        {
          model: HealsPayment,
        },
      ],
    });

    if (!application) {
      return res.status(404).json({
        message: "Application not found",
      });
    }

    res.status(200).json({ application });
  } catch (error) {
    console.error("Admin Get Application By ID Error:", error);
    res.status(500).json({
      message: "Failed to fetch application",
    });
  }
};

// ======================================================
// VERIFY DOCUMENTS
// ======================================================
// Body: { passportVerified?, transcriptVerified?, bankStatementVerified? }
// Send only the flags you want to change; unspecified ones are left as-is.

export const verifyApplicationDocuments = async (req, res) => {
  const transaction = await HealsApplication.sequelize.transaction();

  try {
    const adminId = req.user.id;
    const { id } = req.params;
    const { passportVerified, transcriptVerified, bankStatementVerified } = req.body;

    const application = await HealsApplication.findByPk(id);

    if (!application) {
      await transaction.rollback();
      return res.status(404).json({
        message: "Application not found",
      });
    }

    const updates = {};
    if (typeof passportVerified === "boolean") updates.passportVerified = passportVerified;
    if (typeof transcriptVerified === "boolean") updates.transcriptVerified = transcriptVerified;
    if (typeof bankStatementVerified === "boolean") updates.bankStatementVerified = bankStatementVerified;

    if (Object.keys(updates).length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        message: "No document verification flags provided",
      });
    }

    await application.update(updates, { transaction });

    await ActivityLog.create(
      {
        userId: adminId,
        action: "DOCUMENTS_VERIFIED",
        meta: { applicationId: application.id, updates },
      },
      { transaction }
    );

    await transaction.commit();

    res.status(200).json({
      message: "Document verification updated",
      application,
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Verify Documents Error:", error);
    res.status(500).json({
      message: "Failed to verify documents",
    });
  }
};

// ======================================================
// UPDATE APPLICATION STATUS
// ======================================================
// Body: { status, currentStage?, internalNotes? }

const VALID_STATUSES = [
  "draft",
  "submitted",
  "under_review",
  "approved_for_payment",
  "paid",
  "processing",
  "completed",
  "rejected",
  "info_requested",
];

export const updateApplicationStatus = async (req, res) => {
  const transaction = await HealsApplication.sequelize.transaction();

  try {
    const adminId = req.user.id;
    const { id } = req.params;
    const { status, currentStage, internalNotes } = req.body;

    if (!status || !VALID_STATUSES.includes(status)) {
      await transaction.rollback();
      return res.status(400).json({
        message: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`,
      });
    }

    const application = await HealsApplication.findByPk(id);

    if (!application) {
      await transaction.rollback();
      return res.status(404).json({
        message: "Application not found",
      });
    }

    const updates = { status };

    if (currentStage) updates.currentStage = currentStage;
    if (typeof internalNotes === "string") updates.internalNotes = internalNotes;

    // stamp the relevant timestamp for the new status
    if (status === "under_review" && !application.reviewStartedAt) {
      updates.reviewStartedAt = new Date();
    }
    if (status === "approved_for_payment") {
      updates.approvedAt = new Date();
    }
    if (status === "rejected") {
      updates.rejectedAt = new Date();
    }
    if (status === "completed") {
      updates.completedAt = new Date();
    }

    await application.update(updates, { transaction });

    await ActivityLog.create(
      {
        userId: adminId,
        action: "APPLICATION_STATUS_UPDATED",
        meta: { applicationId: application.id, status },
      },
      { transaction }
    );

    await Notification.create(
      {
        title: "Application Status Updated",
        message: `${application.fullName}'s application is now "${status}"`,
        type: "heals_application",
        entityId: application.id,
        entityType: "heals_application",
      },
      { transaction }
    );

    await transaction.commit();

    // fire-and-forget emails — don't block the response on SMTP
    try {
      if (status === "approved_for_payment") {
        await sendEmail(application.email, "HEALS Application Approved", approvalTemplate(application.fullName));
      } else if (status === "rejected") {
        await sendEmail(application.email, "HEALS Application Update", rejectionTemplate(application.fullName));
      } else if (status === "info_requested") {
        await sendEmail(
          application.email,
          "HEALS Application - Additional Info Needed",
          infoRequestTemplate(application.fullName, internalNotes)
        );
      }
    } catch (mailErr) {
      console.error("Status update email failed:", mailErr);
    }

    res.status(200).json({
      message: "Application status updated",
      application,
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Update Application Status Error:", error);
    res.status(500).json({
      message: "Failed to update application status",
    });
  }
};

// ======================================================
// SEND PAYMENT REQUEST
// ======================================================
// Body: { amount, title?, description? }

export const sendPaymentRequest = async (req, res) => {
  const transaction = await HealsApplication.sequelize.transaction();

  try {
    const agentId = req.user.id;
    const { id } = req.params;
    const { amount, title, description } = req.body;

    if (!amount) {
      await transaction.rollback();
      return res.status(400).json({
        message: "Amount is required",
      });
    }

    const application = await HealsApplication.findByPk(id);

    if (!application) {
      await transaction.rollback();
      return res.status(404).json({
        message: "Application not found",
      });
    }

    if (!application.passportVerified || !application.transcriptVerified) {
      await transaction.rollback();
      return res.status(400).json({
        message: "Documents not fully verified",
      });
    }

    application.status = "approved_for_payment";
    application.assignedAgentId = agentId;
    application.applicationFeeAmount = amount;
    application.reviewStartedAt = application.reviewStartedAt || new Date();
    application.approvedAt = new Date();

    await application.save({ transaction });

    const payment = await HealsPayment.create(
      {
        userId: application.userId,
        applicationId: application.id,
        assignedAgentId: agentId,
        type: "application_fee",
        title: title || "HEALS Application Processing Fee",
        description: description || "Payment for HEALS programme processing",
        amount,
        totalAmount: amount,
        status: "pending",
      },
      { transaction }
    );

    const paymentLink = `${process.env.FRONTEND_URL}/heals/payment/${payment.id}`;

    await ActivityLog.create(
      {
        userId: agentId,
        action: "PAYMENT_REQUEST_SENT",
        meta: { applicationId: application.id, paymentId: payment.id, amount },
      },
      { transaction }
    );

    await Notification.create(
      {
        title: "Payment Request Sent",
        message: `Payment request sent to ${application.fullName}`,
        type: "heals_payment",
        entityId: payment.id,
        entityType: "heals_payment",
      },
      { transaction }
    );

    await transaction.commit();

    try {
      await sendEmail(
        application.email,
        "HEALS Payment Request",
        paymentRequestTemplate({
          fullName: application.fullName,
          amount,
          paymentLink,
        })
      );
    } catch (mailErr) {
      console.error("Payment request email failed:", mailErr);
    }

    res.status(200).json({
      message: "Payment request sent successfully",
      paymentLink,
      payment,
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Send Payment Request Error:", error);
    res.status(500).json({
      message: "Failed to send payment request",
    });
  }
};

// ======================================================
// START PROCESSING
// ======================================================

export const startProcessing = async (req, res) => {
  const transaction = await HealsApplication.sequelize.transaction();

  try {
    const adminId = req.user.id;
    const { id } = req.params;

    const application = await HealsApplication.findByPk(id);

    if (!application) {
      await transaction.rollback();
      return res.status(404).json({
        message: "Application not found",
      });
    }

    if (application.status !== "paid") {
      await transaction.rollback();
      return res.status(400).json({
        message: "Application must be paid before processing can start",
      });
    }

    await application.update(
      {
        status: "processing",
        currentStage: "school_matching",
      },
      { transaction }
    );

    await ActivityLog.create(
      {
        userId: adminId,
        action: "APPLICATION_PROCESSING_STARTED",
        meta: { applicationId: application.id },
      },
      { transaction }
    );

    await transaction.commit();

    res.status(200).json({
      message: "Processing started",
      application,
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Start Processing Error:", error);
    res.status(500).json({
      message: "Failed to start processing",
    });
  }
};

// ======================================================
// COMPLETE APPLICATION
// ======================================================

export const completeApplication = async (req, res) => {
  const transaction = await HealsApplication.sequelize.transaction();

  try {
    const adminId = req.user.id;
    const { id } = req.params;

    const application = await HealsApplication.findByPk(id);

    if (!application) {
      await transaction.rollback();
      return res.status(404).json({
        message: "Application not found",
      });
    }

    await application.update(
      {
        status: "completed",
        currentStage: "completed",
        completedAt: new Date(),
      },
      { transaction }
    );

    await ActivityLog.create(
      {
        userId: adminId,
        action: "APPLICATION_COMPLETED",
        meta: { applicationId: application.id },
      },
      { transaction }
    );

    await Notification.create(
      {
        title: "Application Completed",
        message: `${application.fullName}'s HEALS application is complete`,
        type: "heals_application",
        entityId: application.id,
        entityType: "heals_application",
      },
      { transaction }
    );

    await transaction.commit();

    res.status(200).json({
      message: "Application marked as completed",
      application,
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Complete Application Error:", error);
    res.status(500).json({
      message: "Failed to complete application",
    });
  }
};

// ======================================================
// GET APPLICATION PAYMENTS
// ======================================================

export const getApplicationPayments = async (req, res) => {
  try {
    const { id } = req.params;

    const application = await HealsApplication.findByPk(id);

    if (!application) {
      return res.status(404).json({
        message: "Application not found",
      });
    }

    const payments = await HealsPayment.findAll({
      where: { applicationId: id },
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({ payments });
  } catch (error) {
    console.error("Get Application Payments Error:", error);
    res.status(500).json({
      message: "Failed to fetch application payments",
    });
  }
};