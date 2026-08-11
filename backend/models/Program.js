// models/Program.js
import { DataTypes } from "sequelize";

export default (sequelize) => {
  const Program = sequelize.define(
    "Program",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

      title: { type: DataTypes.STRING(150), allowNull: false },

      // URL-friendly identifier, e.g. "choices" → /programs/choices
      slug: { type: DataTypes.STRING(180), allowNull: false, unique: true },

      tagline: { type: DataTypes.STRING(255), allowNull: true },

      // Intro paragraph shown above the sections
      description: { type: DataTypes.TEXT, allowNull: true },

      heroImageUrl: { type: DataTypes.STRING(500), allowNull: true },
      heroImageCloudinaryId: { type: DataTypes.STRING(300), allowNull: true },

      // Array of { id, name, description, imageUrl, imageCloudinaryId }
      sections: { type: DataTypes.JSON, allowNull: true, defaultValue: [] },

      category: { type: DataTypes.STRING(60), allowNull: true, defaultValue: "General" },

      order: { type: DataTypes.INTEGER, defaultValue: 0 },

      status: { type: DataTypes.ENUM("draft", "published", "archived"), defaultValue: "draft" },

      createdBy: { type: DataTypes.INTEGER, allowNull: true },
    },
    { tableName: "programs", timestamps: true }
  );

  Program.associate = (models) => {
    Program.belongsTo(models.User, { foreignKey: "createdBy", as: "creator" });
  };

  return Program;
};