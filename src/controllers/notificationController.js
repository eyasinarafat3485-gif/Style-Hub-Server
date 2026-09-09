const Notification = require('../models/Notification');
const MyCollection = require('../models/MyCollection');
const Order = require('../models/Order');

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
  userId,
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
    const resolvedUser = user || userId;
    if (!resolvedUser || !title) return null;
    const notification = await Notification.create({
      user: typeof resolvedUser === 'object' ? resolvedUser._id || resolvedUser.id : resolvedUser,
      userEmail: userEmail || (typeof resolvedUser === 'object' ? resolvedUser.email || '' : ''),
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

// @desc    Get logged in user notifications with pagination, dynamic counts & filtering
// @route   GET /api/notifications
// @access  Private
const getMyNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const requestedType = req.query.type || req.query.filter || 'all';

    const baseFilter = getUserFilter(req.user);

    // Auto-sync and clean up Wishlist & Cart notifications from MyCollection
    try {
      if (req.user?._id) {
        // 1. Wishlist Sync
        const wishlistItems = await MyCollection.find({
          user: req.user._id,
          itemType: 'wishlist',
        });
        const activeWishlistNames = wishlistItems.map((w) => w.name);

        // Delete notifications for items no longer in user's active wishlist
        if (activeWishlistNames.length === 0) {
          await Notification.deleteMany({
            ...baseFilter,
            type: 'wishlist_add',
          });
        } else {
          await Notification.deleteMany({
            ...baseFilter,
            type: 'wishlist_add',
            productName: { $nin: activeWishlistNames },
          });
        }

        // Auto-create notification for existing active wishlist items if not exists & remove duplicates
        for (const w of wishlistItems) {
          const notifs = await Notification.find({
            ...baseFilter,
            type: 'wishlist_add',
            productName: w.name,
          }).sort({ createdAt: -1 });

          if (notifs.length === 0) {
            await Notification.create({
              user: req.user._id,
              userEmail: req.user.email ? req.user.email.toLowerCase() : '',
              title: `${w.name} saved to Wishlist 💖`,
              message: `${w.name} is saved in your personal wishlist collection!`,
              type: 'wishlist_add',
              productImage: w.image || '',
              productName: w.name,
              price: Number(w.price) || 0,
              isRead: false,
            });
          } else if (notifs.length > 1) {
            const extraIds = notifs.slice(1).map((n) => n._id);
            await Notification.deleteMany({ _id: { $in: extraIds } });
          }
        }

        // 2. Cart Sync
        const cartItems = await MyCollection.find({
          user: req.user._id,
          itemType: 'cart',
        });
        const activeCartNames = cartItems.map((c) => c.name);

        if (activeCartNames.length === 0) {
          await Notification.deleteMany({
            ...baseFilter,
            type: { $in: ['cart_add', 'wishlist_to_cart'] },
          });
        } else {
          await Notification.deleteMany({
            ...baseFilter,
            type: { $in: ['cart_add', 'wishlist_to_cart'] },
            productName: { $nin: activeCartNames },
          });
        }

        for (const c of cartItems) {
          const notifs = await Notification.find({
            ...baseFilter,
            type: { $in: ['cart_add', 'wishlist_to_cart'] },
            productName: c.name,
          }).sort({ createdAt: -1 });

          if (notifs.length === 0) {
            await Notification.create({
              user: req.user._id,
              userEmail: req.user.email ? req.user.email.toLowerCase() : '',
              title: `${c.name} added to your Cart 🛒`,
              message: `${c.name} (${c.selectedSize || 'M'}) is in your shopping cart. Price: ৳${Number(c.price || 0).toLocaleString('en-BD')}`,
              type: 'cart_add',
              productImage: c.image || '',
              productName: c.name,
              price: Number(c.price) || 0,
              isRead: false,
            });
          } else if (notifs.length > 1) {
            const extraIds = notifs.slice(1).map((n) => n._id);
            await Notification.deleteMany({ _id: { $in: extraIds } });
          }
        }

        // 3. Orders Sync
        const userOrders = await Order.find({ user: req.user._id });
        for (const ord of userOrders) {
          const shortId = ord._id ? `ORD-${ord._id.toString().slice(-6).toUpperCase()}` : 'ORD-NEW';
          const exists = await Notification.findOne({
            user: req.user._id,
            type: 'order_status',
            orderId: shortId,
          });
          if (!exists) {
            await Notification.create({
              user: req.user._id,
              userEmail: req.user.email ? req.user.email.toLowerCase() : '',
              title: `🎉 Order #${shortId} Status: ${ord.status || 'Pending'}`,
              message: `Your order containing ${ord.orderItems?.length || 1} item(s) for ৳${Number(ord.totalPrice || 0).toLocaleString('en-BD')} is ${ord.status || 'Pending'}.`,
              type: 'order_status',
              productImage: ord.orderItems?.[0]?.image || '',
              productName: ord.orderItems?.[0]?.name || ord.orderItems?.[0]?.title || 'Fashion item',
              price: ord.totalPrice || 0,
              orderId: shortId,
              isRead: false,
            });
          }
        }
      }
    } catch (syncErr) {
      console.warn('Notification sync error:', syncErr.message);
    }

    // Dynamic Real-time Counts aggregation from MongoDB database
    const [allCount, unreadCount, liveCartCount, liveWishlistCount, liveOrdersCount] = await Promise.all([
      Notification.countDocuments(baseFilter),
      Notification.countDocuments({ ...baseFilter, isRead: false }),
      MyCollection.countDocuments({ user: req.user._id, itemType: 'cart' }),
      MyCollection.countDocuments({ user: req.user._id, itemType: 'wishlist' }),
      Order.countDocuments({ user: req.user._id }),
    ]);

    const counts = {
      all: allCount,
      unread: unreadCount,
      cart: liveCartCount,
      wishlist: liveWishlistCount,
      orders: liveOrdersCount,
    };

    // Apply Filter Query
    let queryFilter = { ...baseFilter };
    if (requestedType === 'unread') {
      queryFilter.isRead = false;
    } else if (requestedType === 'cart') {
      queryFilter.type = { $in: ['cart_add', 'wishlist_to_cart'] };
    } else if (requestedType === 'wishlist') {
      queryFilter.type = 'wishlist_add';
    } else if (requestedType === 'orders') {
      queryFilter.type = 'order_status';
    }

    const filteredTotal = await Notification.countDocuments(queryFilter);

    const notifications = await Notification.find(queryFilter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(filteredTotal / limit) || 1;

    return res.json({
      success: true,
      count: notifications.length,
      totalCount: allCount,
      filteredCount: filteredTotal,
      unreadCount,
      counts,
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
