import { DataTypes } from "sequelize";

// Generic key/value settings for HEALS (the fee today, other options later)
export default (sequelize) => {
  const HealsSetting = sequelize.define("HealsSetting", {
    name:      { type: DataTypes.STRING(60), primaryKey: true },
    value:     { type: DataTypes.JSON, allowNull: false },
    updatedBy: { type: DataTypes.INTEGER, allowNull: true },
  }, { tableName: "heals_settings", timestamps: true });

  return HealsSetting;
};