// models/Payment.js
import { DataTypes } from "sequelize";

export default (sequelize) => {
  const Payment = sequelize.define(
    "Payment",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      courseId: DataTypes.INTEGER,        // optional
      sessionId: DataTypes.INTEGER,       // optional (Tutor session)
      //quizId: DataTypes.INTEGER,

      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },

      durationMonths: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
      },

      subscriptionStartDate: {
        type: DataTypes.DATE,
      },

      subscriptionEndDate: {
        type: DataTypes.DATE,
      },

      tutorialMode: {
        type: DataTypes.ENUM("onsite", "virtual"),
      },

      currency: {
        type: DataTypes.STRING,
        defaultValue: "NGN",
      },

      paymentMethod: {
        type: DataTypes.STRING, // card, transfer, wallet, paystack, flutterwave
      },

      transactionRef: {
        type: DataTypes.STRING,
        unique: true,
      },
      

      status: {
        type: DataTypes.ENUM("pending", "success", "failed", "refunded"),
        defaultValue: "pending",
      },
      gatewayResponse: DataTypes.JSON, // full Paystack response
      paidAt: DataTypes.DATE,

      meta: DataTypes.JSON,

    },
    {
      tableName: "payments",
      timestamps: true,
    }
  );

  Payment.associate = (models) => {
    Payment.belongsTo(models.User, { foreignKey: "userId" });
    Payment.belongsTo(models.Course, { foreignKey: "courseId" });
    Payment.belongsTo(models.ClassSession, { foreignKey: "sessionId" });
    
  };

  return Payment;
};
