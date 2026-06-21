import { DataTypes } from "sequelize";

export default (sequelize) => {
  const Notification = sequelize.define("Notification", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    title: DataTypes.STRING,
    message: DataTypes.TEXT,

    type: {
  type: DataTypes.ENUM(

    "application",

    "campaign_registration",

    "user_registration",

    "payment",

    "support",

    "tutor_profile",

    "course",

    "article",

    "live_class",

    "system",

    "kyc",

    "assignment",
    "tutor_assignment",
    "tutor_verification",
    "CAMPAIGN_FEATURED",
    "CAMPAIGN_UNFEATURED",
    "CAMPAIGN_PUBLISHED",
    "CAMPAIGN_ARCHIVED",
  ),

  allowNull: false,
},

    // 🔥 Who receives it
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    // 🔥 Optional linking
    entityId: DataTypes.INTEGER,
    entityType: DataTypes.STRING, // "campaign", "application"

    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  });

  return Notification;
};