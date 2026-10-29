// models/VisaNote.js
// INTERNAL admin notes. Never returned by any applicant endpoint.
export default (sequelize, DataTypes) => {
  const VisaNote = sequelize.define(
    "VisaNote",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      applicationId: { type: DataTypes.INTEGER, allowNull: false },
      authorId: { type: DataTypes.INTEGER, allowNull: false },
      body: { type: DataTypes.TEXT, allowNull: false },
    },
    { tableName: "visa_notes", indexes: [{ fields: ["applicationId"] }] }
  );
  VisaNote.associate = (models) => {
    VisaNote.belongsTo(models.VisaApplication, { foreignKey: "applicationId" });
    if (models.User) VisaNote.belongsTo(models.User, { foreignKey: "authorId", as: "author" });
  };
  return VisaNote;
};
