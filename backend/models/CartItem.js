// models/CartItem.js
import { DataTypes, Model } from 'sequelize';
import getSequelize from '../config/database.js';

const sequelize = getSequelize();

class CartItem extends Model {}

CartItem.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: { args: [1], msg: 'Quantity must be at least 1' },
      },
    },
  },
  {
    sequelize,
    modelName: 'CartItem',
    tableName: 'cart_items',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['cartId', 'productId'],
      },
    ],
  }
);

export default CartItem;