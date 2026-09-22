const Category = require('../models/Category');
const connectDB = require('../config/db');

const defaultCategories = [
  { name: "Panjabi", slug: "/category/panjabi", description: "Men's Panjabi & Ethnic Wear", itemCount: 36 },
  { name: "Sarees", slug: "/category/sarees", description: "Women's Designer Sarees", itemCount: 48 },
  { name: "Shirts", slug: "/category/shirts", description: "Casual Premium & Formal Shirts", itemCount: 29 },
  { name: "T-Shirts", slug: "/category/t-shirts", description: "Oversized & Polo T-Shirts", itemCount: 42 },
  { name: "Kurtis", slug: "/category/kurtis", description: "Designer Stylish Kurtis", itemCount: 25 },
  { name: "Men", slug: "/category/men", description: "Men's Apparel & Accessories", itemCount: 54 },
  { name: "Women", slug: "/category/women", description: "Women's Fashion & Silk Sarees", itemCount: 61 },
];

// @desc    Get all categories (seed initial if empty)
// @route   GET /api/categories
// @access  Public
const getCategories = async (req, res) => {
  try {
    await connectDB();
    let categories = await Category.find({}).sort({ createdAt: -1 });

    if (categories.length === 0) {
      categories = await Category.insertMany(defaultCategories);
    }

    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new category
// @route   POST /api/categories
// @access  Public / Admin
const createCategory = async (req, res) => {
  try {
    await connectDB();
    const { name, description, image, slug } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    const categoryExists = await Category.findOne({ name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } });
    if (categoryExists) {
      return res.status(400).json({ success: false, message: 'Category with this name already exists' });
    }

    const generatedSlug = slug || `/category/${name.toLowerCase().replace(/\s+/g, '-')}`;

    const newCategory = new Category({
      name: name.trim(),
      slug: generatedSlug,
      description: description || '',
      image: image || '',
      itemCount: 0,
    });

    const savedCategory = await newCategory.save();
    res.status(201).json({ success: true, category: savedCategory });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Public / Admin
const deleteCategory = async (req, res) => {
  try {
    await connectDB();
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    await category.deleteOne();
    res.json({ success: true, message: 'Category removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getCategories,
  createCategory,
  deleteCategory,
};
