const express = require('express');
const router = express.Router();
const { getAnalytics } = require('../controllers/analyticsController');

// Public or Admin endpoint for analytics
router.get('/', getAnalytics);

module.exports = router;
