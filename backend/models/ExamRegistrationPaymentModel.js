import { DataTypes } from "sequelize";

export default (sequelize) => {
  const ExamPayment = sequelize.define(
    "ExamPayment",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      registrationId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },

      currency: {
        type: DataTypes.STRING,
        defaultValue: "NGN",
      },

      paymentMethod: {
        type: DataTypes.STRING,
        defaultValue: "paystack",
      },

      transactionRef: {
        type: DataTypes.STRING,
        unique: true,
      },

      status: {
        type: DataTypes.ENUM(
          "pending",
          "success",
          "failed",
          "refunded"
        ),
        defaultValue: "pending",
      },

      authorizationUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      channel: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      paidAt: DataTypes.DATE,

      gatewayResponse: DataTypes.JSON,
    },
    {
      tableName: "exam_payments",
      timestamps: true,
    }
  );

  ExamPayment.associate = (models) => {
    ExamPayment.belongsTo(models.User, {
      foreignKey: "userId",
    });

    ExamPayment.belongsTo(models.ExamRegistration, {
      foreignKey: "registrationId",
      as: "registration",
    });
  };

  return ExamPayment;
};