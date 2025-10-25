// /routes/orderRoutes.js 
import express from 'express';
import {
  addOrderItems,
  getOrders,
  getMyOrders,
  verifyPaystackPayment,
  updateOrderStatus,
  deleteOrder, // ✅ Correctly imported
} from '../controllers/orderController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// ----------------------------------------------------
// 1. PUBLIC ROUTE – Paystack Callback Verification
// ----------------------------------------------------
router.route('/paystack/verify/:reference').get(verifyPaystackPayment);

// ----------------------------------------------------
// 2. USER ROUTES (Protected)
// ----------------------------------------------------
// User creates a new order
router.route('/').post(protect, addOrderItems);

// User views their own orders
router.route('/myorders').get(protect, getMyOrders);

// 🟢 NEW: User deletes a specific order by ID (e.g., /api/orders/:id)
// This route is correctly defined and protected.
router.route('/:id').delete(protect, deleteOrder);


// ----------------------------------------------------
// 3. ADMIN ROUTES (Protected + Role Restricted)
// ----------------------------------------------------
// Admin views all orders (with user details)
router.route('/admin').get(protect, authorizeRoles('admin'), getOrders);

// Admin updates order status (Processing / Shipped / Delivered)
router
  .route('/:id/status')
  .put(protect, authorizeRoles('admin'), updateOrderStatus);

export default router;
