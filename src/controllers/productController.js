const mongoose = require('mongoose');
const Product = require('../models/Product');
const productsSeed = require('../data/productsSeed');

// @desc    Fetch all products with optional filters, search, and sorting
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  try {
    const { category, search, sort, isTrending, isNewArrival, limit = 50, page = 1 } = req.query;

    // If MongoDB is not yet connected or ready, gracefully serve seed items
    if (mongoose.connection.readyState !== 1) {
      let filtered = [...productsSeed];
      if (category && category !== 'All') {
        filtered = filtered.filter(p => p.category.toLowerCase() === category.toLowerCase());
      }
      if (search) {
        filtered = filtered.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase()));
      }
      return res.json(filtered);
    }

    let query = {};

    // Filter by Category
    if (category && category !== 'All') {
      query.category = { $regex: new RegExp(`^${category}$`, 'i') };
    }

    // Search by Keyword (Name or Description)
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ];
    }

    // Trending filter
    if (isTrending === 'true') {
      query.isTrending = true;
    }

    // New Arrival filter
    if (isNewArrival === 'true') {
      query.isNewArrival = true;
    }

    // Sorting
    let sortOption = { createdAt: -1 }; // default newest
    if (sort === 'price-low') {
      sortOption = { price: 1 };
    } else if (sort === 'price-high') {
      sortOption = { price: -1 };
    } else if (sort === 'rating') {
      sortOption = { rating: -1 };
    }

    const pageSize = Number(limit);
    const currentPage = Number(page);
    const skip = (currentPage - 1) * pageSize;

    const count = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort(sortOption)
      .limit(pageSize)
      .skip(skip);

    return res.json(products);
  } catch (error) {
    console.error('Fetch products error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message,
    });
  }
};

// @desc    Fetch single product by ID or Slug
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
  try {
    const identifier = req.params.id;

    if (mongoose.connection.readyState !== 1) {
      const fallback = productsSeed.find(p => p.slug === identifier || p.id === identifier);
      if (fallback) return res.json(fallback);
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    let product;

    // Check if identifier is a valid MongoDB ObjectId
    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(identifier);
    }

    // If not found by ID, try finding by slug
    if (!product) {
      product = await Product.findOne({ slug: identifier });
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    return res.json(product);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error retrieving product',
      error: error.message,
    });
  }
};

// @desc    Get categories summary
// @route   GET /api/products/categories/list
// @access  Public
const getCategories = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const categoriesMap = {};
      productsSeed.forEach(p => {
        if (!categoriesMap[p.category]) {
          categoriesMap[p.category] = { name: p.category, count: 0, image: p.image };
        }
        categoriesMap[p.category].count += 1;
      });
      return res.json(Object.values(categoriesMap));
    }
    const categories = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          image: { $first: '$image' },
        },
      },
      {
        $project: {
          name: '$_id',
          count: 1,
          image: 1,
          _id: 0,
        },
      },
    ]);

    return res.json(categories);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message,
    });
  }
};

// @desc    Create a new product (Admin)
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res) => {
  try {
    const {
      name,
      slug,
      category,
      image,
      images,
      price,
      oldPrice,
      discountBadge,
      description,
      colors,
      sizes,
      countInStock,
      isTrending,
    } = req.body;

    const generatedSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const product = new Product({
      name,
      slug: generatedSlug,
      category,
      image,
      images: images || [image],
      price,
      oldPrice: oldPrice || null,
      discountBadge: discountBadge || '',
      description,
      colors: colors || ['Default'],
      sizes: sizes || ['S', 'M', 'L', 'XL'],
      countInStock: countInStock || 50,
      isTrending: Boolean(isTrending),
    });

    const createdProduct = await product.save();
    return res.status(201).json(createdProduct);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to create product',
    });
  }
};

// @desc    Update a product (Admin)
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    Object.assign(product, req.body);
    const updatedProduct = await product.save();

    return res.json(updatedProduct);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to update product',
    });
  }
};

// @desc    Delete a product (Admin)
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    await Product.deleteOne({ _id: product._id });
    return res.json({ success: true, message: 'Product removed successfully' });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete product',
    });
  }
};

module.exports = {
  getProducts,
  getProductById,
  getCategories,
  createProduct,
  updateProduct,
  deleteProduct,
};
