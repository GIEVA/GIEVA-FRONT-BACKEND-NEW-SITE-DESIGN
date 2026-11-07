import { DataTypes } from "sequelize";

export default (sequelize) => {
  const CampaignRegistration = sequelize.define("CampaignRegistration", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: true },
    campaignId: { type: DataTypes.INTEGER, allowNull: false },
    fullName: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false },
    extraData: { type: DataTypes.JSON },
  });

  CampaignRegistration.associate = (models) => {
    CampaignRegistration.belongsTo(models.Campaign, { foreignKey: "campaignId", as: "campaign" });
    CampaignRegistration.belongsTo(models.User, { foreignKey: "userId", as: "user" });
  };

  return CampaignRegistration;
};