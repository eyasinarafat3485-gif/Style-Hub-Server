const express = require('express');
const router = express.Router();
const {
  getMyNotifications,
  createNotification,
  markAllAsRead,
  markSingleAsRead,
  deleteNotification,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getMyNotifications);
router.post('/', protect, createNotification);
router.put('/mark-all-read', protect, markAllAsRead);
router.put('/:id/read', protect, markSingleAsRead);
router.delete('/:id', protect, deleteNotification);

module.exports = router;
