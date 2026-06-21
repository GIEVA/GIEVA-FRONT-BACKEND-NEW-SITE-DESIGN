// ExamRegistrationComment.js

import { DataTypes } from "sequelize";

export default (sequelize) => {
  const ExamRegistrationComment =
    sequelize.define(
      "ExamRegistrationComment",
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },

        registrationId: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },

        userId: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },

        comment: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
      },
      {
        tableName:
          "exam_registration_comments",

        timestamps: true,
      }
    );

  ExamRegistrationComment.associate =
    (models) => {

      ExamRegistrationComment.belongsTo(
        models.ExamRegistration,
        {
          foreignKey:
            "registrationId",
        }
      );

      ExamRegistrationComment.belongsTo(
        models.User,
        {
          foreignKey: "userId",
        }
      );
    };

  return ExamRegistrationComment;
};