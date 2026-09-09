const MyCollection = require('../models/MyCollection');
const Notification = require('../models/Notification');
const { createNotificationHelper } = require('./notificationController');

// @desc    Get logged in user's cart & wishlist collections
// @route   GET /api/my-collections
// @access  Private
const getMyCollection = async (req, res) => {
  try {
    const items = await MyCollection.find({ user: req.user._id }).sort({ createdAt: -1 });

    const cart = items.filter((item) => item.itemType === 'cart');
    const wishlist = items.filter((item) => item.itemType === 'wishlist');

    return res.json({
      success: true,
      count: items.length,
      cart,
      wishlist,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch collection items',
    });
  }
};

// @desc    Add item to cart or wishlist
// @route   POST /api/my-collections
// @access  Private
const addToMyCollection = async (req, res) => {
  try {
    const {
      itemType,
      productId,
      name,
      price,
      image,
      category,
      quantity = 1,
      selectedSize = 'M',
      selectedColor = '',
      fromWishlist = false,
    } = req.body;

    if (!itemType || !productId || !name) {
      return res.status(400).json({
        success: false,
        message: 'Please provide itemType, productId, and name',
      });
    }

    // For cart items, check if item with same productId and selectedSize exists
    if (itemType === 'cart') {
      let existingItem = await MyCollection.findOne({
        user: req.user._id,
        itemType: 'cart',
        productId: String(productId),
        selectedSize: selectedSize || 'M',
      });

      if (existingItem) {
        existingItem.quantity += Number(quantity) || 1;
        await existingItem.save();

        // Create Notification
        try {
          await createNotificationHelper({
            userId: req.user._id,
            userEmail: req.user.email,
            title: fromWishlist
              ? `${name} moved to Cart from Wishlist 🛒`
              : `${name} added to your Cart 🛒`,
            message: fromWishlist
              ? `${name} has been successfully transferred from your wishlist to your active shopping cart.`
              : `${name} (${selectedSize || 'M'}) was added to your shopping cart. Quantity updated to ${existingItem.quantity}.`,
            type: fromWishlist ? 'wishlist_to_cart' : 'cart_add',
            productImage: image || '',
            productName: name,
            price: Number(price) || 0,
          });
        } catch (nErr) {
          console.warn('Failed to auto-create notification:', nErr.message);
        }

        return res.json({
          success: true,
          action: 'updated',
          item: existingItem,
        });
      }
    }

    // For wishlist items, check if already in wishlist
    if (itemType === 'wishlist') {
      let existingWishlist = await MyCollection.findOne({
        user: req.user._id,
        itemType: 'wishlist',
        productId: String(productId),
      });

      if (existingWishlist) {
        return res.json({
          success: true,
          action: 'exists',
          item: existingWishlist,
        });
      }
    }

    // Create new collection entry
    const newItem = await MyCollection.create({
      user: req.user._id,
      userEmail: req.user.email,
      itemType,
      productId: String(productId),
      name,
      price: Number(price) || 0,
      image: image || '',
      category: category || 'General',
      quantity: Number(quantity) || 1,
      selectedSize: selectedSize || 'M',
      selectedColor: selectedColor || '',
    });

    // Create Notification
    try {
      if (itemType === 'cart') {
        await createNotificationHelper({
          userId: req.user._id,
          userEmail: req.user.email,
          title: fromWishlist
            ? `${name} moved to Cart from Wishlist 🛒`
            : `${name} added to your Cart 🛒`,
          message: fromWishlist
            ? `${name} has been successfully transferred from your saved wishlist to your shopping cart.`
            : `${name} (${selectedSize || 'M'}) was added to your shopping cart. Price: ৳${Number(price || 0).toLocaleString('en-BD')}`,
          type: fromWishlist ? 'wishlist_to_cart' : 'cart_add',
          productImage: image || '',
          productName: name,
          price: Number(price) || 0,
        });
      } else if (itemType === 'wishlist') {
        await createNotificationHelper({
          userId: req.user._id,
          userEmail: req.user.email,
          title: `${name} saved to Wishlist 💖`,
          message: `${name} has been saved in your personal wishlist collection!`,
          type: 'wishlist_add',
          productImage: image || '',
          productName: name,
          price: Number(price) || 0,
        });
      }
    } catch (nErr) {
      console.warn('Failed to auto-create notification:', nErr.message);
    }

    return res.status(201).json({
      success: true,
      action: 'created',
      item: newItem,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to add item to collection',
    });
  }
};

// @desc    Toggle wishlist item (add if not exists, remove if exists)
// @route   POST /api/my-collections/wishlist/toggle
// @access  Private
const toggleWishlistItem = async (req, res) => {
  try {
    const { productId, name, price, image, category } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required',
      });
    }

    const existingWishlist = await MyCollection.findOne({
      user: req.user._id,
      itemType: 'wishlist',
      productId: String(productId),
    });

    if (existingWishlist) {
      await MyCollection.findByIdAndDelete(existingWishlist._id);
      // Clean up notification for this wishlist item
      try {
        await Notification.deleteMany({
          user: req.user._id,
          type: 'wishlist_add',
          $or: [
            { productName: existingWishlist.name },
            { productImage: existingWishlist.image },
          ],
        });
      } catch (delErr) {
        console.warn('Wishlist notification cleanup warning:', delErr.message);
      }
      return res.json({
        success: true,
        action: 'removed',
        productId: String(productId),
      });
    } else {
      const newWishlistItem = await MyCollection.create({
        user: req.user._id,
        userEmail: req.user.email,
        itemType: 'wishlist',
        productId: String(productId),
        name: name || 'Fashion Product',
        price: Number(price) || 0,
        image: image || '',
        category: category || 'General',
      });

      // Create notification
      try {
        await createNotificationHelper({
          userId: req.user._id,
          userEmail: req.user.email,
          title: `${name || 'Product'} saved to Wishlist 💖`,
          message: `${name || 'Product'} was added to your personal wishlist collection!`,
          type: 'wishlist_add',
          productImage: image || '',
          productName: name || 'Product',
          price: Number(price) || 0,
        });
      } catch (nErr) {
        console.warn('Failed to auto-create notification:', nErr.message);
      }

      return res.status(201).json({
        success: true,
        action: 'added',
        item: newWishlistItem,
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to toggle wishlist item',
    });
  }
};

// @desc    Update item quantity/size
// @route   PUT /api/my-collections/:id
// @access  Private
const updateMyCollectionItem = async (req, res) => {
  try {
    const { quantity, selectedSize, selectedColor } = req.body;

    const item = await MyCollection.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Collection item not found',
      });
    }

    if (quantity !== undefined) {
      if (quantity <= 0) {
        await MyCollection.findByIdAndDelete(item._id);
        return res.json({ success: true, action: 'deleted', id: item._id });
      }
      item.quantity = Number(quantity);
    }

    if (selectedSize) item.selectedSize = selectedSize;
    if (selectedColor !== undefined) item.selectedColor = selectedColor;

    const updated = await item.save();

    return res.json({
      success: true,
      action: 'updated',
      item: updated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update collection item',
    });
  }
};

// @desc    Delete single collection item by MongoDB ID or productId+itemType
// @route   DELETE /api/my-collections/:id
// @access  Private
const removeFromMyCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const { productId, itemType, selectedSize } = req.query;

    let filter = { user: req.user._id };

    if (id && id !== 'item') {
      filter._id = id;
    } else if (productId && itemType) {
      filter.productId = String(productId);
      filter.itemType = itemType;
      if (selectedSize) filter.selectedSize = selectedSize;
    }

    const deletedItem = await MyCollection.findOneAndDelete(filter);

    if (deletedItem) {
      try {
        if (deletedItem.itemType === 'wishlist') {
          await Notification.deleteMany({
            user: req.user._id,
            type: 'wishlist_add',
            $or: [
              { productName: deletedItem.name },
              { productImage: deletedItem.image },
            ],
          });
        } else if (deletedItem.itemType === 'cart') {
          await Notification.deleteMany({
            user: req.user._id,
            type: { $in: ['cart_add', 'wishlist_to_cart'] },
            productName: deletedItem.name,
          });
        }
      } catch (dErr) {
        console.warn('Collection notification cleanup notice:', dErr.message);
      }
    }

    return res.json({
      success: true,
      message: 'Item removed from collection',
      deletedId: deletedItem ? deletedItem._id : id,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to remove item',
    });
  }
};

// @desc    Clear entire cart or wishlist for user
// @route   DELETE /api/my-collections/clear/:itemType
// @access  Private
const clearCollection = async (req, res) => {
  try {
    const { itemType } = req.params;
    if (!['cart', 'wishlist'].includes(itemType)) {
      return res.status(400).json({ success: false, message: 'Invalid itemType' });
    }

    await MyCollection.deleteMany({
      user: req.user._id,
      itemType,
    });

    try {
      if (itemType === 'wishlist') {
        await Notification.deleteMany({
          user: req.user._id,
          type: 'wishlist_add',
        });
      } else if (itemType === 'cart') {
        await Notification.deleteMany({
          user: req.user._id,
          type: { $in: ['cart_add', 'wishlist_to_cart'] },
        });
      }
    } catch (cErr) {
      console.warn('Clear collection notification cleanup notice:', cErr.message);
    }

    return res.json({
      success: true,
      message: `Cleared all ${itemType} items from collection`,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to clear collection',
    });
  }
};

module.exports = {
  getMyCollection,
  addToMyCollection,
  toggleWishlistItem,
  updateMyCollectionItem,
  removeFromMyCollection,
  clearCollection,
};
