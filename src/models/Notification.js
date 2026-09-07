const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    userEmail: {
      type: String,
      default: '',
      trim: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['cart_add', 'wishlist_add', 'wishlist_to_cart', 'order_status', 'promo', 'system'],
      default: 'system',
    },
    productImage: {
      type: String,
      default: '',
    },
    productName: {
      type: String,
      default: '',
    },
    price: {
      type: Number,
      default: 0,
    },
    orderId: {
      type: String,
      default: '',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Notification', notificationSchema);
