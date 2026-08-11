// models/Partner.js
import { DataTypes } from "sequelize";

export default (sequelize) => {
  const Partner = sequelize.define(
    "Partner",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

      name: { type: DataTypes.STRING(150), allowNull: false },

      logoUrl: { type: DataTypes.STRING(500), allowNull: true },
      logoCloudinaryId: { type: DataTypes.STRING(300), allowNull: true },

      href: { type: DataTypes.STRING(300), allowNull: true, defaultValue: "#" },
      external: { type: DataTypes.BOOLEAN, defaultValue: false },

      order: { type: DataTypes.INTEGER, defaultValue: 0 },

      status: { type: DataTypes.ENUM("draft", "published", "archived"), defaultValue: "draft" },

      createdBy: { type: DataTypes.INTEGER, allowNull: true },
    },
    { tableName: "partners", timestamps: true }
  );

  Partner.associate = (models) => {
    Partner.belongsTo(models.User, { foreignKey: "createdBy", as: "creator" });
  };

  return Partner;
};