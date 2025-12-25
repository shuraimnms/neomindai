// ============================================
// Assignment Controller
// ============================================

const { Op } = require('sequelize');
const {
  Assignment,
  Question,
  Option,
  Submission,
  Answer,
  AssignmentRecipient,
  User
} = require('../models');
const { sequelize } = require('../config/database');

// ============================================
// STUDENT CONTROLLERS
// ============================================

// Get assignments for a student
const getAssignmentsForStudent = async (req, res) => {
  try {
    const studentId = req.user.id;

    // Get assignments where student is a recipient or all students are recipients
    const assignments = await Assignment.findAll({
      include: [
        {
          model: AssignmentRecipient,
          as: 'recipients',
          where: {
            [Op.or]: [
              { recipient_type: 'all_students' },
              {
                recipient_type: 'selected_students',
                student_id: studentId
              }
            ]
          },
          required: true
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        }
      ],
      attributes: [
        'id', 'title', 'description', 'status',
        'start_date', 'due_date', 'total_marks', 'time_limit',
        'attempt_limit', 'allow_late_submission'
      ]
    });

    // Get submission status for each assignment
    const assignmentsWithStatus = await Promise.all(
      assignments.map(async (assignment) => {
        const submissions = await Submission.findAll({
          where: {
            assignment_id: assignment.id,
            student_id: studentId
          },
          order: [['attempt_number', 'DESC']]
        });

        const latestSubmission = submissions[0];
        let status = 'not_started';

        if (latestSubmission) {
          if (latestSubmission.status === 'submitted' || latestSubmission.status === 'graded') {
            status = 'submitted';
          } else if (latestSubmission.status === 'in_progress') {
            status = 'in_progress';
          }
        }

        return {
          ...assignment.toJSON(),
          status,
          attempts_used: submissions.length,
          latest_submission: latestSubmission ? {
            id: latestSubmission.id,
            status: latestSubmission.status,
            submitted_at: latestSubmission.submitted_at,
            total_score: latestSubmission.total_score,
            percentage: latestSubmission.percentage
          } : null
        };
      })
    );

    res.json({
      success: true,
      data: assignmentsWithStatus
    });
  } catch (error) {
    console.error('Error fetching assignments for student:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assignments'
    });
  }
};

// Get single assignment for student
const getAssignmentForStudentById = async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = req.user.id;

    // Check if student has access to this assignment
    const recipient = await AssignmentRecipient.findOne({
      where: {
        assignment_id: id,
        [Op.or]: [
          { recipient_type: 'all_students' },
          {
            recipient_type: 'selected_students',
            student_id: studentId
          }
        ]
      }
    });

    if (!recipient) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this assignment'
      });
    }

    // Get assignment with questions and options
    const assignment = await Assignment.findByPk(id, {
      include: [
        {
          model: Question,
          as: 'questions',
          include: [
            {
              model: Option,
              as: 'options',
              attributes: ['id', 'text', 'order_index'],
              order: [['order_index', 'ASC']]
            }
          ],
          order: [['order_index', 'ASC']],
          attributes: [
            'id', 'title', 'description', 'type', 'marks',
            'order_index', 'allowed_file_types', 'max_file_size'
          ]
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        }
      ],
      attributes: [
        'id', 'title', 'description', 'status',
        'start_date', 'due_date', 'total_marks', 'time_limit',
        'attempt_limit', 'allow_late_submission', 'shuffle_questions', 'shuffle_options'
      ]
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    if (!assignment.isAvailable()) {
      return res.status(403).json({
        success: false,
        message: 'Assignment is not available yet'
      });
    }

    // Get student's submissions
    const submissions = await Submission.findAll({
      where: {
        assignment_id: id,
        student_id: studentId
      },
      order: [['attempt_number', 'DESC']]
    });

    // Check attempt limits
    const attemptsUsed = submissions.length;
    const canAttempt = !assignment.attempt_limit || attemptsUsed < assignment.attempt_limit;

    // Get latest submission answers if exists
    let answers = [];
    if (submissions.length > 0) {
      const latestSubmission = submissions[0];
      answers = await Answer.findAll({
        where: { submission_id: latestSubmission.id },
        include: [
          {
            model: Question,
            as: 'question',
            attributes: ['id', 'type']
          }
        ]
      });
    }

    res.json({
      success: true,
      data: {
        assignment: assignment.toJSON(),
        can_attempt: canAttempt,
        attempts_used: attemptsUsed,
        max_attempts: assignment.attempt_limit,
        latest_answers: answers.map(answer => ({
          question_id: answer.question_id,
          answer: answer.getAnswerValue(),
          score: answer.score,
          feedback: answer.feedback
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching assignment for student:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assignment'
    });
  }
};

// Submit assignment
const submitAssignment = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const studentId = req.user.id;
    const { answers, time_taken } = req.body;

    // Check if student has access
    const recipient = await AssignmentRecipient.findOne({
      where: {
        assignment_id: id,
        [Op.or]: [
          { recipient_type: 'all_students' },
          {
            recipient_type: 'selected_students',
            student_id: studentId
          }
        ]
      },
      transaction
    });

    if (!recipient) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: 'Access denied to this assignment'
      });
    }

    const assignment = await Assignment.findByPk(id, { transaction });
    if (!assignment || !assignment.isAvailable()) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: 'Assignment is not available'
      });
    }

    // Check if overdue and late submission not allowed
    if (assignment.isOverdue() && !assignment.canSubmitLate()) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: 'Assignment deadline has passed'
      });
    }

    // Get existing submissions
    const existingSubmissions = await Submission.findAll({
      where: {
        assignment_id: id,
        student_id: studentId
      },
      order: [['attempt_number', 'DESC']],
      transaction
    });

    const attemptsUsed = existingSubmissions.length;
    if (assignment.attempt_limit && attemptsUsed >= assignment.attempt_limit) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: 'Maximum attempts exceeded'
      });
    }

    // Create new submission
    const submission = await Submission.create({
      assignment_id: id,
      student_id: studentId,
      attempt_number: attemptsUsed + 1,
      status: assignment.isOverdue() ? 'late' : 'submitted',
      submitted_at: new Date(),
      time_taken: time_taken || null,
      file_url: req.file ? `/uploads/submissions/${req.file.filename}` : null,
      file_name: req.file ? req.file.originalname : null,
      file_size: req.file ? req.file.size : null
    }, { transaction });

    // Get all questions
    const questions = await Question.findAll({
      where: { assignment_id: id },
      include: [
        {
          model: Option,
          as: 'options'
        }
      ],
      transaction
    });

    let totalScore = 0;
    let maxScore = 0;

    // Process answers
    for (const question of questions) {
      maxScore += question.marks;

      const studentAnswer = answers ? answers[question.id] : null;

      let score = 0;
      if (question.isAutoGradable() && studentAnswer !== null) {
        score = question.checkAnswer(studentAnswer) || 0;
      }

      totalScore += score;

      // Create answer record
      await Answer.create({
        submission_id: submission.id,
        question_id: question.id,
        score: question.isAutoGradable() ? score : null,
        max_score: question.marks
      }, { transaction }).then(answer => {
        // Set the answer value
        return answer.setAnswerValue(studentAnswer, question.type);
      });
    }

    // Update submission with scores
    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
    await submission.update({
      total_score: totalScore,
      max_score: maxScore,
      percentage: percentage
    }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: 'Assignment submitted successfully',
      data: {
        submission_id: submission.id,
        total_score: totalScore,
        max_score: maxScore,
        percentage: percentage,
        status: submission.status
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error submitting assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit assignment'
    });
  }
};

// Auto-save answer
const autoSaveAnswer = async (req, res) => {
  try {
    const { id } = req.params; // assignment id
    const { question_id, answer } = req.body;
    const studentId = req.user.id;

    // Find or create submission
    let submission = await Submission.findOne({
      where: {
        assignment_id: id,
        student_id: studentId,
        status: 'in_progress'
      }
    });

    if (!submission) {
      // Check if can create new submission
      const assignment = await Assignment.findByPk(id);
      if (!assignment || !assignment.isAvailable()) {
        return res.status(403).json({
          success: false,
          message: 'Assignment not available'
        });
      }

      const existingCount = await Submission.count({
        where: {
          assignment_id: id,
          student_id: studentId
        }
      });

      if (assignment.attempt_limit && existingCount >= assignment.attempt_limit) {
        return res.status(403).json({
          success: false,
          message: 'Maximum attempts exceeded'
        });
      }

      submission = await Submission.create({
        assignment_id: id,
        student_id: studentId,
        attempt_number: existingCount + 1,
        status: 'in_progress'
      });
    }

    // Find or create answer
    let answerRecord = await Answer.findOne({
      where: {
        submission_id: submission.id,
        question_id: question_id
      }
    });

    if (!answerRecord) {
      const question = await Question.findByPk(question_id);
      answerRecord = await Answer.create({
        submission_id: submission.id,
        question_id: question_id,
        max_score: question.marks
      });
    }

    // Update answer
    await answerRecord.setAnswerValue(answer, answerRecord.question.type);

    res.json({
      success: true,
      message: 'Answer saved successfully'
    });
  } catch (error) {
    console.error('Error auto-saving answer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save answer'
    });
  }
};

// Get assignment result
const getAssignmentResult = async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = req.user.id;

    const submission = await Submission.findOne({
      where: {
        assignment_id: id,
        student_id: studentId,
        [Op.or]: [
          { status: 'submitted' },
          { status: 'graded' },
          { status: 'late' }
        ]
      },
      include: [
        {
          model: Assignment,
          as: 'assignment',
          attributes: ['id', 'title', 'total_marks']
        },
        {
          model: Answer,
          as: 'answers',
          include: [
            {
              model: Question,
              as: 'question',
              attributes: ['id', 'title', 'type', 'marks']
            }
          ]
        }
      ],
      order: [['created_at', 'DESC']]
    });

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    res.json({
      success: true,
      data: {
        submission: {
          id: submission.id,
          status: submission.status,
          submitted_at: submission.submitted_at,
          total_score: submission.total_score,
          max_score: submission.max_score,
          percentage: submission.percentage,
          feedback: submission.feedback
        },
        assignment: submission.assignment,
        answers: submission.answers.map(answer => ({
          question_id: answer.question_id,
          question_title: answer.question.title,
          question_type: answer.question.type,
          answer: answer.getAnswerValue(),
          score: answer.score,
          max_score: answer.max_score,
          feedback: answer.feedback
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching assignment result:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch result'
    });
  }
};

// Suggest improvement (AI-like feature)
const suggestImprovement = async (req, res) => {
  try {
    const { id } = req.params;
    const { question_id, answer_text } = req.body;

    // This is a placeholder for AI integration
    // In a real implementation, you would call an AI service

    const suggestions = [
      "Consider providing more specific examples to support your answer.",
      "Your answer could benefit from additional details about the key concepts.",
      "Try to connect your response to real-world applications.",
      "Consider revising for clarity and conciseness."
    ];

    const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];

    res.json({
      success: true,
      suggestion: randomSuggestion
    });
  } catch (error) {
    console.error('Error generating suggestion:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate suggestion'
    });
  }
};

module.exports = {
  getAssignmentsForStudent,
  getAssignmentForStudentById,
  submitAssignment,
  autoSaveAnswer,
  getAssignmentResult,
  suggestImprovement
};
