import { DataTypes } from "sequelize";

export default (sequelize) => {
  const PendingRegistration = sequelize.define(
    "PendingRegistration",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      fullName: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },

      // Temporarily stored as a bcrypt hash; cleared after verification.
      passwordHash: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      role: {
        type: DataTypes.ENUM(
          "tutor",
          "student",
          "applicant"
        ),
        allowNull: false,
        defaultValue: "student",
      },

      verificationToken: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },

      verificationTokenExpiry: {
        type: DataTypes.DATE,
        allowNull: false,
      },

      registrationAttempts: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      cooldownUntil: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      // Retain the token's record so repeat clicks can be handled gracefully.
      verifiedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "pending_registrations",
      timestamps: true,
      indexes: [
        { fields: ["email"], unique: true },
        { fields: ["verificationToken"], unique: true },
      ],
    }
  );

  return PendingRegistration;
};