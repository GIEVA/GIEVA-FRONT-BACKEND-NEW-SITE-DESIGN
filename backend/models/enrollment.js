// models/Enrollment.js
import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Enrollment = sequelize.define('Enrollment', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    studentId: { type: DataTypes.INTEGER, allowNull: false },
    courseId: { type: DataTypes.INTEGER, allowNull: false },
    status: {
      type: DataTypes.ENUM('pending', 'active', 'cancelled'),
      defaultValue: 'pending'
    },
    expiresAt: {
      type: DataTypes.DATE,
    },

    durationMonths: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    paymentId: DataTypes.STRING
  });

  Enrollment.associate = (models) => {
    Enrollment.belongsTo(models.User, { foreignKey: 'studentId' });
    Enrollment.belongsTo(models.Course, { foreignKey: 'courseId' });
  };

  return Enrollment;
};
