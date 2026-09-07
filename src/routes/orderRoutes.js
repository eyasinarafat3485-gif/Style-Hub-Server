const express = require('express');
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
} = require('../controllers/orderController');
const { protect, admin } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/myorders').get(getMyOrders);

router.route('/')
  .post(createOrder)
  .get(admin, getAllOrders);

router.route('/:id/status').put(admin, updateOrderStatus);

module.exports = router;
