// models/SessionQuestion.js  (webinar Q&A)
export default (sequelize, DataTypes) => {
  const SessionQuestion = sequelize.define(
    "SessionQuestion",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      classSessionId: { type: DataTypes.INTEGER, allowNull: false },
      userId: { type: DataTypes.INTEGER, allowNull: false },
      askerName: { type: DataTypes.STRING(150), allowNull: true },
      text: { type: DataTypes.STRING(600), allowNull: false },
      isAnonymous: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      // open -> waiting · live -> being answered out loud · answered -> typed/closed · dismissed -> hidden
      status: {
        type: DataTypes.STRING(12),
        allowNull: false,
        defaultValue: "open",
        validate: { isIn: [["open", "live", "answered", "dismissed"]] },
      },
      answer: { type: DataTypes.TEXT, allowNull: true },
      answeredBy: { type: DataTypes.INTEGER, allowNull: true },
      voters: { type: DataTypes.JSON, allowNull: false }, // user ids who upvoted (set in beforeValidate)
    },
    { tableName: "session_questions", indexes: [{ fields: ["classSessionId"] }] }
  );

  SessionQuestion.beforeValidate((q) => {
    if (!Array.isArray(q.voters)) q.voters = [];
  });

  SessionQuestion.associate = (models) => {
    SessionQuestion.belongsTo(models.ClassSession, { foreignKey: "classSessionId" });
  };

  return SessionQuestion;
};
