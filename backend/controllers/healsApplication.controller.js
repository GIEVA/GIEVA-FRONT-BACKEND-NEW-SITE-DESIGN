// controllers/healsApplication.controller.js

import models from "../models/index.js";
import sendEmail from "../utils/sendMail.js";
import {
  submissionTemplate,
  approvalTemplate,
  rejectionTemplate,
  infoRequestTemplate,
} from "../utils/emailTemplates.js";
import { cloudinary } from "../config/cloudinary.js";
import { applicationSchema } from "../service/healsValidationSchema.js";
import { v4 as uuidv4 } from "uuid";
import { Op } from "sequelize";

const { HealsApplication, ActivityLog, User, Notification } = models;






export const createApplication = async (req, res) => {
  const transaction = await HealsApplication.sequelize.transaction();
  try {
    const userId = req.user.id;

const isDraft =
  req.body.status === "draft";

let value;


// ======================================================
// DRAFT
// ======================================================

if (isDraft) {

  value = req.body;

} else {

  // ======================================================
  // FINAL SUBMISSION VALIDATION
  // ======================================================

  const validation =
    applicationSchema.validate(
      req.body,
      {
        abortEarly: false,
        stripUnknown: true,
      }
    );

  if (validation.error) {

    return res.status(400).json({
      message: "Validation failed",

      errors:
        validation.error.details.map(
          (err) => err.message
        ),
    });
  }

  value = validation.value;
}
    // ---------------- VALIDATION ----------------
   const {
  // PROGRAM
  degreeProgram,
  desiredCountry,
  fieldOfStudy,
  firstChoice,
  secondChoice,
  thirdChoice,
  fourthChoice,
  intakePeriod,
  preferredLanguage,

  // PERSONAL
  fullName,
  dob,
  gender,
  maritalStatus,
  passportNumber,
  passportIssueDate,
  passportExpiryDate,
  address,
  phone,
  email,
  hasVisa,

  // ACADEMIC
  highSchool,
  highSchoolYearFrom,
  highSchoolYearTo,
  universityAttended,
  degreeReceived,

  // FINANCIAL
  budgetRange,
  financialNeeds,
} = value;



    // ---------------- HANDLE FILES ----------------
    // Expecting fields like:
    // passport, transcript, sop, recommendation, bank_statement, other
const getFileData = (field) => {
  if (req.files?.[field]) {
    return {
      url: req.files[field][0].path,
      publicId: `${req.files[field][0].filename}-${uuidv4()}`,
    };
  }
  return { url: null, publicId: null };
};

const passport = getFileData("passport");
const transcript = getFileData("transcript");
const sop = getFileData("sop");
const recommendation = getFileData("recommendation");
const bankStatement = getFileData("bankStatement");
const otherDoc = getFileData("otherDoc");



const data = {
  // PROGRAM
  degreeProgram,
  desiredCountry,
  fieldOfStudy,
  firstChoice,
  secondChoice,
  thirdChoice,
  fourthChoice,
  intakePeriod,
  preferredLanguage,

  // PERSONAL
  fullName,
  dob,
  gender,
  maritalStatus,
  passportNumber,
  passportIssueDate,
  passportExpiryDate,
  address,
  phone,
  email,
  hasVisa,

  // ACADEMIC
  highSchool,
  highSchoolYearFrom,
  highSchoolYearTo,
  universityAttended,
  degreeReceived,

  // FINANCIAL
  budgetRange,
  financialNeeds,

  // DOCUMENTS
  passportUrl: passport.url,
passportPublicId: passport.publicId,

transcriptUrl: transcript.url,
transcriptPublicId: transcript.publicId,

sopUrl: sop.url,
sopPublicId: sop.publicId,

recommendationUrl: recommendation.url,
recommendationPublicId: recommendation.publicId,

bankStatementUrl: bankStatement.url,
bankStatementPublicId: bankStatement.publicId,

otherDocUrl: otherDoc.url,
otherDocPublicId: otherDoc.publicId,

  // SYSTEM FIELDS
  userId,
  status:
  req.body.status || "draft",
};

      const uploadedDocs = Object.keys(req.files || {});
    // ---------------- CREATE ----------------
      const application = await HealsApplication.create(data, { transaction });

      await ActivityLog.create({
        userId,
        action: "APPLICATION_CREATED",
        meta: {
          applicationId: application.id,
          hasDocuments: uploadedDocs,
        },
      }, { transaction });

      await Notification.create({
        title: "New Application Submitted",
        message: `${fullName} submitted an application`,
        type: "application",
        entityId: application.id,
        entityType: "application",
      },  { transaction });

      await transaction.commit();

  //      await sendEmail(
  //   application.email,
  //   "HEALS Application Submitted",
  //   submissionTemplate(application.fullName)
  // );
    // ---------------- RESPONSE ----------------
    res.status(201).json({
      message: "Application created successfully",
      application,
    });

  } catch (error) {
    await transaction.rollback();

  console.error(
    "Create Application Error:",
    error
  );

  res.status(500).json({
    message:
      "Failed to create application",
  });
  }
};

export const getMyApplications = async (req, res) => {
  try {
    const userId = req.user.id;

    let { page = 1, limit = 10, status, search } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const offset = (page - 1) * limit;

    // ---------------- FILTERS ----------------
    const where = { userId };

    if (status) {
      where.status = status;
    }

    if (search) {
      where[Op.or] = [
        { desiredCountry: { [Op.like]: `%${search}%` } },
        { fieldOfStudy: { [Op.like]: `%${search}%` } },
        { fullName: { [Op.like]: `%${search}%` } },
      ];
    }

    // ---------------- QUERY ----------------
    const { rows, count } = await HealsApplication.findAndCountAll({
      where,
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });

    // ---------------- PARSE DOCUMENTS ----------------
    const parsedApplications = rows.map(app => ({
      id: app.id,
      fullName: app.fullName,
      email: app.email,
      phone: app.phone,
      status: app.status,
      desiredCountry: app.desiredCountry,
      fieldOfStudy: app.fieldOfStudy,
      createdAt: app.createdAt,

      documents: {
        passport: app.passportUrl,
        transcript: app.transcriptUrl,
        sop: app.sopUrl,
        recommendation: app.recommendationUrl,
        bankStatement: app.bankStatementUrl,
        other: app.otherDocUrl,
      },
    }));

    res.status(200).json({
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
      applications: parsedApplications,
    });

  } catch (error) {
    console.error("Get Applications Error:", error);
    res.status(500).json({
      message: "Failed to fetch applications",
    });
  }
};

export const getApplicationById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const application = await HealsApplication.findOne({
      where: { id, userId },
    });

    if (!application) {
      return res.status(404).json({
        message: "Application not found",
      });
    }

    res.status(200).json({
      application,
    });

  } catch (error) {
    console.error("Get Application By ID Error:", error);
    res.status(500).json({
      message: "Failed to fetch application",
    });
  }
};


export const updateApplication = async (req, res) => {
  const transaction = await HealsApplication.sequelize.transaction();

  try {
    const userId = req.user.id;
    const { id } = req.params;

    const application = await HealsApplication.findOne({
      where: { id, userId },
    });

    if (!application) {
      return res.status(404).json({
        message: "Application not found",
      });
    }

    if (application.status === "submitted") {
        return res.status(403).json({
          message: "Cannot edit a submitted application",
        });
      }

    // ✅ Validate (partial allowed)
    const { error, value } = applicationSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      presence: "optional", // 🔥 important for updates
    });

    if (error) {
      return res.status(400).json({
        message: "Validation failed",
        errors: error.details.map(err => err.message),
      });
    }

    // ---------------- FILE HANDLING ----------------
    const handleFileUpdate = async (field, urlKey, publicIdKey) => {
      if (req.files?.[field]) {
        // delete old file if exists
        if (application[publicIdKey]) {
          await cloudinary.uploader.destroy(application[publicIdKey]);
        }

        return {
          [urlKey]: req.files[field][0].path,
          [publicIdKey]: req.files[field][0].filename,
        };
      }
      return {};
    };

    const updates = {
      ...value,
      ...(await handleFileUpdate("passport", "passportUrl", "passportPublicId")),
      ...(await handleFileUpdate("transcript", "transcriptUrl", "transcriptPublicId")),
      ...(await handleFileUpdate("sop", "sopUrl", "sopPublicId")),
      ...(await handleFileUpdate("recommendation", "recommendationUrl", "recommendationPublicId")),
      ...(await handleFileUpdate("bankStatement", "bankStatementUrl", "bankStatementPublicId")),
      ...(await handleFileUpdate("otherDoc", "otherDocUrl", "otherDocPublicId")),
    };

    await application.update(updates, { transaction });

    await ActivityLog.create({
      userId,
      action: "APPLICATION_UPDATED",
      meta: { applicationId: application.id },
    }, { transaction });

    await transaction.commit();

    res.status(200).json({
      message: "Application updated successfully",
      application,
    });

  } catch (error) {
    await transaction.rollback();
    console.error("Update Application Error:", error);

    res.status(500).json({
      message: "Failed to update application",
    });
  }
};

export const deleteApplication = async (req, res) => {
  const transaction = await HealsApplication.sequelize.transaction();

  try {
    const userId = req.user.id;
    const { id } = req.params;

    const application = await HealsApplication.findOne({
      where: { id, userId },
    });

    if (!application) {
      return res.status(404).json({
        message: "Application not found",
      });
    }

    // ---------------- DELETE FILES ----------------
    const filePublicIds = [
      application.passportPublicId,
      application.transcriptPublicId,
      application.sopPublicId,
      application.recommendationPublicId,
      application.bankStatementPublicId,
      application.otherDocPublicId,
    ].filter(Boolean);

    for (const publicId of filePublicIds) {
      await cloudinary.uploader.destroy(publicId);
    }

    // ---------------- DELETE RECORD ----------------
    await application.destroy({ transaction });

    await ActivityLog.create({
      userId,
      action: "APPLICATION_DELETED",
      meta: { applicationId: id },
    }, { transaction });

    await transaction.commit();

    res.status(200).json({
      message: "Application deleted successfully",
    });

  } catch (error) {
    await transaction.rollback();
    console.error("Delete Application Error:", error);

    res.status(500).json({
      message: "Failed to delete application",
    });
  }
};

export const saveApplicationProgress = async (req, res) => {
  const transaction = await HealsApplication.sequelize.transaction();

  try {
    const userId = req.user.id;
    const { id } = req.params; // optional (for update)

    let application;

    if (id) {
      application = await HealsApplication.findOne({
        where: { id, userId },
      });

      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
    }

    // ✅ Partial validation
    const { error, value } = applicationSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      presence: "optional", // 🔥 allows partial updates
    });

    if (error) {
      return res.status(400).json({
        message: "Validation failed",
        errors: error.details.map(e => e.message),
      });
    }

    // ---------------- FILE HANDLING ----------------
    const handleFile = (field) => {
      if (req.files?.[field]) {
        return {
          [`${field}Url`]: req.files[field][0].path,
          [`${field}PublicId`]: req.files[field][0].filename,
        };
      }
      return {};
    };

    const fileUpdates = {
      ...handleFile("passport"),
      ...handleFile("transcript"),
      ...handleFile("sop"),
      ...handleFile("recommendation"),
      ...handleFile("bankStatement"),
      ...handleFile("otherDoc"),
    };

    let savedApplication;

    if (application) {
      // UPDATE
      savedApplication = await application.update(
        {
          ...value,
          ...fileUpdates,
        },
        { transaction }
      );
    } else {
      // CREATE
      savedApplication = await HealsApplication.create(
        {
          ...value,
          ...fileUpdates,
          userId,
          status: "draft",
        },
        { transaction }
      );
    }

    await ActivityLog.create({
      userId,
      action: "APPLICATION_SAVED",
      meta: { applicationId: savedApplication.id },
    }, { transaction });

    await transaction.commit();

    res.status(200).json({
      message: "Progress saved",
      application: savedApplication,
    });

  } catch (error) {
    await transaction.rollback();
    console.error("Save Progress Error:", error);

    res.status(500).json({
      message: "Failed to save progress",
    });
  }
};

export const submitApplication = async (req, res) => {
  const transaction = await HealsApplication.sequelize.transaction();

  try {
    const userId = req.user.id;
    const { id } = req.params;

    const application = await HealsApplication.findOne({
      where: { id, userId },
    });

    if (!application) {
      return res.status(404).json({
        message: "Application not found",
      });
    }

    if (application.status === "submitted") {
      return res.status(400).json({
        message: "Application already submitted",
      });
    }

    // ✅ Strict validation (everything required)
    const { error } = applicationSchema.validate(application.toJSON(), {
      abortEarly: false,
    });

    if (error) {
      return res.status(400).json({
        message: "Application is incomplete",
        errors: error.details.map(e => e.message),
      });
    }

    // ✅ Check required documents
    const requiredDocs = [
      "passportUrl",
      "transcriptUrl",
      "sopUrl",
    ];

    const missingDocs = requiredDocs.filter(doc => !application[doc]);

    if (missingDocs.length > 0) {
      return res.status(400).json({
        message: "Missing required documents",
        missingDocs,
      });
    }

    // ---------------- SUBMIT ----------------
await application.update(
  {
    status: "submitted",
    submittedAt: new Date(),
  },
  { transaction }
);

    await ActivityLog.create({
      userId,
      action: "APPLICATION_SUBMITTED",
      meta: { applicationId: id },
    }, { transaction });

    await transaction.commit();

    await sendEmail(
  application.email,
  "HEALS Application Submitted",
  submissionTemplate(
    application.fullName
  )
);

    res.status(200).json({
      message: "Application submitted successfully",
    });

  } catch (error) {
    await transaction.rollback();
    console.error("Submit Application Error:", error);

    res.status(500).json({
      message: "Failed to submit application",
    });
  }
};

//
// DELETE DRAFT APPLICATION
//

export const deleteDraftApplication =
  async (req, res) => {

    const transaction =
      await HealsApplication
      .sequelize
      .transaction();

    try {

      const userId =
        req.user.id;

      const application =
        await HealsApplication.findOne({
          where: {
            id: req.params.id,
            userId,
          },
        });

      if (!application) {

        await transaction.rollback();

        return res.status(404).json({
          message:
            "Application not found",
        });
      }

      // ONLY DRAFTS CAN BE DELETED

      if (
        application.status !==
        "draft"
      ) {

        await transaction.rollback();

        return res.status(400).json({
          message:
            "Only draft applications can be deleted",
        });
      }

      await application.destroy({
        transaction,
      });

      await ActivityLog.create({
        userId,

        action:
          "APPLICATION_DELETED",

        meta: {
          applicationId:
            application.id,
        },
      }, { transaction });

      await transaction.commit();

      res.json({
        message:
          "Draft deleted successfully",
      });

    } catch (err) {

      await transaction.rollback();

      console.error(err);

      res.status(500).json({
        message:
          "Failed to delete application",
      });
    }
  };

// ======================================================
// SEND PAYMENT REQUEST
// ======================================================

export const sendPaymentRequest =
  async (req, res) => {

    const transaction =
      await HealsApplication
        .sequelize
        .transaction();

    try {

      const agentId =
        req.user.id;

      const { id } =
        req.params;

      const {
        amount,
        title,
        description,
      } = req.body;

      // ======================================================
      // APPLICATION
      // ======================================================

      const application =
        await HealsApplication.findByPk(
          id
        );

      if (!application) {

        await transaction.rollback();

        return res.status(404).json({
          message:
            "Application not found",
        });
      }

      // ======================================================
      // VALIDATION
      // ======================================================

      if (
        !application.passportVerified ||
        !application.transcriptVerified
      ) {

        await transaction.rollback();

        return res.status(400).json({
          message:
            "Documents not fully verified",
        });
      }

      // ======================================================
      // UPDATE APPLICATION
      // ======================================================

      application.status =
        "approved_for_payment";

      application.assignedAgentId =
        agentId;

      application.applicationFeeAmount =
        amount;

      application.reviewStartedAt =
        new Date();

      await application.save({
        transaction,
      });


      

      // ======================================================
      // CREATE PENDING PAYMENT RECORD
      // ======================================================

      const payment =
        await models.HealsPayment.create(
          {
            userId:
              application.userId,

            applicationId:
              application.id,

            assignedAgentId:
              agentId,

            type:
              "application_fee",

            title:
              title ||
              "HEALS Application Processing Fee",

            description:
              description ||
              "Payment for HEALS programme processing",

            amount,

            totalAmount:
              amount,

            status:
              "pending",
          },

          { transaction }
        );

      // ======================================================
      // GENERATE PAYMENT LINK
      // ======================================================

      const paymentLink =
        `${process.env.FRONTEND_URL}/heals/payment/${payment.id}`;

      // ======================================================
      // EMAIL APPLICANT
      // ======================================================

      await sendEmail(
        application.email,

        "HEALS Payment Request",

        paymentRequestTemplate({
          fullName:
            application.fullName,

          amount,

          paymentLink,
        })
      );

      // ======================================================
      // ACTIVITY LOG
      // ======================================================

      await ActivityLog.create(
        {
          userId: agentId,

          action:
            "PAYMENT_REQUEST_SENT",

          meta: {
            applicationId:
              application.id,

            paymentId:
              payment.id,

            amount,
          },
        },

        { transaction }
      );

      // ======================================================
      // NOTIFICATION
      // ======================================================

      await Notification.create(
        {
          title:
            "Payment Request Sent",

          message:
            `Payment request sent to ${application.fullName}`,

          type:
            "heals_payment",

          entityId:
            payment.id,

          entityType:
            "heals_payment",
        },

        { transaction }
      );

      await transaction.commit();

      res.json({
        message:
          "Payment request sent successfully",

        paymentLink,

        payment,
      });

    } catch (err) {

      await transaction.rollback();

      console.error(err);

      res.status(500).json({
        message:
          "Failed to send payment request",
      });
    }
  };