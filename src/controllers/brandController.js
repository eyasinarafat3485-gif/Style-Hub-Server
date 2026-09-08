const Brand = require('../models/Brand');

const defaultBrands = [
  { name: 'StyleHub Signature', status: 'Featured', itemCount: 42, description: 'Flagship luxury apparel line' },
  { name: 'Royal Silk Atelier', status: 'Active', itemCount: 28, description: 'Traditional silk & wedding wear' },
  { name: 'Velvet Heritage', status: 'Active', itemCount: 19, description: 'Velvet ethnic party collections' },
  { name: 'Urban Denim Co.', status: 'Active', itemCount: 34, description: 'Streetwear & casual denim line' },
];

// @desc    Get all brands (seed if empty)
// @route   GET /api/brands
// @access  Public
const getBrands = async (req, res) => {
  try {
    let brands = await Brand.find({}).sort({ createdAt: -1 });

    if (brands.length === 0) {
      brands = await Brand.insertMany(defaultBrands);
    }

    res.json({ success: true, brands });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new brand
// @route   POST /api/brands
// @access  Public / Admin
const createBrand = async (req, res) => {
  try {
    const { name, status, logo, description } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Brand name is required' });
    }

    const brandExists = await Brand.findOne({ name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } });
    if (brandExists) {
      return res.status(400).json({ success: false, message: 'Brand with this name already exists' });
    }

    const newBrand = new Brand({
      name: name.trim(),
      status: status || 'Active',
      logo: logo || '',
      description: description || '',
      itemCount: 0,
    });

    const savedBrand = await newBrand.save();
    res.status(201).json({ success: true, brand: savedBrand });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a brand
// @route   DELETE /api/brands/:id
// @access  Public / Admin
const deleteBrand = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) {
      return res.status(404).json({ success: false, message: 'Brand not found' });
    }

    await brand.deleteOne();
    res.json({ success: true, message: 'Brand removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getBrands,
  createBrand,
  deleteBrand,
};
