import crypto from "crypto";
import models from "../models/index.js";
import { EXAM_PRICES } from "../config/examPrices.js";
const {
  ExamRegistration,
  ExamPayment,
  ActivityLog,
  User,
} = models;


export const createRegistration = async (
  req,
  res
) => {
  try {
    const userId = req.user.id;

    const {
      examType,
      data,
    } = req.body;

    if (!examType) {
      return res.status(400).json({
        message: "Exam type is required",
      });
    }

    if (
      !data ||
      typeof data !== "object"
    ) {
      return res.status(400).json({
        message:
          "Registration data is required",
      });
    }

    let amount;

    switch (examType) {
      case "SAT":
        amount = EXAM_PRICES.SAT;
        break;

      case "GRE":
        amount = EXAM_PRICES.GRE;
        break;

      case "IELTS":
        amount = EXAM_PRICES.IELTS;
        break;

      case "TOEFL":
        amount = EXAM_PRICES.TOEFL;
        break;

      case "ACT":
        amount =
          EXAM_PRICES.ACT[
            data?.examSpecific
              ?.package || "standard"
          ];
        break;

      case "SEVIS":
        amount =
          EXAM_PRICES.SEVIS[
            data?.sevisInfo
              ?.category || "F1"
          ];
        break;

      default:
        return res.status(400).json({
          message:
            "Invalid exam type",
        });
    }

    if (
      !amount ||
      Number(amount) <= 0
    ) {
      return res.status(400).json({
        message:
          "Invalid exam amount configuration",
      });
    }

    const registrationCode =
      `${examType}-${Date.now()}-${crypto
        .randomBytes(3)
        .toString("hex")
        .toUpperCase()}`;

    const registration =
      await ExamRegistration.create({
        userId,
        registrationCode,
        examType,
        amount,
        status: "payment_pending",
        paymentStatus: "pending",
        data,
      });

    await ActivityLog.create({
      userId,
      action:
        "EXAM_REGISTRATION_CREATED",
      meta: {
        registrationId:
          registration.id,
        examType,
      },
    });

    return res.status(201).json({
      message:
        "Registration created successfully",

      registration,
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message:
        "Failed to create registration",
    });
  }
};

export const getMyRegistrations =
  async (req, res) => {
    try {
      const userId = req.user.id;

      const page =
        Number(req.query.page) || 1;

      const limit =
        Number(req.query.limit) || 20;

      const offset =
        (page - 1) * limit;

      const {
        count,
        rows,
      } =
        await ExamRegistration.findAndCountAll(
          {
            where: {
              userId,
            },

            include: [
              {
                model: ExamPayment,
                as: "payments",
              },
            ],

            order: [
              ["createdAt", "DESC"],
            ],

            limit,
            offset,
          }
        );

      return res.json({
        total: count,

        page,

        totalPages:
          Math.ceil(count / limit),

        registrations: rows,
      });

    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message:
          "Failed to fetch registrations",
      });
    }
  };

  export const getRegistrationById =
  async (req, res) => {
    try {
      const { id } =
        req.params;

      const registration =
        await ExamRegistration.findByPk(
          id,
          {
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

              {
                model: User,
                as: "processor",
                attributes: [
                  "id",
                  "fullName",
                  "email",
                ],
                required: false,
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

      const isOwner =
        registration.userId ===
        req.user.id;

      const isAdmin = [
        "superadmin",
        "operational_admin",
      ].includes(req.user.role);

      if (!isOwner && !isAdmin) {
        return res.status(403).json({
          message: "Unauthorized",
        });
      }

      return res.json(
        registration
      );

    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message:
          "Failed to fetch registration",
      });
    }
  };

  export const deleteDraftRegistration =
  async (req, res) => {
    try {
      const { id } =
        req.params;

      const registration =
        await ExamRegistration.findByPk(
          id
        );

      if (!registration) {
        return res.status(404).json({
          message:
            "Registration not found",
        });
      }

      if (
        registration.userId !==
        req.user.id
      ) {
        return res.status(403).json({
          message: "Unauthorized",
        });
      }

      const allowedStatuses =
        [
          "draft",
          "payment_pending",
        ];

      if (
        !allowedStatuses.includes(
          registration.status
        )
      ) {
        return res.status(400).json({
          message:
            "Cannot delete submitted registration",
        });
      }

      await registration.destroy();

      await ActivityLog.create({
        userId:
          req.user.id,

        action:
          "EXAM_REGISTRATION_DELETED",

        meta: {
          registrationId: id,
          examType:
            registration.examType,
        },
      });

      return res.json({
        message:
          "Registration deleted successfully",
      });

    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message:
          "Failed to delete registration",
      });
    }
  };