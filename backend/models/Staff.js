// models/Staff.js
import { DataTypes } from "sequelize";

export default (sequelize) => {
  const Staff = sequelize.define(
    "Staff",
    {
      id: {
        type:          DataTypes.INTEGER,
        primaryKey:    true,
        autoIncrement: true,
      },

      name: {
        type:      DataTypes.STRING(120),
        allowNull: false,
      },

      role: {
        type:      DataTypes.STRING(120),
        allowNull: false,
      },

      // Cloudinary URL
      imageUrl: {
        type:      DataTypes.STRING(500),
        allowNull: true,
      },

      imageCloudinaryId: {
        type:      DataTypes.STRING(300),
        allowNull: true,
      },

      // Store socials as JSON: { facebook, linkedin, x, instagram, youtube }
      socials: {
        type:         DataTypes.JSON,
        allowNull:    true,
        defaultValue: {},
      },

      // Controls display order (lower = first)
      order: {
        type:         DataTypes.INTEGER,
        defaultValue: 0,
      },

      // Only "published" staff appear publicly
      status: {
        type:         DataTypes.ENUM("draft", "published", "archived"),
        defaultValue: "draft",
      },

      createdBy: {
        type:      DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      tableName:  "staff",
      timestamps: true,
    }
  );

  Staff.associate = (models) => {
    Staff.belongsTo(models.User, {
      foreignKey: "createdBy",
      as:         "creator",
    });
  };

  return Staff;
};