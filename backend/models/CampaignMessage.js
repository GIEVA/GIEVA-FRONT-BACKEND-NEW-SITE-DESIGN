import { DataTypes } from "sequelize";

export default (sequelize) => {
  const CampaignMessage = sequelize.define("CampaignMessage", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    campaignId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    subject: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    sentBy: DataTypes.INTEGER,

    // 🔥 NEW FEATURES
    status: {
      type: DataTypes.ENUM("draft", "scheduled", "sent"),
      defaultValue: "draft",
    },

    scheduledAt: DataTypes.DATE,
    sentAt: DataTypes.DATE,

    totalRecipients: DataTypes.INTEGER,
    successCount: { type: DataTypes.INTEGER, defaultValue: 0 },
    failedCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  });

  CampaignMessage.associate = (models) => {
    CampaignMessage.belongsTo(models.Campaign, {
      foreignKey: "campaignId",
      as: "campaign",
    });

    CampaignMessage.belongsTo(
      models.User,
      {
        foreignKey: "sentBy",
        as: "sender",
      }
    );
  };

  return CampaignMessage;
};