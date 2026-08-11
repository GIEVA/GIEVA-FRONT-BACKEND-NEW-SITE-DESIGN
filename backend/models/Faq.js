import { DataTypes } from "sequelize";

export default (sequelize) => {
  const Faq = sequelize.define(
    "Faq",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

      question: { type: DataTypes.STRING(500), allowNull: false },
      answer: { type: DataTypes.TEXT, allowNull: false },

      category: { type: DataTypes.STRING(80), allowNull: true, defaultValue: "General" },

      order: { type: DataTypes.INTEGER, defaultValue: 0 },

      status: { type: DataTypes.ENUM("draft", "published", "archived"), defaultValue: "draft" },

      createdBy: { type: DataTypes.INTEGER, allowNull: true },
    },
    { tableName: "faqs", timestamps: true }
  );

  Faq.associate = (models) => {
    Faq.belongsTo(models.User, { foreignKey: "createdBy", as: "creator" });
  };

  return Faq;
};