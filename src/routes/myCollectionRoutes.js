const express = require('express');
const router = express.Router();
const {
  getMyCollection,
  addToMyCollection,
  toggleWishlistItem,
  updateMyCollectionItem,
  removeFromMyCollection,
  clearCollection,
} = require('../controllers/myCollectionController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(getMyCollection)
  .post(addToMyCollection);

router.post('/wishlist/toggle', toggleWishlistItem);
router.delete('/clear/:itemType', clearCollection);

router.route('/:id')
  .put(updateMyCollectionItem)
  .delete(removeFromMyCollection);

module.exports = router;
