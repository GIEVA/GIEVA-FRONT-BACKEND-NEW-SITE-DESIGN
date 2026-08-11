// models/HealsPayment.js

import { DataTypes } from "sequelize";

export default (sequelize) => {
  const HealsPayment = sequelize.define(
    "HealsPayment",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      applicationId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      assignedAgentId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },

      paymentCode: {
        type: DataTypes.STRING,
        unique: true, // only here — do not repeat in indexes
      },

      type: {
        type: DataTypes.ENUM(
          "application_fee",
          "service_charge",
          "school_application",
          "visa_processing",
          "sevis_fee",
          "tuition_deposit",
          "flight_booking",
          "accommodation",
          "consultation",
          "other"
        ),
        allowNull: false,
      },

      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      description: DataTypes.TEXT,

      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },

      currency: {
        type: DataTypes.STRING,
        defaultValue: "NGN",
      },

      quantity: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
      },

      totalAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },

      paymentMethod: {
        type: DataTypes.STRING,
      },

      transactionRef: {
        type: DataTypes.STRING,
        unique: true, // only here — do not repeat in indexes
      },

      gateway: {
        type: DataTypes.ENUM(
          "paystack",
          "flutterwave",
          "bank_transfer",
          "wallet"
        ),
        defaultValue: "paystack",
      },

      status: {
        type: DataTypes.ENUM(
          "pending",
          "success",
          "failed",
          "cancelled",
          "refunded"
        ),
        defaultValue: "pending",
      },

      paidAt: DataTypes.DATE,
      dueDate: DataTypes.DATE,
      receiptUrl: DataTypes.STRING,
      gatewayResponse: DataTypes.JSON,
      meta: DataTypes.JSON,
    },
    {
      tableName: "heals_payments",
      timestamps: true,

      // Only non-unique helper indexes
      indexes: [
        { fields: ["userId"] },
        { fields: ["applicationId"] },
        { fields: ["status"] },
        
      ],
    }
  );

  HealsPayment.associate = (models) => {
    HealsPayment.belongsTo(models.User, {
      foreignKey: "userId",
    });

    HealsPayment.belongsTo(models.HealsApplication, {
      foreignKey: "applicationId",
    });
  };

  return HealsPayment;
};

// // models/HealsPayment.js

// import { DataTypes } from "sequelize";

// export default (sequelize) => {
//   const HealsPayment = sequelize.define(
//     "HealsPayment",
//     {
//       id: {
//         type: DataTypes.INTEGER,
//         primaryKey: true,
//         autoIncrement: true,
//       },


//       applicationId: {
//         type: DataTypes.INTEGER,
//         allowNull: false,
//       },
//       userId: {
//         type: DataTypes.INTEGER,
//         allowNull: false,
//       },

//       assignedAgentId: {
//         type: DataTypes.INTEGER,
//         allowNull: true,
//       },

//       paymentCode: {
//         type: DataTypes.STRING,
//         unique: true,
//       },

//       type: {
//         type: DataTypes.ENUM(
//           "application_fee",
//           "service_charge",
//           "school_application",
//           "visa_processing",
//           "sevis_fee",
//            "tuition_deposit",
//           "flight_booking",
//           "accommodation",
//           "consultation",
//           "other"
//         ),
//         allowNull: false,
//       },

//       title: {
//         type: DataTypes.STRING,
//         allowNull: false,
//       },

//       description: DataTypes.TEXT,

//       amount: {
//         type: DataTypes.DECIMAL(10, 2),
//         allowNull: false,
//       },

//       currency: {
//         type: DataTypes.STRING,
//         defaultValue: "NGN",
//       },

//       quantity: {
//         type: DataTypes.INTEGER,
//         defaultValue: 1,
//       },
//       totalAmount: {
//         type: DataTypes.DECIMAL(10, 2),
//         allowNull: false,
//       },

//       paymentMethod: {
//         type: DataTypes.STRING,
//       },

//       transactionRef: {
//         type: DataTypes.STRING,
//         unique: true,
//       },

//       gateway: {
//         type: DataTypes.ENUM(
//           "paystack",
//           "flutterwave",
//           "bank_transfer",
//           "wallet"
//         ),
//         defaultValue: "paystack",
//       },

//       status: {
//         type: DataTypes.ENUM(
//           "pending",
//           "success",
//           "failed",
//            "cancelled",
//           "refunded"
//         ),
//         defaultValue: "pending",
//       },

//       paidAt: DataTypes.DATE,

//       dueDate: DataTypes.DATE,

//       receiptUrl: DataTypes.STRING,

//       gatewayResponse: DataTypes.JSON,

//       meta: DataTypes.JSON,
//     },
//     {
//       tableName: "heals_payments",
//       timestamps: true,

//       indexes: [
//         { fields: ["userId"] },
//         { fields: ["applicationId"] },
//         { fields: ["status"] },
//         { fields: ["transactionRef"] },
//         { unique: true, fields: ["paymentCode"] },
//       ],
//        }
//   );

//   HealsPayment.associate = (models) => {
//     HealsPayment.belongsTo(models.User, {
//       foreignKey: "userId",
//     });



//     HealsPayment.belongsTo(models.HealsApplication, {
//       foreignKey: "applicationId",
//     });
//   };

//   return HealsPayment;
// };