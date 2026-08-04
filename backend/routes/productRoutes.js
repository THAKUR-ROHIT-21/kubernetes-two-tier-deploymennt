import express from 'express';
import { createProduct, getProducts, bulkCreateProducts, getProductById } from '../controllers/productController.js';
import upload from '../middleware/uploadMiddleware.js';
import { isLoggedIn, isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET routes stay public — anyone can browse products without logging in
router.route('/').get(getProducts);
router.route('/:id').get(getProductById);

// POST routes require login AND admin role — this is where "admin full access" is enforced
router.route('/').post(isLoggedIn, isAdmin, upload.array('images', 5), createProduct);
router.route('/bulk').post(isLoggedIn, isAdmin, bulkCreateProducts);

export default router;