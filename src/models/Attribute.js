const mongoose = require('mongoose');

const attributeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['Size', 'Color', 'Material', 'Fit', 'Other'],
      default: 'Size',
    },
    values: [
      {
        type: String,
        trim: true,
      },
    ],
    hexCode: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Attribute', attributeSchema);
