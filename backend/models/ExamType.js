// models/ExamType.js
//
// Replaces the static examCatalogData.js + examPrices.js files.
// Admins create/edit/publish ExamType records from the dashboard.
// Students read published ones from the public catalog API.

import { DataTypes } from "sequelize";

export default (sequelize) => {
  const ExamType = sequelize.define(
    "ExamType",
    {
      id: {
        type:          DataTypes.INTEGER,
        primaryKey:    true,
        autoIncrement: true,
      },

      // e.g. "SAT", "IELTS", "ACT" — used as a stable identifier
      // for routing and the existing ExamRegistration.examType enum.
      examType: {
        type:      DataTypes.STRING(50),
        allowNull: false,
        unique:    true,
      },

      title: {
        type:      DataTypes.STRING(100),
        allowNull: false,
      },

      description: {
        type:      DataTypes.TEXT,
        allowNull: false,
      },

      imageUrl: {
        type:         DataTypes.STRING,
        defaultValue: "",
      },

      usdToNgnRate: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 1600, // sensible starting point, admin will edit
      },

      // ── Pricing ────────────────────────────────────────────────
      // pricingType "flat"     → use flatPrice
      // pricingType "variants" → use priceVariants array
      //
      // priceVariants example (ACT):
      // [
      //   { key: "standard",      label: "Standard",         price: 197000 },
      //   { key: "science",       label: "With Science",     price: 207000 },
      //   { key: "writing",       label: "With Writing",     price: 222000 },
      //   { key: "scienceWriting",label: "Science + Writing", price: 232000 }
      // ]
      //
      // priceVariants example (SEVIS):
      // [
      //   { key: "F1", label: "F1 Visa", price: 400000 },
      //   { key: "J1", label: "J1 Visa", price: 270000 }
      // ]
      pricingType: {
        type:         DataTypes.ENUM("flat", "variants"),
        defaultValue: "flat",
      },

      flatPrice: {
        type:         DataTypes.DECIMAL(12, 2),
        defaultValue: 0,
      },

      priceVariants: {
        type:         DataTypes.JSON,
        defaultValue: [],
        // Array of { key, label, price }
      },

      // ── Dynamic field schema ────────────────────────────────────
      // Defines what the registration form renders for this exam.
      // Each element:
      // {
      //   key:         string  — field identifier, maps to ExamRegistration.formData
      //   label:       string  — display label
      //   type:        "text" | "email" | "tel" | "date" | "select" |
      //                "number" | "textarea" | "file"
      //   required:    boolean
      //   options:     string[]  — only for type="select"
      //   placeholder: string   — optional
      //   helperText:  string   — optional hint below the field
      //   section:     string   — optional grouping label
      // }
      //
      // Example (SAT):
      // [
      //   { key: "firstName",   label: "First Name",          type: "text",   required: true, section: "Personal Information" },
      //   { key: "lastName",    label: "Last Name",           type: "text",   required: true, section: "Personal Information" },
      //   { key: "dateOfBirth", label: "Date of Birth",       type: "date",   required: true, section: "Personal Information" },
      //   { key: "testDate",    label: "Preferred Test Date", type: "date",   required: true, section: "Exam Details" },
      //   { key: "testCenter",  label: "Preferred Test Center",type:"text",  required: true, section: "Exam Details" },
      //   { key: "passport",    label: "Passport / ID Upload", type: "file",  required: true, section: "Documents" }
      // ]
      fieldSchema: {
        type:         DataTypes.JSON,
        defaultValue: [],
      },

      // ── Lifecycle ──────────────────────────────────────────────
      // Only published exams appear in the student-facing catalog.
      // Admins can draft, edit, then publish when ready.
      status: {
        type:         DataTypes.ENUM("draft", "published", "archived"),
        defaultValue: "draft",
      },

      // Display order on the catalog page (lower = first)
      sortOrder: {
        type:         DataTypes.INTEGER,
        defaultValue: 0,
      },

      createdBy: {
        type:      DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      tableName:  "exam_types",
      timestamps: true,
    }
  );

  ExamType.associate = (models) => {
    ExamType.belongsTo(models.User, {
      foreignKey: "createdBy",
      as:         "creator",
    });
    // ExamType.hasMany(models.ExamRegistration, {
    //   foreignKey: "examTypeId",
    // });
  };

  return ExamType;
};
