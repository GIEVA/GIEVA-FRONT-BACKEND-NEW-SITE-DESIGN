// models/HealsApplication.js
import { DataTypes } from "sequelize";

// Every document gets <name>Url and <name>PublicId.
// TEXT (not VARCHAR) keeps them out of MySQL's 65,535-byte row limit.
const DOC_FIELDS = [
  "passport", "transcript", "sop", "recommendation", "recommendation2", "recommendation3",
  "bankStatement", "otherDoc", "waecResult", "degreeCertificate", "testScore",
  "collegeEssay", "credentialEvaluation", "resume",
];
const docColumns = Object.fromEntries(
  DOC_FIELDS.flatMap((f) => [
    [`${f}Url`, DataTypes.TEXT],
    [`${f}PublicId`, DataTypes.TEXT],
  ])
);

export default (sequelize) => {
  const HealsApplication = sequelize.define("HealsApplication", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    userId: { type: DataTypes.INTEGER, allowNull: false },

    applicantCategory: { type: DataTypes.ENUM("undergraduate", "postgraduate"), allowNull: true },

    // ---------------- STUDY ----------------
    degreeProgram: DataTypes.STRING(50),
    degreeProgramOther: DataTypes.STRING(100),
    desiredCountry: DataTypes.TEXT,            // legacy: comma-joined copy of desiredCountries
    desiredCountries: DataTypes.JSON,          // ["USA","UK"]
    desiredCountryOther: DataTypes.STRING(150),
    fieldOfStudy: DataTypes.STRING(150),
    firstChoice: DataTypes.STRING(150),
    secondChoice: DataTypes.STRING(150),
    thirdChoice: DataTypes.STRING(150),
    fourthChoice: DataTypes.STRING(150),
    studyAreas: DataTypes.JSON,
    studyAreaOther: DataTypes.STRING(100),
    intakePeriod: DataTypes.STRING(50),        // legacy
    intakePeriods: DataTypes.JSON,
    preferredLanguage: DataTypes.STRING(50),   // legacy
    mediumOfInstruction: DataTypes.JSON,
    mediumOther: DataTypes.STRING(100),

    // ---------------- PERSONAL ----------------
    fullName: DataTypes.STRING(200),
    lastName: DataTypes.STRING(100),
    firstName: DataTypes.STRING(100),
    middleName: DataTypes.STRING(100),
    dob: DataTypes.DATE,
    gender: DataTypes.STRING(20),
    maritalStatus: DataTypes.STRING(20),

    passportNumber: DataTypes.STRING(50),
    passportIssueDate: DataTypes.DATE,
    passportExpiryDate: DataTypes.DATE,

    address: DataTypes.TEXT,
    phone: DataTypes.STRING(50),
    email: DataTypes.STRING(150),
    hasVisa: DataTypes.BOOLEAN,

    // ---------------- HIGH SCHOOL ----------------
    highSchool: DataTypes.STRING(200),
    highSchoolAddress: DataTypes.TEXT,
    highSchoolYearFrom: DataTypes.DATE,        // legacy, unused
    highSchoolYearTo: DataTypes.DATE,          // legacy, unused
    highSchoolStartYear: DataTypes.INTEGER,
    highSchoolEndYear: DataTypes.INTEGER,
    certificateObtained: DataTypes.STRING(100),
    examinationBody: DataTypes.STRING(100),
    waecCreditCount: DataTypes.INTEGER,

    // ---------------- COLLEGE / UNIVERSITY ----------------
    universityAttended: DataTypes.STRING(200),
    universityAddress: DataTypes.TEXT,
    universityWebsite: DataTypes.TEXT,
    universityEmail: DataTypes.STRING(150),
    universityPhone: DataTypes.STRING(50),
    universityStartYear: DataTypes.INTEGER,
    universityEndYear: DataTypes.INTEGER,
    degreeReceived: DataTypes.STRING(150),

    // ---------------- HIGHEST QUALIFICATION ----------------
    highestQualification: DataTypes.STRING(100),
    qualificationInstitution: DataTypes.STRING(200),
    qualificationCourse: DataTypes.STRING(150),
    qualificationGrade: DataTypes.STRING(100),
    gradeScale: DataTypes.STRING(50),
    graduationYear: DataTypes.INTEGER,

    // ---------------- TESTS ----------------
    testType: DataTypes.STRING(30),
    testScoreValue: DataTypes.STRING(50),
    testDate: DataTypes.DATE,

    // ---------------- FINANCIAL ----------------
    budgetRange: DataTypes.STRING(50),
    incomeDocuments: DataTypes.JSON,
    financialNeeds: DataTypes.STRING(150),

    // ---------------- PROFILE EXTRAS ----------------
    awardsObtained: DataTypes.TEXT,
    leadershipRoles: DataTypes.TEXT,
    otherTalents: DataTypes.TEXT,
    workExperience: DataTypes.TEXT,
    innovations: DataTypes.TEXT,

    // ---------------- TERMS ----------------
    signatureName: DataTypes.STRING(200),
    termsAcceptedAt: DataTypes.DATE,

    // ---------------- DOCUMENTS (all <name>Url / <name>PublicId as TEXT) ----------------
    ...docColumns,

    passportVerified:      { type: DataTypes.BOOLEAN, defaultValue: false },
    transcriptVerified:    { type: DataTypes.BOOLEAN, defaultValue: false },
    bankStatementVerified: { type: DataTypes.BOOLEAN, defaultValue: false },

    applicationCode: { type: DataTypes.STRING(50), unique: true },

    applicationFeePaid:   { type: DataTypes.BOOLEAN, defaultValue: false },
    applicationFeeAmount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },

    // ---------------- STATUS ----------------
    status: {
      type: DataTypes.ENUM(
        "draft", "submitted", "under_review", "approved_for_payment",
        "paid", "processing", "completed", "rejected", "info_requested"
      ),
      defaultValue: "draft",
    },

    studentNotes: DataTypes.TEXT,
    internalNotes: DataTypes.TEXT,

    currentStage: {
      type: DataTypes.ENUM(
        "application", "document_review", "school_matching", "school_application",
        "offer_processing", "visa_processing", "travel_processing", "completed"
      ),
      defaultValue: "application",
    },

    documentReviews: DataTypes.JSON,   // { passport: "verified", waecResult: "rejected", ... }
    submittedAt: DataTypes.DATE,
    reviewStartedAt: DataTypes.DATE,
    approvedAt: DataTypes.DATE,
    rejectedAt: DataTypes.DATE,
    completedAt: DataTypes.DATE,
  });

  HealsApplication.associate = (models) => {
    HealsApplication.belongsTo(models.User, { foreignKey: "userId", as: "applicant" });
    HealsApplication.hasMany(models.HealsPayment, { foreignKey: "applicationId" });
  };

  return HealsApplication;
};