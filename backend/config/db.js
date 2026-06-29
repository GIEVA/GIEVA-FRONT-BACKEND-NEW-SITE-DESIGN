import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

export const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USERNAME,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    dialect: "mysql",

    logging: false,

    define: {
      freezeTableName: true,
    },

    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },

    dialectOptions: {
      ssl: {
        rejectUnauthorized: false,
      },
    },
  }
);

export async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log("✅ Sequelize connected successfully!");
  } catch (error) {
    console.error("❌ Database connection failed:");
    console.error(error);
  }
}

export default sequelize;