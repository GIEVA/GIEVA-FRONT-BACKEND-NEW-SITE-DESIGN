// models/TutorProfile.js

import { DataTypes } from "sequelize";

export default (sequelize) => {

  const TutorProfile =
    sequelize.define(
      "TutorProfile",
      {

        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },

        userId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          unique: true,
        },

        fullName: {
          type: DataTypes.STRING,
          allowNull: false,
        },

        email: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: {
            isEmail: true,
          },
        },

        profilePicUrl:
          DataTypes.STRING,

        cloudinary_id:
          DataTypes.TEXT,

        phone:
          DataTypes.STRING,

        bio:
          DataTypes.TEXT,

        dob:
          DataTypes.DATE,

        address:
          DataTypes.STRING,

        expertise: {
          type: DataTypes.JSON,
          defaultValue: [],
        },

        certifications: {
          type: DataTypes.JSON,
          defaultValue: [],
        },

        yearsOfExperience: {
          type: DataTypes.INTEGER,
          defaultValue: 0,
        },

        linkedinUrl:
          DataTypes.STRING,

        websiteUrl:
          DataTypes.STRING,

        totalStudents: {
          type: DataTypes.INTEGER,
          defaultValue: 0,
        },

        totalCourses: {
          type: DataTypes.INTEGER,
          defaultValue: 0,
        },

        totalLectureMinutes: {
          type: DataTypes.INTEGER,
          defaultValue: 0,
        },

        averageRating: {
          type: DataTypes.FLOAT,
          defaultValue: 0,
        },

        totalReviews: {
          type: DataTypes.INTEGER,
          defaultValue: 0,
        },

        hourlyRate: {
          type: DataTypes.DECIMAL,
          defaultValue: 0,
        },

        availabilityStatus: {
          type: DataTypes.ENUM(
            "available",
            "busy",
            "offline"
          ),
          defaultValue:
            "available",
        },

        approved: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },

        verificationStatus: {
          type: DataTypes.ENUM(
            "pending",
            "verified",
            "rejected"
          ),
          defaultValue:
            "pending",
        },
        verificationNotes: {
          type: DataTypes.TEXT,
        },

        socialLinks: {
          type: DataTypes.JSON,
          defaultValue: {},
        },

        sessionsCompleted: {
          type: DataTypes.INTEGER,
          defaultValue: 0,
        },

        sessionsCancelled: {
          type: DataTypes.INTEGER,
          defaultValue: 0,
        },

        attendanceRate: {
          type: DataTypes.FLOAT,
          defaultValue: 0,
        },

        lastActiveAt: {
          type: DataTypes.DATE,
        },

      },
      {
        tableName:
          "tutor_profiles",

        timestamps: true,
      }
    );



  TutorProfile.associate =
    (models) => {

      TutorProfile.belongsTo(
        models.User,
        {
          foreignKey:
            "userId",

          onDelete:
            "CASCADE",
        }
      );

      TutorProfile.hasMany(
        models.ClassSession,
        {
          foreignKey:
            "tutorProfileId",
        }
      );

      TutorProfile.hasMany(
        models.TutorStudent,
        {
          foreignKey:
            "tutorProfileId",
        }
      );
      
    };

  return TutorProfile;
};