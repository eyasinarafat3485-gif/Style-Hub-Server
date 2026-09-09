const StoreSettings = require('../models/StoreSettings');

// Helper to get or initialize default settings
const getOrCreateSettings = async () => {
  let settings = await StoreSettings.findOne();
  if (!settings) {
    settings = await StoreSettings.create({});
  }
  return settings;
};

// @desc    Get store settings (Public / User / Admin)
// @route   GET /api/settings
// @access  Public
const getSettings = async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    return res.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error('Error fetching store settings:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch settings',
    });
  }
};

// @desc    Update store settings (Admin only)
// @route   PUT /api/settings
// @access  Private/Admin
const updateSettings = async (req, res) => {
  try {
    let settings = await getOrCreateSettings();

    if (req.body.storeName !== undefined) settings.storeName = req.body.storeName;
    if (req.body.supportEmail !== undefined) settings.supportEmail = req.body.supportEmail;
    if (req.body.supportPhone !== undefined) settings.supportPhone = req.body.supportPhone;
    if (req.body.storeAddress !== undefined) settings.storeAddress = req.body.storeAddress;

    if (req.body.currency) {
      settings.currency = {
        ...settings.currency.toObject(),
        ...req.body.currency,
      };
    }

    if (req.body.shipping) {
      settings.shipping = {
        ...settings.shipping.toObject(),
        ...req.body.shipping,
      };
    }

    if (req.body.orderNotifications) {
      settings.orderNotifications = {
        ...settings.orderNotifications.toObject(),
        ...req.body.orderNotifications,
      };
    }

    if (Array.isArray(req.body.paymentMethods)) {
      settings.paymentMethods = req.body.paymentMethods;
    }

    await settings.save();

    return res.json({
      success: true,
      message: 'Store settings updated successfully! 🎉',
      settings,
    });
  } catch (error) {
    console.error('Error updating store settings:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update store settings',
    });
  }
};

// @desc    Add a payment method (Admin only)
// @route   POST /api/settings/payment-methods
// @access  Private/Admin
const addPaymentMethod = async (req, res) => {
  try {
    const { name, badge, description, accountNumber, instructions, icon, enabled } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Payment method name is required' });
    }

    const settings = await getOrCreateSettings();
    const id = (name.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now().toString().slice(-4));

    const newMethod = {
      id,
      name,
      badge: badge || '',
      description: description || '',
      accountNumber: accountNumber || '',
      instructions: instructions || '',
      icon: icon || 'banknote',
      enabled: enabled !== undefined ? enabled : true,
    };

    settings.paymentMethods.push(newMethod);
    await settings.save();

    return res.status(201).json({
      success: true,
      message: `Payment method "${name}" added successfully!`,
      settings,
      paymentMethod: newMethod,
    });
  } catch (error) {
    console.error('Error adding payment method:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to add payment method',
    });
  }
};

// @desc    Update a payment method (Admin only)
// @route   PUT /api/settings/payment-methods/:id
// @access  Private/Admin
const updatePaymentMethod = async (req, res) => {
  try {
    const { id } = req.params;
    const settings = await getOrCreateSettings();

    const methodIndex = settings.paymentMethods.findIndex(
      (m) => m.id === id || m._id.toString() === id
    );

    if (methodIndex === -1) {
      return res.status(404).json({ success: false, message: 'Payment method not found' });
    }

    const existing = settings.paymentMethods[methodIndex];
    if (req.body.name !== undefined) existing.name = req.body.name;
    if (req.body.badge !== undefined) existing.badge = req.body.badge;
    if (req.body.description !== undefined) existing.description = req.body.description;
    if (req.body.accountNumber !== undefined) existing.accountNumber = req.body.accountNumber;
    if (req.body.instructions !== undefined) existing.instructions = req.body.instructions;
    if (req.body.icon !== undefined) existing.icon = req.body.icon;
    if (req.body.enabled !== undefined) existing.enabled = req.body.enabled;

    settings.paymentMethods[methodIndex] = existing;
    await settings.save();

    return res.json({
      success: true,
      message: 'Payment method updated successfully!',
      settings,
      paymentMethod: existing,
    });
  } catch (error) {
    console.error('Error updating payment method:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update payment method',
    });
  }
};

// @desc    Delete a payment method (Admin only)
// @route   DELETE /api/settings/payment-methods/:id
// @access  Private/Admin
const deletePaymentMethod = async (req, res) => {
  try {
    const { id } = req.params;
    const settings = await getOrCreateSettings();

    const methodIndex = settings.paymentMethods.findIndex(
      (m) => m.id === id || m._id.toString() === id
    );

    if (methodIndex === -1) {
      return res.status(404).json({ success: false, message: 'Payment method not found' });
    }

    const removedName = settings.paymentMethods[methodIndex].name;
    settings.paymentMethods.splice(methodIndex, 1);
    await settings.save();

    return res.json({
      success: true,
      message: `Payment method "${removedName}" deleted successfully!`,
      settings,
    });
  } catch (error) {
    console.error('Error deleting payment method:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete payment method',
    });
  }
};

module.exports = {
  getSettings,
  updateSettings,
  addPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
};
