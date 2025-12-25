// ============================================
// Admin Controller
// ============================================

const User = require('../models/User');
const Video = require('../models/Video');
const Assignment = require('../models/Assignment');
const Question = require('../models/Question');
const Submission = require('../models/Submission');
const AssignmentRecipient = require('../models/AssignmentRecipient');
const Answer = require('../models/Answer');
const Option = require('../models/Option');
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
      whereClause.status = 'published';
    } else if (status === 'inactive') {
      whereClause.status = 'draft';
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

// @desc    Get all assignments
// @route   GET /api/admin/assignments
// @access  Private (Admin only)
const getAllAssignments = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', status = '' } = req.query;
    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause = {};

    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (status === 'active') {
      whereClause.status = 'published';
    } else if (status === 'inactive') {
      whereClause.status = 'draft';
    }

    // Get assignments with pagination
    const { count, rows: assignments } = await Assignment.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Question,
          as: 'questions',
          include: [
            {
              model: Option,
              as: 'options'
            }
          ]
        },
        {
          model: AssignmentRecipient,
          as: 'recipients',
          include: [
            {
              model: User,
              as: 'student',
              attributes: ['id', 'name', 'email']
            }
          ]
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    // Calculate total pages
    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      status: 'success',
      message: 'Assignments fetched successfully',
      data: {
        assignments,
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
    console.error('Get assignments error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch assignments'
    });
  }
};

// @desc    Get assignment details
// @route   GET /api/admin/assignments/:id
// @access  Private (Admin only)
const getAssignmentDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const assignment = await Assignment.findOne({
      where: { id },
      include: [
        {
          model: Question,
          as: 'questions',
          include: [
            {
              model: Option,
              as: 'options'
            }
          ]
        },
        {
          model: AssignmentRecipient,
          as: 'recipients',
          include: [
            {
              model: User,
              as: 'student',
              attributes: ['id', 'name', 'email']
            }
          ]
        },
        {
          model: Submission,
          as: 'submissions',
          include: [
            {
              model: User,
              as: 'student',
              attributes: ['id', 'name', 'email']
            },
            {
              model: Answer,
              as: 'answers',
              include: [
                {
                  model: Question,
                  as: 'question'
                }
              ]
            }
          ]
        }
      ]
    });

    if (!assignment) {
      return res.status(404).json({
        status: 'error',
        message: 'Assignment not found'
      });
    }

    // Transform questions for frontend editing
    // Convert database IDs to client-side IDs for options and correct_answer
    const transformedQuestions = assignment.questions.map(question => {
      const clientOptions = question.options.map(option => ({
        id: `o${option.id}`, // Convert database ID to client ID
        text: option.text
      }));

      // Map correct_answer from database IDs to client IDs
      let clientCorrectAnswer = question.correct_answer;
      if (question.correct_answer && Array.isArray(question.correct_answer)) {
        clientCorrectAnswer = question.correct_answer.map(dbId => {
          const option = question.options.find(opt => opt.id === dbId);
          return option ? `o${option.id}` : dbId;
        });
      }

      return {
        ...question.toJSON(),
        options: clientOptions,
        correct_answer: clientCorrectAnswer
      };
    });

    const transformedAssignment = {
      ...assignment.toJSON(),
      questions: transformedQuestions
    };

    res.status(200).json({
      status: 'success',
      message: 'Assignment details fetched',
      data: { assignment: transformedAssignment }
    });

  } catch (error) {
    console.error('Get assignment details error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch assignment details'
    });
  }
};

// @desc    Create new assignment
// @route   POST /api/admin/assignments
// @access  Private (Admin only)
const createAssignment = async (req, res) => {
  try {
    const { title, description, questions, recipients, due_date, status = 'draft' } = req.body;

    // Create assignment (only use columns that exist in database)
    const assignment = await Assignment.create({
      title,
      description,
      due_date,
      status,
      created_by: req.user.id,
      allow_late_submission: false,
      auto_evaluation: true,
      manual_evaluation: false,
      shuffle_questions: false,
      shuffle_options: false,
      total_marks: 0
    });

    // Create questions and options
    if (questions && questions.length > 0) {
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];

        // Create question first
        const question = await Question.create({
          assignment_id: assignment.id,
          title: q.title,
          description: q.description,
          type: q.type,
          marks: q.marks || 1,
          order_index: i,
          correct_answer: q.correct_answer, // Will be updated after options are created
          allowed_file_types: q.allowed_file_types,
          max_file_size: q.max_file_size
        });

        // Create options with the question_id
        let createdOptions = [];
        if (q.options && q.options.length > 0) {
          for (let optIndex = 0; optIndex < q.options.length; optIndex++) {
            const opt = q.options[optIndex];
            const createdOption = await Option.create({
              question_id: question.id,
              text: opt.text,
              order_index: optIndex
            });
            createdOptions.push({ clientId: opt.id, dbOption: createdOption });
          }
        }

        // Map correct_answer from client IDs to database IDs and update question
        if (q.correct_answer && Array.isArray(q.correct_answer)) {
          const correctAnswer = q.correct_answer.map(clientId => {
            const found = createdOptions.find(co => co.clientId === clientId);
            return found ? found.dbOption.id : clientId;
          });
          await question.update({ correct_answer: correctAnswer });
        }
      }
    }

    // Assign to recipients
    if (recipients && recipients.length > 0) {
      for (const studentId of recipients) {
        await AssignmentRecipient.create({
          assignment_id: assignment.id,
          recipient_type: 'selected_students',
          student_id: studentId
        });
      }
    }

    // Fetch complete assignment
    const completeAssignment = await Assignment.findOne({
      where: { id: assignment.id },
      include: [
        {
          model: Question,
          as: 'questions',
          include: [
            {
              model: Option,
              as: 'options'
            }
          ]
        },
        {
          model: AssignmentRecipient,
          as: 'recipients',
          include: [
            {
              model: User,
              as: 'student',
              attributes: ['id', 'name', 'email']
            }
          ]
        }
      ]
    });

    res.status(201).json({
      status: 'success',
      message: 'Assignment created successfully',
      data: { assignment: completeAssignment }
    });

  } catch (error) {
    console.error('Create assignment error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create assignment'
    });
  }
};

// @desc    Update assignment
// @route   PUT /api/admin/assignments/:id
// @access  Private (Admin only)
const updateAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, questions, recipients, due_date, status } = req.body;

    const assignment = await Assignment.findOne({ where: { id } });

    if (!assignment) {
      return res.status(404).json({
        status: 'error',
        message: 'Assignment not found'
      });
    }

    // Update assignment
    await assignment.update({
      title: title || assignment.title,
      description: description || assignment.description,
      due_date: due_date || assignment.due_date,
      status: status !== undefined ? status : assignment.status
    });

    // Update questions if provided
    if (questions) {
      // Delete existing questions and options
      await Question.destroy({ where: { assignment_id: id } });

      // Create new questions
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];

        // First create options to get their database IDs
        let correctAnswer = q.correct_answer;
        let createdOptions = [];

        if (q.options && q.options.length > 0) {
          for (let optIndex = 0; optIndex < q.options.length; optIndex++) {
            const opt = q.options[optIndex];
            const createdOption = await Option.create({
              question_id: null, // Will be set after question creation
              text: opt.text,
              order_index: optIndex
            });
            createdOptions.push({ clientId: opt.id, dbOption: createdOption });
          }
        }

        // Map correct_answer from client IDs to database IDs
        if (q.correct_answer && Array.isArray(q.correct_answer)) {
          correctAnswer = q.correct_answer.map(clientId => {
            const found = createdOptions.find(co => co.clientId === clientId);
            return found ? found.dbOption.id : clientId;
          });
        }

        // Create question with mapped correct_answer
        const question = await Question.create({
          assignment_id: id,
          title: q.title,
          description: q.description,
          type: q.type,
          marks: q.marks || 1,
          order_index: i,
          correct_answer: correctAnswer,
          allowed_file_types: q.allowed_file_types,
          max_file_size: q.max_file_size
        });

        // Update options with question_id
        for (const createdOption of createdOptions) {
          await createdOption.dbOption.update({ question_id: question.id });
        }
      }
    }

    // Update recipients if provided
    if (recipients) {
      // Delete existing recipients
      await AssignmentRecipient.destroy({ where: { assignment_id: id } });

      // Create new recipients
      for (const studentId of recipients) {
        await AssignmentRecipient.create({
          assignment_id: id,
          recipient_type: 'selected_students',
          student_id: studentId
        });
      }
    }

    // Fetch updated assignment
    const updatedAssignment = await Assignment.findOne({
      where: { id },
      include: [
        {
          model: Question,
          as: 'questions',
          include: [
            {
              model: Option,
              as: 'options'
            }
          ]
        },
        {
          model: AssignmentRecipient,
          as: 'recipients',
          include: [
            {
              model: User,
              as: 'student',
              attributes: ['id', 'name', 'email']
            }
          ]
        }
      ]
    });

    res.status(200).json({
      status: 'success',
      message: 'Assignment updated successfully',
      data: { assignment: updatedAssignment }
    });

  } catch (error) {
    console.error('Update assignment error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update assignment'
    });
  }
};

// @desc    Delete assignment
// @route   DELETE /api/admin/assignments/:id
// @access  Private (Admin only)
const deleteAssignment = async (req, res) => {
  try {
    const { id } = req.params;

    const assignment = await Assignment.findOne({ where: { id } });

    if (!assignment) {
      return res.status(404).json({
        status: 'error',
        message: 'Assignment not found'
      });
    }

    // Delete related records
    await Answer.destroy({ where: { question_id: { [Op.in]: await Question.findAll({ where: { assignment_id: id }, attributes: ['id'] }).then(qs => qs.map(q => q.id)) } } });
    await Option.destroy({ where: { question_id: { [Op.in]: await Question.findAll({ where: { assignment_id: id }, attributes: ['id'] }).then(qs => qs.map(q => q.id)) } } });
    await Question.destroy({ where: { assignment_id: id } });
    await Submission.destroy({ where: { assignment_id: id } });
    await AssignmentRecipient.destroy({ where: { assignment_id: id } });

    // Delete assignment
    await assignment.destroy();

    res.status(200).json({
      status: 'success',
      message: 'Assignment deleted successfully'
    });

  } catch (error) {
    console.error('Delete assignment error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete assignment'
    });
  }
};

// @desc    Get assignment statistics
// @route   GET /api/admin/assignments/stats
// @access  Private (Admin only)
const getAssignmentStats = async (req, res) => {
  try {
    const totalAssignments = await Assignment.count();
    const activeAssignments = await Assignment.count({ where: { status: 'published' } });
    const totalSubmissions = await Submission.count();
    const completedSubmissions = await Submission.count({ where: { status: 'completed' } });

    res.status(200).json({
      status: 'success',
      message: 'Assignment stats fetched successfully',
      data: {
        stats: {
          totalAssignments,
          activeAssignments,
          inactiveAssignments: totalAssignments - activeAssignments,
          totalSubmissions,
          completedSubmissions,
          pendingSubmissions: totalSubmissions - completedSubmissions
        }
      }
    });

  } catch (error) {
    console.error('Get assignment stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch assignment stats'
    });
  }
};

module.exports = {
  getAdminDashboard,
  getAllStudents,
  toggleStudentStatus,
  getStudentDetails,
  getAllAssignments,
  getAssignmentDetails,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getAssignmentStats
};
