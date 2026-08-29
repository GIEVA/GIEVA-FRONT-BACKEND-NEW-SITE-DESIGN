// models/QuizScore.js
import { DataTypes } from "sequelize";
export default (sequelize) => {
  const QuizScore = sequelize.define("QuizScore", {
    id:            { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    eventId:       { type: DataTypes.INTEGER, allowNull: false },
    roundId:       { type: DataTypes.INTEGER, allowNull: false },
    participantId: { type: DataTypes.INTEGER, allowNull: false },

    totalMarks:    { type: DataTypes.DECIMAL(6,2), defaultValue: 0 },
    correctCount:  { type: DataTypes.INTEGER, defaultValue: 0 },
    incorrectCount:{ type: DataTypes.INTEGER, defaultValue: 0 },
    unansweredCount:{ type: DataTypes.INTEGER, defaultValue: 0 },

    // Ranking within this round (set after round completes)
    roundRank:     { type: DataTypes.INTEGER, allowNull: true },

    // Whether this score has been confirmed by the admin
    confirmed:     { type: DataTypes.BOOLEAN, defaultValue: false },
    confirmedBy:   { type: DataTypes.INTEGER, allowNull: true },
    confirmedAt:   { type: DataTypes.DATE,    allowNull: true },

    // Notes for manual adjustments
    adjustmentNote: { type: DataTypes.TEXT, allowNull: true },
    adjustedBy:    { type: DataTypes.INTEGER, allowNull: true },
  }, { tableName: "quiz_scores", timestamps: true });

  QuizScore.associate = (models) => {
    QuizScore.belongsTo(models.QuizEvent,       { foreignKey: "eventId"       });
    QuizScore.belongsTo(models.QuizRound,       { foreignKey: "roundId"       });
    QuizScore.belongsTo(models.QuizParticipant, { foreignKey: "participantId" });
  };

  return QuizScore;
};
