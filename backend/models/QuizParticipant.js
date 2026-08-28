// models/QuizParticipant.js
import { DataTypes } from "sequelize";
export default (sequelize) => {
  const QuizParticipant = sequelize.define("QuizParticipant", {
    id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    eventId:     { type: DataTypes.INTEGER, allowNull: false },
    userId:      { type: DataTypes.INTEGER, allowNull: true },  // null = guest code join
    name:        { type: DataTypes.STRING(120), allowNull: false },
    school:      { type: DataTypes.STRING(200), allowNull: true },
    classLevel:  { type: DataTypes.ENUM("SS2", "SS3"), allowNull: true },
    displayNumber: { type: DataTypes.INTEGER, allowNull: true },   // seat/display order
    participantCode: { type: DataTypes.STRING(20), unique: true, allowNull: false },
    photoUrl:    { type: DataTypes.STRING(500), allowNull: true },

    // Connection state shown on readiness dashboard
    connectionStatus: {
      type: DataTypes.ENUM(
        "not_connected", "connected", "ready",
        "disconnected", "needs_assistance"
      ),
      defaultValue: "not_connected",
    },

    // Competition status
    status: {
      type: DataTypes.ENUM(
        "registered", "active", "eliminated",
        "qualified_round2", "tiebreak", "completed", "disqualified"
      ),
      defaultValue: "registered",
    },

    // Which round they're eliminated after (null if still active)
    eliminatedAfterRound: { type: DataTypes.INTEGER, allowNull: true },
    eliminationReason:    { type: DataTypes.TEXT,    allowNull: true },
    eliminationConfirmedBy: { type: DataTypes.INTEGER, allowNull: true },
    eliminatedAt:         { type: DataTypes.DATE,    allowNull: true },

    // Final overall ranking
    finalRank:   { type: DataTypes.INTEGER, allowNull: true },

    lastSeenAt:  { type: DataTypes.DATE, allowNull: true },
    joinedAt:    { type: DataTypes.DATE, allowNull: true },
  }, { tableName: "quiz_participants", timestamps: true });

  QuizParticipant.associate = (models) => {
    QuizParticipant.belongsTo(models.QuizEvent, { foreignKey: "eventId" });
    QuizParticipant.belongsTo(models.User,      { foreignKey: "userId", as: "user" });
    QuizParticipant.hasMany(models.QuizAnswer,  { foreignKey: "participantId", as: "answers" });
    QuizParticipant.hasMany(models.QuizScore,   { foreignKey: "participantId", as: "scores" });
  };

  return QuizParticipant;
};
