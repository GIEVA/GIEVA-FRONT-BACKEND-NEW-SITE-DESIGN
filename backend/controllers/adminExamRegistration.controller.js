import models from "../models/index.js";
import sendEmail from "../utils/sendMail.js";
import ExcelJS from "exceljs";
import { generateReceiptPDF } from "../utils/generateReceipt.js";

import {
  examStatusUpdateTemplate,
} from "../utils/emailTemplates.js";

import {
  updateExamRegistrationStatus,
} from "../service/examRegistration.service.js";


const {
  ExamRegistration,
  ExamPayment,
  ActivityLog,
  User,
  Notification,
  ExamRegistrationComment
} = models;

export const getRegistrations = async (
  req,
  res
) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      examType,
      paymentStatus,
      search,
    } = req.query;

    const where = {};

    if (status)
      where.status = status;

    if (examType)
      where.examType = examType;

    if (paymentStatus)
      where.paymentStatus =
        paymentStatus;

    const { count, rows } =
      await ExamRegistration.findAndCountAll({
        where,

        include: [
          {
            model: User,
            as: "applicant",
            attributes: [
              "id",
              "fullName",
              "email",
            ],
          },
        ],

        order: [
          ["createdAt", "DESC"],
        ],

        limit: Number(limit),

        offset:
          (page - 1) *
          Number(limit),
      });

    return res.json({
      total: count,
      page: Number(page),
      totalPages:
        Math.ceil(
          count / limit
        ),
      registrations: rows,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      message:
        "Failed to fetch registrations",
    });
  }
};

export const adminGetRegistration =
  async (req, res) => {
    try {
      const registration =
        await ExamRegistration.findByPk(
          req.params.id,
          {
            include: [
              {
                model: User,
                as: "applicant",
              },

              {
                model: User,
                as: "processor",
              },

              {
                model: ExamPayment,
                as: "payments",
              },
            ],
          }
        );

      if (!registration) {
        return res.status(404).json({
          message:
            "Registration not found",
        });
      }

      return res.json(
        registration
      );
    } catch (err) {
      console.error(err);

      return res.status(500).json({
        message:
          "Failed to fetch registration",
      });
    }
  };

  export const assignRegistration =
  async (req, res) => {

    const registration =
      await ExamRegistration.findByPk(
        req.params.id
      );

    if (!registration) {
      return res.status(404).json({
        message:
          "Registration not found",
      });
    }

    registration.processedBy =
      req.user.id;

    await registration.save();

    return res.json({
      message:
        "Registration assigned",
    });
  };


  export const updateAdminNotes =
  async (req, res) => {

    const { adminNotes } =
      req.body;

    const registration =
      await ExamRegistration.findByPk(
        req.params.id
      );

    if (!registration) {
      return res.status(404).json({
        message:
          "Registration not found",
      });
    }

    registration.adminNotes =
      adminNotes;

    registration.processedBy =
      req.user.id;

    await registration.save();

    return res.json({
      message:
        "Notes updated",
    });
  };

  export const deleteRegistration =
  async (req, res) => {

    const registration =
      await ExamRegistration.findByPk(
        req.params.id
      );

    if (!registration) {
      return res.status(404).json({
        message:
          "Registration not found",
      });
    }

    await registration.destroy();

    return res.json({
      message:
        "Registration deleted",
    });
  };

 export const getExamRegistrationStats =
  async (req, res) => {
    try {
      const total =
        await ExamRegistration.count();

      const submitted =
        await ExamRegistration.count({
          where: {
            status: "submitted",
          },
        });

      const underReview =
        await ExamRegistration.count({
          where: {
            status: "under_review",
          },
        });

      const processing =
        await ExamRegistration.count({
          where: {
            status: "processing",
          },
        });

      const completed =
        await ExamRegistration.count({
          where: {
            status: "completed",
          },
        });

      const rejected =
        await ExamRegistration.count({
          where: {
            status: "rejected",
          },
        });

      const successfulPayments =
        await ExamPayment.count({
          where: {
            status: "success",
          },
        });

      const pendingPayment =
        await ExamRegistration.count({
          where: {
            paymentStatus:
              "pending",
          },
        });

      const totalRevenue =
        await ExamPayment.sum(
          "amount",
          {
            where: {
              status:
                "success",
            },
          }
        );

      const examBreakdown =
        await ExamRegistration.findAll(
          {
            attributes: [
              "examType",
              [
                models.sequelize.fn(
                  "COUNT",
                  models.sequelize.col(
                    "id"
                  )
                ),
                "count",
              ],
            ],

            group: [
              "examType",
            ],

            raw: true,
          }
        );

      return res.json({
        totalRegistrations:
          total,

        totalRevenue:
          totalRevenue || 0,

        successfulPayments,

        submitted,

        underReview,

        processing,

        completed,

        rejected,

        pendingPayment,

        examBreakdown,
      });

    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message:
          "Failed to fetch stats",
      });
    }
  };



export const exportRegistrations =
  async (req, res) => {
    try {
      const registrations =
        await ExamRegistration.findAll({
          include: [
            {
              model: User,
              as: "applicant",
            },
          ],
          order: [
            ["createdAt", "DESC"],
          ],
        });

      const workbook =
        new ExcelJS.Workbook();

      const worksheet =
        workbook.addWorksheet(
          "Exam Registrations"
        );

      worksheet.columns = [
        {
          header:
            "Registration Code",
          key:
            "registrationCode",
          width: 25,
        },
        {
          header:
            "Applicant Name",
          key: "applicant",
          width: 30,
        },
        {
          header: "Email",
          key: "email",
          width: 35,
        },
        {
          header:
            "Exam Type",
          key: "examType",
          width: 20,
        },
        {
          header: "Amount",
          key: "amount",
          width: 15,
        },
        {
          header: "Status",
          key: "status",
          width: 20,
        },
        {
          header:
            "Payment Status",
          key:
            "paymentStatus",
          width: 20,
        },
        {
          header:
            "Submitted At",
          key:
            "submittedAt",
          width: 25,
        },
      ];

      registrations.forEach(
        (registration) => {
          worksheet.addRow({
            registrationCode:
              registration.registrationCode,

            applicant:
              registration.applicant
                ?.fullName || "",

            email:
              registration.applicant
                ?.email || "",

            examType:
              registration.examType,

            amount:
              registration.amount,

            status:
              registration.status,

            paymentStatus:
              registration.paymentStatus,

            submittedAt:
              registration.submittedAt
                ? new Date(
                    registration.submittedAt
                  ).toLocaleString()
                : "",
          });
        }
      );

      // Header styling
      worksheet.getRow(1).eachCell(
        (cell) => {
          cell.font = {
            bold: true,
            color: {
              argb:
                "FFFFFFFF",
            },
          };

          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: {
              argb:
                "1F4E78",
            },
          };

          cell.alignment = {
            vertical:
              "middle",
            horizontal:
              "center",
          };
        }
      );

      // Currency formatting
      worksheet
        .getColumn("amount")
        .numFmt =
        '₦#,##0.00';

      // Borders
      worksheet.eachRow(
        (row) => {
          row.eachCell(
            (cell) => {
              cell.border = {
                top: {
                  style:
                    "thin",
                },
                left: {
                  style:
                    "thin",
                },
                bottom: {
                  style:
                    "thin",
                },
                right: {
                  style:
                    "thin",
                },
              };
            }
          );
        }
      );

      const fileName = `exam-registrations-${Date.now()}.xlsx`;

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );

      res.setHeader(
        "Content-Disposition",
        `attachment; filename=${fileName}`
      );

      await workbook.xlsx.write(
        res
      );

      res.end();
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message:
          "Export failed",
      });
    }
  };

  export const getExamPayments =
  async (req, res) => {
    try {
      const payments =
        await ExamPayment.findAll({
          include: [
            {
              model: User,
              attributes: [
                "id",
                "fullName",
                "email",
              ],
            },

            {
              model:
                ExamRegistration,
                 attributes: [
                        "id",
                        "examType",
                        "registrationCode",
                        ],
            },
          ],

          order: [
            ["createdAt", "DESC"],
          ],
        });

      res.json(payments);

    } catch (error) {
      console.error(error);

      res.status(500).json({
        message:
          "Failed to fetch payments",
      });
    }
  };

  export const getExamPaymentById =
  async (req, res) => {
    try {
      const payment =
  await ExamPayment.findByPk(
    req.params.id,
    {
      include: [
        {
          model: User,
          attributes: [
            "id",
            "fullName",
            "email",
          ],
        },
        {
          model:
            ExamRegistration,
          attributes: [
            "id",
            "registrationCode",
            "examType",
            "status",
            "paymentStatus",
          ],
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

    } catch (error) {
      console.error(error);

      res.status(500).json({
        message:
          "Failed to fetch payment",
      });
    }
  };

  export const resendRegistrationEmail =
  async (req, res) => {

    try {
      const registration =
        await ExamRegistration.findByPk(
          req.params.id,
          {
            include: [
              {
                model: User,
                as: "applicant",
              },
            ],
          }
        );

      if (!registration) {
        return res.status(404).json({
          message:
            "Registration not found",
        });
      }

      await sendEmail(
        registration.applicant.email,

        `${registration.examType} Registration Update`,

        examStatusUpdateTemplate(
          registration,
          registration.status
        )
      );

      res.json({
        message:
          "Email resent successfully",
      });

    } catch (error) {
      console.error(error);

      res.status(500).json({
        message:
          "Failed to resend email",
      });
    }
  };



export const addComment =
  async (req, res) => {

    try {
      const { comment } =
        req.body;

      const registration =
        await ExamRegistration.findByPk(
          req.params.id
        );

      if (!registration) {
        return res.status(404).json({
          message:
            "Registration not found",
        });
      }

      const newComment =
        await ExamRegistrationComment.create(
          {
            registrationId:
              registration.id,

            userId:
              req.user.id,

            comment,
          }
        );

      res.status(201).json(
        newComment
      );

    } catch (error) {
      console.error(error);

      res.status(500).json({
        message:
          "Failed to add comment",
      });
    }
  };


  export const updateRegistrationStatusController =
  async (req, res) => {

    try {

      const { id } =
        req.params;

      const {
        status,
        adminNotes,
        rejectionReason,
      } = req.body;

      const allowedStatuses = [
        "under_review",
        "processing",
        "completed",
        "rejected",
        "cancelled",
      ];

      if (
        !allowedStatuses.includes(
          status
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid status",
        });
      }

      const registration =
        await ExamRegistration.findByPk(
          id,
          {
            include: [
              {
                model: User,
                as: "applicant",
              },
            ],
          }
        );

      if (!registration) {
        return res.status(404).json({
          message:
            "Registration not found",
        });
      }

      await updateExamRegistrationStatus({
        registration,

        applicant:
          registration.applicant,

        status,

        processorId:
          req.user.id,

        adminNotes,

        rejectionReason,
      });

      return res.json({
        message:
          "Registration updated successfully",

        registration,
      });

    } catch (error) {

      console.error(error);

      return res.status(500).json({
        message:
          "Failed to update registration",
      });
    }
  };




export const adminDownloadExamReceipt =
  async (req, res) => {
    try {
      const { id } = req.params;

      const payment =
        await ExamPayment.findByPk(id, {
          include: [
            {
              model: User,
              attributes: [
                "id",
                "fullName",
                "email",
              ],
            },
            {
              model: ExamRegistration,
              attributes: [
                "id",
                "registrationCode",
                "examType",
                "status",
              ],
            },
          ],
        });

      if (!payment) {
        return res.status(404).json({
          message: "Payment not found",
        });
      }

      const pdfBuffer =
        await generateReceiptPDF({
          fullName:
            payment.User?.fullName,

          email:
            payment.User?.email,

          examType:
            payment.ExamRegistration
              ?.examType,

          registrationCode:
            payment.ExamRegistration
              ?.registrationCode,

          amount:
            payment.amount,

          currency:
            payment.currency,

          reference:
            payment.transactionRef,

          paymentMethod:
            payment.paymentMethod,

          date:
            payment.paidAt
              ? new Date(
                  payment.paidAt
                ).toLocaleString()
              : new Date(
                  payment.createdAt
                ).toLocaleString(),
        });

      res.setHeader(
        "Content-Type",
        "application/pdf"
      );

      res.setHeader(
        "Content-Disposition",
        `attachment; filename=exam-receipt-${payment.id}.pdf`
      );

      return res.send(pdfBuffer);

    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message:
          "Failed to generate receipt",
      });
    }
  };