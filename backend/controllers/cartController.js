import asyncHandler from 'express-async-handler';
import Cart from '../models/Cart.js';
import CartItem from '../models/CartItem.js';
import Product from '../models/Product.js';

// Helper — Sequelize ka nested object format ko frontend-friendly shape mein convert karta hai
const formatCart = (cart) => {
  if (!cart) return { items: [] };

  const items = (cart.CartItems || []).map((item) => ({
    _id: item.id,
    product: item.Product
      ? {
          _id: item.Product.id,
          name: item.Product.name,
          price: item.Product.price,
          discountPrice: item.Product.discountPrice,
          images: item.Product.images,
          stock: item.Product.stock,
        }
      : null,
    quantity: item.quantity,
  }));

  return { id: cart.id, userId: cart.userId, items };
};

// @desc    Get the logged-in user's cart, with full product details populated
// @route   GET /api/cart
export const getCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({
    where: { userId: req.user.id },
    include: [{ model: CartItem, include: [{ model: Product }] }],
  });

  res.status(200).json({ success: true, cart: formatCart(cart) });
});

// @desc    Add a product to the cart, or increase quantity if it's already in there
// @route   POST /api/cart
export const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body;

  if (!productId) {
    res.status(400);
    throw new Error('productId is required');
  }

  const product = await Product.findByPk(productId);
  if (!product || !product.isActive) {
    res.status(404);
    throw new Error('Product not found');
  }

  if (product.stock < quantity) {
    res.status(400);
    throw new Error(`Only ${product.stock} units available`);
  }

  let cart = await Cart.findOne({ where: { userId: req.user.id } });
  if (!cart) {
    cart = await Cart.create({ userId: req.user.id });
  }

  const existingItem = await CartItem.findOne({
    where: { cartId: cart.id, productId },
  });

  if (existingItem) {
    existingItem.quantity += quantity;
    await existingItem.save();
  } else {
    await CartItem.create({ cartId: cart.id, productId, quantity });
  }

  const updatedCart = await Cart.findOne({
    where: { userId: req.user.id },
    include: [{ model: CartItem, include: [{ model: Product }] }],
  });

  res.status(200).json({ success: true, cart: formatCart(updatedCart) });
});

// @desc    Update the quantity of a specific item in the cart
// @route   PUT /api/cart/:productId
export const updateCartItem = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  const { productId } = req.params;

  if (!quantity || quantity < 1) {
    res.status(400);
    throw new Error('Quantity must be at least 1');
  }

  const cart = await Cart.findOne({ where: { userId: req.user.id } });
  if (!cart) {
    res.status(404);
    throw new Error('Cart not found');
  }

  const item = await CartItem.findOne({ where: { cartId: cart.id, productId } });
  if (!item) {
    res.status(404);
    throw new Error('Item not found in cart');
  }

  item.quantity = quantity;
  await item.save();

  const updatedCart = await Cart.findOne({
    where: { userId: req.user.id },
    include: [{ model: CartItem, include: [{ model: Product }] }],
  });

  res.status(200).json({ success: true, cart: formatCart(updatedCart) });
});

// @desc    Remove a single item from the cart
// @route   DELETE /api/cart/:productId
export const removeFromCart = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const cart = await Cart.findOne({ where: { userId: req.user.id } });
  if (!cart) {
    res.status(404);
    throw new Error('Cart not found');
  }

  await CartItem.destroy({ where: { cartId: cart.id, productId } });

  const updatedCart = await Cart.findOne({
    where: { userId: req.user.id },
    include: [{ model: CartItem, include: [{ model: Product }] }],
  });

  res.status(200).json({ success: true, cart: formatCart(updatedCart) });
});

// @desc    Clear the entire cart
// @route   DELETE /api/cart
export const clearCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ where: { userId: req.user.id } });
  if (cart) {
    await CartItem.destroy({ where: { cartId: cart.id } });
  }

  res.status(200).json({ success: true, cart: { id: cart?.id, userId: req.user.id, items: [] } });
});