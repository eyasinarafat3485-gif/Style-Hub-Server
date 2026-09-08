const Attribute = require('../models/Attribute');

const defaultAttributes = [
  { name: 'Apparel Sizes', type: 'Size', values: ['S', 'M', 'L', 'XL', 'XXL', 'Custom Tailored'] },
  { name: 'Color Swatches', type: 'Color', values: ['Royal Navy', 'Crimson Red', 'Emerald Green', 'Gold Silk', 'Pure Pearl'] },
  { name: 'Fabric Material', type: 'Material', values: ['100% Organic Cotton', 'Mulberry Silk', 'Linen', 'Velvet', 'Georgette'] },
  { name: 'Fit Style', type: 'Fit', values: ['Regular Fit', 'Slim Fit', 'Oversized', 'Tailored Cut'] },
];

// @desc    Get all attributes (seed if empty)
// @route   GET /api/attributes
// @access  Public
const getAttributes = async (req, res) => {
  try {
    let attributes = await Attribute.find({}).sort({ createdAt: -1 });

    if (attributes.length === 0) {
      attributes = await Attribute.insertMany(defaultAttributes);
    }

    res.json({ success: true, attributes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new attribute
// @route   POST /api/attributes
// @access  Public / Admin
const createAttribute = async (req, res) => {
  try {
    const { name, type, values, hexCode } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Attribute name is required' });
    }

    let valuesArray = [];
    if (Array.isArray(values)) {
      valuesArray = values;
    } else if (typeof values === 'string') {
      valuesArray = values.split(',').map((v) => v.trim()).filter(Boolean);
    }

    const newAttribute = new Attribute({
      name: name.trim(),
      type: type || 'Size',
      values: valuesArray,
      hexCode: hexCode || '',
    });

    const savedAttribute = await newAttribute.save();
    res.status(201).json({ success: true, attribute: savedAttribute });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete an attribute
// @route   DELETE /api/attributes/:id
// @access  Public / Admin
const deleteAttribute = async (req, res) => {
  try {
    const attribute = await Attribute.findById(req.params.id);
    if (!attribute) {
      return res.status(404).json({ success: false, message: 'Attribute not found' });
    }

    await attribute.deleteOne();
    res.json({ success: true, message: 'Attribute removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAttributes,
  createAttribute,
  deleteAttribute,
};
