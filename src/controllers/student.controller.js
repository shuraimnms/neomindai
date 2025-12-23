// ============================================
// Student Controller
// ============================================

const User = require('../models/User');
const Video = require('../models/Video');

// @desc    Get student dashboard data
// @route   GET /api/student/dashboard
// @access  Private (Student only)
const getStudentDashboard = async (req, res) => {
  try {
    // Get total videos count
    const totalVideos = await Video.count();
    
    // Get user data
    const user = await User.findByPk(req.user.id);
    
    res.status(200).json({
      status: 'success',
      message: 'Dashboard data fetched successfully',
      data: {
        user: user.getSafeData(),
        stats: {
          totalVideos,
          totalWatched: 0, // Placeholder for future feature
          completionRate: 0 // Placeholder for future feature
        },
        greeting: `Welcome back, ${user.name}!`
      }
    });
    
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch dashboard data'
    });
  }
};

// @desc    Get student profile
// @route   GET /api/student/profile
// @access  Private (Student only)
const getStudentProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Profile fetched successfully',
      data: { user }
    });
    
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch profile'
    });
  }
};

// @desc    Update student profile
// @route   PUT /api/student/profile
// @access  Private (Student only)
const updateStudentProfile = async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({
        status: 'error',
        message: 'Name is required'
      });
    }
    
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    // Update user
    await user.update({ name });
    
    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
      data: { user: user.getSafeData() }
    });
    
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update profile'
    });
  }
};

// @desc    Get all videos for student
// @route   GET /api/student/videos
// @access  Private (Student only)
const getStudentVideos = async (req, res) => {
  try {
    const videos = await Video.findAll({
      order: [['created_at', 'DESC']],
      limit: 50 // Limit for student view
    });
    
    res.status(200).json({
      status: 'success',
      message: 'Videos fetched successfully',
      data: { videos }
    });
    
  } catch (error) {
    console.error('Get student videos error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch videos'
    });
  }
};

module.exports = {
  getStudentDashboard,
  getStudentProfile,
  updateStudentProfile,
  getStudentVideos
};