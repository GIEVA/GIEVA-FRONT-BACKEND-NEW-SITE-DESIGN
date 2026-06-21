import { DataTypes } from "sequelize";

export default (sequelize) => {
  const Attachment = sequelize.define("Attachment", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    ticketId: DataTypes.INTEGER,
    replyId: DataTypes.INTEGER,

    url: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    publicId: DataTypes.STRING,
    fileType: DataTypes.STRING,
  });

  Attachment.associate = (models) => {
    Attachment.belongsTo(models.SupportTicket, {
      foreignKey: "ticketId",
      as: "ticket",
    });
  };

  return Attachment;
};