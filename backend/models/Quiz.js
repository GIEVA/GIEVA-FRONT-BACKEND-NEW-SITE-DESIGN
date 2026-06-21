// models/Quiz.js
import { DataTypes } from "sequelize";

export default (sequelize) => {
  const Quiz = sequelize.define("Quiz", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    courseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    title: { type: DataTypes.STRING, allowNull: false },
    description: DataTypes.TEXT,

    durationMinutes: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    totalMarks: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    // ✅ FIX: add isPaid
    isPaid: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    price: {
      type: DataTypes.DECIMAL,
      defaultValue: 0,
    },

    active: { type: DataTypes.BOOLEAN, defaultValue: true },
  });

  Quiz.associate = (models) => {
    Quiz.belongsTo(models.Course, { foreignKey: "courseId" });
    Quiz.hasMany(models.Question, { foreignKey: "quizId" });
    Quiz.hasMany(models.QuizAttempt, { foreignKey: "quizId" });
  };

  return Quiz;
};