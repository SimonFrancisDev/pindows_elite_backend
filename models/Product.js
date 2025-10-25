// /models/Product.js
import mongoose from 'mongoose';

// 1️⃣ Define the product schema (structure of the product document)
const productSchema = new mongoose.Schema(
  {
    // The admin or user who created this product
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User', // Creates a relationship with the User collection
    },

    // Product name
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      minlength: [3, 'Name must be at least 3 characters long'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },

    // Product image URL (from Cloudinary or your own image storage)
    image: {
      type: String,
      required: [true, 'Product image is required'],
      default: 'https://via.placeholder.com/600x400.png?text=No+Image',
    },

    // Product description
    description: {
      type: String,
      required: [true, 'Product description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
    },

    // Price of the product
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
      default: 0,
    },

    // How many units are in stock
    countInStock: {
      type: Number,
      required: [true, 'Stock count is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },

    // Flash sale feature
    flashSale: {
      type: Boolean,
      default: false,
    },

    // Discount price (if flash sale is on)
    discountPrice: {
      type: Number,
      default: 0,
    },

    // When the discount expires
    discountExpires: {
      type: Date,
    },

    // Optional: category, brand, and ratings for scalability
    category: {
      type: String,
      default: 'General',
    },

    brand: {
      type: String,
      default: 'Unknown',
    },

    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
  },
  {
    timestamps: true, // Auto adds createdAt and updatedAt fields
  }
);

// 2️⃣ Pre-save hook: automatically handle flash sale logic before saving
productSchema.pre('save', function (next) {
  if (this.flashSale) {
    // Calculate 20% discount
    this.discountPrice = this.price - this.price * 0.20;

    // Set expiration (3 weeks from now)
    if (!this.discountExpires) {
      const expireDate = new Date();
      expireDate.setDate(expireDate.getDate() + 21);
      this.discountExpires = expireDate;
    }
  } else {
    // Reset values if flash sale is off
    this.discountPrice = 0;
    this.discountExpires = null;
  }

  next();
});

// 3️⃣ Instance method: Renew flash sale manually
productSchema.methods.renewFlashSale = async function () {
  this.flashSale = true;
  const newExpireDate = new Date();
  newExpireDate.setDate(newExpireDate.getDate() + 21);
  this.discountExpires = newExpireDate;
  this.discountPrice = this.price - this.price * 0.1;
  return this.save();
};

// 4️⃣ Create and export the model
const Product = mongoose.models.Product || mongoose.model('Product', productSchema);
export default Product;
