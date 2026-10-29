// models/VisaSetting.js
// Generic key/value settings for the visa service (same pattern as HealsSetting).
//   "application_fee" -> { normalFee, expeditedFee, currency }
//   "availability"    -> { isOpen, closedMessage, instructions }
export default (sequelize, DataTypes) => {
  const VisaSetting = sequelize.define(
    "VisaSetting",
    {
      name: { type: DataTypes.STRING(60), primaryKey: true },
      value: { type: DataTypes.JSON, allowNull: false },
      updatedBy: { type: DataTypes.INTEGER, allowNull: true },
    },
    { tableName: "visa_settings", timestamps: true }
  );
  return VisaSetting;
};
