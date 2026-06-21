import { DataTypes } from "sequelize";

export default (sequelize) => {
  const TicketReply = sequelize.define("TicketReply", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    ticketId: DataTypes.INTEGER,
    userId: DataTypes.INTEGER,

    message: DataTypes.TEXT,

    isAdmin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  });

  TicketReply.associate = (models) => {
    TicketReply.belongsTo(models.SupportTicket, {
      foreignKey: "ticketId",
      as: "ticket",
    });

    TicketReply.hasMany(models.TicketAttachment, {
      foreignKey: "ticketId",
      as: "attachments",
      onDelete: "CASCADE",
    });
  };

  return TicketReply;
};