// /controllers/orderController.js
import asyncHandler from 'express-async-handler';
import axios from 'axios';
import Order from '../models/Order.js';

// 🧾 CREATE ORDER & INITIALIZE PAYSTACK PAYMENT
// @route   POST /api/orders
// @access  Private
export const addOrderItems = asyncHandler(async (req, res) => {
  const { orderItems, shippingAddress, totalPrice } = req.body;

  if (!orderItems || orderItems.length === 0) {
    res.status(400);
    throw new Error('No order items');
  }

  // 1️⃣ Create unpaid order in MongoDB
  const order = new Order({
    user: req.user._id,
    orderItems,
    shippingAddress,
    paymentMethod: 'Paystack',
    totalPrice,
    // 🟢 UPDATE: Set initial status using the new field
    orderStatus: 'Processing', 
  });

  const createdOrder = await order.save();

  // 2️⃣ Initialize Paystack transaction
  const amountKobo = createdOrder.totalPrice * 100; // ₦1 = 100 Kobo

  try {
    const { data } = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email: req.user.email,
        amount: amountKobo,
        reference: createdOrder._id.toString(), // use order ID as reference
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (data.status) {
      res.status(201).json({
        orderId: createdOrder._id,
        authorization_url: data.data.authorization_url,
        reference: data.data.reference,
        message: 'Payment initialized successfully',
      });
    } else {
      res.status(500);
      throw new Error(`Paystack initialization failed: ${data.message}`);
    }
  } catch (error) {
    console.error('Paystack Initialization Error:', error.response?.data || error.message);
    res.status(500);
    throw new Error('Could not connect to Paystack for initialization');
  }
});


// 💳 VERIFY PAYSTACK PAYMENT
// @route   GET /api/orders/paystack/verify/:reference
// @access  Public
export const verifyPaystackPayment = asyncHandler(async (req, res) => {
  const { reference } = req.params;

  try {
    const { data } = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
      }
    );

    if (data.data?.status === 'success') {
      const order = await Order.findById(reference);
      if (!order) {
        res.status(404);
        throw new Error('Order not found after payment');
      }

      // ✅ Verify amount consistency
      const expectedAmount = order.totalPrice * 100;
      if (data.data.amount !== expectedAmount) {
        res.status(400);
        throw new Error('Payment verification failed: amount mismatch');
      }

      // ✅ Mark order as paid
      order.isPaid = true;
      order.paidAt = Date.now();
      order.paymentResult = {
        id: data.data.id,
        status: data.data.status,
        reference,
      };

      const updatedOrder = await order.save();
      res.json({ message: 'Payment successful', order: updatedOrder });
    } else {
      res.status(400);
      throw new Error(`Payment failed: ${data.message}`);
    }
  } catch (error) {
    console.error('Paystack Verification Error:', error.response?.data || error.message);
    res.status(500);
    throw new Error('Could not verify Paystack payment');
  }
});


// 📋 GET ALL ORDERS (ADMIN)
// @route   GET /api/orders/admin
// @access  Private/Admin
export const getOrders = asyncHandler(async (req, res) => {
    // 🟢 MODIFIED: Populate user to get name, email, and phoneNumber.
    // By default, Mongoose returns all fields on the Order model, 
    // including shippingAddress and orderItems, so we don't need explicit populate for them.
  const orders = await Order.find({}).populate(
    'user', 
    'id name email phoneNumber' // ⬅️ ADDED: phoneNumber to be populated from User
  );
  res.json(orders);
});


// 👤 GET LOGGED-IN USER’S ORDERS
// @route   GET /api/orders/myorders
// @access  Private
export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id });
  res.json(orders);
});


// 🏷️ UPDATE ORDER STATUS (ADMIN)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // 🟢 UPDATE: Update the primary status field
  order.orderStatus = status;

  switch (status) {
    case 'Processing':
      order.isPaid = true;
      order.isDelivered = false;
      // Clear deliveredAt when changing from Delivered status
      order.deliveredAt = undefined; 
      break;
    case 'Shipped':
      order.isPaid = true;
      order.isDelivered = false;
      order.deliveredAt = undefined;
      order.deliveryDetails = {
        courier: 'In transit',
        trackingNumber: `TRK-${Math.floor(Math.random() * 1000000)}`,
      };
      break;
    case 'Delivered':
      order.isPaid = true;
      order.isDelivered = true;
      order.deliveredAt = Date.now();
      break;
    default:
      res.status(400);
      throw new Error('Invalid status update');
  }

  const updatedOrder = await order.save();
  res.json({ message: `Order updated to ${status}`, order: updatedOrder });
});

// ----------------------------------------------------
// ❌ DELETE USER ORDER FROM HISTORY (USER)
// @route   DELETE /api/orders/:id
// @access  Private
// ----------------------------------------------------
export const deleteOrder = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }

    // 1. SECURITY CHECK: Ensure the order belongs to the logged-in user
    if (order.user.toString() !== req.user._id.toString()) {
        res.status(401);
        throw new Error('Not authorized to delete this order. Access denied.');
    }

    // 2. BUSINESS LOGIC CHECK: Only allow deletion if the status is 'Delivered'
    // This now reliably uses the new orderStatus field
    if (order.orderStatus !== 'Delivered') {
        res.status(400);
        throw new Error('Order cannot be deleted. Only orders with "Delivered" status can be removed from history.');
    }

    // 3. DELETE THE ORDER
    await order.deleteOne();

    res.json({ message: 'Order successfully removed from user history.' });
});