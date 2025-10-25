// /controllers/productController.js
import asyncHandler from 'express-async-handler';
import Product from '../models/Product.js';
import cloudinary from '../config/cloudinary.js';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// ✅ Cloudinary Storage Configuration
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'pindows_products', // Folder from your Cloudinary preset
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  },
});

export const upload = multer({ storage });

// ------------------------------------------------------------
// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
// ------------------------------------------------------------
export const getProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({});
  res.json(products);
});

// ------------------------------------------------------------
// @desc    Fetch single product
// @route   GET /api/products/:id
// @access  Public
// ------------------------------------------------------------
export const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (product) res.json(product);
  else {
    res.status(404);
    throw new Error('Product not found');
  }
});

// ------------------------------------------------------------
// @desc    Upload Image to Cloudinary
// @route   POST /api/products/upload
// @access  Private/Admin
// ------------------------------------------------------------
export const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('No image file provided.');
  }

  res.json({
    message: 'Image uploaded successfully',
    image: req.file.path, // Cloudinary gives a public HTTPS URL
  });
});

// ------------------------------------------------------------
// @desc    Create new product (Admin only)
// @route   POST /api/products/admin
// @access  Private/Admin
// ------------------------------------------------------------
export const createProduct = asyncHandler(async (req, res) => {
  const { name, price, description, image, countInStock, flashSale } = req.body;

  if (!name || !price || !description || !image || countInStock === undefined) {
    res.status(400);
    throw new Error('Please provide all required product fields.');
  }

  const product = new Product({
    user: req.user._id,
    name,
    price,
    description,
    image, // ✅ Cloudinary image URL from the frontend
    countInStock,
    flashSale: flashSale === 'true' || flashSale === true,
  });

  const createdProduct = await product.save();
  res.status(201).json(createdProduct);
});
