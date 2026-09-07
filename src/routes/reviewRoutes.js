const express = require('express');
const router = express.Router();
const { getAllReviews, getProductReviews, createReview, deleteReview } = require('../controllers/reviewController');

router.get('/', getAllReviews);
router.get('/product/:productId', getProductReviews);
router.post('/', createReview);
router.delete('/:id', deleteReview);

module.exports = router;
