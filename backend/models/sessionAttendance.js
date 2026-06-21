import { DataTypes } from "sequelize";

export default (sequelize) => {
  const SessionAttendance = sequelize.define(
    "SessionAttendance",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

      classSessionId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      role: {
        type: DataTypes.ENUM("student", "tutor"),
      },

      joinTime: DataTypes.DATE,
      leaveTime: DataTypes.DATE,

      totalMinutes: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },

      reconnectCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },

      wasPresent: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: "session_attendance",
      timestamps: true,
    }
  );

  SessionAttendance.associate = (models) => {
  SessionAttendance.belongsTo(models.User, {
    foreignKey: "userId",
    onDelete: "CASCADE",
  });

  SessionAttendance.belongsTo(models.ClassSession, {
    foreignKey: "classSessionId",
    onDelete: "CASCADE",
  });
};

  return SessionAttendance;
};