// /routes/productRoutes.js
import express from 'express';
import {
  getProducts,
  getProductById,
  uploadImage,
  createProduct,
  upload,
} from '../controllers/productController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// ✅ Public Routes
router.get('/', getProducts);
router.get('/:id', getProductById);

// ✅ Admin Routes
router.post(
  '/upload',
  protect,
  authorizeRoles('admin'),
  upload.single('image'),
  uploadImage
);

router.post(
  '/admin',
  protect,
  authorizeRoles('admin'),
  createProduct
);

export default router;
