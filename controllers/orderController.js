import asyncHandler from 'express-async-handler';
import axios from 'axios';
import Order from '../models/Order.js';
// 🟢 NEW: Import email utilities
import { sendEmail } from '../utils/sendEmail.js'; 
import { generateOrderConfirmationHtml } from '../utils/emailTemplates.js'; 

// --------------------------------------------------------------------------------
// 🧾 CREATE ORDER & INITIALIZE PAYSTACK PAYMENT
// @route   POST /api/orders
// @access  Public (via optionalProtect)
// --------------------------------------------------------------------------------
export const addOrderItems = asyncHandler(async (req, res) => {
  // Frontend sends: orderItems, shippingAddress (with all fields), totalPrice, 
  // and potentially buyerName/buyerEmail if guest.
  const { orderItems, shippingAddress, totalPrice, buyerName, buyerEmail } = req.body;

  if (!orderItems || orderItems.length === 0) {
    res.status(400);
    throw new Error('No order items');
  }

  // 🟢 1️⃣ Determine Buyer Identity and Prepare Order Data
  const orderData = {
    orderItems,
    shippingAddress,
    paymentMethod: 'Paystack',
    totalPrice,
    orderStatus: 'Processing',
  };
  
  let payerEmail;
  let buyerNameFinal;

  if (req.user && req.user._id) {
    // LOGGED-IN USER: Uses req.user data
    orderData.user = req.user._id;
    orderData.buyer = { name: req.user.name, email: req.user.email };
    payerEmail = req.user.email;
    buyerNameFinal = req.user.name;

  } else if (buyerName && buyerEmail) {
    // GUEST USER: Uses body data, 'user' field remains null/undefined
    orderData.buyer = { name: buyerName, email: buyerEmail };
    payerEmail = buyerEmail;
    buyerNameFinal = buyerName;

  } else {
    res.status(400);
    throw new Error('Buyer information (name and email) is required');
  }

  // 1b. Validate required shipping fields
  const requiredShippingFields = ['streetAddress', 'city', 'state', 'postalCode', 'country', 'contactPhone'];
  for (const field of requiredShippingFields) {
      if (!shippingAddress[field]) {
          res.status(400);
          throw new Error(`Shipping address field: ${field} is required.`);
      }
  }


  // 🟢 2️⃣ Save order in MongoDB (unpaid)
  const createdOrder = await Order.create(orderData);

  // 🟢 3️⃣ Prepare Paystack transaction
  const amountKobo = createdOrder.totalPrice * 100;

  try {
    const { data } = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email: payerEmail, 
        amount: amountKobo,
        reference: createdOrder._id.toString(),
        metadata: {
          custom_fields: [
            { display_name: "Buyer Name", variable_name: "buyer_name", value: buyerNameFinal }
          ]
        }
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


// --------------------------------------------------------------------------------
// 💳 VERIFY PAYSTACK PAYMENT (sends email)
// @route   GET /api/orders/paystack/verify/:reference
// @access  Public
// --------------------------------------------------------------------------------
export const verifyPaystackPayment = asyncHandler(async (req, res) => {
  const { reference } = req.params;

  try {
    // ... Paystack verification logic (unchanged) ...
    const { data } = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
    );

    if (data.data?.status === 'success') {
      // Populate user for email template (if account holder)
      const order = await Order.findById(reference).populate('user', 'name email'); 
      if (!order) {
        res.status(404);
        throw new Error('Order not found after payment');
      }

      // Verification and marking as paid (unchanged)
      order.isPaid = true;
      order.paidAt = Date.now();
      order.paymentResult = { id: data.data.id, status: data.data.status, reference };
      const updatedOrder = await order.save();
      
      // 🟢 NEW: SEND ORDER CONFIRMATION EMAIL
      const recipientEmail = updatedOrder.buyer.email; 
      const recipientName = updatedOrder.buyer.name;

      // Ensure you have generated the required HTML function in utils/emailTemplates.js
      const emailHtml = generateOrderConfirmationHtml(updatedOrder, recipientName); 

      try {
        await sendEmail(
          recipientEmail, 
          `🎉 Your Pindows Elite Order #${updatedOrder._id.toString().slice(-8)} is Confirmed!`, 
          emailHtml
        );
      } catch (emailError) {
        // Log the email error but don't stop the main response
        console.error("Failed to send order confirmation email:", emailError.message);
      }

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


// --------------------------------------------------------------------------------
// 📋 GET ALL ORDERS (ADMIN)
// @route   GET /api/orders/admin
// @access  Private/Admin
// --------------------------------------------------------------------------------
export const getOrders = asyncHandler(async (req, res) => {
    // Unmodified: Continues to populate user data for logged-in users.
  const orders = await Order.find({}).populate(
    'user', 
    'id name email phoneNumber' 
  );
  res.json(orders);
});

// --------------------------------------------------------------------------------
// 👤 GET LOGGED-IN USER’S ORDERS (FIXED to include guest orders by email)
// @route   GET /api/orders/myorders
// @access  Private
// --------------------------------------------------------------------------------
export const getMyOrders = asyncHandler(async (req, res) => {
    // 🟢 FIX: Search for orders where the 'user' field matches the logged-in ID
    // OR where the 'buyer.email' field matches the logged-in user's email.
    // This captures orders placed while logged in AND orders placed as a guest 
    // using the same email address.
    const orders = await Order.find({ 
        $or: [
            { user: req.user._id },
            { 'buyer.email': req.user.email }
        ]
    }).sort({ createdAt: -1 }); // Sort by creation date descending to show latest first

    res.json(orders);
});

// ... (updateOrderStatus and deleteOrder remain unchanged as they require authentication) ...

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


// --------------------------------------------------------------------------------
// 📦 GET GUEST ORDERS BY EMAIL (PUBLIC)
// @route   GET /api/orders/guest/:email
// @access  Public
// --------------------------------------------------------------------------------
export const getGuestOrders = asyncHandler(async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      res.status(400);
      throw new Error('Email is required to find guest orders');
    }

    // Find orders matching the guest email (case-insensitive)
    const orders = await Order.find({
      'buyer.email': { $regex: new RegExp(`^${email}$`, 'i') },
    }).sort({ createdAt: -1 });

    if (!orders || orders.length === 0) {
      res.status(404);
      throw new Error('No orders found for this email.');
    }

    res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching guest orders:', error);
    res.status(500);
    throw new Error('Failed to fetch guest orders');
  }
});
