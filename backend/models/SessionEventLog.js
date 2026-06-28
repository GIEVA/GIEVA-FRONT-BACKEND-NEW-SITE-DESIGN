// models/SessionEventLog.js
//
// FIX: `eventType` was a strict MySQL ENUM that only allowed:
//   "join","leave","mic_on","mic_off","camera_on","camera_off",
//   "screen_share","raise_hand"
//
// The controller sends "REACTION" (and other event types not in that
// list) — MySQL silently truncates/rejects any value not in the ENUM's
// declared set, which surfaced as:
//   "Data truncated for column 'eventType' at row 1"
//
// ENUMs in MySQL are rigid: every new event type requires a migration
// to ALTER the column definition, and forgetting to update the model
// to match (or vice versa) causes exactly this class of bug. Since
// this log is just an audit trail (not used for strict validation
// logic elsewhere), a plain STRING is the safer, more maintainable
// choice — it accepts any value the app throws at it, and validation
// (if you want it) can live in the controller layer where it's easy
// to update without a DB migration.

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

      // CHANGED: was DataTypes.ENUM(...) — now a flexible STRING.
      // Known values in use across the app (not enforced at the DB
      // level, just for reference):
      //   join, leave, mic_on, mic_off, camera_on, camera_off,
      //   screen_share, raise_hand, reaction, whiteboard_open,
      //   whiteboard_close, whiteboard_clear
      eventType: {
        type: DataTypes.STRING(40),
        allowNull: false,
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