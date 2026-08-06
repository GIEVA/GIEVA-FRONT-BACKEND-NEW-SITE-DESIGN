import { DataTypes } from "sequelize";

export default (sequelize) => {
  const Project = sequelize.define(
    "Project",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

      title: { type: DataTypes.STRING(200), allowNull: false },
      slug: { type: DataTypes.STRING(220), allowNull: false, unique: true },

      description: { type: DataTypes.TEXT, allowNull: true },

      imageUrl: { type: DataTypes.STRING(500), allowNull: true },
      imageCloudinaryId: { type: DataTypes.STRING(300), allowNull: true },

      // e.g. "Education", "Health", "Skills & Tech", "Partnership"
      category: { type: DataTypes.STRING(80), allowNull: true, defaultValue: "General" },

      // Optional credit line — e.g. "Sterling Bank", "US Embassy Nigeria", "British Council"
      partnerName: { type: DataTypes.STRING(150), allowNull: true },

      href: { type: DataTypes.STRING(500), allowNull: true },
      external: { type: DataTypes.BOOLEAN, defaultValue: false },

      featured: { type: DataTypes.BOOLEAN, defaultValue: false },

      order: { type: DataTypes.INTEGER, defaultValue: 0 },

      status: { type: DataTypes.ENUM("draft", "published", "archived"), defaultValue: "draft" },

      createdBy: { type: DataTypes.INTEGER, allowNull: true },
    },
    { tableName: "projects", timestamps: true }
  );

  Project.associate = (models) => {
    Project.belongsTo(models.User, { foreignKey: "createdBy", as: "creator" });
  };

  return Project;
};