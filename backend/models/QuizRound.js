// models/QuizRound.js
import { DataTypes } from "sequelize";
export default (sequelize) => {
  const QuizRound = sequelize.define("QuizRound", {
    id:            { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    eventId:       { type: DataTypes.INTEGER, allowNull: false },
    roundNumber:   { type: DataTypes.INTEGER, allowNull: false }, // 1, 2, or 99 (tiebreak)
    label:         { type: DataTypes.STRING(60), defaultValue: "Round 1" },
    participantLimit: { type: DataTypes.INTEGER, allowNull: true },
    questionCount: { type: DataTypes.INTEGER,    allowNull: true },
    status: {
      type: DataTypes.ENUM("pending","active","completed","cancelled"),
      defaultValue: "pending",
    },
    currentQuestionIdx: { type: DataTypes.INTEGER, defaultValue: 0 },
    startedAt:     { type: DataTypes.DATE, allowNull: true },
    completedAt:   { type: DataTypes.DATE, allowNull: true },
    // Tiebreak-specific: which participants are in it
    tiebreakParticipants: { type: DataTypes.JSON, allowNull: true },
  }, { tableName: "quiz_rounds", timestamps: true });

  QuizRound.associate = (models) => {
    QuizRound.belongsTo(models.QuizEvent,       { foreignKey: "eventId" });
    QuizRound.hasMany(models.QuizRoundQuestion,  { foreignKey: "roundId", as: "roundQuestions" });
    QuizRound.hasMany(models.QuizScore,          { foreignKey: "roundId", as: "scores" });
  };

  return QuizRound;
};
