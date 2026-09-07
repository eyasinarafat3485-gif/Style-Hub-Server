const mongoose = require('mongoose');

const myCollectionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userEmail: {
      type: String,
      required: true,
      trim: true,
    },
    itemType: {
      type: String,
      enum: ['cart', 'wishlist'],
      required: true,
    },
    productId: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      default: 0,
    },
    image: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      default: 'General',
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1,
    },
    selectedSize: {
      type: String,
      default: 'M',
    },
    selectedColor: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to quickly find user cart/wishlist items
myCollectionSchema.index({ user: 1, itemType: 1 });

module.exports = mongoose.model('MyCollection', myCollectionSchema, 'my-collections');
