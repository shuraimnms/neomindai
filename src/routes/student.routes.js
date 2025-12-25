// ============================================
// Student Routes
// ============================================

const express = require('express');
const router = express.Router();
const {
  getStudentDashboard,
  getStudentProfile,
  updateStudentProfile,
  getStudentVideos,
  getStudentAssignments
} = require('../controllers/student.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

// All routes require student role
router.use(protect, restrictTo('student'));

// Dashboard
router.get('/dashboard', getStudentDashboard);

// Profile
router.get('/profile', getStudentProfile);
router.put('/profile', updateStudentProfile);

// Videos
router.get('/videos', getStudentVideos);

module.exports = router;