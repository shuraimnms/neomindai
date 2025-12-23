// ============================================
// JWT Configuration
// ============================================

const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_CONFIG = {
  secret: process.env.JWT_SECRET || 'fallback_secret_key_change_in_production',
  expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  cookieExpire: parseInt(process.env.JWT_COOKIE_EXPIRE) || 24
};

// Generate JWT token
const generateToken = (payload) => {
  return jwt.sign(payload, JWT_CONFIG.secret, {
    expiresIn: JWT_CONFIG.expiresIn
  });
};

// Verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_CONFIG.secret);
  } catch (error) {
    return null;
  }
};

// Decode token without verification
const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
};

// Create token with user data
const createUserToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    isActive: user.is_active
  };
  
  return generateToken(payload);
};

// Send token in cookie
const sendTokenCookie = (res, token) => {
  const cookieOptions = {
    expires: new Date(
      Date.now() + JWT_CONFIG.cookieExpire * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  };
  
  res.cookie('token', token, cookieOptions);
};

// Clear token cookie
const clearTokenCookie = (res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
};

module.exports = {
  JWT_CONFIG,
  generateToken,
  verifyToken,
  decodeToken,
  createUserToken,
  sendTokenCookie,
  clearTokenCookie
};