// models/TutorStudent.js

import { DataTypes }
from "sequelize";

export default (sequelize) => {

  const TutorStudent =
    sequelize.define(
      "TutorStudent",
      {

        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },

        tutorProfileId: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },

        studentId: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },

        courseId: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },

        assignedBy: {
          type: DataTypes.INTEGER,
        },

        assignedAt: {
          type: DataTypes.DATE,
          defaultValue:
            DataTypes.NOW,
        },

        status: {
          type: DataTypes.ENUM(
            "active",
            "inactive"
          ),
          defaultValue:
            "active",
        },

      },
      {
        tableName:
          "tutor_students",

        timestamps: true,
      }
    );



  TutorStudent.associate =
    (models) => {

      TutorStudent.belongsTo(
        models.TutorProfile,
        {
          foreignKey:
            "tutorProfileId",
        }
      );

      TutorStudent.belongsTo(
        models.User,
        {
          foreignKey:
            "studentId",

          as: "student",
        }
      );

      TutorStudent.belongsTo(
        models.Course,
        {
          foreignKey:
            "courseId",
        }
      );
    };

  return TutorStudent;
};