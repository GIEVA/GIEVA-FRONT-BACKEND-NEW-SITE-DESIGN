// models/QuizEvent.js

import { DataTypes } from "sequelize";

export default (sequelize) => {
  const QuizEvent = sequelize.define("QuizEvent", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    name:        { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT,        allowNull: true },
    venue:       { type: DataTypes.STRING(300),  allowNull: true },
    eventDate:   { type: DataTypes.DATE,         allowNull: true },
    startTime:   { type: DataTypes.DATE,         allowNull: true },
    category:    { type: DataTypes.ENUM("SS2", "SS3", "SS2_SS3"), defaultValue: "SS2_SS3" },

    // State machine — matches doc section 14
    status: {
      type: DataTypes.ENUM(
        "draft", "published", "ready",
        "round1_intro", "round1_question_open", "round1_question_locked",
        "round1_result_revealed", "round1_completed",
        "elimination_review",
        "tiebreak_active",          // supplementary quiz for ties
        "round2_intro",
        "round2_question_open", "round2_question_locked",
        "round2_result_revealed", "round2_completed",
        "final_review", "completed",
        "paused", "cancelled"
      ),
      defaultValue: "draft",
    },

    // State before pause (so we can resume to the right state)
    pausedFromStatus: { type: DataTypes.STRING(60), allowNull: true },

    // Competition rules (configurable, defaults from doc)
    round1ParticipantLimit: { type: DataTypes.INTEGER, defaultValue: 10 },
    round1QuestionCount:    { type: DataTypes.INTEGER, defaultValue: 12 },
    round2ParticipantLimit: { type: DataTypes.INTEGER, defaultValue: 5  },
    round2QuestionCount:    { type: DataTypes.INTEGER, defaultValue: 12 },
    questionsPerSubject:    { type: DataTypes.INTEGER, defaultValue: 3  },
    eliminateAfterRound1:   { type: DataTypes.INTEGER, defaultValue: 5  },

    // Scoring config
    marksPerCorrect:   { type: DataTypes.DECIMAL(4,2), defaultValue: 1 },
    negativeMarking:   { type: DataTypes.BOOLEAN,       defaultValue: false },
    negativeMarkValue: { type: DataTypes.DECIMAL(4,2), defaultValue: 0 },

    // Timer config (seconds per question, 0 = no timer)
    questionTimerSeconds:  { type: DataTypes.INTEGER, defaultValue: 60 },
    immediateFeeback:      { type: DataTypes.BOOLEAN,  defaultValue: true },

    // Final score rule: "sum" | "round2_only" | "weighted"
    finalScoreRule:    { type: DataTypes.STRING(30), defaultValue: "sum" },
    round2Weight:      { type: DataTypes.DECIMAL(4,2), defaultValue: 1 }, // used if weighted

    // Tiebreak config
    tiebreakSubject:         { type: DataTypes.STRING(50), allowNull: true }, // null = sudden death
    tiebreakQuestionCount:   { type: DataTypes.INTEGER,   defaultValue: 10 },

    // Subject order (JSON array)
    subjectOrder: {
      type: DataTypes.JSON,
      defaultValue: ["Biology", "Physics", "Chemistry", "Mathematics"],
    },

    // Current active round (1 or 2)
    activeRound:       { type: DataTypes.INTEGER, allowNull: true },
    // Current question index within the active round (0-based)
    currentQuestionIdx:{ type: DataTypes.INTEGER, allowNull: true },

    // Audience display settings
    audienceScreenMode: {
      type: DataTypes.ENUM("public", "private", "link"),
      defaultValue: "public",
    },
    audienceAccessCode: { type: DataTypes.STRING(20), allowNull: true },

    // Unique join links
    eventCode:       { type: DataTypes.STRING(20),  unique: true, allowNull: true },
    participantLink: { type: DataTypes.STRING(500), allowNull: true },
    audienceLink:    { type: DataTypes.STRING(500), allowNull: true },
    panelistLink:    { type: DataTypes.STRING(500), allowNull: true },

    createdBy: { type: DataTypes.INTEGER, allowNull: false },
    startedAt: { type: DataTypes.DATE,    allowNull: true },
    completedAt:{ type: DataTypes.DATE,   allowNull: true },
  }, {
    tableName: "quiz_events",
    timestamps: true,
  });

  QuizEvent.associate = (models) => {
    QuizEvent.belongsTo(models.User, { foreignKey: "createdBy", as: "creator" });
    QuizEvent.hasMany(models.QuizParticipant, { foreignKey: "eventId", as: "participants" });
    QuizEvent.hasMany(models.QuizQuestion,    { foreignKey: "eventId", as: "questions" });
    QuizEvent.hasMany(models.QuizRound,       { foreignKey: "eventId", as: "rounds" });
    QuizEvent.hasMany(models.QuizAuditEvent,  { foreignKey: "eventId", as: "auditEvents" });
    QuizEvent.hasMany(models.QuizPanelist,    { foreignKey: "eventId", as: "panelists" });
  };

  return QuizEvent;
};
