import { DataTypes } from "sequelize";

export default (sequelize) => {
  const CourseModule = sequelize.define(
    "CourseModule",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

      courseId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      description: DataTypes.TEXT,

      orderIndex: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },

      unlockDays: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },

      isPublished: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: "course_modules",
      timestamps: true,
      indexes: [
        { fields: ["courseId"] },
        { fields: ["orderIndex"] },
        { unique: true, fields: ["courseId", "orderIndex"] }, // 🔥 prevent duplicates
      ],
    }
  );

  CourseModule.associate = (models) => {
    CourseModule.belongsTo(models.Course, {
      foreignKey: "courseId",
      onDelete: "CASCADE",
    });

    CourseModule.hasMany(models.Lesson, {
      foreignKey: "moduleId",
    });
  };

  return CourseModule;
};