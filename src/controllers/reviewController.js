const mongoose = require('mongoose');
const Review = require('../models/Review');
const Product = require('../models/Product');

// @desc    Get all reviews for a specific product
// @route   GET /api/reviews/product/:productId
// @access  Public
const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { name } = req.query;

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required' });
    }

    const queryOr = [{ productId: String(productId) }];

    if (name) {
      queryOr.push({ productName: new RegExp(`^${name.trim()}$`, 'i') });
    }

    // Try to find product to get all name and ID aliases
    let targetProduct = null;
    if (mongoose.Types.ObjectId.isValid(productId)) {
      targetProduct = await Product.findById(productId);
    }
    if (!targetProduct) {
      targetProduct = await Product.findOne({
        $or: [{ slug: productId }, { name: new RegExp(`^${productId}$`, 'i') }],
      });
    }

    if (targetProduct) {
      queryOr.push({ productId: String(targetProduct._id) });
      if (targetProduct.name) {
        queryOr.push({ productName: new RegExp(`^${targetProduct.name.trim()}$`, 'i') });
      }
    }

    const reviews = await Review.find({ $or: queryOr }).sort({ createdAt: -1 });

    const totalReviews = reviews.length;
    const averageRating =
      totalReviews > 0
        ? Number((reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / totalReviews).toFixed(1))
        : 0;

    const ratingCounts = {
      5: reviews.filter((r) => Math.round(r.rating) === 5).length,
      4: reviews.filter((r) => Math.round(r.rating) === 4).length,
      3: reviews.filter((r) => Math.round(r.rating) === 3).length,
      2: reviews.filter((r) => Math.round(r.rating) === 2).length,
      1: reviews.filter((r) => Math.round(r.rating) === 1).length,
    };

    res.status(200).json({
      success: true,
      count: totalReviews,
      averageRating,
      ratingCounts,
      reviews,
    });
  } catch (error) {
    console.error('Error fetching reviews:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product reviews',
      error: error.message,
    });
  }
};

// @desc    Create a new product review
// @route   POST /api/reviews
// @access  Public (Guest or Authenticated User)
const createReview = async (req, res) => {
  try {
    const { productId, productName, productImage, userAvatar, name, email, rating, comment } = req.body;

    if (!productId || !name || !email || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields (productId, name, email, rating, comment)',
      });
    }

    const numericRating = Number(rating);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be a number between 1 and 5',
      });
    }

    // Create review in MongoDB 'reviews' collection
    const review = await Review.create({
      productId: String(productId),
      productName: productName || '',
      productImage: productImage || '',
      userAvatar: userAvatar || (req.user ? req.user.avatar : '') || '',
      userId: req.user ? req.user._id : null,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      rating: numericRating,
      comment: comment.trim(),
    });

    // Update aggregate product rating in Product model if product exists in MongoDB
    try {
      const allProductReviews = await Review.find({ productId: String(productId) });
      const newReviewCount = allProductReviews.length;
      const newAvgRating = Number(
        (allProductReviews.reduce((sum, r) => sum + r.rating, 0) / newReviewCount).toFixed(1)
      );

      // Attempt to update by _id or custom string id if valid
      let product = null;
      if (mongoose.Types.ObjectId.isValid(productId)) {
        product = await Product.findById(productId);
      }
      if (!product) {
        product = await Product.findOne({ slug: productId });
      }

      if (product) {
        product.rating = newAvgRating;
        product.reviewCount = newReviewCount;
        await product.save();
      }
    } catch (updateErr) {
      console.warn('Note: Could not update Product document rating (may be a static fallback item):', updateErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully!',
      review,
    });
  } catch (error) {
    console.error('Error creating review:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to submit review',
      error: error.message,
    });
  }
};

// @desc    Get all reviews across all products (for Homepage / Storefront Review section)
// @route   GET /api/reviews
// @access  Public
const getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 });
    const count = reviews.length;
    const averageRating =
      count > 0
        ? Number((reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / count).toFixed(1))
        : 5.0;

    res.status(200).json({
      success: true,
      count,
      averageRating,
      reviews,
    });
  } catch (error) {
    console.error('Error fetching all reviews:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews',
      error: error.message,
    });
  }
};

// @desc    Delete a review by ID
// @route   DELETE /api/reviews/:id
// @access  Admin
const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const review = await Review.findByIdAndDelete(id);

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    // Update product rating if product exists
    try {
      const remainingReviews = await Review.find({ productId: review.productId });
      const count = remainingReviews.length;
      const newAvg = count > 0 ? Number((remainingReviews.reduce((sum, r) => sum + r.rating, 0) / count).toFixed(1)) : 5.0;

      let product = null;
      if (mongoose.Types.ObjectId.isValid(review.productId)) {
        product = await Product.findById(review.productId);
      }
      if (product) {
        product.rating = newAvg;
        product.reviewCount = count;
        await product.save();
      }
    } catch (_) {}

    res.status(200).json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete review', error: error.message });
  }
};

module.exports = {
  getAllReviews,
  getProductReviews,
  createReview,
  deleteReview,
};
