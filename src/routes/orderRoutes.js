const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const {
  createOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
  deleteOrder,
} = require('../controllers/orderController');
const { protect, admin } = require('../middleware/authMiddleware');

const optionalProtect = async (req, res, next) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'stylehub_secret_fallback');
      if (decoded && decoded.id) {
        req.user = await User.findById(decoded.id).select('-password');
      }
    } catch (err) {
      console.warn('Optional auth token notice:', err.message);
    }
  }
  next();
};

// Create order allows both guest & registered users
router.post('/', optionalProtect, createOrder);

// User & Admin protected routes
router.get('/myorders', protect, getMyOrders);
router.get('/', protect, admin, getAllOrders);
router.put('/:id/status', protect, admin, updateOrderStatus);
router.delete('/:id', protect, admin, deleteOrder);

module.exports = router;

