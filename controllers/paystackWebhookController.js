import asyncHandler from 'express-async-handler';
import crypto from 'crypto';
import Order from '../models/Order.js';

/**
 * @desc   Handle Paystack Webhook Events
 * @route  POST /api/orders/paystack/webhook
 * @access Public (Paystack calls this route)
 */
export const paystackWebhook = asyncHandler(async (req, res) => {
  // ✅ STEP 1: Verify Paystack signature
  const secret = process.env.PAYSTACK_SECRET_KEY;
  const hash = crypto
    .createHmac('sha512', secret)
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (hash !== req.headers['x-paystack-signature']) {
    console.warn('⚠️ Invalid Paystack Webhook signature');
    return res.status(401).json({ message: 'Invalid signature' });
  }

  // ✅ STEP 2: Extract event data
  const event = req.body.event;
  const data = req.body.data;

  if (event === 'charge.success' && data.status === 'success') {
    const reference = data.reference;

    const order = await Order.findById(reference);
    if (!order) {
      console.warn(`⚠️ Webhook: Order not found for reference ${reference}`);
      return res.status(404).json({ message: 'Order not found' });
    }

    // Verify amount
    const expectedAmount = order.totalPrice * 100;
    if (data.amount !== expectedAmount) {
      console.warn(
        `⚠️ Webhook: Amount mismatch for ${reference}. Expected ${expectedAmount}, got ${data.amount}`
      );
      return res.status(400).json({ message: 'Amount mismatch' });
    }

    // ✅ Mark order as paid if not already updated
    if (!order.isPaid) {
      order.isPaid = true;
      order.paidAt = Date.now();
      order.paymentResult = {
        id: data.id,
        status: data.status,
        reference,
      };
      await order.save();
      console.log(`✅ Order ${reference} marked as paid via webhook`);
    }
  } else {
    console.log(`ℹ️ Unhandled Paystack event: ${event}`);
  }

  // ✅ Always respond with 200 so Paystack knows we received it
  res.status(200).json({ received: true });
});
