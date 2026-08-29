// models/QuizEventAnswer.js
import { DataTypes } from "sequelize";
export default (sequelize) => {
  const QuizEventAnswer = sequelize.define("QuizEventAnswer", {
    id:              { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    participantId:   { type: DataTypes.INTEGER, allowNull: false },
    questionId:      { type: DataTypes.INTEGER, allowNull: false },
    roundQuestionId: { type: DataTypes.INTEGER, allowNull: false },
    eventId:         { type: DataTypes.INTEGER, allowNull: false },

    // The option the participant chose: A, B, C, D, or null (unanswered)
    selectedOption: { type: DataTypes.ENUM("A","B","C","D"), allowNull: true },

    // Whether they changed their answer before locking
    changedAnswer:  { type: DataTypes.BOOLEAN, defaultValue: false },
    previousOption: { type: DataTypes.ENUM("A","B","C","D"), allowNull: true },

    // Scored server-side after question locks — never computed on client
    isCorrect:       { type: DataTypes.BOOLEAN, allowNull: true },
    marksEarned:     { type: DataTypes.DECIMAL(4,2), defaultValue: 0 },

    // Timing
    submittedAt:     { type: DataTypes.DATE, allowNull: true },
    lockedAt:        { type: DataTypes.DATE, allowNull: true },

    // How the answer was locked
    lockReason: {
      type: DataTypes.ENUM("submitted","timer_expired","admin_locked","question_voided"),
      allowNull: true,
    },

    // Connection state at submission time (for audit)
    connectionStatusAtSubmit: { type: DataTypes.STRING(30), allowNull: true },
  }, {
    // Renamed from "quiz_answers" — that table name is already owned by
    // the LMS course-quiz QuizAnswer model. Sharing it would mean two
    // models with completely different columns fighting over one table
    // on every sequelize.sync().
    tableName: "quiz_event_answers",
    timestamps: true,
  });

  QuizEventAnswer.associate = (models) => {
    QuizEventAnswer.belongsTo(models.QuizParticipant,   { foreignKey: "participantId" });
    QuizEventAnswer.belongsTo(models.QuizQuestion,      { foreignKey: "questionId"    });
    QuizEventAnswer.belongsTo(models.QuizRoundQuestion, { foreignKey: "roundQuestionId" });
    QuizEventAnswer.belongsTo(models.QuizEvent,         { foreignKey: "eventId"       });
  };

  return QuizEventAnswer;
};