import { DataTypes } from "sequelize";

export default (sequelize) => {
  const SessionEventLog = sequelize.define(
    "SessionEventLog",
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

      eventType: {
        type: DataTypes.ENUM(
          "join",
          "leave",
          "mic_on",
          "mic_off",
          "camera_on",
          "camera_off",
          "screen_share",
          "raise_hand"
        ),
      },

      metadata: DataTypes.JSON,
    },
    {
      tableName: "session_event_logs",
      timestamps: true,
    }
  );

  // ✅ CORRECT ASSOCIATIONS
  SessionEventLog.associate = (models) => {
    SessionEventLog.belongsTo(models.User, {
      foreignKey: "userId",
      onDelete: "CASCADE",
    });

    SessionEventLog.belongsTo(models.ClassSession, {
      foreignKey: "classSessionId",
      onDelete: "CASCADE",
    });
  };

  return SessionEventLog;
};