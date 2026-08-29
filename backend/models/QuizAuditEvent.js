// models/QuizAuditEvent.js
//
// Append-only audit trail for a quiz event. Every admin state-changing
// action (start, open/lock/reveal question, void, elimination, score
// adjustment, pause/resume, completion...) writes one row here via the
// `audit()` helper in quizEventController.js / quizParticipantController.js.
//
// Written with fields inferred from every audit(...) call site across
// both controllers — this is the union of every `extras` shape used:
//   audit(eventId, userId, action, {
//     description, relatedQuestionId, relatedRoundId,
//     relatedParticipantId, reason, beforeValue, afterValue,
//   })

import { DataTypes } from "sequelize";

export default (sequelize) => {
  const QuizAuditEvent = sequelize.define("QuizAuditEvent", {
    id:      { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    eventId: { type: DataTypes.INTEGER, allowNull: false },

    // Who performed the action. Nullable — e.g. participant_joined is
    // audited with participant.userId, which is optional on QuizParticipant
    // (participants can be added by an admin without a linked user account).
    userId:  { type: DataTypes.INTEGER, allowNull: true },

    // e.g. "event_created", "event_started", "question_opened",
    // "question_locked", "result_revealed", "round_completed",
    // "elimination_confirmed", "tiebreak_started", "event_paused",
    // "event_resumed", "question_voided", "score_adjusted",
    // "event_completed", "participant_joined", "manual_incident_recorded"
    action:  { type: DataTypes.STRING(60), allowNull: false },

    description: { type: DataTypes.TEXT, allowNull: true },

    // Optional cross-references — only ever one or two of these are set
    // per row, depending on which entity the action concerned.
    relatedQuestionId:    { type: DataTypes.INTEGER, allowNull: true },
    relatedRoundId:       { type: DataTypes.INTEGER, allowNull: true },
    relatedParticipantId: { type: DataTypes.INTEGER, allowNull: true },

    // Free-text justification — required by the controller for void/adjust
    // actions, optional (defaulted) for pause.
    reason: { type: DataTypes.TEXT, allowNull: true },

    // Before/after snapshots for actions that overwrite state (e.g.
    // adjustScore's { totalMarks: before } / { totalMarks: newTotal },
    // confirmElimination's { qualified, eliminated } lists).
    beforeValue: { type: DataTypes.JSON, allowNull: true },
    afterValue:  { type: DataTypes.JSON, allowNull: true },
  }, {
    tableName:  "quiz_audit_events",
    timestamps: true,
    updatedAt:  false, // audit rows are append-only — never modified after creation
  });

  QuizAuditEvent.associate = (models) => {
    QuizAuditEvent.belongsTo(models.QuizEvent, { foreignKey: "eventId" });
    QuizAuditEvent.belongsTo(models.User,      { foreignKey: "userId", as: "actor" });
  };

  return QuizAuditEvent;
};