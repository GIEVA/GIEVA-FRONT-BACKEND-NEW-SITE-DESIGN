// ── Degree program drives the applicant category ──────────────
export const DEGREE_PROGRAMS = [
  { value: "undergraduate", label: "Undergraduate" },
  { value: "masters",       label: "Masters" },
  { value: "doctorate",     label: "Doctorate" },
  { value: "other",         label: "Other" },
];
// Masters, Doctorate and Other all use the postgraduate requirements
export const categoryFromProgram = (p) => (!p ? null : p === "undergraduate" ? "undergraduate" : "postgraduate");

// ── Option lists (mirror the PDF form) ────────────────────────
export const COUNTRIES = ["USA","Canada","UK","China","Cyprus","Germany","Ireland","Poland","Turkey","Russia","Ghana","Kenya"];
export const STUDY_AREAS = ["Medical science","Engineering","Computer science","Social science","Education","Law"];
export const INTAKES = ["Fall","Spring","Summer"];
export const LANGUAGES = ["English","Chinese","Russian","German"];
export const BUDGETS = ["$20,000-$30,000","$31,000-$40,000","$41,000-$60,000","$61,000-$75,000","$76,000-$100,000","Above $100,000"];
export const INCOME_DOCS = [
  "Bank Statement of Account",
  "Landed Property (C of O, R of O, etc.)",
  "Sponsorship Letter (on sponsor's letter-headed paper)",
  "Others (personal funds, if any)",
];
export const FINANCIAL_NEEDS = {
  "Low economic background": [
    "Cannot afford college unless fully sponsored",
    "Can afford if 75% sponsored",
    "Can afford if 50% sponsored",
    "Can afford if 25% sponsored",
    "Can afford if 10% sponsored",
    "Can afford if 0% sponsored",
  ],
  "Good income background": [
    "Can self-sponsor but needs some financial assistance",
    "Can self-sponsor my education anywhere without assistance",
  ],
};
export const QUALIFICATIONS = [
  "WAEC / NECO / GCE (O-Level)", "A-Levels / IB / JUPEB", "OND / HND",
  "Bachelor's degree", "Master's degree", "Doctorate", "Other",
];
export const GRADE_SCALES = ["5.0 CGPA","4.0 GPA","7.0 GPA","Percentage (%)","Class of degree","A1–F9 (WAEC/NECO)","Other"];
export const TEST_TYPES = ["SAT","ACT","TOEFL","IELTS","GRE","GMAT","None yet"];

// ── Required uploads per category ─────────────────────────────
export const HEALS_REQUIREMENTS = {
  undergraduate: {
    label: "Undergraduate",
    documents: [
      { field: "waecResult",           label: "WAEC Result (at least 5 credits)",          required: true  },
      { field: "passport",             label: "Valid International Passport",              required: true  },
      { field: "recommendation",       label: "Recommendation Letter 1 (Teacher)",         required: true  },
      { field: "recommendation2",      label: "Recommendation Letter 2 (Teacher)",         required: true  },
      { field: "transcript",           label: "SS1–SS3 School Transcript Records",         required: true  },
      { field: "testScore",            label: "SAT/ACT or TOEFL/IELTS Result (optional)",  required: false },
      { field: "sop",                  label: "Statement of Purpose (SOP)",                required: false },
      { field: "collegeEssay",         label: "College Essay",                             required: false },
      { field: "credentialEvaluation", label: "Credential Evaluation",                     required: false },
      { field: "bankStatement",        label: "Family-income verification document",       required: false },
    ],
  },
  postgraduate: {
    label: "Postgraduate",
    documents: [
      { field: "degreeCertificate",    label: "Degree Certificate (minimum 2:2)",          required: true  },
      { field: "transcript",           label: "Full Record of Transcript",                 required: true  },
      { field: "passport",             label: "Valid International Passport",              required: true  },
      { field: "recommendation",       label: "Recommendation Letter 1 (Instructor)",      required: true  },
      { field: "recommendation2",      label: "Recommendation Letter 2 (Instructor)",      required: true  },
      { field: "recommendation3",      label: "Recommendation Letter 3 (Instructor)",      required: true  },
      { field: "testScore",            label: "GRE/GMAT or TOEFL/IELTS Test Scores",       required: true  },
      { field: "sop",                  label: "SOP and Graduate Essays",                   required: false },
      { field: "resume",               label: "CV / Work Experience",                      required: false },
      { field: "credentialEvaluation", label: "Credential Evaluation",                     required: false },
      { field: "bankStatement",        label: "Family-income verification document",       required: false },
    ],
  },
};
// Items marked required:false come from the PDF's requirements box.
// Flip any of them to true here if you want them mandatory.

export const ALL_DOC_FIELDS = [
  ...new Set(Object.values(HEALS_REQUIREMENTS).flatMap((c) => c.documents.map((d) => d.field))),
];

// ── Required form fields (used by the browser AND the server) ─
export const REQUIRED_FIELDS = {
  degreeProgram: "Degree program",
  desiredCountries: "Desired country of study",
  fieldOfStudy: "Proposed field of study",
  intakePeriods: "Anticipated period of resumption",
  mediumOfInstruction: "Preferred medium of instruction",
  lastName: "Last name", firstName: "First name",
  dob: "Date of birth", gender: "Gender", maritalStatus: "Marital status",
  passportNumber: "Passport number", passportIssueDate: "Passport issue date",
  passportExpiryDate: "Passport expiry date", hasVisa: "Student visa status",
  address: "Home address", phone: "Phone number", email: "Email address",
  highSchool: "High school attended",
  highestQualification: "Highest qualification",
  qualificationInstitution: "School/institution of highest qualification",
  qualificationGrade: "Grade obtained", gradeScale: "Grading scale", graduationYear: "Year of graduation",
  budgetRange: "Anticipated budget", financialNeeds: "Financial needs",
  signatureName: "Signature (typed full name)",
};

export const getMissingFields = (data) => {
  const out = Object.entries(REQUIRED_FIELDS)
    .filter(([k]) => {
      const v = data[k];
      return Array.isArray(v) ? v.length === 0 : v === null || v === undefined || String(v).trim() === "";
    })
    .map(([, label]) => label);
  if (categoryFromProgram(data.degreeProgram) === "undergraduate" && !(Number(data.waecCreditCount) >= 5))
    out.push("At least 5 WAEC credits");
  return out;
};

// Backend only
export const getMissingDocuments = (application) => {
  const cfg = HEALS_REQUIREMENTS[application.applicantCategory];
  if (!cfg) return [];
  return cfg.documents.filter((d) => d.required && !application[`${d.field}Url`]).map((d) => d.label);
};