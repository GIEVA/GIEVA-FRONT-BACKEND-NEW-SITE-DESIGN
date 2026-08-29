// models/TechnicalIncident.js
//
// Manually-logged technical incidents during a live quiz event
// (connectivity drops, device failures, AV issues, etc.), recorded
// via quizEventController.js's logIncident().

import { DataTypes } from "sequelize";

export default (sequelize) => {
  const TechnicalIncident = sequelize.define("TechnicalIncident", {
    id:      { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    eventId: { type: DataTypes.INTEGER, allowNull: false },

    // Nullable — an incident isn't always tied to one participant
    // (e.g. a venue-wide AV failure affects everyone).
    participantId: { type: DataTypes.INTEGER, allowNull: true },

    type: {
      type: DataTypes.ENUM(
        "connectivity",
        "device_failure",
        "audio_visual",
        "power",
        "venue",
        "other"
      ),
      allowNull:   false,
      defaultValue: "other",
    },

    description: { type: DataTypes.TEXT, allowNull: false },
    actionTaken: { type: DataTypes.TEXT, allowNull: true },

    occurredAt: { type: DataTypes.DATE, allowNull: false },
  }, {
    tableName:  "quiz_technical_incidents",
    timestamps: true,
  });

  TechnicalIncident.associate = (models) => {
    TechnicalIncident.belongsTo(models.QuizEvent,       { foreignKey: "eventId" });
    TechnicalIncident.belongsTo(models.QuizParticipant, { foreignKey: "participantId" });
  };

  return TechnicalIncident;
};