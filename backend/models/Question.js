// models/Question.js
import { DataTypes } from "sequelize";

export default (sequelize) => {
  const Question = sequelize.define("Question", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    quizId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    questionText: DataTypes.TEXT,

    optionA: DataTypes.STRING,
    optionB: DataTypes.STRING,
    optionC: DataTypes.STRING,
    optionD: DataTypes.STRING,

    correctAnswer: DataTypes.STRING, // A / B / C / D
    difficulty: {
      type: DataTypes.ENUM("easy", "medium", "hard"),
      defaultValue: "medium",
    },


    marks: { type: DataTypes.INTEGER, defaultValue: 1 },

  }, {
    tableName: "questions",
    timestamps: false,
  });

  Question.associate = (models) => {
    Question.belongsTo(models.Quiz, { foreignKey: "quizId" });
  };

  return Question;
};
