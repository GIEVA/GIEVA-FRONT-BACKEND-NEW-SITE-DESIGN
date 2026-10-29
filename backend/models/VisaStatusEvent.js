// models/VisaStatusEvent.js
// The applicant-visible timeline. One row per status change (including "submitted" by the system).
export default (sequelize, DataTypes) => {
  const VisaStatusEvent = sequelize.define(
    "VisaStatusEvent",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      applicationId: { type: DataTypes.INTEGER, allowNull: false },
      fromStatus: { type: DataTypes.STRING(24), allowNull: true },
      toStatus: { type: DataTypes.STRING(24), allowNull: false },
      note: { type: DataTypes.TEXT, allowNull: true }, // shown to the applicant
      actorId: { type: DataTypes.INTEGER, allowNull: true },
      actorType: { type: DataTypes.STRING(10), allowNull: false, defaultValue: "system", validate: { isIn: [["system", "admin", "user"]] } },
    },
    { tableName: "visa_status_events", indexes: [{ fields: ["applicationId"] }] }
  );
  VisaStatusEvent.associate = (models) => {
    VisaStatusEvent.belongsTo(models.VisaApplication, { foreignKey: "applicationId" });
  };
  return VisaStatusEvent;
};
