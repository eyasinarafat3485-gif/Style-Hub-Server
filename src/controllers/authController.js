const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID || '',
  process.env.GOOGLE_CLIENT_SECRET || ''
);


// Helper to generate signed JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'stylehub_secret_fallback', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists',
      });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        authProvider: user.authProvider,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration',
    });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const token = generateToken(user._id);

    return res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        authProvider: user.authProvider,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    if (error.message?.includes('buffering timed out') || error.message?.includes('ENOTFOUND') || error.name === 'MongooseError') {
      return res.status(503).json({
        success: false,
        message: 'Database connection is temporarily busy or disconnected. Please check your internet and try again.',
      });
    }
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during login',
    });
  }
};

// @desc    Google OAuth Sign-in / Sign-up
// @route   POST /api/auth/google
// @access  Public
const googleAuth = async (req, res) => {
  try {
    const { credential, userInfo } = req.body;

    let email = '';
    let name = '';
    let picture = '';
    let googleId = '';

    // If Google ID Token credential is provided, verify it
    if (credential && process.env.GOOGLE_CLIENT_ID) {
      try {
        const ticket = await client.verifyIdToken({
          idToken: credential,
          audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        email = payload.email;
        name = payload.name;
        picture = payload.picture;
        googleId = payload.sub;
      } catch (err) {
        console.warn('Google token verification fallback:', err.message);
      }
    }

    // Fallback if userInfo was passed directly from client
    if (!email && userInfo) {
      email = userInfo.email;
      name = userInfo.name || userInfo.email?.split('@')[0];
      picture = userInfo.picture || userInfo.avatar || '';
      googleId = userInfo.sub || userInfo.id || '';
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Google authentication payload missing valid email',
      });
    }

    let user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      // Update Google ID and avatar if provided
      if (googleId) user.googleId = googleId;
      if (picture) user.avatar = picture;
      await user.save();
    } else {
      // Create new user from Google
      user = await User.create({
        name: name || 'Google User',
        email: email.toLowerCase(),
        avatar: picture || '',
        googleId: googleId || null,
        authProvider: 'google',
      });
    }

    const token = generateToken(user._id);

    return res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        authProvider: user.authProvider,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Google Auth Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Google authentication failed',
    });
  }
};

// @desc    Get current logged in user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        authProvider: user.authProvider,
        address: user.address,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching user profile',
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.name = req.body.name || user.name;
    user.avatar = req.body.avatar || user.avatar;
    if (req.body.address) {
      user.address = { ...user.address, ...req.body.address };
    }

    if (req.body.password) {
      if (req.body.password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters',
        });
      }
      user.password = req.body.password;
    }

    const updatedUser = await user.save();
    const token = generateToken(updatedUser._id);

    return res.json({
      success: true,
      token,
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        avatar: updatedUser.avatar,
        address: updatedUser.address,
        authProvider: updatedUser.authProvider,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update profile',
    });
  }
};

const Order = require('../models/Order');

// @desc    Get all customers (Registered Users + Checkout Guest Shoppers) with order statistics (Admin only)
// @route   GET /api/auth/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    const orders = await Order.find({}).sort({ createdAt: -1 });

    const registeredEmails = new Set(
      users.map((u) => (u.email ? u.email.toLowerCase().trim() : '')).filter(Boolean)
    );
    const registeredUserIds = new Set(users.map((u) => u._id.toString()));

    // 1. Enriched Registered Users
    const enrichedUsers = users.map((u) => {
      const uEmail = u.email ? u.email.toLowerCase().trim() : '';
      const userOrders = orders.filter((o) => {
        const matchesId = o.user && o.user.toString() === u._id.toString();
        const matchesEmail =
          (o.userEmail && o.userEmail.toLowerCase().trim() === uEmail) ||
          (o.shippingAddress?.email && o.shippingAddress.email.toLowerCase().trim() === uEmail);
        return matchesId || matchesEmail;
      });

      const totalOrders = userOrders.length;
      const totalSpent = userOrders
        .filter((o) => o.status !== 'Cancelled')
        .reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);

      const firstOrder = userOrders[0];
      const primaryPhone = u.address?.phone || firstOrder?.shippingAddress?.phone || '';
      const primaryAddress =
        [u.address?.street, u.address?.city, u.address?.country].filter(Boolean).join(', ') ||
        [firstOrder?.shippingAddress?.address, firstOrder?.shippingAddress?.city || firstOrder?.shippingAddress?.district].filter(Boolean).join(', ');

      return {
        _id: u._id,
        id: u._id,
        name: u.name,
        email: u.email,
        role: u.role || 'user',
        authProvider: u.authProvider || 'local',
        avatar: u.avatar || '',
        phone: primaryPhone,
        address: primaryAddress,
        isRegistered: true,
        createdAt: u.createdAt,
        totalOrders,
        totalSpent,
      };
    });

    // 2. Extract and Group Guest Customers from Orders
    const guestCustomerMap = new Map();

    for (const ord of orders) {
      const isRegisteredOrder =
        (ord.user && registeredUserIds.has(ord.user.toString())) ||
        (ord.userEmail && registeredEmails.has(ord.userEmail.toLowerCase().trim())) ||
        (ord.shippingAddress?.email && registeredEmails.has(ord.shippingAddress.email.toLowerCase().trim()));

      if (isRegisteredOrder) continue;

      const emailKey = (ord.shippingAddress?.email || ord.userEmail || '').toLowerCase().trim();
      const phoneKey = (ord.shippingAddress?.phone || '').trim();
      const nameKey = (ord.shippingAddress?.fullName || '').toLowerCase().trim();

      const customerKey = emailKey || phoneKey || nameKey || `guest_order_${ord._id}`;

      if (!guestCustomerMap.has(customerKey)) {
        guestCustomerMap.set(customerKey, {
          _id: `guest_${ord._id}`,
          id: `guest_${ord._id}`,
          name: ord.shippingAddress?.fullName || 'Guest Customer',
          email: emailKey || (phoneKey ? `Phone: ${phoneKey}` : 'Guest Shopper'),
          phone: phoneKey,
          address: [ord.shippingAddress?.address, ord.shippingAddress?.city || ord.shippingAddress?.district].filter(Boolean).join(', '),
          role: 'guest',
          authProvider: 'checkout',
          avatar: '',
          isRegistered: false,
          createdAt: ord.createdAt,
          orders: [],
        });
      }

      const custEntry = guestCustomerMap.get(customerKey);
      custEntry.orders.push(ord);
      if (!custEntry.phone && phoneKey) custEntry.phone = phoneKey;
      if (!custEntry.address && ord.shippingAddress?.address) {
        custEntry.address = [ord.shippingAddress?.address, ord.shippingAddress?.city || ord.shippingAddress?.district].filter(Boolean).join(', ');
      }
    }

    const guestCustomers = Array.from(guestCustomerMap.values()).map((g) => {
      const totalOrders = g.orders.length;
      const totalSpent = g.orders
        .filter((o) => o.status !== 'Cancelled')
        .reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);

      return {
        _id: g._id,
        id: g.id,
        name: g.name,
        email: g.email,
        phone: g.phone,
        address: g.address,
        role: 'guest',
        authProvider: 'checkout',
        avatar: '',
        isRegistered: false,
        createdAt: g.createdAt,
        totalOrders,
        totalSpent,
      };
    });

    const allCustomers = [...enrichedUsers, ...guestCustomers];

    return res.json({
      success: true,
      count: allCustomers.length,
      users: allCustomers,
      registeredCount: enrichedUsers.length,
      guestCount: guestCustomers.length,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch customers',
    });
  }
};

// @desc    Update user role (Admin only)
// @route   PUT /api/auth/users/:id/role
// @access  Private/Admin
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role specified' });
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    targetUser.role = role;
    await targetUser.save();

    return res.json({
      success: true,
      message: `User role updated to ${role}`,
      user: {
        _id: targetUser._id,
        id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        avatar: targetUser.avatar,
        authProvider: targetUser.authProvider,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update user role',
    });
  }
};

// @desc    Delete user account or guest customer record (Admin only)
// @route   DELETE /api/auth/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    if (req.params.id && req.params.id.startsWith('guest_')) {
      const orderId = req.params.id.replace('guest_', '');
      await Order.findByIdAndDelete(orderId);
      return res.json({
        success: true,
        message: 'Guest customer record deleted successfully',
      });
    }

    if (req.user._id.toString() === req.params.id) {
      return res
        .status(400)
        .json({ success: false, message: 'You cannot delete your own admin account' });
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await User.findByIdAndDelete(req.params.id);
    return res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete user',
    });
  }
};

module.exports = {
  register,
  login,
  googleAuth,
  getMe,
  updateProfile,
  getAllUsers,
  updateUserRole,
  deleteUser,
};
