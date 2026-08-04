// config/database.js
import { Sequelize } from 'sequelize';

let sequelize = null;

export function getSequelize() {
  if (!sequelize) {


    sequelize = new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'mysql',
        logging: false,
      }
    );
  }
  return sequelize;
}

export default getSequelize;