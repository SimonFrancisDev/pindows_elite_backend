// /models/Order.js
import mongoose from 'mongoose';

// 1️⃣ Define the Order schema
const orderSchema = new mongoose.Schema(
  {
    // The user (buyer) who placed the order
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User', // References the User collection
    },

    // List of ordered products (each item in the order)
    orderItems: [
      {
        name: {
          type: String,
          required: [true, 'Product name is required'],
          trim: true,
        },
        qty: {
          type: Number,
          required: [true, 'Quantity is required'],
          min: [1, 'Quantity cannot be less than 1'],
        },
        image: {
          type: String,
          required: [true, 'Product image is required'],
          default: 'https://via.placeholder.com/300x300.png?text=No+Image',
        },
        price: {
          type: Number,
          required: [true, 'Price is required'],
          min: [0, 'Price cannot be negative'],
        },
        product: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: 'Product', // Links each order item to the actual Product
        },
      },
    ],

    // Shipping details (address, city, etc.)
    shippingAddress: {
      address: { type: String, required: [true, 'Shipping address is required'] },
      city: { type: String, required: [true, 'City is required'] },
      postalCode: { type: String, required: [true, 'Postal code is required'] },
      country: { type: String, required: [true, 'Country is required'] },
    },

    // Payment information
    paymentMethod: {
      type: String,
      required: true,
      enum: ['Paystack', 'Flutterwave', 'Stripe', 'PayPal', 'CashOnDelivery'],
      default: 'Paystack',
    },

    // Details returned from the payment provider (like Paystack)
    paymentResult: {
      id: { type: String }, // Paystack transaction ID
      status: { type: String }, // Payment status
      reference: { type: String }, // Paystack reference
      amount: { type: Number }, // Optional: amount confirmed by gateway
      currency: { type: String, default: 'NGN' },
    },

    // Total price for the order
    totalPrice: {
      type: Number,
      required: [true, 'Total price is required'],
      default: 0.0,
      min: [0, 'Total price cannot be negative'],
    },

    // 🟢 NEW: Explicit string status for front-end display and logic
    orderStatus: {
        type: String,
        required: true,
        enum: ['Processing', 'Shipped', 'Delivered', 'Cancelled'], 
        default: 'Processing',
    },

    // Order payment status
    isPaid: {
      type: Boolean,
      default: false,
    },
    paidAt: {
      type: Date,
    },

    // Order delivery status
    isDelivered: {
      type: Boolean,
      default: false,
    },
    deliveredAt: {
      type: Date,
    },

    // Optional: tracking info and delivery service
    deliveryDetails: {
      courier: { type: String, default: 'Not Assigned' },
      trackingNumber: { type: String, default: null },
      estimatedDelivery: { type: Date },
    },
  },
  {
    timestamps: true, // Auto adds createdAt and updatedAt
  }
);

// 2️⃣ Optional method: mark order as paid
orderSchema.methods.markAsPaid = async function (paymentData) {
  this.isPaid = true;
  this.paidAt = new Date();
  this.paymentResult = paymentData;
  // If updating manually via method, ensure status is set
  if(this.orderStatus === 'Processing' && this.isPaid) {
      this.orderStatus = 'Processing';
  }
  await this.save();
};

// 3️⃣ Optional method: mark order as delivered
orderSchema.methods.markAsDelivered = async function () {
  this.isDelivered = true;
  this.deliveredAt = new Date();
  this.orderStatus = 'Delivered'; // 🟢 Update new field
  await this.save();
};

// 4️⃣ Create and export model
const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
export default Order;
