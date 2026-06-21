// models/HealsApplication.js
import { DataTypes } from "sequelize";

export default (sequelize) => {
  const HealsApplication = sequelize.define("HealsApplication", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },


    // ---------------- STUDY ----------------
    degreeProgram: DataTypes.STRING,
    desiredCountry: DataTypes.STRING,
    fieldOfStudy: DataTypes.STRING,
    firstChoice: DataTypes.STRING,
    secondChoice: DataTypes.STRING,
    thirdChoice: DataTypes.STRING,
    fourthChoice: DataTypes.STRING,
    intakePeriod: DataTypes.STRING,
    preferredLanguage: DataTypes.STRING,

    // ---------------- PERSONAL ----------------
    fullName: DataTypes.STRING,
    dob: DataTypes.DATE,
    gender: DataTypes.STRING,
    maritalStatus: DataTypes.STRING,

    passportNumber: DataTypes.STRING,
    passportIssueDate: DataTypes.DATE,
    passportExpiryDate: DataTypes.DATE,

    address: DataTypes.TEXT,
    phone: DataTypes.STRING,
    email: DataTypes.STRING,
    hasVisa: DataTypes.BOOLEAN,

    // ---------------- ACADEMIC ----------------
    highSchool: DataTypes.STRING,
    highSchoolYearFrom: DataTypes.DATE,
    highSchoolYearTo: DataTypes.DATE,
    universityAttended: DataTypes.STRING,
    degreeReceived: DataTypes.STRING,

    // ---------------- FINANCIAL ----------------
    budgetRange: DataTypes.STRING,
    financialNeeds: DataTypes.STRING,

    // ---------------- DOCUMENTS ----------------

    passportUrl: DataTypes.STRING,
    passportPublicId: DataTypes.STRING,

    transcriptUrl: DataTypes.STRING,
    transcriptPublicId: DataTypes.STRING,

    sopUrl: DataTypes.STRING,
    sopPublicId: DataTypes.STRING,

    recommendationUrl: DataTypes.STRING,
    recommendationPublicId: DataTypes.STRING,

    bankStatementUrl: DataTypes.STRING,
    bankStatementPublicId: DataTypes.STRING,

    otherDocUrl: DataTypes.STRING,
    otherDocPublicId: DataTypes.STRING,

    passportVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    },

    transcriptVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    bankStatementVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    applicationCode: {
      type: DataTypes.STRING,
      unique: true,
    },

    applicationFeePaid: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    applicationFeeAmount: {
      type: DataTypes.DECIMAL(10,2),
      defaultValue: 0,
    },

    // ---------------- STATUS ----------------
    status: {
  type: DataTypes.ENUM(
    "draft",
    "submitted",
    "under_review",
    "approved_for_payment",
    "paid",
    "processing",
    "completed",
    "rejected",
    "info_requested"
  ),
  defaultValue: "draft",
},

    studentNotes: DataTypes.TEXT,
    internalNotes: DataTypes.TEXT,

    currentStage: {
        type: DataTypes.ENUM(
          "application",
          "document_review",
          "school_matching",
          "school_application",
          "offer_processing",
          "visa_processing",
          "travel_processing",
          "completed"
        ),
        defaultValue: "application",
      },
      submittedAt: DataTypes.DATE,
      reviewStartedAt: DataTypes.DATE,
      approvedAt: DataTypes.DATE,
      rejectedAt: DataTypes.DATE,
      completedAt: DataTypes.DATE,
  });

  HealsApplication.associate = (models) => {
    HealsApplication.belongsTo(models.User, {
      foreignKey: "userId",
      as: "applicant",
    });


    HealsApplication.hasMany(models.HealsPayment, {
      foreignKey: "applicationId",
    });
  };

  return HealsApplication;
};