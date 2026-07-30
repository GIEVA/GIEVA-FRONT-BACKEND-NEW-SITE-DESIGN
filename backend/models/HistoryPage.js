import { DataTypes } from "sequelize";

export default (sequelize) => {
  const HistoryPage = sequelize.define(
    "HistoryPage",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

      // Hero
      heroTitle: { type: DataTypes.STRING(200), allowNull: false, defaultValue: "Our History" },
      heroBreadcrumb: { type: DataTypes.STRING(200), allowNull: false, defaultValue: "Our History" },

      // Intro
      introEyebrow: { type: DataTypes.STRING(150), allowNull: true },
      introTitle: { type: DataTypes.STRING(200), allowNull: true },
      // Array of strings
      introParagraphs: { type: DataTypes.JSON, allowNull: true, defaultValue: [] },

      // Sidebar
      sidebarEyebrow: { type: DataTypes.STRING(150), allowNull: true },
      sidebarTitle: { type: DataTypes.STRING(200), allowNull: true },
      sidebarDescription: { type: DataTypes.TEXT, allowNull: true },
      sidebarImageUrl: { type: DataTypes.STRING(500), allowNull: true },
      sidebarImageCloudinaryId: { type: DataTypes.STRING(300), allowNull: true },
      sidebarImageAlt: { type: DataTypes.STRING(255), allowNull: true },

      // Array of { id, year, title, text }
      timeline: { type: DataTypes.JSON, allowNull: true, defaultValue: [] },

      status: { type: DataTypes.ENUM("draft", "published"), defaultValue: "draft" },

      updatedBy: { type: DataTypes.INTEGER, allowNull: true },
    },
    { tableName: "history_pages", timestamps: true }
  );

  HistoryPage.associate = (models) => {
    HistoryPage.belongsTo(models.User, { foreignKey: "updatedBy", as: "editor" });
  };

  return HistoryPage;
};