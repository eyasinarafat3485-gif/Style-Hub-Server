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
    let settings = await StoreSettings.findOne();
    if (!settings) {
      settings = new StoreSettings({});
    }

    const payload = req.body || {};

    // General & Contact
    if (payload.storeName !== undefined) settings.storeName = payload.storeName;
    if (payload.supportEmail !== undefined) settings.supportEmail = payload.supportEmail;
    if (payload.supportPhone !== undefined) settings.supportPhone = payload.supportPhone;
    if (payload.storeAddress !== undefined) settings.storeAddress = payload.storeAddress;

    // Theme & Visual Aesthetics
    if (payload.theme) {
      const currentTheme = settings.theme ? (settings.theme.toObject ? settings.theme.toObject() : settings.theme) : {};
      settings.set('theme', {
        ...currentTheme,
        ...payload.theme,
      });
      settings.markModified('theme');
    }

    // Branding
    if (payload.branding) {
      const currentBranding = settings.branding ? (settings.branding.toObject ? settings.branding.toObject() : settings.branding) : {};
      settings.set('branding', {
        ...currentBranding,
        ...payload.branding,
      });
      settings.markModified('branding');
    }

    // Top Notice
    if (payload.topNotice) {
      const currentNotice = settings.topNotice ? (settings.topNotice.toObject ? settings.topNotice.toObject() : settings.topNotice) : {};
      settings.set('topNotice', {
        ...currentNotice,
        ...payload.topNotice,
      });
      settings.markModified('topNotice');
    }

    // Hero Slider Carousel
    if (Array.isArray(payload.heroSlider)) {
      settings.set('heroSlider', payload.heroSlider);
      settings.markModified('heroSlider');
    }

    // Promotional Banners
    if (Array.isArray(payload.promoBanners)) {
      settings.set('promoBanners', payload.promoBanners);
      settings.markModified('promoBanners');
    }

    // Custom Page Content (About Us, FAQ, Trust Badges)
    if (payload.pageContent) {
      const currentContent = settings.pageContent ? (settings.pageContent.toObject ? settings.pageContent.toObject() : settings.pageContent) : {};
      const newPageContent = {
        ...currentContent,
        aboutUs: payload.pageContent.aboutUs
          ? { ...(currentContent.aboutUs || {}), ...payload.pageContent.aboutUs }
          : currentContent.aboutUs,
        faq: Array.isArray(payload.pageContent.faq)
          ? payload.pageContent.faq
          : (currentContent.faq || []),
        trustBadges: Array.isArray(payload.pageContent.trustBadges)
          ? payload.pageContent.trustBadges
          : (currentContent.trustBadges || []),
      };
      settings.set('pageContent', newPageContent);
      settings.markModified('pageContent');
    }

    // Footer
    if (payload.footer) {
      const currentFooter = settings.footer ? (settings.footer.toObject ? settings.footer.toObject() : settings.footer) : {};
      settings.set('footer', {
        ...currentFooter,
        ...payload.footer,
      });
      settings.markModified('footer');
    }

    // Currency
    if (payload.currency) {
      const currentCurrency = settings.currency ? (settings.currency.toObject ? settings.currency.toObject() : settings.currency) : {};
      settings.set('currency', {
        ...currentCurrency,
        ...payload.currency,
      });
      settings.markModified('currency');
    }

    // Shipping
    if (payload.shipping) {
      const currentShipping = settings.shipping ? (settings.shipping.toObject ? settings.shipping.toObject() : settings.shipping) : {};
      settings.set('shipping', {
        ...currentShipping,
        ...payload.shipping,
      });
      settings.markModified('shipping');
    }

    // Notifications
    if (payload.orderNotifications) {
      const currentNotif = settings.orderNotifications ? (settings.orderNotifications.toObject ? settings.orderNotifications.toObject() : settings.orderNotifications) : {};
      settings.set('orderNotifications', {
        ...currentNotif,
        ...payload.orderNotifications,
      });
      settings.markModified('orderNotifications');
    }

    // Payment Methods
    if (Array.isArray(payload.paymentMethods)) {
      settings.set('paymentMethods', payload.paymentMethods);
      settings.markModified('paymentMethods');
    }

    const saved = await settings.save();

    return res.json({
      success: true,
      message: 'Store settings updated successfully! 🎉',
      settings: saved,
    });
  } catch (error) {
    console.error('Error updating store settings:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update store settings',
    });
  }
};

// @desc    Reset store settings to system defaults (Admin only)
// @route   POST /api/settings/reset-defaults
// @access  Private/Admin
const resetDefaultSettings = async (req, res) => {
  try {
    await StoreSettings.deleteMany({});
    const newSettings = await StoreSettings.create({});
    return res.json({
      success: true,
      message: 'Store settings successfully reset to factory defaults! 🔄',
      settings: newSettings,
    });
  } catch (error) {
    console.error('Error resetting store settings:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to reset settings',
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
  resetDefaultSettings,
  addPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
};
