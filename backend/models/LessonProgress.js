// models/LessonProgress.js

import { DataTypes } from "sequelize";

export default (sequelize) => {
  const LessonProgress = sequelize.define(
    "LessonProgress",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      lessonId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      completed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },

      watchTime: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },

      progressPercent: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
      },

      lastAccessedAt: {
        type: DataTypes.DATE,
      },

      completedAt: {
        type: DataTypes.DATE,
      },
    },
    {
      tableName: "lesson_progress",
      timestamps: true,

      indexes: [
        {
          unique: true,
          fields: ["userId", "lessonId"],
        },

        {
          fields: ["userId"],
        },

        {
          fields: ["lessonId"],
        },
      ],
    }
  );

  // ================= ASSOCIATIONS =================

  LessonProgress.associate = (models) => {

    // USER
    LessonProgress.belongsTo(models.User, {
      foreignKey: "userId",
      onDelete: "CASCADE",
    });

    // LESSON
    LessonProgress.belongsTo(models.Lesson, {
      foreignKey: "lessonId",
      onDelete: "CASCADE",
    });

  };

  return LessonProgress;
};