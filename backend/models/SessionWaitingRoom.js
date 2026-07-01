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
 
      // CHANGED: now nullable — null for guest attendees
      userId: {
        type:      DataTypes.INTEGER,
        allowNull: true,
      },
 
      // NEW: stable per-guest identity for unauthenticated attendees
      // joining a public meeting. Format: "guest-<uuid>".
      guestId: {
        type:      DataTypes.STRING(64),
        allowNull: true,
      },
 
      // NEW: marks whether this row represents a guest or a real user.
      // Convenient for queries/UI without re-deriving from
      // userId/guestId nullability every time.
      isGuest: {
        type:         DataTypes.BOOLEAN,
        defaultValue: false,
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
        // One record per registered user per session (upsert-safe)
        {
          unique: true,
          fields: ["classSessionId", "userId"],
          name:   "uniq_session_user",
        },
        // One record per guest per session (upsert-safe)
        {
          unique: true,
          fields: ["classSessionId", "guestId"],
          name:   "uniq_session_guest",
        },
      ],
    }
  );
 
  SessionWaitingRoom.associate = (models) => {
    SessionWaitingRoom.belongsTo(models.ClassSession, {
      foreignKey: "classSessionId",
    });
    // NOTE: no belongsTo(models.User) constraint enforcement issue here
    // since userId is now nullable — Sequelize handles nullable FKs fine.
    SessionWaitingRoom.belongsTo(models.User, {
      foreignKey: "userId",
    });
  };
 
  return SessionWaitingRoom;
};
