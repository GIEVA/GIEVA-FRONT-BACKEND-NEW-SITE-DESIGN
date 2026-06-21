// models/Lesson.js
import { DataTypes } from "sequelize";

export default (sequelize) => {
  const Lesson = sequelize.define(
    "Lesson",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

      moduleId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      type: {
        type: DataTypes.ENUM(
          "video",
          "pdf",
          "image",
          "link",
          "text",
          "quiz" // 🔥 NEW
        ),
        allowNull: false,
      },

      contentUrl: DataTypes.STRING,
      contentText: DataTypes.TEXT,

      cloudinaryPublicId: DataTypes.STRING,
      cloudinaryResourceType: DataTypes.STRING,

      youtubeVideoId: DataTypes.STRING,

      // 🔥 link quiz to lesson
      quizId: DataTypes.INTEGER,

      durationSeconds: DataTypes.INTEGER,

      orderIndex: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      isPublished: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },

      isPreview: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: "lessons",
      timestamps: true,
      indexes: [
        { fields: ["moduleId"] },
        { unique: true, fields: ["moduleId", "orderIndex"] }, // 🔥 important
      ],
    }
  );

  Lesson.associate = (models) => {
    Lesson.belongsTo(models.CourseModule, {
      foreignKey: "moduleId",
      onDelete: "CASCADE",
    });

    Lesson.belongsTo(models.Quiz, {
      foreignKey: "quizId",
    });

    Lesson.hasMany(models.LessonProgress, {
      foreignKey: "lessonId",
    });
  };

  return Lesson;
};