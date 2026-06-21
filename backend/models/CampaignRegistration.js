import { DataTypes } from "sequelize";

export default (sequelize) => {
  const CampaignRegistration = sequelize.define("CampaignRegistration", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    //  NEW: Link to User
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true, // allow guest registrations if needed
    },

    campaignId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    fullName: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    dob: {
        type: DataTypes.DATE,
        allowNull: false,
      },

    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    extraData: {
      type: DataTypes.JSON,
    },
  });

  // ---------------- ASSOCIATIONS ----------------
  CampaignRegistration.associate = (models) => {
    // 🔗 Campaign relation
    CampaignRegistration.belongsTo(models.Campaign, {
      foreignKey: "campaignId",
      as: "campaign",
    });

    // 🔗 User relation
    CampaignRegistration.belongsTo(models.User, {
      foreignKey: "userId",
      as: "user",
    });
  };

  return CampaignRegistration;
};