// db.js

import {
  Sequelize,
} from "sequelize";

import dotenv
from "dotenv";

dotenv.config();



// ======================================================
// SEQUELIZE INSTANCE
// ======================================================

export const sequelize =
  new Sequelize(

    process.env.DB_NAME || "lms",

    process.env.ROOT || "root",

    process.env.PASSWORD || "1234",

    {

      host:
        process.env.MSQL_HOST || "127.0.0.1",

      dialect:
        "mysql",

      logging:
        false,



      // ======================================================
      // VERY IMPORTANT
      // prevents weird pluralized tables
      // ======================================================

      define: {

        freezeTableName: true,
      },



      pool: {

        max: 10,

        min: 0,

        acquire: 30000,

        idle: 10000,
      },
    }
  );



// ======================================================
// TEST CONNECTION
// ======================================================

export async function
testConnection() {

  try {

    await sequelize.authenticate();

    console.log(
      "✅ Sequelize MySQL Connected Successfully!"
    );

  } catch (error) {

    console.error(
      "❌ Sequelize Connection Failed:",
      error.message
    );
  }
}



export default sequelize;