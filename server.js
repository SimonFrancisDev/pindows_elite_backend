// ----------------------------------------------------
// SERVER.JS — Finalized Backend Entry Point (ES6)
// ----------------------------------------------------
import dotenv from 'dotenv';
// 🛑 FIX: Execute config immediately to load process.env before other modules are imported/resolved
dotenv.config(); 

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

// Import routes (ES6 imports)
import userRoutes from './routes/userRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import paystackWebhookRoutes from './routes/paystackWebhookRoutes.js';
import subscriberRoutes from './routes/subscriberRoutes.js';



// ----------------------------------------------------
// DATABASE CONNECTION
// ----------------------------------------------------
connectDB();

const app = express();

// ----------------------------------------------------
// HELPERS (for __dirname replacement in ES modules)
// ----------------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ----------------------------------------------------
// MIDDLEWARE
// ----------------------------------------------------
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON payloads
app.use(express.static(path.join(__dirname, "public")));



// ----------------------------------------------------
// ROUTES
// ----------------------------------------------------
app.get('/', (req, res) => {
  res.send('🚀 API is running for MERN E-commerce...');
});

app.use('/api/orders/paystack', paystackWebhookRoutes)
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/subscribers', subscriberRoutes);

// ----------------------------------------------------
// STATIC FILES (for uploaded images)
// ----------------------------------------------------
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

// ----------------------------------------------------
// ERROR HANDLERS
// ----------------------------------------------------
app.use(notFound);
app.use(errorHandler);

// ----------------------------------------------------
// SERVER START
// ----------------------------------------------------
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `✅ Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`
  );
});
