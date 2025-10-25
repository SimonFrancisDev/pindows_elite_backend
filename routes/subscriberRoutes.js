// /backend/routes/subscriberRoutes.js

import express from 'express';
import { addSubscriber, sendUpdateEmail } from '../controllers/subscriberController.js'; 
import { protect, authorizeRoles } from '../middleware/authMiddleware.js'; // ⬅️ Fixed Import

const router = express.Router();

router.route('/').post(addSubscriber);

// Use authorizeRoles('admin') to enforce that the user must be logged in and have the 'admin' role
router.route('/send-update').post(protect, authorizeRoles('admin'), sendUpdateEmail); 

export default router;