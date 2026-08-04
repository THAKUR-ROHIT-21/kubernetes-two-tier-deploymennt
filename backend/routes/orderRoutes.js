import express from 'express';
import {
  createRazorpayOrder,
  verifyPayment,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  getSalesAnalytics,
} from '../controllers/orderController.js';
import { isLoggedIn, isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(isLoggedIn);

// Admin routes — must come BEFORE /:id, otherwise Express treats "admin" as an :id value
router.get('/admin/all', isAdmin, getAllOrders);
router.get('/admin/analytics', isAdmin, getSalesAnalytics);
router.patch('/admin/:id/status', isAdmin, updateOrderStatus);

router.post('/razorpay', createRazorpayOrder);
router.post('/verify', verifyPayment);
router.get('/', getMyOrders);
router.get('/:id', getOrderById);


export default router;