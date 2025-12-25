// ============================================
// Student Controller
// ============================================

const User = require('../models/User');
const Video = require('../models/Video');
const Assignment = require('../models/Assignment');
const AssignmentRecipient = require('../models/AssignmentRecipient');
const Submission = require('../models/Submission');

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

// @desc    Get assignments for student
// @route   GET /api/student/assignments
// @access  Private (Student only)
const getStudentAssignments = async (req, res) => {
  try {
    // Get assignments assigned to this student
    const assignments = await Assignment.findAll({
      where: {
        status: 'published' // Only show published assignments
      },
      include: [
        {
          model: AssignmentRecipient,
          as: 'recipients',
          where: {
            student_id: req.user.id,
            recipient_type: 'selected_students'
          },
          required: true // Only include assignments where student is a recipient
        },
        {
          model: Submission,
          as: 'submissions',
          where: {
            student_id: req.user.id
          },
          required: false // Include submissions if they exist
        }
      ],
      order: [['due_date', 'ASC']]
    });

    // Transform assignments to include submission status
    const transformedAssignments = assignments.map(assignment => {
      const submission = assignment.submissions?.[0];
      let status = 'pending';

      if (submission) {
        status = submission.status;
      } else if (new Date(assignment.due_date) < new Date()) {
        status = 'overdue';
      }

      return {
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        due_date: assignment.due_date,
        created_at: assignment.created_at,
        status: status
      };
    });

    res.status(200).json({
      status: 'success',
      message: 'Assignments fetched successfully',
      data: { assignments: transformedAssignments }
    });

  } catch (error) {
    console.error('Get student assignments error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch assignments'
    });
  }
};

module.exports = {
  getStudentDashboard,
  getStudentProfile,
  updateStudentProfile,
  getStudentVideos,
  getStudentAssignments
};
