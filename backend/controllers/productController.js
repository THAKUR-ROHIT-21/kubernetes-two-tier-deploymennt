import asyncHandler from 'express-async-handler';
import slugify from 'slugify';
import Product from '../models/Product.js';

// @desc    Create a new product
// @route   POST /api/products
export const createProduct = asyncHandler(async (req, res) => {
  const { name, sku, description, price, category, stock } = req.body;

  if (!name || !sku || !description || !price || !category || stock === undefined) {
    res.status(400);
    throw new Error('Please provide name, sku, description, price, category, and stock');
  }

  const imageUrls = req.files
    ? req.files.map((file) => `${req.protocol}://${req.get('host')}/uploads/${file.filename}`)
    : [];

  const product = await Product.create({
    ...req.body,
    images: imageUrls,
  });

  res.status(201).json({
    success: true,
    product,
  });
});

// @desc    Get all products
// @route   GET /api/products
export const getProducts = asyncHandler(async (req, res) => {
  const products = await Product.findAll({
    where: { isActive: true },
    order: [['createdAt', 'DESC']],
  });

  res.status(200).json({
    success: true,
    count: products.length,
    products,
  });
});

// @desc    Bulk create products from a JSON array
// @route   POST /api/products/bulk
export const bulkCreateProducts = asyncHandler(async (req, res) => {
  const { products } = req.body;

  if (!Array.isArray(products) || products.length === 0) {
    res.status(400);
    throw new Error('Please provide a non-empty array of products');
  }

  const productsWithSlugs = products.map((p) => ({
    ...p,
    slug: slugify(p.name, { lower: true, strict: true }),
  }));

  const result = await Product.bulkCreate(productsWithSlugs, {
    validate: true,
    individualHooks: false,
  });

  res.status(201).json({
    success: true,
    count: result.length,
    products: result,
  });
});

// @desc    Get a single product by ID
// @route   GET /api/products/:id
export const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findByPk(req.params.id);

  if (!product || !product.isActive) {
    res.status(404);
    throw new Error('Product not found');
  }

  res.status(200).json({
    success: true,
    product,
  });
});