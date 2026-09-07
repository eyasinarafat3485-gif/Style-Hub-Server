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
    const orders = await Order.find({}).populate('user', 'name email').sort({ createdAt: -1 });
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

// @desc    Update order status (Admin only)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.status = status || order.status;
    if (status === 'Delivered') {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
    }

    const updatedOrder = await order.save();

    // Trigger Notification for Customer
    const shortId = `SH-${updatedOrder._id.toString().slice(-6).toUpperCase()}`;
    const firstItemImg = updatedOrder.orderItems?.[0]?.image || '';
    const firstItemName = updatedOrder.orderItems?.[0]?.name || 'Order Shipment';

    await createNotificationHelper({
      user: updatedOrder.user,
      title: `Order #${shortId} Status Updated: ${status}`,
      message: `Your order #${shortId} status is now ${status}. Thank you for shopping with StyleHub!`,
      type: 'order_status',
      productImage: firstItemImg,
      productName: firstItemName,
      price: updatedOrder.totalPrice,
      orderId: shortId,
    });

    return res.json({
      success: true,
      order: updatedOrder,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update order status',
    });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
};
