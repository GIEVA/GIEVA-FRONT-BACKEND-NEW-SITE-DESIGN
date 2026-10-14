// models/SessionPollResponse.js
// One row per (poll, user). The unique index is what stops double-voting.
// `answers` is { [questionId]: "Option" | ["Opt1","Opt2"] | 4 | "free text" }.
//
// For anonymous polls userId is still stored (needed for the unique index) but is
// never returned by any API.

export default (sequelize, DataTypes) => {
  const SessionPollResponse = sequelize.define(
    "SessionPollResponse",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      pollId: { type: DataTypes.INTEGER, allowNull: false },
      userId: { type: DataTypes.INTEGER, allowNull: false },
      answers: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
    },
    {
      tableName: "session_poll_responses",
      indexes: [{ unique: true, fields: ["pollId", "userId"] }],
    }
  );

  SessionPollResponse.associate = (models) => {
    SessionPollResponse.belongsTo(models.SessionPoll, { foreignKey: "pollId" });
    SessionPollResponse.belongsTo(models.User, { foreignKey: "userId" });
  };

  return SessionPollResponse;
};
