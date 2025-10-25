import express from 'express';
import {
  addOrderItems,
  getOrders,
  getMyOrders,
  verifyPaystackPayment,
  updateOrderStatus,
  deleteOrder, 
} from '../controllers/orderController.js';
// 🟢 MODIFIED: Assume `optionalProtect` is now available in authMiddleware.js
import { protect, authorizeRoles, optionalProtect } from '../middleware/authMiddleware.js'; 

const router = express.Router();

// ----------------------------------------------------
// 1. PUBLIC ROUTE – Paystack Callback Verification (unmodified)
// ----------------------------------------------------
router.route('/paystack/verify/:reference').get(verifyPaystackPayment);

// ----------------------------------------------------
// 2. USER/GUEST ROUTES 
// ----------------------------------------------------
// 🟢 MODIFIED: Allows both logged-in users and guests to post an order.
router.route('/').post(optionalProtect, addOrderItems); 

// User views their own orders (Must be logged in)
router.route('/myorders').get(protect, getMyOrders);

// User deletes a specific order by ID (Must be logged in)
router.route('/:id').delete(protect, deleteOrder);


// ----------------------------------------------------
// 3. ADMIN ROUTES (Protected + Role Restricted - unmodified)
// ----------------------------------------------------
// Admin views all orders (with user details)
router.route('/admin').get(protect, authorizeRoles('admin'), getOrders);

// Admin updates order status (Processing / Shipped / Delivered)
router
  .route('/:id/status')
  .put(protect, authorizeRoles('admin'), updateOrderStatus);

export default router;