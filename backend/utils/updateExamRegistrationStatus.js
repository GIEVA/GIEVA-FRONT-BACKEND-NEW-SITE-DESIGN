import models from "../models/index.js";

import sendEmail from "./sendMail.js";

import {
  examStatusUpdateTemplate,
} from "./emailTemplates.js";

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

    if (
      status === "processing"
    ) {
      registration.processedAt =
        new Date();
    }

    if (
      status === "completed"
    ) {
      registration.completedAt =
        new Date();
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
        `Exam Registration Update`,

      message:
        `Your ${registration.examType} application is now ${status.replace(
          "_",
          " "
        )}.`,

      type:
        "exam_registration",

      entityId:
        registration.id,
    });

    await sendEmail(
      applicant.email,

      `${registration.examType} Registration Update`,

      examStatusUpdateTemplate(
        registration,
        status
      )
    );

    return registration;
  };