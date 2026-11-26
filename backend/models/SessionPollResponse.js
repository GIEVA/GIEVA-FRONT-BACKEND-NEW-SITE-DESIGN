
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

      // Authenticated GIEVA user
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },

      // Unauthenticated webinar guest
      guestRegistrationId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },

      answers: {
        type: DataTypes.JSON,
        allowNull: false,
      },
    },
    {
      tableName: "session_poll_responses",
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ["pollId", "userId"],
        },
        {
          unique: true,
          fields: ["pollId", "guestRegistrationId"],
        },
      ],
      validate: {
        respondentMustBeOneType() {
          const hasUser = this.userId != null;
          const hasGuest = this.guestRegistrationId != null;

          if (hasUser === hasGuest) {
            throw new Error(
              "A response must belong to exactly one user or guest"
            );
          }
        },
      },
    }
  );

  SessionPollResponse.associate = (models) => {
    SessionPollResponse.belongsTo(models.SessionPoll, {
      foreignKey: "pollId",
    });

    SessionPollResponse.belongsTo(models.User, {
      foreignKey: "userId",
    });

    SessionPollResponse.belongsTo(models.WebinarRegistration, {
      foreignKey: "guestRegistrationId",
    });
  };

  return SessionPollResponse;
};
