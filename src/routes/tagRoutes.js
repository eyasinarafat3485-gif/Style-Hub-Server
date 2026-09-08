const express = require('express');
const router = express.Router();
const {
  getTags,
  createTag,
  deleteTag,
} = require('../controllers/tagController');

router.route('/').get(getTags).post(createTag);
router.route('/:id').delete(deleteTag);

module.exports = router;
