const Order = require('../models/Order');
const MyCollection = require('../models/MyCollection');
const { createNotificationHelper } = require('./notificationController');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
  try {
    const {
      orderItems,
      shippingAddress,
      paymentMethod = 'Cash on Delivery',
      itemsPrice,
      shippingPrice = 60,
      totalPrice,
    } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ success: false, message: 'No order items provided' });
    }

    const order = new Order({
      user: req.user._id,
      orderItems,
      shippingAddress: shippingAddress || {
        fullName: req.user.name,
        phone: req.user.phone || '+880 1712-345678',
        address: 'Dhanmondi',
        city: 'Dhaka',
      },
      paymentMethod,
      itemsPrice: Number(itemsPrice) || 0,
      shippingPrice: Number(shippingPrice) || 60,
      totalPrice: Number(totalPrice) || Number(itemsPrice || 0) + Number(shippingPrice || 60),
      status: 'Pending',
    });

    const createdOrder = await order.save();

    // Clear cart from MyCollection after successful order placement
    await MyCollection.deleteMany({ user: req.user._id, itemType: 'cart' });

    // Trigger Notification for User
    const shortId = `SH-${createdOrder._id.toString().slice(-6).toUpperCase()}`;
    const firstItemImg = orderItems[0]?.image || '';
    const firstItemName = orderItems[0]?.name || orderItems[0]?.title || 'Fashion item';

    await createNotificationHelper({
      user: req.user._id,
      title: `Order #${shortId} Placed Successfully!`,
      message: `Your order containing ${orderItems.length} item(s) for ৳${createdOrder.totalPrice} has been confirmed.`,
      type: 'order_status',
      productImage: firstItemImg,
      productName: firstItemName,
      price: createdOrder.totalPrice,
      orderId: shortId,
    });

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      order: createdOrder,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to place order',
    });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    return res.json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch your orders',
    });
  }
};

// @desc    Get all orders (Admin only)
// @route   GET /api/orders
// @access  Private/Admin
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate('user', 'name email address phone avatar')
      .sort({ createdAt: -1 });
    return res.json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch all orders',
    });
  }
};

// @desc    Update order or specific item status (Admin only)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res) => {
  try {
    const { status, itemId, itemIndex } = req.body;
    const order = await Order.findById(req.params.id).populate('user', 'name email');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    let updatedItemName = 'Order Item';

    if (itemId || itemIndex !== undefined) {
      let targetItem = null;
      if (itemId) {
        targetItem = order.orderItems.find((it) => it._id?.toString() === itemId?.toString());
      }
      if (!targetItem && itemIndex !== undefined && order.orderItems[itemIndex]) {
        targetItem = order.orderItems[itemIndex];
      }

      if (targetItem) {
        targetItem.status = status;
        updatedItemName = targetItem.name || 'Order Item';
      }

      const allStatuses = order.orderItems.map((it) => it.status || 'Pending');
      const allDelivered = allStatuses.every((st) => st === 'Delivered');
      const allCancelled = allStatuses.every((st) => st === 'Cancelled');

      if (allDelivered) {
        order.status = 'Delivered';
        order.isDelivered = true;
        order.deliveredAt = Date.now();
      } else if (allCancelled) {
        order.status = 'Cancelled';
        order.isDelivered = false;
      } else if (allStatuses.some((st) => st === 'Shipped' || st === 'Delivered')) {
        order.status = 'Processing';
      } else {
        order.status = status;
      }
    } else {
      order.status = status || order.status;
      order.orderItems.forEach((it) => {
        it.status = status;
      });
      if (status === 'Delivered') {
        order.isDelivered = true;
        order.deliveredAt = Date.now();
      }
      if (status === 'Cancelled') {
        order.isDelivered = false;
      }
    }

    const updatedOrder = await order.save();

    // Trigger Notification for Customer
    const shortId = `ORD-${updatedOrder._id.toString().slice(-6).toUpperCase()}`;
    const firstItemImg = updatedOrder.orderItems?.[0]?.image || '';

    try {
      await createNotificationHelper({
        user: updatedOrder.user?._id || updatedOrder.user,
        userEmail: updatedOrder.user?.email || '',
        title: `Item Status Updated: ${status}`,
        message: `Your item "${updatedItemName}" in order #${shortId} is now marked as "${status}".`,
        type: 'order_status',
        productImage: firstItemImg,
        productName: updatedItemName,
        price: updatedOrder.totalPrice,
        orderId: shortId,
      });
    } catch (nErr) {
      console.warn('Failed to dispatch notification:', nErr.message);
    }

    return res.json({
      success: true,
      message: `Status updated to "${status}"`,
      order: updatedOrder,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update order status',
    });
  }
};

// @desc    Delete order or specific order item (Admin only)
// @route   DELETE /api/orders/:id
// @access  Private/Admin
const deleteOrder = async (req, res) => {
  try {
    const { itemId, itemIndex } = req.query;
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if ((itemId || itemIndex !== undefined) && order.orderItems.length > 1) {
      let removedPrice = 0;
      if (itemId) {
        const idx = order.orderItems.findIndex((it) => it._id?.toString() === itemId.toString());
        if (idx !== -1) {
          removedPrice = (order.orderItems[idx].price || 0) * (order.orderItems[idx].quantity || 1);
          order.orderItems.splice(idx, 1);
        }
      } else if (itemIndex !== undefined && order.orderItems[itemIndex]) {
        removedPrice =
          (order.orderItems[itemIndex].price || 0) *
          (order.orderItems[itemIndex].quantity || 1);
        order.orderItems.splice(Number(itemIndex), 1);
      }

      order.itemsPrice = Math.max(0, (order.itemsPrice || 0) - removedPrice);
      order.totalPrice = Math.max(0, (order.totalPrice || 0) - removedPrice);
      await order.save();

      return res.json({
        success: true,
        message: 'Order item removed successfully',
        order,
      });
    }

    await Order.findByIdAndDelete(req.params.id);
    return res.json({
      success: true,
      message: 'Order deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete order',
    });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
  deleteOrder,
};
