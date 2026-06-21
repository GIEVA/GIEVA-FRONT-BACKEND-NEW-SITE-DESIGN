import models from "../models/index.js";
import { cloudinary } from "../config/cloudinary.js";
import { Parser } from "json2csv";
import ExcelJS from "exceljs";
import { Op } from "sequelize";
import {
  approvalTemplate,
  rejectionTemplate,
  infoRequestTemplate,
} from "../utils/emailTemplates.js";
import { campaignBroadcastTemplate } from "../utils/emailTemplates.js";

const {
  User,
  Campaign,
  ActivityLog,
  Notification,
  HealsApplication,
  CampaignMessage,
  ClassSession,
  SessionAttendance,
  Lesson,
  LessonProgress,
  CourseModule,
  Course,
  HealsPayment,
} = models;



export const getApplicationById = async (req, res) => {
  const app = await HealsApplication.findByPk(req.params.id, {
    include: [
  {
    model: models.User,
    as: "applicant",
    attributes: [
      "id",
      "fullName",
      "email",
    ],
  },
]
  });

  if (!app) return res.status(404).json({ message: "Not found" });

  // 🔒 student restriction
  if (
    req.user.role === "student" &&
    app.userId !== req.user.id
  ) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  res.json(app);
};


export const getAllApplications = async (req, res) => {
  try {
    let { page = 1, limit = 10, status, search } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const offset = (page - 1) * limit;

    const where = {};

    if (status) where.status = status;

    if (search) {
      where[Op.or] = [
        { fullName: { [Op.like]: `%${search}%` } },
        { desiredCountry: { [Op.like]: `%${search}%` } },
        { fieldOfStudy: { [Op.like]: `%${search}%` } },
      ];
    }

    const { rows, count } = await HealsApplication.findAndCountAll({
      where,
      limit,
      offset,
      order: [["createdAt", "DESC"]],
      include: [{ model: User, attributes: ["id", "email"] }],
    });

    res.status(200).json({
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
      applications: rows,
    });

  } catch (error) {
    console.error("Admin Fetch Error:", error);
    res.status(500).json({ message: "Failed to fetch applications" });
  }
};

export const updateApplication = async (req, res) => {
  try {
    const app = await HealsApplication.findByPk(req.params.id);

    if (!app) return res.status(404).json({ message: "Not found" });

    // 🔒 STUDENT RULE
    if (req.user.role === "student") {
      if (app.userId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      if (!["draft", "submitted"].includes(app.status)) {
        return res.status(400).json({
          message: "Cannot edit at this stage",
        });
      }
    }

    const oldData = app.toJSON();

    await app.update(req.body);

    await ActivityLog.create({
      userId: req.user.id,
      action: "APPLICATION_UPDATED",
      meta: {
        applicationId: app.id,
        before: oldData,
        after: app.toJSON(),
      },
    });

    res.json(app);

  } catch (error) {
    res.status(500).json({ message: "Update failed" });
  }
};



export const updateApplicationStatus = async (req, res) => {
  const transaction = await HealsApplication.sequelize.transaction();

  try {
    const { status, note } = req.body;
    const { id } = req.params;

    // 🔐 Admin check
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Only admins can update application status",
      });
    }

    const app = await HealsApplication.findByPk(id);

    if (!app) {
      return res.status(404).json({
        message: "Application not found",
      });
    }

    // ✅ Validate status
    const allowedStatuses = [
      "under_review",
      "info_requested",
      "approved",
      "rejected",
      "processing",
      "completed",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid status",
      });
    }

    // ✅ Enforce note when required
    if (
      (status === "rejected" || status === "info_requested") &&
      !note
    ) {
      return res.status(400).json({
        message: "Note is required for this action",
      });
    }

    const oldStatus = app.status;

    await app.update(
      {
        status,
        notes: note || null,
      },
      { transaction }
    );

    // ---------------- EMAIL ----------------
    let template;

    if (status === "approved") {
      template = approvalTemplate(app.fullName);
    } else if (status === "rejected") {
      template = rejectionTemplate(note);
    } else if (status === "info_requested") {
      template = infoRequestTemplate(note);
    }

    if (template) {
      await sendEmail(app.email, "Application Update", template);
    }

    // ---------------- LOG ----------------
    await ActivityLog.create(
      {
        userId: req.user.id,
        action: "APPLICATION_STATUS_UPDATED",
        meta: {
          applicationId: app.id,
          from: oldStatus,
          to: status,
          note,
        },
      },
      { transaction }
    );

    await transaction.commit();

    res.status(200).json({
      message: "Status updated successfully",
    });

  } catch (error) {
    await transaction.rollback();
    console.error("Status Update Error:", error);

    res.status(500).json({
      message: "Failed to update status",
    });
  }
};

// ======================================================
// VERIFY DOCUMENTS
// ======================================================

export const verifyDocuments =
  async (req, res) => {

    const transaction =
      await HealsApplication
        .sequelize
        .transaction();

    try {

      const { id } =
        req.params;

      const {
        passportVerified,
        transcriptVerified,
        bankStatementVerified,
        internalNotes,
      } = req.body;

      const app =
        await HealsApplication.findByPk(
          id
        );

      if (!app) {

        await transaction.rollback();

        return res.status(404).json({
          message:
            "Application not found",
        });
      }

      app.passportVerified =
        passportVerified;

      app.transcriptVerified =
        transcriptVerified;

      app.bankStatementVerified =
        bankStatementVerified;

      app.internalNotes =
        internalNotes;

      app.status =
        "under_review";

      app.reviewStartedAt =
        new Date();

      await app.save({
        transaction,
      });

      await ActivityLog.create(
        {
          userId:
            req.user.id,

          action:
            "DOCUMENTS_VERIFIED",

          meta: {
            applicationId:
              app.id,
          },
        },

        { transaction }
      );

      await transaction.commit();

      res.json({
        message:
          "Documents verified successfully",
      });

    } catch (err) {

      await transaction.rollback();

      console.error(err);

      res.status(500).json({
        message:
          "Document verification failed",
      });
    }
  };



  // ======================================================
// START PROCESSING
// ======================================================

export const startProcessing =
  async (req, res) => {

    try {

      const app =
        await HealsApplication.findByPk(
          req.params.id
        );

      if (!app) {
        return res.status(404).json({
          message:
            "Application not found",
        });
      }

      if (
        app.status !== "paid"
      ) {
        return res.status(400).json({
          message:
            "Application has not been paid for",
        });
      }

      app.status =
        "processing";

      app.currentStage =
        "school_matching";

      await app.save();

      res.json({
        message:
          "Processing started",
      });

    } catch (err) {

      console.error(err);

      res.status(500).json({
        message:
          "Failed to start processing",
      });
    }
  };

  // ======================================================
// COMPLETE APPLICATION
// ======================================================

export const markApplicationCompleted =
  async (req, res) => {

    try {

      const app =
        await HealsApplication.findByPk(
          req.params.id
        );

      if (!app) {
        return res.status(404).json({
          message:
            "Application not found",
        });
      }

      app.status =
        "completed";

      app.completedAt =
        new Date();

      app.currentStage =
        "completed";

      await app.save();

      res.json({
        message:
          "Application completed",
      });

    } catch (err) {

      console.error(err);

      res.status(500).json({
        message:
          "Failed to complete application",
      });
    }
  };

  // ======================================================
// GET APPLICATION PAYMENTS
// ======================================================

export const getApplicationPayments =
  async (req, res) => {

    try {

      const payments =
        await models.HealsPayment.findAll({
          where: {
            applicationId:
              req.params.id,
          },

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

// ---------------- GET ALL LOGS (WITH FILTERS + PAGINATION) ----------------
export const getActivityLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      action,
      userId,
      startDate,
      endDate,
      search,
    } = req.query;

    const offset = (page - 1) * limit;

    let where = {};

    // Filter by action
    if (action) {
      where.action = action;
    }

    // Filter by user
    if (userId) {
      where.userId = userId;
    }

    // Date range filter
    if (startDate && endDate) {
      where.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }

    // Search inside meta (basic)
    if (search) {
      where[Op.or] = [
        { action: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await ActivityLog.findAndCountAll({
      where,
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    return res.json({
      total: count,
      page: parseInt(page),
      pages: Math.ceil(count / limit),
      logs: rows,
    });

  } catch (error) {
    console.error("Get Logs Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};


export const exportRegistrationsCSV = async (req, res) => {
  try {
    const { campaignId } = req.query;

    const where = {};
    if (campaignId) where.campaignId = campaignId;

    const registrations = await CampaignRegistration.findAll({
      where,
      include: [{ model: Campaign, as: "campaign" }],
      raw: true,
      nest: true,
    });

    const formatted = registrations.map(r => ({
      fullName: r.fullName,
      email: r.email,
      phoneNumber: r.phoneNumber,
      dob: r.dob,
      status: r.status,
      campaign: r.campaign?.title,
      createdAt: r.createdAt,
    }));

    const parser = new Parser();
    const csv = parser.parse(formatted);

    res.header("Content-Type", "text/csv");
    res.attachment("registrations.csv");
    res.send(csv);

  } catch (error) {
    res.status(500).json({ message: "Export failed" });
  }
};


export const exportRegistrationsExcel = async (req, res) => {
  try {
    const { campaignId } = req.query;

    const where = {};
    if (campaignId) where.campaignId = campaignId;

    const registrations = await CampaignRegistration.findAll({
      where,
      include: [{ model: Campaign, as: "campaign" }],
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Registrations");

    sheet.columns = [
      { header: "Full Name", key: "fullName" },
      { header: "Email", key: "email" },
      { header: "Phone", key: "phoneNumber" },
      { header: "DOB", key: "dob" },
      { header: "Status", key: "status" },
      { header: "Campaign", key: "campaign" },
      { header: "Date", key: "createdAt" },
    ];

    registrations.forEach(r => {
      sheet.addRow({
        fullName: r.fullName,
        email: r.email,
        phoneNumber: r.phoneNumber,
        dob: r.dob,
        status: r.status,
        campaign: r.campaign?.title,
        createdAt: r.createdAt,
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=registrations.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    res.status(500).json({ message: "Excel export failed" });
  }
};


export const getNotifications = async (req, res) => {
  const notifications = await Notification.findAll({
    order: [["createdAt", "DESC"]],
  });

  res.json(notifications);
};
export const markNotificationRead = async (req, res) => {
  const notification = await Notification.findByPk(req.params.id);

  if (!notification) {
    return res.status(404).json({ message: "Not found" });
  }

  notification.isRead = true;
  await notification.save();

  res.json({ message: "Marked as read" });
};


export const adminGetRegistrations = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;

    let { page = 1, limit = 10, campaignId, search } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const offset = (page - 1) * limit;

    const where = {};

    if (campaignId) where.campaignId = campaignId;

    if (search) {
      where[Op.or] = [
        { fullName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phoneNumber: { [Op.like]: `%${search}%` } },
      ];
    }

    const { rows, count } = await CampaignRegistration.findAndCountAll({
      where,
      include: [{ model: Campaign, as: "campaign" }],
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });

    res.json({
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
      registrations: rows,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const adminUpdateRegistration = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;

    const registration = await CampaignRegistration.findByPk(req.params.id);

    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    const oldData = registration.toJSON();

    const allowedFields = ["fullName", "phoneNumber", "dob", "extraData"];

    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    await registration.update(updates);

    await ActivityLog.create({
      userId: req.user.id,
      action: "ADMIN_UPDATED_REGISTRATION",
      meta: {
        registrationId: registration.id,
        changes: { before: oldData, after: registration.toJSON() },
      },
    });

    res.json({
      message: "Registration updated",
      registration,
    });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const adminDeleteRegistration = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;

    const registration = await CampaignRegistration.findByPk(req.params.id);

    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    const data = registration.toJSON();

    await registration.destroy();

    await ActivityLog.create({
      userId: req.user.id,
      action: "ADMIN_DELETED_REGISTRATION",
      meta: {
        registrationId: data.id,
        email: data.email,
        campaignId: data.campaignId,
      },
    });

    res.json({ message: "Registration deleted" });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const adminGetRegistrationById = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;

    const registration = await CampaignRegistration.findByPk(req.params.id, {
      include: [{ model: Campaign, as: "campaign" }],
    });

    if (!registration) {
      return res.status(404).json({ message: "Not found" });
    }

    res.json(registration);

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const emailAttendees = async (req, res) => {
  const transaction = await CampaignRegistration.sequelize.transaction();

  try {
    // 🔐 Admin only
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admins only" });
    }

    const { campaignId, subject, message, status, scheduledAt } = req.body;

    if (!campaignId || !subject || !message) {
      return res.status(400).json({
        message: "campaignId, subject and message required",
      });
    }

    const campaign = await Campaign.findByPk(campaignId);

    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    // =====================
    // 📝 HANDLE DRAFT
    // =====================
    if (status === "draft") {
      const draft = await CampaignMessage.create({
        campaignId,
        subject,
        message,
        status: "draft",
        sentBy: req.user.id,
      });

      return res.json({ message: "Draft saved", draft });
    }

    // =====================
    // ⏰ HANDLE SCHEDULE
    // =====================
    if (status === "scheduled") {
      if (!scheduledAt) {
        return res.status(400).json({
          message: "scheduledAt is required for scheduling",
        });
      }

      const scheduled = await CampaignMessage.create({
        campaignId,
        subject,
        message,
        status: "scheduled",
        scheduledAt,
        sentBy: req.user.id,
      });

      return res.json({ message: "Scheduled successfully", scheduled });
    }

    // =====================
    // 📧 SEND IMMEDIATELY
    // =====================

    const campaignMessage = await CampaignMessage.create({
      campaignId,
      subject,
      message,
      status: "sent",
      sentBy: req.user.id,
      sentAt: new Date(),
    }, { transaction });

    const registrations = await CampaignRegistration.findAll({
      where: { campaignId },
    });

    if (!registrations.length) {
      await transaction.rollback();
      return res.status(400).json({
        message: "No attendees found for this campaign",
      });
    }

    let success = 0;
    let failed = 0;

    await Promise.all(
      registrations.map(async (r) => {
        try {
          const personalizedMessage = message.replace(
            "{{name}}",
            r.fullName
          );

          await sendEmail(
            r.email,
            subject,
            campaignBroadcastTemplate(personalizedMessage, campaign.title)
          );

          success++;

        } catch (err) {
          failed++;
        }
      })
    );

    campaignMessage.totalRecipients = registrations.length;
    campaignMessage.successCount = success;
    campaignMessage.failedCount = failed;

    await campaignMessage.save({ transaction });

    await ActivityLog.create({
      userId: req.user.id,
      action: "EMAIL_SENT_TO_ATTENDEES",
      meta: {
        campaignId,
        messageId: campaignMessage.id,
        count: registrations.length,
      },
    }, { transaction });

    await transaction.commit();

    res.json({
      message: `Emails sent to ${registrations.length} attendees`,
      stats: { success, failed },
      messageId: campaignMessage.id,
    });

  } catch (error) {
    await transaction.rollback();
    console.error(error);

    res.status(500).json({
      message: "Failed to send emails",
    });
  }
};

export const getCampaignMessages = async (req, res) => {
  try {
    const { id } = req.params;

    const messages = await CampaignMessage.findAll({
      where: { campaignId: id },
      order: [["createdAt", "DESC"]],
    });

    res.json(messages);

  } catch (error) {
    res.status(500).json({ message: "Failed to fetch messages" });
  }
};

export const resendMessage = async (req, res) => {
  try {
    const message = await CampaignMessage.findByPk(req.params.id);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    const campaign = await Campaign.findByPk(message.campaignId);

    const registrations = await CampaignRegistration.findAll({
      where: { campaignId: message.campaignId },
    });

    let success = 0;
    let failed = 0;

    await Promise.all(
      registrations.map(async (r) => {
        try {
          await sendEmail(
            r.email,
            message.subject,
            campaignBroadcastTemplate(
              message.message.replace("{{name}}", r.fullName),
              campaign.title
            )
          );

          success++;

        } catch (err) {
          failed++;
        }
      })
    );

    message.status = "sent";
    message.sentAt = new Date();
    message.successCount = success;
    message.failedCount = failed;

    await message.save();

    res.json({ message: "Resent successfully" });

  } catch (error) {
    res.status(500).json({ message: "Resend failed" });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const message = await CampaignMessage.findByPk(req.params.id);

    if (!message) {
      return res.status(404).json({ message: "Not found" });
    }

    await message.destroy();

    res.json({ message: "Message deleted" });

  } catch (error) {
    res.status(500).json({ message: "Delete failed" });
  }
};

export const getSessionAttendance = async (req, res) => {
  const records = await SessionAttendance.findAll({
    where: { classSessionId: req.params.sessionId },
    include: ["User"],
  });

  res.json(records);
};

export const getTutorHours = async (req, res) => {
  const tutors = await TutorProfile.findAll({
    attributes: [
      "id",
      "fullName",
      "totalLectureMinutes",
    ],
  });

  res.json(tutors);
};

//live session

export const getAllSessionsAdmin = async (req, res) => {
  const sessions = await ClassSession.findAll({
    include: ["Course"],
    order: [["createdAt", "DESC"]],
  });

  res.json(sessions);
};

export const getSessionAnalytics = async (req, res) => {
  const { sessionId } = req.params;

  const records = await SessionAttendance.findAll({
    where: { classSessionId: sessionId },
  });

  const totalStudents = records.length;

  const totalMinutes = records.reduce(
    (sum, r) => sum + r.totalMinutes,
    0
  );

  const avgMinutes =
    totalStudents > 0
      ? Math.round(totalMinutes / totalStudents)
      : 0;

  res.json({
    totalStudents,
    totalMinutes,
    avgMinutes,
  });
};

export const endSession = async (req, res) => {
  const session = await ClassSession.findByPk(
    req.params.sessionId
  );

  if (!session)
    return res.status(404).json({ message: "Not found" });

  session.endTime = new Date();
  await session.save();

  res.json({ message: "Session ended" });
};

export const deleteSession = async (req, res) => {
  const session = await ClassSession.findByPk(
    req.params.sessionId
  );

  if (!session)
    return res.status(404).json({ message: "Not found" });

  await session.destroy();

  res.json({ message: "Session deleted" });
};

export const getAllSessions = async (req, res) => {
  const sessions = await ClassSession.findAll({
    include: ["Course"],
    order: [["createdAt", "DESC"]],
  });

  res.json(sessions);
};

export const cancelSession = async (req, res) => {
  const session = await ClassSession.findByPk(
    req.params.sessionId
  );

  if (!session) {
    return res.status(404).json({ message: "Not found" });
  }

  session.status = "cancelled";
  await session.save();

  await models.ActivityLog.create({
    userId: req.user.id,
    action: "SESSION_CANCELLED",
    meta: { sessionId: session.id },
  });

  res.json({ message: "Session cancelled" });
};

export const createCourse = async (req, res) => {
  try {
    const userId = req.user.id;

    if (req.user.role !== "superadmin") {
      return res.status(403).json({ message: "Admin only" });
    }

    const {
      title,
      description,
      price,
      category,
      level,
      tutorProfileId, // optional
    } = req.body;

    if (!title || !category) {
      return res.status(400).json({
        message: "Title and category are required",
      });
    }

    // ✅ optional tutor assignment
    let tutorProfile = null;

    if (tutorProfileId) {
      tutorProfile = await models.TutorProfile.findByPk(
        tutorProfileId
      );

      if (!tutorProfile) {
        return res.status(404).json({
          message: "Tutor not found",
        });
      }
    }

    const course = await Course.create({
      title,
      description,
      price,
      category,
      level,
      userId, // creator (admin)
      tutorProfileId: tutorProfile ? tutorProfile.id : null,
    });

    await ActivityLog.create({
      userId,
      action: "ADMIN_CREATE_COURSE",
      meta: { courseId: course.id },
    });

    res.status(201).json(course);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not create course" });
  }
};

export const getAllCoursesAdmin = async (req, res) => {
  try {
    if (req.user.role !== "superadmin") {
      return res.status(403).json({ message: "Admin only" });
    }

    const courses = await Course.findAll({
      include: [
        { model: models.TutorProfile, attributes: ["id", "fullName"] },
        { model: models.User, attributes: ["id", "email"] },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json(courses);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getCourseByIdAdmin = async (req, res) => {
  try {
    if (req.user.role !== "superadmin") {
      return res.status(403).json({ message: "Admin only" });
    }

    const course = await Course.findByPk(req.params.id, {
      include: [
        { model: models.TutorProfile },
        { model: models.User },
      ],
    });

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.json(course);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateCourseAdmin = async (req, res) => {
  try {
    const userId = req.user.id;

    if (req.user.role !== "superadmin") {
      return res.status(403).json({ message: "Admin only" });
    }

    const course = await Course.findByPk(req.params.id);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const oldData = course.toJSON();

    const {
      title,
      description,
      price,
      category,
      level,
      tutorProfileId,
      isPublished,
    } = req.body;

    if (tutorProfileId) {
      const tutor = await models.TutorProfile.findByPk(
        tutorProfileId
      );

      if (!tutor) {
        return res.status(404).json({
          message: "Tutor not found",
        });
      }

      course.tutorProfileId = tutor.id;
    }

    course.title = title ?? course.title;
    course.description = description ?? course.description;
    course.price = price ?? course.price;
    course.category = category ?? course.category;
    course.level = level ?? course.level;
    course.isPublished = isPublished ?? course.isPublished;

    await course.save();

    await ActivityLog.create({
      userId,
      action: "ADMIN_UPDATE_COURSE",
      meta: {
        courseId: course.id,
        before: oldData,
        after: course.toJSON(),
      },
    });

    res.json(course);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteCourseAdmin = async (req, res) => {
  try {
    const userId = req.user.id;

    if (req.user.role !== "superadmin") {
      return res.status(403).json({ message: "Admin only" });
    }

    const course = await Course.findByPk(req.params.id);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    await course.destroy();

    await ActivityLog.create({
      userId,
      action: "ADMIN_DELETE_COURSE",
      meta: {
        courseId: req.params.id,
      },
    });

    res.json({ message: "Course deleted" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


//
// CREATE LESSON
//
export const createLesson = async (req, res) => {
  try {
    const { title, moduleId, type, contentText, youtubeUrl } = req.body;

      if (!title || !type || !moduleId) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const module = await models.CourseModule.findByPk(moduleId, {
      include: [{ model: models.Course }],
    });

    if (!module) return res.status(404).json({ message: "Module not found" });

     const exists = await Lesson.findOne({
      where: { moduleId, orderIndex },
    });

    if (exists) {
      return res.status(400).json({
        message: "Order already exists",
      });
    }

    let contentUrl = null;
    let cloudinaryPublicId = null;
    let cloudinaryResourceType = null;
    let youtubeVideoId = null;

    // ✅ FILE UPLOAD (PDF / IMAGE)
    if (req.file) {
      contentUrl = req.file.path;
      cloudinaryPublicId = req.file.filename;
      cloudinaryResourceType = req.file.resource_type;
    }

    // ✅ YOUTUBE VIDEO
    if (type === "video" && youtubeUrl) {
      const match = youtubeUrl.match(
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/i
      );

      youtubeVideoId = match ? match[1] : null;
      contentUrl = youtubeUrl;
    }

    const lesson = await Lesson.create({
      title,
      moduleId,
      type,
      contentText,
      contentUrl,
      youtubeVideoId,
      cloudinaryPublicId,
      cloudinaryResourceType,
    });

    await models.ActivityLog.create({
      userId,
      action: "CREATE_LESSON",
      meta: { lessonId: lesson.id },
    });

    res.status(201).json(lesson);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lesson creation failed" });
  }
};


//
// GET MODULE LESSONS
//
export const getModuleLessons = async (req, res) => {
  const userId = req.user.id;

  const lessons = await Lesson.findAll({
    where: { moduleId: req.params.moduleId },
    order: [["orderIndex", "ASC"]],
    include: [
      {
        model: LessonProgress,
        where: { userId },
        required: false,
      },
    ],
  });

  res.json(lessons);
};


//
// UPDATE LESSON
//
export const updateLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findByPk(req.params.id);

    if (!lesson)
      return res.status(404).json({ message: "Lesson not found" });

    // ✅ Replace uploaded file
    if (req.file) {
      // delete old cloudinary file
      if (lesson.cloudinaryPublicId) {
        await cloudinary.uploader.destroy(
          lesson.cloudinaryPublicId,
          {
            resource_type: lesson.cloudinaryResourceType || "image",
          }
        );
      }

      lesson.contentUrl = req.file.path;
      lesson.cloudinaryPublicId = req.file.filename;
      lesson.cloudinaryResourceType = req.file.resource_type;
    }

    await lesson.update(req.body);

    res.json(lesson);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lesson update failed" });
  }
};


//
// DELETE LESSON
//
export const deleteLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findByPk(req.params.id);

    if (!lesson)
      return res.status(404).json({ message: "Lesson not found" });

    // ✅ Remove from Cloudinary
    if (lesson.cloudinaryPublicId) {
      await cloudinary.uploader.destroy(
        lesson.cloudinaryPublicId,
        {
          resource_type: lesson.cloudinaryResourceType || "image",
        }
      );
    }

    await lesson.destroy();

    res.json({ message: "Lesson deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lesson delete failed" });
  }
};


