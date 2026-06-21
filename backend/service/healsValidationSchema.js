import Joi from "joi";

export const applicationSchema = Joi.object({
  // PROGRAM
  degreeProgram: Joi.string().trim().required(),
  desiredCountry: Joi.string().trim().required(),
  fieldOfStudy: Joi.string().trim().required(),
  firstChoice: Joi.string().trim().required(),
  secondChoice: Joi.string().allow("", null),
  thirdChoice: Joi.string().allow("", null),
  fourthChoice: Joi.string().allow("", null),
  intakePeriod: Joi.string().trim().required(),
  preferredLanguage: Joi.string().trim().optional(),

  // PERSONAL
  fullName: Joi.string().min(3).max(100).required(),

  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required(),

  phone: Joi.string()
    .pattern(/^\+?[0-9]{7,15}$/)
    .required()
    .messages({
      "string.pattern.base":
        "Phone must be a valid number (7–15 digits, optional +)",
    }),

  dob: Joi.date()
    .less("now")
    .required()
    .messages({
      "date.less": "Date of birth must be in the past",
    }),

  gender: Joi.string().valid("male", "female", "other").required(),
  maritalStatus: Joi.string()
    .valid("single", "married", "divorced", "widowed")
    .required(),

  passportNumber: Joi.string().allow("", null),
  passportIssueDate: Joi.date().allow(null),
  passportExpiryDate: Joi.date().greater(Joi.ref("passportIssueDate")).allow(null),

  address: Joi.string().min(5).required(),
  hasVisa: Joi.boolean().optional(),

  // ACADEMIC
  highSchool: Joi.string().required(),
  highSchoolYearFrom: Joi.number().integer().min(1900).max(new Date().getFullYear()),
  highSchoolYearTo: Joi.number()
    .integer()
    .min(Joi.ref("highSchoolYearFrom"))
    .max(new Date().getFullYear()),

  universityAttended: Joi.string().allow("", null),
  degreeReceived: Joi.string().allow("", null),

  // FINANCIAL
  budgetRange: Joi.string().required(),
  financialNeeds: Joi.string().allow("", null),
});