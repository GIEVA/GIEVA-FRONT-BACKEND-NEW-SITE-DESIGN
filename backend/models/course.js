import { DataTypes } from "sequelize";

export default (sequelize) => {
  const Course = sequelize.define(
    "Course",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      description: DataTypes.TEXT,


      // ✅ ENUM CATEGORY
      category: {
        type: DataTypes.ENUM("SAT", "IELTS", "CODING", "GRE", "TOEFL"),
        allowNull: false,
      },

     monthlyPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },

      tutorialMode: {
        type: DataTypes.ENUM("onsite", "virtual"),
        defaultValue: "onsite",
      },

      maxDurationMonths: {
        type: DataTypes.INTEGER,
        defaultValue: 12,
      },
      level: DataTypes.STRING,

      thumbnail: DataTypes.STRING,

      // ✅ OWNER (User)
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      // ✅ TEACHER PROFILE
      tutorProfileId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },

      isPublished: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: "courses",
      timestamps: true,
    }
  );

  Course.associate = (models) => {
    Course.belongsTo(models.User, {
      foreignKey: "userId",
      onDelete: "CASCADE",
    });

    Course.belongsTo(models.TutorProfile, {
      foreignKey: "tutorProfileId",
    });

    Course.hasMany(models.CourseModule, { foreignKey: "courseId" });
    Course.hasMany(models.Enrollment, { foreignKey: "courseId" });
    Course.hasMany(models.Payment, { foreignKey: "courseId" });
    Course.hasMany(models.TutorStudent, {
      foreignKey: "courseId",
    });
  };

  return Course;
};