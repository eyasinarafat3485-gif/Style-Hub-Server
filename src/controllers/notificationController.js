const Notification = require('../models/Notification');

// Helper function to query user notifications by _id or email
const getUserFilter = (user) => {
  if (!user) return {};
  const filterArr = [];
  if (user._id) filterArr.push({ user: user._id });
  if (user.id) filterArr.push({ user: user.id });
  if (user.email) filterArr.push({ userEmail: user.email.toLowerCase() });
  return filterArr.length > 0 ? { $or: filterArr } : { user: user._id };
};

// Helper function to create notification programmatically from other controllers
const createNotificationHelper = async ({
  user,
  userEmail = '',
  title,
  message,
  type = 'system',
  productImage = '',
  productName = '',
  price = 0,
  orderId = '',
}) => {
  try {
    if (!user || !title) return null;
    const notification = await Notification.create({
      user: typeof user === 'object' ? user._id || user.id : user,
      userEmail: userEmail || (typeof user === 'object' ? user.email || '' : ''),
      title,
      message,
      type,
      productImage,
      productName,
      price: Number(price) || 0,
      orderId,
    });
    return notification;
  } catch (error) {
    console.error('Error creating helper notification:', error.message);
    return null;
  }
};

// @desc    Get logged in user notifications with pagination & auto-seed initial welcome alerts
// @route   GET /api/notifications
// @access  Private
const getMyNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const filter = getUserFilter(req.user);

    let totalCount = await Notification.countDocuments(filter);

    // Seed default welcome & system notifications if user has 0 notifications
    if (totalCount === 0) {
      await Notification.create([
        {
          user: req.user._id,
          userEmail: req.user.email ? req.user.email.toLowerCase() : '',
          title: 'Welcome Promo Voucher Available! 🎁',
          message: 'Use promo code STYLE15 at checkout to get 15% OFF on your next fashion order.',
          type: 'promo',
          productImage: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&auto=format&fit=crop&q=80',
          productName: 'StyleHub Promo Voucher',
          price: 0,
          isRead: false,
        },
        {
          user: req.user._id,
          userEmail: req.user.email ? req.user.email.toLowerCase() : '',
          title: 'Account Security Check & Verified 🔐',
          message: `Successful login detected for ${req.user.email || 'your account'}. Your customer portal is active and secure.`,
          type: 'system',
          price: 0,
          isRead: true,
        },
      ]);
      totalCount = await Notification.countDocuments(filter);
    }

    const unreadCount = await Notification.countDocuments({ ...filter, isRead: false });

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(totalCount / limit) || 1;

    return res.json({
      success: true,
      count: notifications.length,
      totalCount,
      unreadCount,
      page,
      totalPages,
      notifications,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch notifications',
    });
  }
};

// @desc    Create a new notification manually
// @route   POST /api/notifications
// @access  Private
const createNotification = async (req, res) => {
  try {
    const { title, message, type, productImage, productName, price, orderId } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title and message for notification',
      });
    }

    const notification = await Notification.create({
      user: req.user._id,
      userEmail: req.user.email ? req.user.email.toLowerCase() : '',
      title,
      message,
      type: type || 'system',
      productImage: productImage || '',
      productName: productName || '',
      price: Number(price) || 0,
      orderId: orderId || '',
    });

    return res.status(201).json({
      success: true,
      notification,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create notification',
    });
  }
};

// @desc    Mark all user notifications as read
// @route   PUT /api/notifications/mark-all-read
// @access  Private
const markAllAsRead = async (req, res) => {
  try {
    const filter = getUserFilter(req.user);
    await Notification.updateMany(
      { ...filter, isRead: false },
      { $set: { isRead: true } }
    );

    return res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to mark notifications as read',
    });
  }
};

// @desc    Mark single notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markSingleAsRead = async (req, res) => {
  try {
    const filter = getUserFilter(req.user);
    const notification = await Notification.findOne({
      _id: req.params.id,
      ...filter,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    notification.isRead = true;
    await notification.save();

    return res.json({
      success: true,
      notification,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to mark notification as read',
    });
  }
};

// @desc    Delete single notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = async (req, res) => {
  try {
    const filter = getUserFilter(req.user);
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      ...filter,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    return res.json({
      success: true,
      message: 'Notification deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete notification',
    });
  }
};

module.exports = {
  createNotificationHelper,
  getMyNotifications,
  createNotification,
  markAllAsRead,
  markSingleAsRead,
  deleteNotification,
};
