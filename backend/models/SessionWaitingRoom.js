// models/SessionWaitingRoom.js
// Tracks students in the waiting room before the host admits them.

import { DataTypes } from "sequelize";

export default (sequelize) => {
  const SessionWaitingRoom = sequelize.define(
    "SessionWaitingRoom",
    {
      id: {
        type:          DataTypes.INTEGER,
        primaryKey:    true,
        autoIncrement: true,
      },

      classSessionId: {
        type:      DataTypes.INTEGER,
        allowNull: false,
      },

      userId: {
        type:      DataTypes.INTEGER,
        allowNull: false,
      },

      // Snapshot so the host can see who's waiting without extra joins
      fullName: {
        type:      DataTypes.STRING,
        allowNull: false,
      },

      profilePicUrl: {
        type:         DataTypes.STRING,
        defaultValue: "",
      },

      // waiting | admitted | denied
      status: {
        type:         DataTypes.ENUM("waiting", "admitted", "denied"),
        defaultValue: "waiting",
      },

      requestedAt: {
        type:         DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },

      admittedAt: DataTypes.DATE,
      deniedAt:   DataTypes.DATE,
      reason:     DataTypes.STRING,
    },
    {
      tableName:  "session_waiting_rooms",
      timestamps: true,
      indexes: [
        // One record per user per session (upsert-safe)
        {
          unique: true,
          fields: ["classSessionId", "userId"],
        },
      ],
    }
  );

  SessionWaitingRoom.associate = (models) => {
    SessionWaitingRoom.belongsTo(models.ClassSession, {
      foreignKey: "classSessionId",
    });
    SessionWaitingRoom.belongsTo(models.User, {
      foreignKey: "userId",
    });
  };

  return SessionWaitingRoom;
};
