// models/VisaPayment.js  (mirrors HealsPayment)
export default (sequelize, DataTypes) => {
  const VisaPayment = sequelize.define(
    "VisaPayment",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      userId: { type: DataTypes.INTEGER, allowNull: false },
      applicationId: { type: DataTypes.INTEGER, allowNull: false },
      paymentCode: { type: DataTypes.STRING(48), allowNull: false, unique: true },
      title: { type: DataTypes.STRING(160), allowNull: false },
      description: { type: DataTypes.STRING(255), allowNull: true },
      appointmentType: { type: DataTypes.STRING(12), allowNull: false },
      amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: "NGN" },
      totalAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      transactionRef: { type: DataTypes.STRING(80), allowNull: false, unique: true },
      status: {
        type: DataTypes.STRING(12),
        allowNull: false,
        defaultValue: "pending",
        validate: { isIn: [["pending", "success", "failed", "cancelled", "refunded"]] },
      },
      paymentMethod: { type: DataTypes.STRING(40), allowNull: true },
      gatewayResponse: { type: DataTypes.JSON, allowNull: true },
      paidAt: { type: DataTypes.DATE, allowNull: true },
    },
    { tableName: "visa_payments", indexes: [{ fields: ["applicationId"] }, { fields: ["userId"] }, { fields: ["status"] }] }
  );

  VisaPayment.associate = (models) => {
    VisaPayment.belongsTo(models.VisaApplication, { foreignKey: "applicationId", as: "application" });
  };
  return VisaPayment;
};
