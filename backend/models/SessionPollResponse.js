
export default (sequelize, DataTypes) => {
  const SessionPollResponse = sequelize.define(
    "SessionPollResponse",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      pollId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      answers: {
        type: DataTypes.JSON,
        allowNull: false,
      },
    },
    {
      tableName: "session_poll_responses",
      indexes: [
        {
          unique: true,
          fields: ["pollId", "userId"],
        },
      ],
    }
  );

  SessionPollResponse.associate = (models) => {
    SessionPollResponse.belongsTo(models.SessionPoll, {
      foreignKey: "pollId",
    });
    SessionPollResponse.belongsTo(models.User, {
      foreignKey: "userId",
    });
  };

  return SessionPollResponse;
};
