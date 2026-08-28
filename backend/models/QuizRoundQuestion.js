// models/QuizRoundQuestion.js
import { DataTypes } from "sequelize";
export default (sequelize) => {
  const QuizRoundQuestion = sequelize.define("QuizRoundQuestion", {
    id:           { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    roundId:      { type: DataTypes.INTEGER, allowNull: false },
    questionId:   { type: DataTypes.INTEGER, allowNull: false },
    sequenceNumber: { type: DataTypes.INTEGER, allowNull: false }, // 1-based display order
    status: {
      type: DataTypes.ENUM("pending","open","locked","revealed","voided"),
      defaultValue: "pending",
    },
    openedAt:   { type: DataTypes.DATE, allowNull: true },
    lockedAt:   { type: DataTypes.DATE, allowNull: true },
    revealedAt: { type: DataTypes.DATE, allowNull: true },
    // Timer extension tracking
    timerExtendedSeconds: { type: DataTypes.INTEGER, defaultValue: 0 },
    pausedAt:     { type: DataTypes.DATE, allowNull: true },
    pauseDurationSeconds: { type: DataTypes.INTEGER, defaultValue: 0 },
  }, { tableName: "quiz_round_questions", timestamps: true });

  QuizRoundQuestion.associate = (models) => {
    QuizRoundQuestion.belongsTo(models.QuizRound,    { foreignKey: "roundId"    });
    QuizRoundQuestion.belongsTo(models.QuizQuestion,  { foreignKey: "questionId" });
    QuizRoundQuestion.hasMany(models.QuizAnswer,      { foreignKey: "roundQuestionId" });
  };

  return QuizRoundQuestion;
};
