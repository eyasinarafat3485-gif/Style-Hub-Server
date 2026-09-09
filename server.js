const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const path = require('path');
const connectDB = require('./src/config/db');

// Load environment variables
dotenv.config();

// Connect to MongoDB Database
connectDB();

const app = express();

// Middleware: CORS
const allowedOrigin = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl/Postman) or allowed client URL
      if (!origin || origin === allowedOrigin || origin.startsWith('http://localhost:')) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive in development
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Middleware: Request Body Parsing (10mb limit for Base64 avatars & product images)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Middleware: Logger (Development)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Routes
const authRoutes = require('./src/routes/authRoutes');
const productRoutes = require('./src/routes/productRoutes');
const reviewRoutes = require('./src/routes/reviewRoutes');
const myCollectionRoutes = require('./src/routes/myCollectionRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const categoryRoutes = require('./src/routes/categoryRoutes');
const brandRoutes = require('./src/routes/brandRoutes');
const tagRoutes = require('./src/routes/tagRoutes');
const attributeRoutes = require('./src/routes/attributeRoutes');
const settingRoutes = require('./src/routes/settingRoutes');
const analyticsRoutes = require('./src/routes/analyticsRoutes');
const { notFound, errorHandler } = require('./src/middleware/errorMiddleware');

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/my-collections', myCollectionRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/attributes', attributeRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    message: 'StyleHub API Server is running smoothly',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Root welcome route
app.get('/', (req, res) => {
  res.send('StyleHub API Server is live.');
});

// 404 and Error Middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`\n🚀 StyleHub Backend Server running on port ${PORT}`);
  console.log(`📍 API Health Endpoint: http://localhost:${PORT}/api/health`);
  console.log(`📦 Products Endpoint:   http://localhost:${PORT}/api/products`);
  console.log(`🔐 Auth Endpoint:       http://localhost:${PORT}/api/auth\n`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection Error: ${err.message}`);
});

module.exports = app;
