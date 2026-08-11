import { DataTypes } from "sequelize";

export default (sequelize) => {
  const Service = sequelize.define(
    "Service",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

      title: { type: DataTypes.STRING(120), allowNull: false },

      // Short blurb — used on cards in the grid
      description: { type: DataTypes.TEXT, allowNull: false },

      // Long-form body for the detail page (About the SAT, test dates, etc.)
      content: { type: DataTypes.TEXT, allowNull: true },

      iconName: { type: DataTypes.STRING(80), allowNull: true, defaultValue: "StarRounded" },

      imageUrl: { type: DataTypes.STRING(500), allowNull: true },
      imageCloudinaryId: { type: DataTypes.STRING(300), allowNull: true },

      href: { type: DataTypes.STRING(200), allowNull: false, defaultValue: "/services" },

      featured: { type: DataTypes.BOOLEAN, defaultValue: false },

      category: { type: DataTypes.STRING(60), allowNull: true, defaultValue: "General" },

      // Array of { id, name, address, phone, email, hours }
      offices: { type: DataTypes.JSON, allowNull: true, defaultValue: [] },

      // Array of { id, label, url }
      resources: { type: DataTypes.JSON, allowNull: true, defaultValue: [] },

      // Array of { id, label, href, external }
      ctaButtons: { type: DataTypes.JSON, allowNull: true, defaultValue: [] },

      order: { type: DataTypes.INTEGER, defaultValue: 0 },

      status: { type: DataTypes.ENUM("draft", "published", "archived"), defaultValue: "draft" },

      createdBy: { type: DataTypes.INTEGER, allowNull: true },
    },
    { tableName: "services", timestamps: true }
  );

  Service.associate = (models) => {
    Service.belongsTo(models.User, { foreignKey: "createdBy", as: "creator" });
  };

  return Service;
};