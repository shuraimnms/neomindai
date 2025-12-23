// ============================================
// Authentication Routes
// ============================================

const express = require('express');
const router = express.Router();
const {
  registerStudent,
  login,
  adminLogin,
  getCurrentUser,
  logout
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

// Public routes
router.post('/register', registerStudent);   // Student registration
router.post('/login', login);                // Student/User login
router.post('/admin/login', adminLogin);     // Admin login

// Protected routes
router.get('/me', protect, getCurrentUser);  // Get current user
router.post('/logout', protect, logout);     // Logout

module.exports = router;