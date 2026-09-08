const Tag = require('../models/Tag');

const defaultTags = [
  { name: 'NewArrival', count: 18 },
  { name: 'TrendingNow', count: 24 },
  { name: 'EidCollection', count: 32 },
  { name: 'HandmadeSilk', count: 15 },
  { name: 'PremiumCotton', count: 29 },
  { name: 'BestSeller', count: 40 },
  { name: 'LimitedEdition', count: 12 },
  { name: 'Discount20', count: 8 },
  { name: 'FormalStyle', count: 21 },
];

// @desc    Get all tags (seed if empty)
// @route   GET /api/tags
// @access  Public
const getTags = async (req, res) => {
  try {
    let tags = await Tag.find({}).sort({ createdAt: -1 });

    if (tags.length === 0) {
      tags = await Tag.insertMany(
        defaultTags.map((t) => ({
          ...t,
          slug: t.name.toLowerCase(),
        }))
      );
    }

    res.json({ success: true, tags });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new tag
// @route   POST /api/tags
// @access  Public / Admin
const createTag = async (req, res) => {
  try {
    let { name } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Tag name is required' });
    }

    // Clean tag name format (remove leading '#' if provided)
    name = name.trim().replace(/^#/, '');

    const tagExists = await Tag.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (tagExists) {
      return res.status(400).json({ success: false, message: 'Tag with this name already exists' });
    }

    const newTag = new Tag({
      name,
      slug: name.toLowerCase(),
      count: 0,
    });

    const savedTag = await newTag.save();
    res.status(201).json({ success: true, tag: savedTag });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a tag
// @route   DELETE /api/tags/:id
// @access  Public / Admin
const deleteTag = async (req, res) => {
  try {
    const tag = await Tag.findById(req.params.id);
    if (!tag) {
      return res.status(404).json({ success: false, message: 'Tag not found' });
    }

    await tag.deleteOne();
    res.json({ success: true, message: 'Tag removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getTags,
  createTag,
  deleteTag,
};
