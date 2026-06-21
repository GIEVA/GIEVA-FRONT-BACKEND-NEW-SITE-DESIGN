// models/QuizAttempt.js
import { DataTypes } from "sequelize";

export default (sequelize) => {
  const QuizAttempt = sequelize.define(
    "QuizAttempt",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

      quizId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      score: { type: DataTypes.INTEGER, defaultValue: 0 },
      totalMarks: DataTypes.INTEGER,

      status: {
        type: DataTypes.ENUM("in_progress", "completed", "timeout"),
        defaultValue: "in_progress",
      },

      timeLimitSeconds: DataTypes.INTEGER,
      timeSpentSeconds: { type: DataTypes.INTEGER, defaultValue: 0 },
      autoSubmitted: { type: DataTypes.BOOLEAN, defaultValue: false },

      startedAt: DataTypes.DATE,
      submittedAt: DataTypes.DATE,
    },
    {
      tableName: "quiz_attempts",
      timestamps: true,

      // ✅ CORRECT PLACE
      indexes: [
        {
          fields: ["quizId", "userId"],
        },
      ],
    }
  );

  QuizAttempt.associate = (models) => {
    QuizAttempt.belongsTo(models.Quiz, { foreignKey: "quizId" });
    QuizAttempt.belongsTo(models.User, { foreignKey: "userId" });
    QuizAttempt.hasMany(models.QuizAnswer, { foreignKey: "attemptId" });
  };

  return QuizAttempt;
};