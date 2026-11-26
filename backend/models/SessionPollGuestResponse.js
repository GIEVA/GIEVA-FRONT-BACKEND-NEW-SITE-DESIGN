export default (sequelize, DataTypes) => {
  const SessionPollGuestResponse = sequelize.define(
    "SessionPollGuestResponse",
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
      webinarRegistrationId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      answers: {
        type: DataTypes.JSON,
        allowNull: false,
      },
    },
    {
      tableName: "session_poll_guest_responses",
      indexes: [
        {
          unique: true,
          fields: ["pollId", "webinarRegistrationId"],
        },
      ],
    }
  );

  return SessionPollGuestResponse;
};