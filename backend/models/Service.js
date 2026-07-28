// models/Service.js
//
// Replaces the static serviceData.js array.
// Mirrors every field used in the existing Services.jsx + FeatureGrid:
//   title, description, icon (MUI icon name string), imageUrl,
//   href, featured, category, order, status

import { DataTypes } from "sequelize";

export default (sequelize) => {
  const Service = sequelize.define(
    "Service",
    {
      id: {
        type:          DataTypes.INTEGER,
        primaryKey:    true,
        autoIncrement: true,
      },

      // Display fields — match existing serviceData keys exactly
      title: {
        type:      DataTypes.STRING(120),
        allowNull: false,
      },

      description: {
        type:      DataTypes.TEXT,
        allowNull: false,
      },

      // MUI icon component name as a string, e.g. "SchoolRounded"
      // Frontend resolves this to the actual MUI icon component.
      // Storing as string means admin picks from a predefined list
      // and we render <DynamicIcon name={service.iconName} /> client-side.
      iconName: {
        type:         DataTypes.STRING(80),
        allowNull:    true,
        defaultValue: "StarRounded",
      },

      // Cloudinary URL (uploaded via admin dashboard)
      imageUrl: {
        type:      DataTypes.STRING(500),
        allowNull: true,
      },

      imageCloudinaryId: {
        type:      DataTypes.STRING(300),
        allowNull: true,
      },

      // Route the card links to
      href: {
        type:         DataTypes.STRING(200),
        allowNull:    false,
        defaultValue: "/services",
      },

      // Highlighted on the home page / hero
      featured: {
        type:         DataTypes.BOOLEAN,
        defaultValue: false,
      },

      category: {
        type:         DataTypes.STRING(60),
        allowNull:    true,
        defaultValue: "General",
      },

      // Controls display order (lower = first)
      order: {
        type:         DataTypes.INTEGER,
        defaultValue: 0,
      },

      // Only "published" services appear publicly
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
      tableName:  "services",
      timestamps: true,
    }
  );

  Service.associate = (models) => {
    Service.belongsTo(models.User, {
      foreignKey: "createdBy",
      as:         "creator",
    });
  };

  return Service;
};
