// ============================================
// Authentication Middleware
// ============================================

const { verifyToken } = require('../config/jwt');
const User = require('../models/User');

// Protect routes - user must be authenticated
const protect = async (req, res, next) => {
  try {
    let token;
    
    // 1. Get token from cookie
    if (req.cookies?.token) {
      token = req.cookies.token;
    }
    // 2. Get token from Authorization header
    else if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    // 3. Check if token exists
    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Not authorized. Please log in.'
      });
    }
    
    // 4. Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid or expired token. Please log in again.'
      });
    }
    
    // 5. Check if user still exists
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'User no longer exists.'
      });
    }
    
    // 6. Check if user is active
    if (!user.is_active) {
      return res.status(403).json({
        status: 'error',
        message: 'Your account has been disabled. Contact administrator.'
      });
    }
    
    // 7. Attach user to request
    req.user = user.getSafeData();
    next();
    
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Authentication failed'
    });
  }
};

// Restrict to specific roles
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to perform this action'
      });
    }
    
    next();
  };
};

// Check if user is authenticated (optional)
const optionalAuth = async (req, res, next) => {
  try {
    let token;
    
    if (req.cookies?.token) {
      token = req.cookies.token;
    } else if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        const user = await User.findByPk(decoded.id);
        if (user && user.is_active) {
          req.user = user.getSafeData();
        }
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

module.exports = {
  protect,
  restrictTo,
  optionalAuth
};