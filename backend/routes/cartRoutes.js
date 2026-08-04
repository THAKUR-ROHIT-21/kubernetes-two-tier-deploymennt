import express from 'express';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from '../controllers/cartController.js';
import { isLoggedIn } from '../middleware/authMiddleware.js';

const router = express.Router();

// every cart route requires login — applied once here instead of repeating on each route
router.use(isLoggedIn);

router.route('/').get(getCart).post(addToCart).delete(clearCart);
router.route('/:productId').put(updateCartItem).delete(removeFromCart);

export default router;