// controllers/examTypeController.js
//
// Public:
//   GET  /api/exam-types            → list published exams (student catalog)
//   GET  /api/exam-types/:examType  → single exam detail + field schema
//
// Admin only:
//   GET    /api/admin/exam-types           → list all (including draft/archived)
//   POST   /api/admin/exam-types           → create
//   PUT    /api/admin/exam-types/:id       → update
//   PATCH  /api/admin/exam-types/:id/status → publish / archive / revert to draft
//   DELETE /api/admin/exam-types/:id       → delete (only drafts)

import models from "../models/index.js";
const { ExamType, User, ExamRegistration } = models;

const ADMIN_ROLES = ["admin", "superadmin", "operational_admin"];

// ── PUBLIC ─────────────────────────────────────────────────────

// GET /api/exam-types
// Returns only published exams for the student catalog page.
// No auth required — the catalog is visible to anyone.
export const listPublishedExams = async (req, res) => {
  try {
    const exams = await ExamType.findAll({
      where:      { status: "published" },
      attributes: [
        "id", "examType", "title", "description", "imageUrl",
        "pricingType", "flatPrice", "priceVariants", "sortOrder",
      ],
      order: [["sortOrder", "ASC"], ["title", "ASC"]],
    });
    res.json({ exams });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch exam catalog" });
  }
};

// GET /api/exam-types/:examType
// Returns the full exam definition including fieldSchema.
// Used by the dynamic registration form page.
export const getExamTypeBySlug = async (req, res) => {
  try {
    const exam = await ExamType.findOne({
      where:      { examType: req.params.examType, status: "published" },
      attributes: [
        "id", "examType", "title", "description", "imageUrl",
        "pricingType", "flatPrice", "priceVariants", "fieldSchema",
      ],
    });
    if (!exam) return res.status(404).json({ message: "Exam not found or not available" });
    res.json({ exam });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch exam details" });
  }
};

// ── ADMIN ──────────────────────────────────────────────────────

// GET /api/admin/exam-types
// Returns all exams (draft + published + archived) for admin dashboard.
export const adminListExams = async (req, res) => {
  try {
    if (!ADMIN_ROLES.includes(req.user.role))
      return res.status(403).json({ message: "Unauthorized" });

    const exams = await ExamType.findAll({
      include: [{ model: User, as: "creator", attributes: ["id", "fullName"] }],
      order:   [["sortOrder", "ASC"], ["createdAt", "DESC"]],
    });

    res.json({ exams });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch exams" });
  }
};

// POST /api/admin/exam-types
export const adminCreateExam = async (req, res) => {
  try {
    if (!ADMIN_ROLES.includes(req.user.role))
      return res.status(403).json({ message: "Unauthorized" });

    const {
      examType, title, description, imageUrl,
      pricingType, flatPrice, priceVariants,
      fieldSchema, sortOrder,
    } = req.body;

    if (!examType || !title || !description)
      return res.status(400).json({ message: "examType, title, and description are required" });

    // Validate no duplicate
    const existing = await ExamType.findOne({ where: { examType } });
    if (existing)
      return res.status(409).json({ message: `An exam with type "${examType}" already exists` });

    // Basic fieldSchema validation — each field must have key, label, type
    const schema = fieldSchema || [];
    for (const field of schema) {
      if (!field.key || !field.label || !field.type)
        return res.status(400).json({
          message: `Field schema error: every field needs "key", "label", and "type". Check field: ${JSON.stringify(field)}`,
        });
    }

    const exam = await ExamType.create({
      examType:      examType.trim().toUpperCase(),
      title:         title.trim(),
      description:   description.trim(),
      imageUrl:      imageUrl || "",
      pricingType:   pricingType || "flat",
      flatPrice:     flatPrice   || 0,
      priceVariants: priceVariants || [],
      fieldSchema:   schema,
      sortOrder:     sortOrder || 0,
      status:        "draft",
      createdBy:     req.user.id,
    });

    res.status(201).json({ message: "Exam created as draft", exam });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create exam" });
  }
};

// PUT /api/admin/exam-types/:id
export const adminUpdateExam = async (req, res) => {
  try {
    if (!ADMIN_ROLES.includes(req.user.role))
      return res.status(403).json({ message: "Unauthorized" });

    const exam = await ExamType.findByPk(req.params.id);
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    const {
      title, description, imageUrl,
      pricingType, flatPrice, priceVariants,
      fieldSchema, sortOrder,
    } = req.body;

    if (fieldSchema) {
      for (const field of fieldSchema) {
        if (!field.key || !field.label || !field.type)
          return res.status(400).json({
            message: `Field schema error: every field needs "key", "label", and "type".`,
          });
      }
    }

    await exam.update({
      ...(title         !== undefined && { title:         title.trim() }),
      ...(description   !== undefined && { description:   description.trim() }),
      ...(imageUrl      !== undefined && { imageUrl }),
      ...(pricingType   !== undefined && { pricingType }),
      ...(flatPrice     !== undefined && { flatPrice }),
      ...(priceVariants !== undefined && { priceVariants }),
      ...(fieldSchema   !== undefined && { fieldSchema }),
      ...(sortOrder     !== undefined && { sortOrder }),
    });

    res.json({ message: "Exam updated", exam });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update exam" });
  }
};

// PATCH /api/admin/exam-types/:id/status
// { status: "published" | "draft" | "archived" }
export const adminSetExamStatus = async (req, res) => {
  try {
    if (!ADMIN_ROLES.includes(req.user.role))
      return res.status(403).json({ message: "Unauthorized" });

    const exam = await ExamType.findByPk(req.params.id);
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    const { status } = req.body;
    if (!["draft", "published", "archived"].includes(status))
      return res.status(400).json({ message: "Status must be draft, published, or archived" });

    // Guard: can't publish an exam with no field schema
    if (status === "published" && (!exam.fieldSchema || exam.fieldSchema.length === 0))
      return res.status(400).json({
        message: "Cannot publish an exam with no field schema. Add at least one form field first.",
      });

    exam.status = status;
    await exam.save();

    res.json({ message: `Exam ${status}`, exam });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update exam status" });
  }
};

// DELETE /api/admin/exam-types/:id
// Only allows deleting drafts with no registrations.
export const adminDeleteExam = async (req, res) => {
  try {
    if (!ADMIN_ROLES.includes(req.user.role))
      return res.status(403).json({ message: "Unauthorized" });

    const exam = await ExamType.findByPk(req.params.id);
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    if (exam.status === "published") {
      const count = await ExamRegistration.count({ where: { examType: exam.examType } });
      if (count > 0)
        return res.status(409).json({
          message: `Cannot delete — ${count} registration(s) exist for this exam. Archive it instead.`,
        });
    }

    await exam.destroy();
    res.json({ message: "Exam deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete exam" });
  }
};