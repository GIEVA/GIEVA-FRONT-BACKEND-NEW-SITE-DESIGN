import { DataTypes } from "sequelize";

export default (sequelize) => {
  const SupportTicket = sequelize.define("SupportTicket", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    fullName: DataTypes.STRING,
    email: DataTypes.STRING,

    subject: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    type: {
      type: DataTypes.ENUM("contact", "complaint", "support"),
      defaultValue: "contact",
    },

    priority: {
      type: DataTypes.ENUM("low", "medium", "high"),
      defaultValue: "medium",
    },

    status: {
      type: DataTypes.ENUM("open", "in_progress", "resolved", "closed"),
      defaultValue: "open",
    },

    assignedTo: DataTypes.INTEGER,

    meta: DataTypes.JSON,
  });

  SupportTicket.associate = (models) => {
    // ✅ FIXED
    SupportTicket.hasMany(models.TicketAttachment, {
      foreignKey: "ticketId",
      as: "attachments",
      onDelete: "CASCADE",
    });

    SupportTicket.hasMany(models.TicketReply, {
      foreignKey: "ticketId",
      as: "replies",
      onDelete: "CASCADE",
    });

    SupportTicket.belongsTo(models.User, {
      foreignKey: "userId",
      as: "user",
    });

    SupportTicket.belongsTo(models.User, {
      foreignKey: "assignedTo",
      as: "agent",
    });
  };

  return SupportTicket;
};