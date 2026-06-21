import models from "../models/index.js";

import sendEmail from "../utils/sendMail.js";

import {
  examStatusUpdateTemplate,
} from "../utils/emailTemplates.js";

const {
  ActivityLog,
  Notification,
} = models;

export const updateExamRegistrationStatus =
  async ({
    registration,
    applicant,
    status,
    processorId,
    adminNotes = null,
    rejectionReason = null,
  }) => {

    registration.status = status;

    registration.processedBy =
      processorId;

    if (adminNotes) {
      registration.adminNotes =
        adminNotes;
    }

    if (rejectionReason) {
      registration.rejectionReason =
        rejectionReason;
    }

    switch (status) {
      case "under_review":
        registration.processedAt =
          new Date();
        break;

      case "processing":
        registration.processedAt =
          new Date();
        break;

      case "completed":
        registration.completedAt =
          new Date();
        break;

      default:
        break;
    }

    await registration.save();

    await ActivityLog.create({
      userId:
        registration.userId,

      action:
        `EXAM_${status.toUpperCase()}`,

      meta: {
        registrationId:
          registration.id,

        registrationCode:
          registration.registrationCode,

        examType:
          registration.examType,

        status,
      },
    });

    await Notification.create({
      userId:
        registration.userId,

      title:
        "Application Status Updated",

      message:
        `Your ${registration.examType} application is now ${status.replace(
          "_",
          " "
        )}`,

      type:
        "exam_registration",

      entityId:
        registration.id,
    });

    await sendEmail(
      applicant.email,
      `${registration.examType} Application Update`,
      examStatusUpdateTemplate(
        registration,
        status
      )
    );

    return registration;
  };