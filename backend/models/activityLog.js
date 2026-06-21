import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const ActivityLog = sequelize.define('ActivityLog', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: DataTypes.INTEGER,
    action: DataTypes.STRING,
    meta: DataTypes.JSON,          // <-- change from JSONB to JSON
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, { timestamps: false });

  return ActivityLog;
};
