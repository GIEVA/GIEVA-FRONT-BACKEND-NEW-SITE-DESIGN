// models/QuizAnswer.js
import { DataTypes } from "sequelize";

export default (sequelize) => {
  const QuizAnswer = sequelize.define("QuizAnswer", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    attemptId: {
  type: DataTypes.INTEGER,
  allowNull: false,
    },
    questionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    questionId: DataTypes.INTEGER,
    

    selectedAnswer: DataTypes.STRING,
    isCorrect: DataTypes.BOOLEAN,

  }, {
    tableName: "quiz_answers",
    timestamps: false,
  });

  QuizAnswer.associate = (models) => {
    QuizAnswer.belongsTo(models.QuizAttempt, { foreignKey: "attemptId" });
    QuizAnswer.belongsTo(models.Question, { foreignKey: "questionId" });
  };

  return QuizAnswer;
};
