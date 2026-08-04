import express from 'express';
import {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from '../controllers/addressController.js';
import { isLoggedIn } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(isLoggedIn);

router.route('/').get(getAddresses).post(createAddress);
router.route('/:id').put(updateAddress).delete(deleteAddress);
router.patch('/:id/default', setDefaultAddress);

export default router;