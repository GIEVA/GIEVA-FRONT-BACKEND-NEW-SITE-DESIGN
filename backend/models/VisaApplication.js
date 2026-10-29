// models/VisaApplication.js
// One visa application. Lifecycle:
//   draft → submitted (ONLY after a verified payment) → under_review → ...admin-driven... → approved | rejected | completed
// Repeating groups (travel, schools, references, ...) are JSON: they are always read/written as a
// whole with the application. (MySQL JSON columns cannot have a DB default, so the defaults
// are applied in the beforeValidate hook below.)

export const VISA_STATUSES = [
  "draft",
  "submitted",
  "under_review",
  "info_required",
  "interview_scheduled",
  "approved",
  "rejected",
  "completed",
  "cancelled",
];

const arr = () => [];
const obj = () => ({});
const JSON_DEFAULTS = {
  travelHistory: arr, tripSponsor: obj, educationSponsor: obj, currentJob: obj, previousJob: obj, father: obj, mother: obj,
  schools: arr, awards: arr, volunteer: arr, usRelatives: arr, social: obj, references: arr, documents: obj,
};

export default (sequelize, DataTypes) => {
  const VisaApplication = sequelize.define(
    "VisaApplication",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      userId: { type: DataTypes.INTEGER, allowNull: false },
      applicationCode: { type: DataTypes.STRING(32), allowNull: true, unique: true },

      status: {
        type: DataTypes.STRING(24),
        allowNull: false,
        defaultValue: "draft",
        validate: { isIn: [VISA_STATUSES] },
      },

      // ── Appointment ──
      interviewLocation: { type: DataTypes.STRING(12), allowNull: true, validate: { isIn: [["abuja", "lagos"]] } },
      appointmentType: { type: DataTypes.STRING(12), allowNull: false, defaultValue: "normal", validate: { isIn: [["normal", "expedited"]] } },

      // ── Bio-data (as on the international passport) ──
      firstName: { type: DataTypes.STRING(80), allowNull: true },
      middleName: { type: DataTypes.STRING(80), allowNull: true },
      lastName: { type: DataTypes.STRING(80), allowNull: true },
      gender: { type: DataTypes.STRING(10), allowNull: true, validate: { isIn: [["male", "female"]] } },
      dateOfBirth: { type: DataTypes.DATEONLY, allowNull: true },

      // ── Identifying details ──
      phone: { type: DataTypes.STRING(40), allowNull: true },
      altPhone: { type: DataTypes.STRING(40), allowNull: true },
      address: { type: DataTypes.TEXT, allowNull: true },
      email: { type: DataTypes.STRING(160), allowNull: true },

      // ── Grouped sections (shapes documented in config/visaRequirements.js) ──
      travelHistory: { type: DataTypes.JSON, allowNull: false },
      tripSponsor: { type: DataTypes.JSON, allowNull: false },
      educationSponsor: { type: DataTypes.JSON, allowNull: false },
      currentJob: { type: DataTypes.JSON, allowNull: false },
      previousJob: { type: DataTypes.JSON, allowNull: false },
      father: { type: DataTypes.JSON, allowNull: false },
      mother: { type: DataTypes.JSON, allowNull: false },
      schools: { type: DataTypes.JSON, allowNull: false },
      awards: { type: DataTypes.JSON, allowNull: false },
      volunteer: { type: DataTypes.JSON, allowNull: false },
      usRelatives: { type: DataTypes.JSON, allowNull: false },
      social: { type: DataTypes.JSON, allowNull: false },
      references: { type: DataTypes.JSON, allowNull: false },

      // { passportPhoto, i20, passportBio } each: { url, publicId, name, mime, size, uploadedAt }  (url = Cloudinary link)
      documents: { type: DataTypes.JSON, allowNull: false },

      consentAcceptedAt: { type: DataTypes.DATE, allowNull: true },

      // ── Payment snapshot (the fee actually charged, even if the admin changes fees later) ──
      applicationFeePaid: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      applicationFeeAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
      currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: "NGN" },

      // ── Admin-managed ──
      interviewDate: { type: DataTypes.DATE, allowNull: true },
      statusNote: { type: DataTypes.TEXT, allowNull: true }, // latest message shown to the applicant
      statusUpdatedAt: { type: DataTypes.DATE, allowNull: true },
      assignedTo: { type: DataTypes.INTEGER, allowNull: true },

      submittedAt: { type: DataTypes.DATE, allowNull: true },
    },
    {
      hooks: {
        beforeValidate: (row) => {
          Object.entries(JSON_DEFAULTS).forEach(([k, v]) => { if (row[k] === undefined || row[k] === null) row[k] = v(); });
        },
      },
      tableName: "visa_applications",
      indexes: [
        { fields: ["userId"] },
        { fields: ["status"] },
        { fields: ["submittedAt"] },
        { fields: ["email"] },
      ],
    }
  );

  VisaApplication.associate = (models) => {
    VisaApplication.hasMany(models.VisaPayment, { foreignKey: "applicationId", as: "payments" });
    VisaApplication.hasMany(models.VisaStatusEvent, { foreignKey: "applicationId", as: "events" });
    VisaApplication.hasMany(models.VisaNote, { foreignKey: "applicationId", as: "notes" });
    if (models.User) VisaApplication.belongsTo(models.User, { foreignKey: "userId", as: "applicant" });
  };

  return VisaApplication;
};
