import { DataTypes } from "sequelize";

export default (sequelize) => {
  const Campaign = sequelize.define("Campaign", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    // 🔥 NEW: Creator / Owner
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false, // campaigns should always have an owner
    },

    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    description: DataTypes.TEXT,

    type: {
      type: DataTypes.ENUM("webinar", "sat", "tutorial", "general"),
      defaultValue: "general",
    },

    imageUrl: DataTypes.STRING,
    imagePublicId: DataTypes.STRING, // 🔥 for Cloudinary delete/update

    registrationLink: DataTypes.STRING,

    requiresRegistration: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },

   status: {
      type: DataTypes.ENUM(
        "draft",
        "active",
        "completed",
        "cancelled",
        "archived"
      ),
      defaultValue: "draft",
    },

    slug: {
      type: DataTypes.STRING,
      unique: true,
    },

    views: {
  type: DataTypes.INTEGER,
  defaultValue: 0,
},

clicks: {
  type: DataTypes.INTEGER,
  defaultValue: 0,
},

featured: {
  type: DataTypes.BOOLEAN,
  defaultValue: false,
},

    reminder24hSent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    reminder1hSent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    thankYouSent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    startDate: DataTypes.DATE,
    endDate: DataTypes.DATE,
  }, {
    timestamps: true,
  });

  // ---------------- ASSOCIATIONS ----------------
  Campaign.associate = (models) => {
    // 🔗 Campaign → Registrations
    Campaign.hasMany(models.CampaignRegistration, {
      foreignKey: "campaignId",
      as: "registrations",
    });

    // 🔗 Campaign → User (creator)
    Campaign.belongsTo(models.User, {
      foreignKey: "userId",
      as: "creator",
    });
  };

  return Campaign;
};