// models/ApplicationDocument.js
import { DataTypes } from "sequelize";

export default (sequelize) => {
  const ApplicationDocument = sequelize.define("ApplicationDocument", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    applicationId: DataTypes.INTEGER,

    type: {
      type: DataTypes.ENUM(
        "passport",
        "transcript",
        "sop",
        "recommendation",
        "bank_statement",
        "other"
      ),
    },

    fileUrl: DataTypes.STRING,
  });

  return ApplicationDocument;
};