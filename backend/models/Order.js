// models/Order.js
import { DataTypes, Model } from 'sequelize';
import getSequelize from '../config/database.js';

const sequelize = getSequelize();

class Order extends Model {}

Order.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    shippingLabel: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    shippingFullName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    shippingPhone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    shippingStreet: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    shippingCity: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    shippingState: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    shippingPostalCode: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    shippingCountry: {
      type: DataTypes.STRING,
      defaultValue: 'India',
    },
    razorpayOrderId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    razorpayPaymentId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    razorpaySignature: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    paymentStatus: {
      type: DataTypes.ENUM('pending', 'paid', 'failed'),
      defaultValue: 'pending',
    },
    itemsPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    shippingPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    totalPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    orderStatus: {
      type: DataTypes.ENUM('processing', 'shipped', 'delivered', 'cancelled'),
      defaultValue: 'processing',
    },
  },
  {
    sequelize,
    modelName: 'Order',
    tableName: 'orders',
    timestamps: true,
  }
);

export default Order;