// models/Product.js
import { DataTypes, Model } from 'sequelize';
import slugify from 'slugify';
import getSequelize from '../config/database.js';

const sequelize = getSequelize();

class Product extends Model {}

Product.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(120),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Product name is required' },
        len: { args: [1, 120], msg: 'Product name cannot exceed 120 characters' },
      },
    },
    slug: {
      type: DataTypes.STRING,
      unique: true,
    },
    sku: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      set(value) {
        this.setDataValue('sku', value.trim().toUpperCase());
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Product description is required' },
      },
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: { args: [0], msg: 'Price cannot be negative' },
      },
    },
    discountPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        isLessThanPrice(value) {
          if (value && parseFloat(value) >= parseFloat(this.price)) {
            throw new Error('Discount price must be less than regular price');
          }
        },
      },
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
      set(value) {
        this.setDataValue('category', value.trim().toLowerCase());
      },
    },
    brand: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    images: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: { args: [0], msg: 'Stock cannot be negative' },
      },
    },
    isFeatured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    ratingsAverage: {
      type: DataTypes.DECIMAL(2, 1),
      defaultValue: 0,
      validate: {
        min: 0,
        max: 5,
      },
    },
    ratingsCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: 'Product',
    tableName: 'products',
    timestamps: true,
    indexes: [
      {
        type: 'FULLTEXT',
        name: 'product_search_idx',
        fields: ['name', 'description'],
      },
    ],
    hooks: {
      beforeSave: (product) => {
        if (product.changed('name') || product.isNewRecord) {
          product.slug = slugify(product.name, { lower: true, strict: true });
        }
      },
    },
  }
);

export default Product;