// models/Cart.js
import { DataTypes, Model } from 'sequelize';
import getSequelize from '../config/database.js';

const sequelize = getSequelize();

class Cart extends Model {}

Cart.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
  },
  {
    sequelize,
    modelName: 'Cart',
    tableName: 'carts',
    timestamps: true,
  }
);

export default Cart;