// ============================================
// Admin Controller
// ============================================

const User = require('../models/User');
const Video = require('../models/Video');
const { Op } = require('sequelize');

// @desc    Get admin dashboard stats
// @route   GET /api/admin/dashboard
// @access  Private (Admin only)
const getAdminDashboard = async (req, res) => {
  try {
    // Get total students count
    const totalStudents = await User.count({
      where: { role: 'student' }
    });
    
    // Get active students count
    const activeStudents = await User.count({
      where: { 
        role: 'student',
        is_active: true
      }
    });
    
    // Get total videos count
    const totalVideos = await Video.count();
    
    // Get recent students (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const recentStudents = await User.count({
      where: {
        role: 'student',
        created_at: {
          [Op.gte]: weekAgo
        }
      }
    });
    
    res.status(200).json({
      status: 'success',
      message: 'Admin dashboard fetched successfully',
      data: {
        stats: {
          totalStudents,
          activeStudents,
          inactiveStudents: totalStudents - activeStudents,
          totalVideos,
          recentStudents
        },
        summary: {
          studentGrowth: recentStudents > 0 ? 'positive' : 'stable',
          videoCount: totalVideos > 0 ? 'good' : 'needs_content'
        }
      }
    });
    
  } catch (error) {
    console.error('Get admin dashboard error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch admin dashboard'
    });
  }
};

// @desc    Get all students
// @route   GET /api/admin/students
// @access  Private (Admin only)
const getAllStudents = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', status = '' } = req.query;
    const offset = (page - 1) * limit;
    
    // Build where clause
    const whereClause = { role: 'student' };
    
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    if (status === 'active') {
      whereClause.is_active = true;
    } else if (status === 'inactive') {
      whereClause.is_active = false;
    }
    
    // Get students with pagination
    const { count, rows: students } = await User.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ['password'] },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });
    
    // Calculate total pages
    const totalPages = Math.ceil(count / limit);
    
    res.status(200).json({
      status: 'success',
      message: 'Students fetched successfully',
      data: {
        students,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
    
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch students'
    });
  }
};

// @desc    Toggle student active status
// @route   PUT /api/admin/students/:id/toggle
// @access  Private (Admin only)
const toggleStudentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find student (not admin)
    const student = await User.findOne({
      where: {
        id,
        role: 'student'
      }
    });
    
    if (!student) {
      return res.status(404).json({
        status: 'error',
        message: 'Student not found'
      });
    }
    
    // Toggle active status
    const newStatus = !student.is_active;
    await student.update({ is_active: newStatus });
    
    res.status(200).json({
      status: 'success',
      message: `Student ${newStatus ? 'activated' : 'deactivated'} successfully`,
      data: {
        student: student.getSafeData()
      }
    });
    
  } catch (error) {
    console.error('Toggle student status error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update student status'
    });
  }
};

// @desc    Get student details
// @route   GET /api/admin/students/:id
// @access  Private (Admin only)
const getStudentDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    const student = await User.findOne({
      where: {
        id,
        role: 'student'
      },
      attributes: { exclude: ['password'] }
    });
    
    if (!student) {
      return res.status(404).json({
        status: 'error',
        message: 'Student not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Student details fetched',
      data: { student }
    });
    
  } catch (error) {
    console.error('Get student details error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch student details'
    });
  }
};

module.exports = {
  getAdminDashboard,
  getAllStudents,
  toggleStudentStatus,
  getStudentDetails
};