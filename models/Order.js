import mongoose from 'mongoose';

// 1️⃣ Define the Order schema
const orderSchema = new mongoose.Schema(
  {
    // The user (buyer) who placed the order (Optional for Guest Users)
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: false, // 🟢 MODIFIED: Not required for guest checkout
      ref: 'User', 
    },

    // 🟢 NEW: Store Buyer Contact/Identity for Guest Orders (and logged-in)
    buyer: {
        name: { type: String, required: [true, 'Buyer name is required'] },
        email: { type: String, required: [true, 'Buyer email is required'] },
        // This ensures the order always has a contact identity, regardless of login status.
    },

    // List of ordered products (each item in the order)
    orderItems: [
      {
        name: { type: String, required: [true, 'Product name is required'], trim: true },
        qty: { type: Number, required: [true, 'Quantity is required'], min: [1, 'Quantity cannot be less than 1'] },
        image: { type: String, required: [true, 'Product image is required'], default: 'https://via.placeholder.com/300x300.png?text=No+Image' },
        price: { type: Number, required: [true, 'Price is required'], min: [0, 'Price cannot be negative'] },
        product: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Product' },
      },
    ],

    // Shipping details (expanded for completeness)
    shippingAddress: {
      // 🟢 MODIFIED: Added detailed fields
      streetAddress: { type: String, required: [true, 'Street address is required'] },
      city: { type: String, required: [true, 'City is required'] },
      state: { type: String, required: [true, 'State is required'] }, // Ready for frontend dropdown
      postalCode: { type: String, required: [true, 'Postal code is required'] },
      country: { type: String, required: [true, 'Country is required'] },
      contactPhone: { type: String, required: [true, 'Shipping contact phone number is required'] }, // Shipping phone number
    },

    // Payment information (unmodified)
    paymentMethod: {
      type: String,
      required: true,
      enum: ['Paystack', 'Flutterwave', 'Stripe', 'PayPal', 'CashOnDelivery'],
      default: 'Paystack',
    },

    // Details returned from the payment provider (unmodified)
    paymentResult: {
      id: { type: String }, 
      status: { type: String },
      reference: { type: String }, 
      amount: { type: Number },
      currency: { type: String, default: 'NGN' },
    },

    // Total price for the order (unmodified)
    totalPrice: {
      type: Number,
      required: [true, 'Total price is required'],
      default: 0.0,
      min: [0, 'Total price cannot be negative'],
    },

    // Explicit string status (unmodified)
    orderStatus: {
        type: String,
        required: true,
        enum: ['Processing', 'Shipped', 'Delivered', 'Cancelled'], 
        default: 'Processing',
    },

    // Order payment status (unmodified)
    isPaid: { type: Boolean, default: false },
    paidAt: { type: Date },

    // Order delivery status (unmodified)
    isDelivered: { type: Boolean, default: false },
    deliveredAt: { type: Date },

    // Optional: tracking info and delivery service (unmodified)
    deliveryDetails: {
      courier: { type: String, default: 'Not Assigned' },
      trackingNumber: { type: String, default: null },
      estimatedDelivery: { type: Date },
    },
  },
  { timestamps: true }
);

// 2️⃣ Optional method: mark order as paid (unmodified)
orderSchema.methods.markAsPaid = async function (paymentData) {
  this.isPaid = true;
  this.paidAt = new Date();
  this.paymentResult = paymentData;
  if(this.orderStatus === 'Processing' && this.isPaid) {
      this.orderStatus = 'Processing';
  }
  await this.save();
};

// 3️⃣ Optional method: mark order as delivered (unmodified)
orderSchema.methods.markAsDelivered = async function () {
  this.isDelivered = true;
  this.deliveredAt = new Date();
  this.orderStatus = 'Delivered';
  await this.save();
};

// 4️⃣ Create and export model
const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
export default Order;