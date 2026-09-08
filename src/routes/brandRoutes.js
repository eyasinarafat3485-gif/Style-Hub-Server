const express = require('express');
const router = express.Router();
const {
  getBrands,
  createBrand,
  deleteBrand,
} = require('../controllers/brandController');

router.route('/').get(getBrands).post(createBrand);
router.route('/:id').delete(deleteBrand);

module.exports = router;
