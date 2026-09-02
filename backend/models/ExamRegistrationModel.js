import { DataTypes } from "sequelize";

export default (sequelize) => {
  const ExamRegistration = sequelize.define(
    "ExamRegistration",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "users",
            key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        },

      registrationCode: {
        type: DataTypes.STRING(60),
        unique: true,
        allowNull: false,
      },

      examType: {
        type: DataTypes.ENUM(
          "SAT",
          "GRE",
          "IELTS",
          "TOEFL",
          "ACT",
          "SEVIS"
        ),
        allowNull: false,
      },

      status: {
        type: DataTypes.ENUM(
          "draft",
          "payment_pending",
          "submitted",
          "under_review",
          "processing",
          "completed",
          "rejected",
          "cancelled"
        ),
        defaultValue: "draft",
      },

      submittedAt: {
        type: DataTypes.DATE,
      },

      processedAt: {
        type: DataTypes.DATE,
      },

      completedAt: {
        type: DataTypes.DATE,
      },

      adminNotes: {
        type: DataTypes.TEXT,
      },

      rejectionReason: {
        type: DataTypes.TEXT,
      },

      amount: {
        type: DataTypes.DECIMAL(10,2),
        allowNull: false,
        },

        usdToNgnRateUsed: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      amountNgn: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
      },

      paymentStatus: {
        type: DataTypes.ENUM(
            "pending",
            "success",
            "failed"
        ),
        defaultValue: "pending",
        },

      
       //Entire exam form payload
       
    //     SAT:
    //    {
    //     "personalInfo": {
    //         "firstName": "",
    //         "middleName": "",
    //         "surname": "",
    //         "gender": "",
    //         "dateOfBirth": "",
    //         "phoneNumber": ""
    //     },

    //     "accountInfo": {
    //         "email": "",
    //         "collegeBoardEmail": "",
    //         "collegeBoardPassword": ""
    //     },

    //     "testInfo": {
    //         "desiredTestDate": "",
    //         "testCenterCode": "",
    //         "preferredCenter": ""
    //     },

    //     "scoreRecipients": [
    //         "",
    //         "",
    //         "",
    //         ""
    //     ],

    //     "examSpecific": {
    //         "bluebookDeviceReady": true
    //     }
    //     },
       
    //     IELTS:
    //   {
    //     "personalInfo": {
    //         "firstName": "",
    //         "middleName": "",
    //         "surname": "",
    //         "gender": "",
    //         "dateOfBirth": "",
    //         "phoneNumber": "",
    //         "homeAddress": "",
    //         "firstLanguage": "",
    //         "nationality": ""
    //     },

    //     "accountInfo": {
    //         "email": "",
    //         "ieltsPassword": ""
    //     },

    //     "passportInfo": {
    //         "passportNumber": "",
    //         "passportExpiryDate": "",
    //         "cityOfIssuance": ""
    //     },

    //     "educationalInfo": {
    //         "occupationSector": "",
    //         "occupationLevel": "",
    //         "employmentSector": "",
    //         "employmentLevel": "",
    //         "desiredCountry": "",
    //         "educationCompleted": "",
    //         "yearsStudyingEnglish": "",
    //         "desiredFieldOfStudy": ""
    //     },

    //     "testInfo": {
    //         "preferredTestCenter": "",
    //         "preferredTestDate": "",
    //         "module": "",
    //         "testFormat": "Computer-Based"
    //     },

    //     "scoreRecipients": [
    //         "",
    //         "",
    //         "",
    //         ""
    //     ]
    //     },
    //     TOEFLE:
    //     {
    //     "personalInfo": {
    //         "firstName": "",
    //         "middleName": "",
    //         "surname": "",
    //         "gender": "",
    //         "dateOfBirth": "",
    //         "phoneNumber": "",
    //         "alternativeNumber": "",
    //         "homeAddress": "",
    //         "firstLanguage": "",
    //         "countryOfNationality": ""
    //     },

    //     "accountInfo": {
    //         "email": "",
    //         "toeflUsername": "",
    //         "toeflPassword": ""
    //     },

    //     "passportInfo": {
    //         "passportNumber": "",
    //         "passportExpiryDate": "",
    //         "cityOfIssuance": ""
    //     },

    //     "educationalInfo": {
    //         "desiredCountry": "",
    //         "educationCompleted": "",
    //         "yearsStudyingEnglish": "",
    //         "desiredFieldOfStudy": ""
    //     },

    //     "testInfo": {
    //         "testDate": "",
    //         "testCenterLocation": ""
    //     },

    //     "scoreRecipients": [
    //         "",
    //         "",
    //         "",
    //         ""
    //     ]
    //     },
    //     GRE:
    //     {
    //         "personalInfo": {
    //             "firstName": "",
    //             "middleName": "",
    //             "surname": "",
    //             "gender": "",
    //             "dateOfBirth": "",
    //             "phoneNumbers": "",
    //             "address": "",
    //             "city": "",
    //             "country": ""
    //         },

    //         "accountInfo": {
    //             "email": "",
    //             "greUsername": "",
    //             "grePassword": ""
    //         },

    //         "passportInfo": {
    //             "passportNumber": ""
    //         },

    //         "educationalInfo": {
    //             "citizenshipStatus": "",
    //             "intendedMajorGraduateStudy": ""
    //         },

    //         "testInfo": {
    //             "testCenterLocation": "",
    //             "preferredTestDate": ""
    //         }
    //         },
    //     ACT:
    //     {
    //     "personalInfo": {
    //         "firstName": "",
    //         "middleName": "",
    //         "surname": "",
    //         "gender": "",
    //         "dateOfBirth": "",
    //         "phoneNumber": "",
    //         "homeAddress": ""
    //     },

    //     "accountInfo": {
    //         "email": "",
    //         "actEmail": "",
    //         "actPassword": ""
    //     },

    //     "testInfo": {
    //         "desiredTestDate": "",
    //         "testCenterCode": "",
    //         "preferredCenter": "",
    //         "actPackage": ""
    //     },

    //     "scoreRecipients": [
    //         "",
    //         "",
    //         "",
    //         ""
    //     ],

    //     "examSpecific": {
    //         "package": "standard"
    //     }
    //     },
    //    SEVIS:
    //    {
    //     "personalInfo": {
    //         "firstName": "",
    //         "middleName": "",
    //         "surname": "",
    //         "dateOfBirth": "",
    //         "streetAddress": "",
    //         "address2": "",
    //         "country": "",
    //         "cityOfBirth": "",
    //         "countryOfBirth": "",
    //         "countryOfCitizenship": "",
    //         "phone": "",
    //         "email": ""
    //     },

    //     "passportInfo": {
    //         "passportNumber": ""
    //     },

    //     "sevisInfo": {
    //         "sevisIdentificationNumber": "",
    //         "schoolCode": "",
    //         "programNumber": "",
    //         "visaAppointmentDate": "",
    //         "category": "",
    //         "otherCategories": ""
    //     }
    //     },
       
      data: {
        type: DataTypes.JSON,
        allowNull: false,
         defaultValue: {},
      },

     processedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: "users",
            key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
        },

      meta: {
        type: DataTypes.JSON,
         defaultValue: {},
      },
    },
    {
      tableName: "exam_registrations",

      timestamps: true,

      indexes: [
        { fields: ["userId"] },
        { fields: ["examType"] },
        { fields: ["status"] },
        { fields: ["paymentStatus"] },
        { fields: ["examType", "status"] },
        { unique: true, fields: ["registrationCode"] },
        { fields: ["createdAt"] },
        ],
    }
  );

  ExamRegistration.associate = (models) => {
    ExamRegistration.belongsTo(models.User, {
        foreignKey: "userId",
        as: "applicant",
        onDelete: "CASCADE",
    });

    ExamRegistration.belongsTo(models.User, {
        foreignKey: "processedBy",
        as: "processor",
        });

    ExamRegistration.hasMany(models.ExamPayment, {
      foreignKey: "registrationId",
      as: "payments",
    });
  };

  return ExamRegistration;
};