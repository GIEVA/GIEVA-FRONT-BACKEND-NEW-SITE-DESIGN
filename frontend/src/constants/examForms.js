export const EXAM_FORMS = {
SAT: {
title: "SAT Registration",


sections: [
  {
    title: "Personal Information",

    fields: [
      { name: "personalInfo.firstName", label: "First Name", type: "text", required: true },
      { name: "personalInfo.middleName", label: "Middle Name", type: "text" },
      { name: "personalInfo.surname", label: "Surname", type: "text", required: true },

      {
        name: "personalInfo.gender",
        label: "Gender",
        type: "select",
        options: ["Male", "Female"],
      },

      {
        name: "personalInfo.dateOfBirth",
        label: "Date of Birth",
        type: "date",
      },

      {
        name: "personalInfo.phoneNumber",
        label: "Phone Number",
        type: "tel",
      },
    ],
  },

  {
    title: "College Board Account",

    fields: [
      {
        name: "accountInfo.email",
        label: "Email",
        type: "email",
      },

      {
        name: "accountInfo.collegeBoardEmail",
        label: "College Board Email",
        type: "email",
      },

      {
        name: "accountInfo.collegeBoardPassword",
        label: "College Board Password",
        type: "password",
      },
    ],
  },

  {
    title: "Test Information",

    fields: [
      {
        name: "testInfo.desiredTestDate",
        label: "Desired Test Date",
        type: "date",
      },

      {
        name: "testInfo.testCenterCode",
        label: "Test Center Code",
        type: "text",
      },

      {
        name: "testInfo.preferredCenter",
        label: "Preferred Test Center",
        type: "text",
      },
    ],
  },
],


},

IELTS: {
title: "IELTS Registration",


sections: [
  {
    title: "Personal Information",

    fields: [
      { name: "personalInfo.firstName", label: "First Name", type: "text" },
      { name: "personalInfo.middleName", label: "Middle Name", type: "text" },
      { name: "personalInfo.surname", label: "Surname", type: "text" },

      {
        name: "personalInfo.gender",
        label: "Gender",
        type: "select",
        options: ["Male", "Female"],
      },

      {
        name: "personalInfo.dateOfBirth",
        label: "Date of Birth",
        type: "date",
      },

      {
        name: "personalInfo.phoneNumber",
        label: "Phone Number",
        type: "tel",
      },

      {
        name: "personalInfo.homeAddress",
        label: "Home Address",
        type: "textarea",
      },

      {
        name: "personalInfo.firstLanguage",
        label: "First Language",
        type: "text",
      },

      {
        name: "personalInfo.nationality",
        label: "Nationality",
        type: "text",
      },
    ],
  },

  {
    title: "Passport Information",

    fields: [
      {
        name: "passportInfo.passportNumber",
        label: "Passport Number",
        type: "text",
      },

      {
        name: "passportInfo.passportExpiryDate",
        label: "Passport Expiry Date",
        type: "date",
      },

      {
        name: "passportInfo.cityOfIssuance",
        label: "City of Issuance",
        type: "text",
      },
    ],
  },

  {
    title: "Education & Employment",

    fields: [
      {
        name: "educationalInfo.occupationSector",
        label: "Occupation Sector",
        type: "text",
      },

      {
        name: "educationalInfo.occupationLevel",
        label: "Occupation Level",
        type: "text",
      },

      {
        name: "educationalInfo.employmentSector",
        label: "Employment Sector",
        type: "text",
      },

      {
        name: "educationalInfo.employmentLevel",
        label: "Employment Level",
        type: "text",
      },

      {
        name: "educationalInfo.desiredCountry",
        label: "Desired Country",
        type: "text",
      },

      {
        name: "educationalInfo.educationCompleted",
        label: "Highest Education Completed",
        type: "text",
      },

      {
        name: "educationalInfo.yearsStudyingEnglish",
        label: "Years Studying English",
        type: "number",
      },

      {
        name: "educationalInfo.desiredFieldOfStudy",
        label: "Desired Field Of Study",
        type: "text",
      },
    ],
  },

  {
    title: "Test Information",

    fields: [
      {
        name: "testInfo.preferredTestCenter",
        label: "Preferred Test Center",
        type: "text",
      },

      {
        name: "testInfo.preferredTestDate",
        label: "Preferred Test Date",
        type: "date",
      },

      {
        name: "testInfo.module",
        label: "Module",
        type: "select",
        options: ["Academic", "General Training"],
      },

      {
        name: "testInfo.testFormat",
        label: "Test Format",
        type: "select",
        options: ["Computer-Based", "Paper-Based"],
      },
    ],
  },
],


},

TOEFL: {
title: "TOEFL Registration",
sections: [
  {
    title: "Personal Information",

    fields: [
      { name: "personalInfo.firstName", label: "First Name", type: "text" },
      { name: "personalInfo.middleName", label: "Middle Name", type: "text" },
      { name: "personalInfo.surname", label: "Surname", type: "text" },

      {
        name: "personalInfo.gender",
        label: "Gender",
        type: "select",
        options: ["Male", "Female"],
      },

      {
        name: "personalInfo.dateOfBirth",
        label: "Date of Birth",
        type: "date",
      },

      {
        name: "personalInfo.phoneNumber",
        label: "Phone Number",
        type: "tel",
      },

      {
        name: "personalInfo.homeAddress",
        label: "Home Address",
        type: "textarea",
      },

      {
        name: "personalInfo.firstLanguage",
        label: "First Language",
        type: "text",
      },

      {
        name: "personalInfo.nationality",
        label: "Nationality",
        type: "text",
      },
    ],
  },

  {
    title: "Passport Information",

    fields: [
      {
        name: "passportInfo.passportNumber",
        label: "Passport Number",
        type: "text",
      },

      {
        name: "passportInfo.passportExpiryDate",
        label: "Passport Expiry Date",
        type: "date",
      },

      {
        name: "passportInfo.cityOfIssuance",
        label: "City of Issuance",
        type: "text",
      },
    ],
  },

  {
    title: "Education & Employment",

    fields: [
      {
        name: "educationalInfo.occupationSector",
        label: "Occupation Sector",
        type: "text",
      },

      {
        name: "educationalInfo.occupationLevel",
        label: "Occupation Level",
        type: "text",
      },

      {
        name: "educationalInfo.employmentSector",
        label: "Employment Sector",
        type: "text",
      },

      {
        name: "educationalInfo.employmentLevel",
        label: "Employment Level",
        type: "text",
      },

      {
        name: "educationalInfo.desiredCountry",
        label: "Desired Country",
        type: "text",
      },

      {
        name: "educationalInfo.educationCompleted",
        label: "Highest Education Completed",
        type: "text",
      },

      {
        name: "educationalInfo.yearsStudyingEnglish",
        label: "Years Studying English",
        type: "number",
      },

      {
        name: "educationalInfo.desiredFieldOfStudy",
        label: "Desired Field Of Study",
        type: "text",
      },
    ],
  },

  {
    title: "Test Information",

    fields: [
      {
        name: "testInfo.preferredTestCenter",
        label: "Preferred Test Center",
        type: "text",
      },

      {
        name: "testInfo.preferredTestDate",
        label: "Preferred Test Date",
        type: "date",
      },

      {
        name: "testInfo.module",
        label: "Module",
        type: "select",
        options: ["Academic", "General Training"],
      },

      {
        name: "testInfo.testFormat",
        label: "Test Format",
        type: "select",
        options: ["Computer-Based", "Paper-Based"],
      },
    ],
  },
],
},

GRE: {
title: "GRE Registration",
sections: [
  {
    title: "Personal Information",

    fields: [
      { name: "personalInfo.firstName", label: "First Name", type: "text" },
      { name: "personalInfo.middleName", label: "Middle Name", type: "text" },
      { name: "personalInfo.surname", label: "Surname", type: "text" },

      {
        name: "personalInfo.gender",
        label: "Gender",
        type: "select",
        options: ["Male", "Female"],
      },

      {
        name: "personalInfo.dateOfBirth",
        label: "Date of Birth",
        type: "date",
      },

      {
        name: "personalInfo.phoneNumber",
        label: "Phone Number",
        type: "tel",
      },

      {
        name: "personalInfo.homeAddress",
        label: "Home Address",
        type: "textarea",
      },

      {
        name: "personalInfo.firstLanguage",
        label: "First Language",
        type: "text",
      },

      {
        name: "personalInfo.nationality",
        label: "Nationality",
        type: "text",
      },
    ],
  },

  {
    title: "Passport Information",

    fields: [
      {
        name: "passportInfo.passportNumber",
        label: "Passport Number",
        type: "text",
      },

      {
        name: "passportInfo.passportExpiryDate",
        label: "Passport Expiry Date",
        type: "date",
      },

      {
        name: "passportInfo.cityOfIssuance",
        label: "City of Issuance",
        type: "text",
      },
    ],
  },

  {
    title: "Education & Employment",

    fields: [
      {
        name: "educationalInfo.occupationSector",
        label: "Occupation Sector",
        type: "text",
      },

      {
        name: "educationalInfo.occupationLevel",
        label: "Occupation Level",
        type: "text",
      },

      {
        name: "educationalInfo.employmentSector",
        label: "Employment Sector",
        type: "text",
      },

      {
        name: "educationalInfo.employmentLevel",
        label: "Employment Level",
        type: "text",
      },

      {
        name: "educationalInfo.desiredCountry",
        label: "Desired Country",
        type: "text",
      },

      {
        name: "educationalInfo.educationCompleted",
        label: "Highest Education Completed",
        type: "text",
      },

      {
        name: "educationalInfo.yearsStudyingEnglish",
        label: "Years Studying English",
        type: "number",
      },

      {
        name: "educationalInfo.desiredFieldOfStudy",
        label: "Desired Field Of Study",
        type: "text",
      },
    ],
  },

  {
    title: "Test Information",

    fields: [
      {
        name: "testInfo.preferredTestCenter",
        label: "Preferred Test Center",
        type: "text",
      },

      {
        name: "testInfo.preferredTestDate",
        label: "Preferred Test Date",
        type: "date",
      },

      {
        name: "testInfo.module",
        label: "Module",
        type: "select",
        options: ["Academic", "General Training"],
      },

      {
        name: "testInfo.testFormat",
        label: "Test Format",
        type: "select",
        options: ["Computer-Based", "Paper-Based"],
      },
    ],
  },
],
},

ACT: {
title: "ACT Registration",


sections: [
  {
    title: "Test Information",

    fields: [
      {
        name: "testInfo.actPackage",
        label: "ACT Package",
        type: "select",

        options: [
          "standard",
          "science",
          "writing",
          "scienceWriting",
        ],
      },
    ],
  },
],


},

SEVIS: {
title: "SEVIS Registration",


sections: [
  {
    title: "SEVIS Information",

    fields: [
      {
        name: "sevisInfo.sevisIdentificationNumber",
        label: "SEVIS Identification Number",
        type: "text",
      },

      {
        name: "sevisInfo.schoolCode",
        label: "School Code",
        type: "text",
      },

      {
        name: "sevisInfo.programNumber",
        label: "Program Number",
        type: "text",
      },

      {
        name: "sevisInfo.visaAppointmentDate",
        label: "Visa Appointment Date",
        type: "date",
      },

      {
        name: "sevisInfo.category",
        label: "Category",
        type: "select",

        options: ["F1", "J1"],
      },

      {
        name: "sevisInfo.otherCategories",
        label: "Other Categories",
        type: "text",
      },
    ],
  },
],


},
};
