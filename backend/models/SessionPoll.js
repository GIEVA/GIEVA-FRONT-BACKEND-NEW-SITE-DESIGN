// models/SessionPoll.js
// A poll (in-meeting, live results) or a survey (multi-question, sent to attendees after the session).
//
// `questions` shape (validated server-side):
//   [{ id: "q1", type: "single" | "multiple" | "rating" | "text", text: "...", options: ["A","B"], required: true }]
//
// STRING + isIn is used instead of ENUM so a later status/kind change never needs a Postgres type migration.

export default (sequelize, DataTypes) => {
  const SessionPoll = sequelize.define(
    "SessionPoll",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      classSessionId: { type: DataTypes.INTEGER, allowNull: false },
      createdBy: { type: DataTypes.INTEGER, allowNull: false },
      kind: {
        type: DataTypes.STRING(16),
        allowNull: false,
        defaultValue: "poll",
        validate: { isIn: [["poll", "survey"]] },
      },
      title: { type: DataTypes.STRING(255), allowNull: false },
      questions: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
      status: {
        type: DataTypes.STRING(16),
        allowNull: false,
        defaultValue: "draft",
        validate: { isIn: [["draft", "live", "closed"]] },
      },
      isAnonymous: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      showResultsToParticipants: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      // Surveys only: launch automatically (and notify attendees) when the session ends.
      autoSendOnEnd: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      launchedAt: { type: DataTypes.DATE, allowNull: true },
      closedAt: { type: DataTypes.DATE, allowNull: true },
    },
    { tableName: "session_polls", indexes: [{ fields: ["classSessionId"] }] }
  );

  SessionPoll.associate = (models) => {
    SessionPoll.belongsTo(models.ClassSession, { foreignKey: "classSessionId" });
    SessionPoll.hasMany(models.SessionPollResponse, { foreignKey: "pollId", as: "responses" });
  };

  return SessionPoll;
};
