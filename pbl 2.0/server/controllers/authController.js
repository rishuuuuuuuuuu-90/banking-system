'use strict';

const User = require('../models/User');
const { signToken } = require('../config/jwt');

const sendTokenResponse = (user, statusCode, res, message) => {
  const token = signToken({ id: user._id, role: user.role });
  return res.status(statusCode).json({
    success: true,
    message,
    data: { token, user },
  });
};

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered.',
      });
    }

    // Prevent registering as admin via API
    const allowedRole = role === 'organizer' ? 'organizer' : 'student';
    const user = await User.create({ name, email, password, role: allowedRole });

    return sendTokenResponse(user, 201, res, 'Registration successful');
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated.',
      });
    }

    return sendTokenResponse(user, 200, res, 'Login successful');
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    return res.status(200).json({
      success: true,
      message: 'User profile fetched',
      data: { user },
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/auth/profile
const updateProfile = async (req, res, next) => {
  try {
    const allowedFields = ['name', 'profileImage'];
    const updates = {};
    allowedFields.forEach((f) => {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    });

    // Handle password update separately
    if (req.body.password) {
      const user = await User.findById(req.user._id).select('+password');
      user.password = req.body.password;
      Object.assign(user, updates);
      await user.save();
      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: { user },
      });
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { user },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getMe, updateProfile };
