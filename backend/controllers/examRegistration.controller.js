// controllers/examRegistration.controller.js
import crypto from "crypto";
import models from "../models/index.js";
const {
  ExamRegistration,
  ActivityLog,
  ExamType,
} = models;

export const createRegistration = async (req, res) => {
  try {
    const userId = req.user.id;

    // Frontend sends `formData`, not `data` — this was the bug causing
    // your "Registration data is required" 400.
    const { examType, examTypeId, formData, priceVariant } = req.body;

    if (!examType) {
      return res.status(400).json({ message: "Exam type is required" });
    }

    if (!formData || typeof formData !== "object") {
      return res.status(400).json({ message: "Registration data is required" });
    }

    // ---------------- LOOK UP THE EXAM TYPE (source of truth for price + schema) ----------------
    const examTypeRecord = examTypeId
      ? await ExamType.findByPk(examTypeId)
      : await ExamType.findOne({ where: { examType } });

    if (!examTypeRecord || examTypeRecord.status !== "published") {
      return res.status(400).json({ message: "Invalid or unavailable exam type" });
    }

    // ---------------- RECOMPUTE AMOUNT SERVER-SIDE — never trust client's `amount` ----------------
    let amount;

    if (examTypeRecord.pricingType === "flat") {
      amount = Number(examTypeRecord.flatPrice);
    } else if (examTypeRecord.pricingType === "variants") {
      const variant = (examTypeRecord.priceVariants || []).find((v) => v.key === priceVariant);
      if (!variant) {
        return res.status(400).json({ message: "Please select a valid package/variant" });
      }
      amount = Number(variant.price);
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid exam amount configuration" });
    }

    // ---------------- VALIDATE REQUIRED FIELDS AGAINST THE ADMIN-DEFINED SCHEMA ----------------
    const missing = (examTypeRecord.fieldSchema || [])
      .filter((f) => f.required && !formData[f.key]?.toString().trim())
      .map((f) => f.label);

    if (missing.length > 0) {
      return res.status(400).json({
        message: `Missing required fields: ${missing.join(", ")}`,
      });
    }

    const registrationCode =
      `${examTypeRecord.examType}-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

    const registration = await ExamRegistration.create({
      userId,
      registrationCode,
      examType: examTypeRecord.examType,
      amount,
      status: "payment_pending",
      paymentStatus: "pending",
      data: formData, // stored in the `data` JSON column
    });

    await ActivityLog.create({
      userId,
      action: "EXAM_REGISTRATION_CREATED",
      meta: { registrationId: registration.id, examType: examTypeRecord.examType },
    });

    return res.status(201).json({
      message: "Registration created successfully",
      registration,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to create registration" });
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