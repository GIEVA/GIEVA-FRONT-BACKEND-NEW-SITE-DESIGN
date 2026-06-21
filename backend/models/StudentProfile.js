import { DataTypes } from "sequelize";

export default (sequelize) => {
  const StudentProfile = sequelize.define(
    "StudentProfile",
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

      // ❌ remove unique
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { isEmail: true },
      },

      profilePicUrl: DataTypes.STRING,
      cloudinary_id: DataTypes.TEXT,

      phone: DataTypes.STRING,
      bio: DataTypes.TEXT,
      dob: DataTypes.DATE,

      level: DataTypes.STRING,
      school: DataTypes.STRING,
      address: DataTypes.STRING,

      guardianName: DataTypes.STRING,
      guardianPhone: DataTypes.STRING,
    },
    {
      tableName: "student_profiles",
      timestamps: true,
      indexes: [{ fields: ["userId"] }],
    }
  );

  StudentProfile.associate = (models) => {
    StudentProfile.belongsTo(models.User, {
      foreignKey: "userId",
      onDelete: "CASCADE",
    });

    // 🔥 ADD THESE RELATIONS
      StudentProfile.hasMany(
      models.Enrollment,
      {
        foreignKey: "studentId",
        sourceKey: "userId",
      }
    );

    StudentProfile.hasMany(models.Payment, {
      foreignKey: "userId",
      sourceKey: "userId",
    });

    StudentProfile.hasMany(models.QuizAttempt, {
      foreignKey: "userId",
      sourceKey: "userId",
    });
  };

  return StudentProfile;
};