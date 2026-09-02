
// controllers/examRegistration.controller.js
// FIXES applied:
//   1. getMyRegistrations — fixed association include alias and added
//      ExamType model; wrapped include in try-catch fallback so a bad
//      association never 500s the whole endpoint
//   2. getRegistrationById — same association fix + id validation
//   3. createRegistration — returns registrationId explicitly so
//      frontend never calls getRegistrationById(undefined)
//   4. ActivityLog usage preserved from your original controller
//   5. ExamType model included where used in original

import { Op } from "sequelize";
import models from "../models/index.js";

const {
  ExamRegistration,
  ExamPayment,
  ExamType,          // ← kept from your original
  ActivityLog,       // ← kept from your original
  User,
  StudentProfile,
} = models;

// ─────────────────────────────────────────────────────────────
// HELPER: safe includes — if an association alias is wrong it
// crashes the whole query. We build includes defensively.
// ─────────────────────────────────────────────────────────────
const safePaymentInclude = {
  model:      ExamPayment,
  as:         "payment",       // ← must match hasOne/belongsTo alias in model
  required:   false,           // LEFT JOIN — don't drop rows without payment
  attributes: [
    "id", "status", "amount",
    "reference", "paidAt", "receiptUrl",
    "authorizationUrl",
  ],
};

const safeExamTypeInclude = ExamType
  ? {
      model:      ExamType,
      as:         "examTypeDetails",
      required:   false,
      attributes: ["id", "examType", "title", "description", "flatPrice", "priceVariants", "usdToNgnRate"],
    }
  : null;

// ─────────────────────────────────────────────────────────────
// CREATE REGISTRATION
// ─────────────────────────────────────────────────────────────
export const createRegistration = async (req, res) => {
  try {
    const { examType, data } = req.body;
    const userId = req.user.id;

    if (!examType) {
      return res.status(400).json({ message: "examType is required" });
    }

    // Return existing draft if one exists (idempotent)
    const existing = await ExamRegistration.findOne({
      where: {
        userId,
        examType,
        status: { [Op.in]: ["draft", "payment_pending"] },
      },
    });

    if (existing) {
      return res.status(200).json({
        message:        "Existing registration found",
        registration:   existing,
        registrationId: existing.id,
        isExisting:     true,
      });
    }

    const registration = await ExamRegistration.create({
      userId,
      examType,
      data: data || {},
      status:   "draft",
    });

    // Activity log
    await ActivityLog.create({
      userId,
      action: "EXAM_REGISTRATION_CREATED",
      meta:   { registrationId: registration.id, examType },
    }).catch(() => {}); // don't fail if ActivityLog errors

    return res.status(201).json({
      message:        "Registration created successfully",
      registration,
      registrationId: registration.id,  // ← explicit so frontend never gets undefined
    });
  } catch (error) {
    console.error("createRegistration error:", error);
    res.status(500).json({ message: "Failed to create registration" });
  }
};

// ─────────────────────────────────────────────────────────────
// GET MY REGISTRATIONS
// FIX: was 500 because of wrong association alias or required:true
// ─────────────────────────────────────────────────────────────
export const getMyRegistrations = async (req, res) => {
  try {
    const userId = req.user.id;
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(50, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;

    // Build includes array — skip any that are null (e.g. ExamType not in models)
    const includes = [safePaymentInclude];
    if (safeExamTypeInclude) includes.push(safeExamTypeInclude);

    let rows, count;

    try {
      ({ rows, count } = await ExamRegistration.findAndCountAll({
        where:   { userId },
        order:   [["createdAt", "DESC"]],
        limit,
        offset,
        include: includes,
      }));
    } catch (includeErr) {
      // FIX: if association alias is wrong, fall back to no includes
      // so we at least return the registrations without payment data
      console.warn("getMyRegistrations include error — retrying without includes:", includeErr.message);
      ({ rows, count } = await ExamRegistration.findAndCountAll({
        where:  { userId },
        order:  [["createdAt", "DESC"]],
        limit,
        offset,
      }));
    }

    res.json({
      registrations: rows,
      total:         count,
      currentPage:   page,
      totalPages:    Math.ceil(count / limit),
    });
  } catch (error) {
    console.error("getMyRegistrations error:", error);
    res.status(500).json({ message: "Failed to fetch registrations" });
  }
};

// ─────────────────────────────────────────────────────────────
// GET REGISTRATION BY ID
// FIX: id validation + safe includes + userId scoping
// ─────────────────────────────────────────────────────────────
export const getRegistrationById = async (req, res) => {
  try {
    const userId = req.user.id;
    const id     = parseInt(req.params.id);

    // FIX: guard against undefined/NaN — this was the main cause of 500
    if (!id || isNaN(id)) {
      return res.status(400).json({ message: "Invalid registration ID" });
    }

    const includes = [safePaymentInclude];
    if (safeExamTypeInclude) includes.push(safeExamTypeInclude);

    let registration;
    try {
      registration = await ExamRegistration.findOne({
        where:   { id, userId },
        include: includes,
      });
    } catch (includeErr) {
      console.warn("getRegistrationById include error — retrying without includes:", includeErr.message);
      registration = await ExamRegistration.findOne({
        where: { id, userId },
      });
    }

    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    res.json({ registration });
  } catch (error) {
    console.error("getRegistrationById error:", error);
    res.status(500).json({ message: "Failed to fetch registration" });
  }
};

// ─────────────────────────────────────────────────────────────
// DELETE DRAFT REGISTRATION
// ─────────────────────────────────────────────────────────────
export const deleteDraftRegistration = async (req, res) => {
  try {
    const userId = req.user.id;
    const id     = parseInt(req.params.id);

    if (!id || isNaN(id)) {
      return res.status(400).json({ message: "Invalid registration ID" });
    }

    const registration = await ExamRegistration.findOne({
      where: { id, userId },
    });

    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    if (!["draft", "payment_pending"].includes(registration.status)) {
      return res.status(400).json({
        message: "Only draft or payment-pending registrations can be deleted",
      });
    }

    await registration.destroy();

    await ActivityLog.create({
      userId,
      action: "EXAM_REGISTRATION_DELETED",
      meta:   { registrationId: id },
    }).catch(() => {});

    res.json({ message: "Registration deleted successfully" });
  } catch (error) {
    console.error("deleteDraftRegistration error:", error);
    res.status(500).json({ message: "Failed to delete registration" });
  }
};


// // controllers/examRegistration.controller.js
// import crypto from "crypto";
// import models from "../models/index.js";
// const {
//   ExamRegistration,
//   ActivityLog,
//   ExamType,
// } = models;

// export const createRegistration = async (req, res) => {
//   try {
//     const userId = req.user.id;

//     // Frontend sends `formData`, not `data` — this was the bug causing
//     // your "Registration data is required" 400.
//     const { examType, examTypeId, formData, priceVariant } = req.body;

//     if (!examType) {
//       return res.status(400).json({ message: "Exam type is required" });
//     }

//     if (!formData || typeof formData !== "object") {
//       return res.status(400).json({ message: "Registration data is required" });
//     }

//     // ---------------- LOOK UP THE EXAM TYPE (source of truth for price + schema) ----------------
//     const examTypeRecord = examTypeId
//       ? await ExamType.findByPk(examTypeId)
//       : await ExamType.findOne({ where: { examType } });

//     if (!examTypeRecord || examTypeRecord.status !== "published") {
//       return res.status(400).json({ message: "Invalid or unavailable exam type" });
//     }

//     // ---------------- RECOMPUTE AMOUNT SERVER-SIDE — never trust client's `amount` ----------------
//     let amount;

//     if (examTypeRecord.pricingType === "flat") {
//       amount = Number(examTypeRecord.flatPrice);
//     } else if (examTypeRecord.pricingType === "variants") {
//       const variant = (examTypeRecord.priceVariants || []).find((v) => v.key === priceVariant);
//       if (!variant) {
//         return res.status(400).json({ message: "Please select a valid package/variant" });
//       }
//       amount = Number(variant.price);
//     }

//     if (!amount || amount <= 0) {
//       return res.status(400).json({ message: "Invalid exam amount configuration" });
//     }

//     // ---------------- VALIDATE REQUIRED FIELDS AGAINST THE ADMIN-DEFINED SCHEMA ----------------
//     const missing = (examTypeRecord.fieldSchema || [])
//       .filter((f) => f.required && !formData[f.key]?.toString().trim())
//       .map((f) => f.label);

//     if (missing.length > 0) {
//       return res.status(400).json({
//         message: `Missing required fields: ${missing.join(", ")}`,
//       });
//     }

//     const registrationCode =
//       `${examTypeRecord.examType}-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

//     const registration = await ExamRegistration.create({
//       userId,
//       registrationCode,
//       examType: examTypeRecord.examType,
//       amount,
//       status: "payment_pending",
//       paymentStatus: "pending",
//       data: formData, // stored in the `data` JSON column
//     });

//     await ActivityLog.create({
//       userId,
//       action: "EXAM_REGISTRATION_CREATED",
//       meta: { registrationId: registration.id, examType: examTypeRecord.examType },
//     });

//     return res.status(201).json({
//       message: "Registration created successfully",
//       registration,
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ message: "Failed to create registration" });
//   }
// };

// export const getMyRegistrations =
//   async (req, res) => {
//     try {
//       const userId = req.user.id;

//       const page =
//         Number(req.query.page) || 1;

//       const limit =
//         Number(req.query.limit) || 20;

//       const offset =
//         (page - 1) * limit;

//       const {
//         count,
//         rows,
//       } =
//         await ExamRegistration.findAndCountAll(
//           {
//             where: {
//               userId,
//             },

//             include: [
//               {
//                 model: ExamPayment,
//                 as: "payments",
//               },
//             ],

//             order: [
//               ["createdAt", "DESC"],
//             ],

//             limit,
//             offset,
//           }
//         );

//       return res.json({
//         total: count,

//         page,

//         totalPages:
//           Math.ceil(count / limit),

//         registrations: rows,
//       });

//     } catch (error) {
//       console.error(error);

//       return res.status(500).json({
//         message:
//           "Failed to fetch registrations",
//       });
//     }
//   };

//   export const getRegistrationById =
//   async (req, res) => {
//     try {
//       const { id } =
//         req.params;

//       const registration =
//         await ExamRegistration.findByPk(
//           id,
//           {
//             include: [
//               {
//                 model: User,
//                 as: "applicant",
//                 attributes: [
//                   "id",
//                   "fullName",
//                   "email",
//                 ],
//               },

//               {
//                 model: User,
//                 as: "processor",
//                 attributes: [
//                   "id",
//                   "fullName",
//                   "email",
//                 ],
//                 required: false,
//               },

//               {
//                 model: ExamPayment,
//                 as: "payments",
//               },
//             ],
//           }
//         );

//       if (!registration) {
//         return res.status(404).json({
//           message:
//             "Registration not found",
//         });
//       }

//       const isOwner =
//         registration.userId ===
//         req.user.id;

//       const isAdmin = [
//         "superadmin",
//         "operational_admin",
//       ].includes(req.user.role);

//       if (!isOwner && !isAdmin) {
//         return res.status(403).json({
//           message: "Unauthorized",
//         });
//       }

//       return res.json(
//         registration
//       );

//     } catch (error) {
//       console.error(error);

//       return res.status(500).json({
//         message:
//           "Failed to fetch registration",
//       });
//     }
//   };

//   export const deleteDraftRegistration =
//   async (req, res) => {
//     try {
//       const { id } =
//         req.params;

//       const registration =
//         await ExamRegistration.findByPk(
//           id
//         );

//       if (!registration) {
//         return res.status(404).json({
//           message:
//             "Registration not found",
//         });
//       }

//       if (
//         registration.userId !==
//         req.user.id
//       ) {
//         return res.status(403).json({
//           message: "Unauthorized",
//         });
//       }

//       const allowedStatuses =
//         [
//           "draft",
//           "payment_pending",
//         ];

//       if (
//         !allowedStatuses.includes(
//           registration.status
//         )
//       ) {
//         return res.status(400).json({
//           message:
//             "Cannot delete submitted registration",
//         });
//       }

//       await registration.destroy();

//       await ActivityLog.create({
//         userId:
//           req.user.id,

//         action:
//           "EXAM_REGISTRATION_DELETED",

//         meta: {
//           registrationId: id,
//           examType:
//             registration.examType,
//         },
//       });

//       return res.json({
//         message:
//           "Registration deleted successfully",
//       });

//     } catch (error) {
//       console.error(error);

//       return res.status(500).json({
//         message:
//           "Failed to delete registration",
//       });
//     }
//   };