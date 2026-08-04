import asyncHandler from 'express-async-handler';
import crypto from 'crypto';
import getSequelize from '../config/database.js';
import Order from '../models/Order.js';
import OrderItem from '../models/OrderItem.js';
import Cart from '../models/Cart.js';
import CartItem from '../models/CartItem.js';
import Product from '../models/Product.js';
import Address from '../models/Address.js';
import getRazorpayInstance from '../config/razorpay.js';
import User from '../models/User.js';
import { Op } from 'sequelize';

const sequelize = getSequelize();

// @desc    Create a Razorpay order from the user's current cart (step 1 of checkout)
// @route   POST /api/orders/razorpay
export const createRazorpayOrder = asyncHandler(async (req, res) => {
  const { addressId } = req.body;

  if (!addressId) {
    res.status(400);
    throw new Error('Please select a shipping address');
  }

  const address = await Address.findOne({ where: { id: addressId, userId: req.user.id } });
  if (!address) {
    res.status(404);
    throw new Error('Address not found');
  }

  const cart = await Cart.findOne({
    where: { userId: req.user.id },
    include: [{ model: CartItem, include: [{ model: Product }] }],
  });

  if (!cart || cart.CartItems.length === 0) {
    res.status(400);
    throw new Error('Your cart is empty');
  }

  let itemsPrice = 0;
  const orderItemsData = [];

  for (const item of cart.CartItems) {
    const product = item.Product;
    if (!product || !product.isActive) {
      res.status(400);
      throw new Error(`A product in your cart is no longer available`);
    }
    if (product.stock < item.quantity) {
      res.status(400);
      throw new Error(`Only ${product.stock} units of "${product.name}" available`);
    }

    const price = product.discountPrice || product.price;
    itemsPrice += price * item.quantity;

    orderItemsData.push({
      productId: product.id,
      name: product.name,
      image: product.images?.[0] || '',
      price,
      quantity: item.quantity,
    });
  }

  const shippingPrice = itemsPrice >= 999 ? 0 : 49;
  const totalPrice = itemsPrice + shippingPrice;
  const amountInPaise = Math.round(totalPrice * 100);

  const razorpayOrder = await getRazorpayInstance().orders.create({
    amount: amountInPaise,
    currency: 'INR',
    receipt: `receipt_${Date.now()}`,
  });

  const result = await sequelize.transaction(async (t) => {
    const order = await Order.create(
      {
        userId: req.user.id,
        shippingLabel: address.label,
        shippingFullName: address.fullName,
        shippingPhone: address.phone,
        shippingStreet: address.street,
        shippingCity: address.city,
        shippingState: address.state,
        shippingPostalCode: address.postalCode,
        shippingCountry: address.country,
        razorpayOrderId: razorpayOrder.id,
        paymentStatus: 'pending',
        itemsPrice,
        shippingPrice,
        totalPrice,
      },
      { transaction: t }
    );

    await OrderItem.bulkCreate(
      orderItemsData.map((item) => ({ ...item, orderId: order.id })),
      { transaction: t }
    );

    return order;
  });

  res.status(201).json({
    success: true,
    razorpayOrderId: razorpayOrder.id,
    amount: amountInPaise,
    currency: 'INR',
    keyId: process.env.RAZORPAY_KEY_ID,
    orderId: result.id,
  });
});

// @desc    Verify the Razorpay payment signature and finalize the order (step 2 of checkout)
// @route   POST /api/orders/verify
export const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
    res.status(400);
    throw new Error('Missing payment verification details');
  }

  const order = await Order.findOne({ where: { id: orderId, userId: req.user.id } });
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  const body = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  const isSignatureValid = expectedSignature === razorpay_signature;

  if (!isSignatureValid) {
    order.paymentStatus = 'failed';
    await order.save();
    res.status(400);
    throw new Error('Payment verification failed');
  }

  await sequelize.transaction(async (t) => {
    order.razorpayPaymentId = razorpay_payment_id;
    order.razorpaySignature = razorpay_signature;
    order.paymentStatus = 'paid';
    await order.save({ transaction: t });

    const orderItems = await OrderItem.findAll({
      where: { orderId: order.id },
      transaction: t,
    });

    for (const item of orderItems) {
      await Product.decrement('stock', {
        by: item.quantity,
        where: { id: item.productId },
        transaction: t,
      });
    }

    const cart = await Cart.findOne({ where: { userId: req.user.id }, transaction: t });
    if (cart) {
      await CartItem.destroy({ where: { cartId: cart.id }, transaction: t });
    }
  });

  // Re-fetch with items included so the response actually has product details
  const fullOrder = await Order.findOne({
    where: { id: order.id },
    include: [{ model: OrderItem, include: [{ model: Product }] }],
  });

  res.status(200).json({ success: true, order: fullOrder });
});

// @desc    Get all orders for the logged-in user
// @route   GET /api/orders
export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.findAll({
    where: { userId: req.user.id },
    include: [{ model: OrderItem, include: [{ model: Product }] }],
    order: [['createdAt', 'DESC']],
  });
  res.status(200).json({ success: true, orders });
});

// @desc    Get a single order by id
// @route   GET /api/orders/:id
export const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findOne({
    where: { id: req.params.id, userId: req.user.id },
    include: [{ model: OrderItem, include: [{ model: Product }] }],
  });

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  res.status(200).json({ success: true, order });
});


// @desc    Get ALL orders across all users (admin only)
// @route   GET /api/orders/admin/all
export const getAllOrders = asyncHandler(async (req, res) => {
  const orders = await Order.findAll({
    include: [
      { model: OrderItem, include: [{ model: Product }] },
      { model: User, attributes: ['id', 'name', 'email'] },
    ],
    order: [['createdAt', 'DESC']],
  });
  res.status(200).json({ success: true, orders });
});

// @desc    Update an order's status (admin only)
// @route   PATCH /api/orders/admin/:id/status
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { orderStatus } = req.body;
  const validStatuses = ['processing', 'shipped', 'delivered', 'cancelled'];

  if (!validStatuses.includes(orderStatus)) {
    res.status(400);
    throw new Error('Invalid order status');
  }

  const order = await Order.findByPk(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  order.orderStatus = orderStatus;
  await order.save();

  res.status(200).json({ success: true, order });
});

// @desc    Get sales analytics (admin only)
// @route   GET /api/orders/admin/analytics
export const getSalesAnalytics = asyncHandler(async (req, res) => {
  const { days = 7 } = req.query;
  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - Number(days));

  const orders = await Order.findAll({
    where: {
      paymentStatus: 'paid',
      createdAt: { [Op.gte]: daysAgo },
    },
    include: [{ model: OrderItem, include: [{ model: Product }] }],
    order: [['createdAt', 'ASC']],
  });

  // Group revenue by date (YYYY-MM-DD)
  const revenueByDate = {};
  let totalRevenue = 0;
  const productSales = {};

  for (const order of orders) {
    const dateKey = order.createdAt.toISOString().split('T')[0];
    const revenue = Number(order.totalPrice);
    revenueByDate[dateKey] = (revenueByDate[dateKey] || 0) + revenue;
    totalRevenue += revenue;

    for (const item of order.OrderItems || []) {
      const name = item.name;
      if (!productSales[name]) {
        productSales[name] = { name, unitsSold: 0, revenue: 0 };
      }
      productSales[name].unitsSold += item.quantity;
      productSales[name].revenue += Number(item.price) * item.quantity;
    }
  }

  // Fill in missing dates with 0 so the chart doesn't have gaps
  const chartData = [];
  for (let i = Number(days) - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateKey = d.toISOString().split('T')[0];
    chartData.push({
      date: dateKey,
      label: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      revenue: Math.round(revenueByDate[dateKey] || 0),
    });
  }

  const topProducts = Object.values(productSales)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  res.status(200).json({
    success: true,
    totalRevenue: Math.round(totalRevenue),
    totalOrders: orders.length,
    avgOrderValue: orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0,
    chartData,
    topProducts,
  });
});