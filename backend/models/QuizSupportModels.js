// models/QuizPanelist.js
import { DataTypes } from "sequelize";
export default (sequelize) => {
  const QuizPanelist = sequelize.define("QuizPanelist", {
    id:      { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    eventId: { type: DataTypes.INTEGER, allowNull: false },
    userId:  { type: DataTypes.INTEGER, allowNull: false },

    // Whether this panelist can also adjust scores (normally admin-only)
    canAdjustScores: { type: DataTypes.BOOLEAN, defaultValue: false },
    canAnnounce:     { type: DataTypes.BOOLEAN, defaultValue: true  },

    role: {
      type: DataTypes.ENUM("panelist", "observer"),
      defaultValue: "panelist",
    },

    joinedAt:    { type: DataTypes.DATE, allowNull: true },
    isConnected: { type: DataTypes.BOOLEAN, defaultValue: false },
  }, { tableName: "quiz_panelists", timestamps: true });

  QuizPanelist.associate = (models) => {
    QuizPanelist.belongsTo(models.QuizEvent, { foreignKey: "eventId" });
    QuizPanelist.belongsTo(models.User,      { foreignKey: "userId"  });
  };

  return QuizPanelist;
};


// ─────────────────────────────────────────────────────────────────────────────
// models/QuizAuditEvent.js  (in the same file for brevity — split if preferred)
// ─────────────────────────────────────────────────────────────────────────────
export const defineQuizAuditEvent = (sequelize) => {
  const QuizAuditEvent = sequelize.define("QuizAuditEvent", {
    id:      { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    eventId: { type: DataTypes.INTEGER, allowNull: false },
    userId:  { type: DataTypes.INTEGER, allowNull: true  },  // who triggered it

    action: {
      type: DataTypes.ENUM(
        "event_created","event_published","event_started","event_paused",
        "event_resumed","event_cancelled","event_completed",
        "round_started","round_completed",
        "question_opened","question_paused","question_resumed",
        "question_locked","result_revealed","question_voided",
        "answer_submitted","answer_locked","timer_extended",
        "elimination_reviewed","elimination_confirmed",
        "tiebreak_started","tiebreak_completed",
        "score_adjusted","participant_disqualified",
        "panelist_joined","participant_joined","participant_disconnected",
        "manual_incident_recorded"
      ),
      allowNull: false,
    },

    description: { type: DataTypes.TEXT,    allowNull: true },
    reason:      { type: DataTypes.TEXT,    allowNull: true },

    // JSON snapshot of before/after values for score adjustments etc.
    beforeValue: { type: DataTypes.JSON, allowNull: true },
    afterValue:  { type: DataTypes.JSON, allowNull: true },

    // Related entity refs (flexible)
    relatedParticipantId: { type: DataTypes.INTEGER, allowNull: true },
    relatedQuestionId:    { type: DataTypes.INTEGER, allowNull: true },
    relatedRoundId:       { type: DataTypes.INTEGER, allowNull: true },
  }, {
    tableName: "quiz_audit_events",
    timestamps: true,
    updatedAt: false,  // audit log rows are immutable
  });

  QuizAuditEvent.associate = (models) => {
    QuizAuditEvent.belongsTo(models.QuizEvent, { foreignKey: "eventId" });
    QuizAuditEvent.belongsTo(models.User,      { foreignKey: "userId", as: "actor" });
  };

  return QuizAuditEvent;
};


// ─────────────────────────────────────────────────────────────────────────────
// models/TechnicalIncident.js
// ─────────────────────────────────────────────────────────────────────────────
export const defineTechnicalIncident = (sequelize) => {
  const TechnicalIncident = sequelize.define("TechnicalIncident", {
    id:            { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    eventId:       { type: DataTypes.INTEGER, allowNull: false },
    participantId: { type: DataTypes.INTEGER, allowNull: true  },

    type: {
      type: DataTypes.ENUM(
        "disconnection","late_submission","double_click",
        "timer_issue","answer_dispute","other"
      ),
      defaultValue: "other",
    },

    description:  { type: DataTypes.TEXT, allowNull: false },
    actionTaken:  { type: DataTypes.TEXT, allowNull: true  },
    resolution:   { type: DataTypes.TEXT, allowNull: true  },

    resolvedBy:   { type: DataTypes.INTEGER, allowNull: true },
    resolvedAt:   { type: DataTypes.DATE,    allowNull: true },
    isResolved:   { type: DataTypes.BOOLEAN, defaultValue: false },

    occurredAt:   { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  }, { tableName: "technical_incidents", timestamps: true });

  TechnicalIncident.associate = (models) => {
    TechnicalIncident.belongsTo(models.QuizEvent,       { foreignKey: "eventId"       });
    TechnicalIncident.belongsTo(models.QuizParticipant, { foreignKey: "participantId" });
    TechnicalIncident.belongsTo(models.User,            { foreignKey: "resolvedBy",    as: "resolver" });
  };

  return TechnicalIncident;
};
