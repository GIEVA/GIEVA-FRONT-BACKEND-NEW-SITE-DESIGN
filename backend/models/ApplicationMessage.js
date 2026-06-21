// models/ApplicationMessage.js
import { DataTypes } from "sequelize";

export default (sequelize) => {
  const ApplicationMessage = sequelize.define("ApplicationMessage", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    applicationId: DataTypes.INTEGER,
    senderId: DataTypes.INTEGER,

    message: DataTypes.TEXT,
  });

  return ApplicationMessage;
};