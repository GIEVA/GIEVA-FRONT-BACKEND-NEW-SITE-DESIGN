// models/QuizQuestion.js
import { DataTypes } from "sequelize";
export default (sequelize) => {
  const QuizQuestion = sequelize.define("QuizQuestion", {
    id:        { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    eventId:   { type: DataTypes.INTEGER, allowNull: true },  // null = global question bank

    subject: {
      type: DataTypes.ENUM("Biology", "Physics", "Chemistry", "Mathematics"),
      allowNull: false,
    },
    classLevel: { type: DataTypes.ENUM("SS2", "SS3", "both"), defaultValue: "both" },

    // Round assignment: 1, 2, "tiebreak", or null (unassigned)
    roundAssignment: { type: DataTypes.STRING(20), allowNull: true },

    questionText: { type: DataTypes.TEXT, allowNull: false },

    // Answer options stored as JSON: { A: "...", B: "...", C: "...", D: "..." }
    options:      { type: DataTypes.JSON, allowNull: false },

    // NEVER sent to the client until result is revealed
    correctAnswer: { type: DataTypes.ENUM("A","B","C","D"), allowNull: false },

    explanation: { type: DataTypes.TEXT, allowNull: true },
    difficulty:  { type: DataTypes.ENUM("easy","medium","hard"), defaultValue: "medium" },
    marks:       { type: DataTypes.DECIMAL(4,2), defaultValue: 1 },

    status: {
      type: DataTypes.ENUM("draft", "approved", "archived", "voided"),
      defaultValue: "draft",
    },

    // If voided during live quiz, record why
    voidReason:   { type: DataTypes.TEXT,    allowNull: true },
    voidedBy:     { type: DataTypes.INTEGER, allowNull: true },
    voidedAt:     { type: DataTypes.DATE,    allowNull: true },

    createdBy:    { type: DataTypes.INTEGER, allowNull: true },
  }, { tableName: "quiz_questions", timestamps: true });

  QuizQuestion.associate = (models) => {
    QuizQuestion.belongsTo(models.QuizEvent,    { foreignKey: "eventId"   });
    QuizQuestion.belongsTo(models.User,         { foreignKey: "createdBy", as: "creator" });
    QuizQuestion.hasMany(models.QuizRoundQuestion, { foreignKey: "questionId" });
    QuizQuestion.hasMany(models.QuizAnswer,     { foreignKey: "questionId" });
  };

  return QuizQuestion;
};
