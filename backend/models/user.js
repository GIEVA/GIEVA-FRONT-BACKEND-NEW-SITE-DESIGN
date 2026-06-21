import { DataTypes } from "sequelize";

export default (sequelize) => {
  const User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true, // ✅ KEEP THIS ONLY
        validate: { isEmail: true },
      },

      passwordHash: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      fullName: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      role: {
        type: DataTypes.ENUM(
          "superadmin",
          "tutor",
          "student",
          "applicant",
          "reviewer",
          "agent",
          "operational_admin"
        ),
        defaultValue: "student",
      },

      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },

      isVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },

      verificationToken: DataTypes.STRING,
      verificationTokenExpiry: DataTypes.DATE,

      resetToken: DataTypes.STRING,
      resetTokenExpiry: DataTypes.DATE,
    },
    {
      tableName: "users",
      timestamps: true,
      indexes: [
        { fields: ["role"] }, // ✅ keep only non-duplicate index
      ],
    }
  );

  // Associations
  User.associate = (models) => {
    User.hasOne(models.TutorProfile, { foreignKey: "userId" });
    User.hasOne(models.StudentProfile, { foreignKey: "userId" });
    User.hasMany(models.Enrollment, { foreignKey: "studentId" });
    User.hasMany(models.SessionAttendance, { foreignKey: "userId" });
    User.hasMany(models.TutorStudent, {
      foreignKey: "studentId",
      as: "TutorAssignments",
    });
    User.hasMany(models.ExamRegistration, {
      foreignKey: "userId",
      as: "examRegistrations",
    });

    User.hasMany(models.ExamRegistration, {
      foreignKey: "processedBy",
      as: "processedExamRegistrations",
    });
  };

  return User;
};