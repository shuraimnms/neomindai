// ============================================
// Authentication Controller
// ============================================

const User = require('../models/User');
const { createUserToken, sendTokenCookie, clearTokenCookie } = require('../config/jwt');

// @desc    Register student
// @route   POST /api/auth/register
// @access  Public
const registerStudent = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // 1. Validate input
    if (!name || !email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide name, email and password'
      });
    }
    
    // 2. Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        status: 'error',
        message: 'User with this email already exists'
      });
    }
    
    // 3. Create student user
    const user = await User.create({
      name,
      email,
      password,
      role: 'student',
      is_active: true
    });
    
    // 4. Create token
    const token = createUserToken(user);
    
    // 5. Send token in cookie
    sendTokenCookie(res, token);
    
    // 6. Send response
    res.status(201).json({
      status: 'success',
      message: 'Registration successful',
      data: {
        user: user.getSafeData(),
        token
      }
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle validation errors
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map(err => err.message);
      return res.status(400).json({
        status: 'error',
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Registration failed. Please try again.'
    });
  }
};

// @desc    Login user (student or admin)
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // 1. Check email and password
    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide email and password'
      });
    }
    
    // 2. Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }
    
    // 3. Check if account is active
    if (!user.is_active) {
      return res.status(403).json({
        status: 'error',
        message: 'Your account has been disabled. Contact administrator.'
      });
    }
    
    // 4. Check password
    const isPasswordCorrect = await user.checkPassword(password);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }
    
    // 5. Create token
    const token = createUserToken(user);
    
    // 6. Send token in cookie
    sendTokenCookie(res, token);
    
    // 7. Send response
    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: {
        user: user.getSafeData(),
        token
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Login failed. Please try again.'
    });
  }
};

// @desc    Admin login (separate endpoint)
// @route   POST /api/auth/admin/login
// @access  Public
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide email and password'
      });
    }
    
    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }
    
    // Check if user is admin
    if (user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Admin only.'
      });
    }
    
    // Check password
    const isPasswordCorrect = await user.checkPassword(password);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }
    
    // Create token
    const token = createUserToken(user);
    
    // Send token in cookie
    sendTokenCookie(res, token);
    
    // Send response
    res.status(200).json({
      status: 'success',
      message: 'Admin login successful',
      data: {
        user: user.getSafeData(),
        token
      }
    });
    
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Admin login failed'
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getCurrentUser = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Not authenticated'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        user: req.user
      }
    });
    
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get user data'
    });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = (req, res) => {
  try {
    // Clear token cookie
    clearTokenCookie(res);
    
    res.status(200).json({
      status: 'success',
      message: 'Logged out successfully'
    });
    
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Logout failed'
    });
  }
};

module.exports = {
  registerStudent,
  login,
  adminLogin,
  getCurrentUser,
  logout
};