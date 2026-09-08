const express = require('express');
const router = express.Router();
const {
  getAttributes,
  createAttribute,
  deleteAttribute,
} = require('../controllers/attributeController');

router.route('/').get(getAttributes).post(createAttribute);
router.route('/:id').delete(deleteAttribute);

module.exports = router;
