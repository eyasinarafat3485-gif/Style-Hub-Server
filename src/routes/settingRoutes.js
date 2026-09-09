const express = require('express');
const router = express.Router();
const {
  getSettings,
  updateSettings,
  addPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
} = require('../controllers/settingController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public route to read settings (shipping fee, currency, active payment methods)
router.get('/', getSettings);

// Admin-protected configuration routes
router.put('/', protect, admin, updateSettings);
router.post('/payment-methods', protect, admin, addPaymentMethod);
router.put('/payment-methods/:id', protect, admin, updatePaymentMethod);
router.delete('/payment-methods/:id', protect, admin, deletePaymentMethod);

module.exports = router;
