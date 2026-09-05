const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please enter product name'],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    category: {
      type: String,
      required: [true, 'Please enter product category'],
      trim: true,
    },
    image: {
      type: String,
      required: [true, 'Please provide primary product image URL'],
    },
    images: [
      {
        type: String,
      },
    ],
    price: {
      type: Number,
      required: [true, 'Please enter product price in BDT'],
      default: 0,
    },
    oldPrice: {
      type: Number,
      default: null,
    },
    discountBadge: {
      type: String,
      default: '',
    },
    rating: {
      type: Number,
      default: 5.0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    isTrending: {
      type: Boolean,
      default: false,
    },
    isNewArrival: {
      type: Boolean,
      default: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide product description'],
    },
    colors: [
      {
        type: String,
      },
    ],
    sizes: [
      {
        type: String,
      },
    ],
    countInStock: {
      type: Number,
      required: true,
      default: 50,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual id for frontend compatibility
productSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

module.exports = mongoose.model('Product', productSchema);
