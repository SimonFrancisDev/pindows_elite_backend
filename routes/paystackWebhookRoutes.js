import express from 'express';
import { paystackWebhook } from '../controllers/paystackWebhookController.js';

const router = express.Router();

// Paystack sends webhook data as raw JSON string
router.post('/webhook', express.json({ verify: (req, res, buf) => (req.rawBody = buf) }), paystackWebhook);

export default router;
