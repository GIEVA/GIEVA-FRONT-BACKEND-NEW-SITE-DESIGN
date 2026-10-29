
import { DataTypes } from "sequelize";

export default (sequelize) => {
  return sequelize.define(
    "WebinarRegistration",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      classSessionId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      fullName: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(254),
        allowNull: false,
        validate: { isEmail: true },
      },
      age: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 1, max: 120 },
      },
      accessKeyHash: {
        type: DataTypes.STRING(64),
        allowNull: false,
        unique: true,
      },
      status: {
        type: DataTypes.ENUM(
          "waiting",
          "admitted",
          "rejected",
          "left"
        ),
        allowNull: false,
        defaultValue: "waiting",
      },
      admittedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      admittedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      joinedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      leftAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      consentAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      tableName: "webinar_registrations",
      timestamps: true,
      indexes: [
        { fields: ["classSessionId", "status"] },
        { fields: ["classSessionId", "email"] },
      ],
    }
  );
};
