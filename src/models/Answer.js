// ============================================
// Answer Model (Student answers to questions)
// ============================================

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Answer = sequelize.define('Answer', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  submission_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'assignment_submissions',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  question_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'assignment_questions',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  // Answer content (flexible for different question types)
  answer_text: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'For text-based answers (short/long answer)'
  },
  answer_options: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'For MCQ answers: array of selected option_ids'
  },
  answer_boolean: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    comment: 'For true/false questions'
  },
  // File upload answers
  file_url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  file_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  file_size: {
    type: DataTypes.INTEGER, // in bytes
    allowNull: true
  },
  // Grading
  score: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  max_score: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  feedback: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  graded_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  graded_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // Auto-save timestamp
  auto_saved_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'assignment_answers',
  indexes: [
    { fields: ['submission_id'] },
    { fields: ['question_id'] },
    { fields: ['submission_id', 'question_id'], unique: true },
    { fields: ['graded_by'] }
  ]
});

// Instance methods
Answer.prototype.isGraded = function() {
  return this.score !== null;
};

Answer.prototype.calculatePercentage = function() {
  if (this.score === null || this.max_score === null || this.max_score === 0) {
    return null;
  }
  return (this.score / this.max_score) * 100;
};

Answer.prototype.getAnswerValue = function() {
  // Return the answer in a standardized format
  if (this.answer_options) return this.answer_options;
  if (this.answer_boolean !== null) return this.answer_boolean;
  if (this.answer_text) return this.answer_text;
  if (this.file_url) return { url: this.file_url, name: this.file_name, size: this.file_size };
  return null;
};

Answer.prototype.setAnswerValue = function(value, questionType) {
  // Reset all answer fields
  this.answer_text = null;
  this.answer_options = null;
  this.answer_boolean = null;
  this.file_url = null;
  this.file_name = null;
  this.file_size = null;

  // Set the appropriate field based on question type
  switch (questionType) {
    case 'mcq_single':
      this.answer_options = Array.isArray(value) ? value : [value];
      break;
    case 'mcq_multiple':
      this.answer_options = Array.isArray(value) ? value : [value];
      break;
    case 'true_false':
      this.answer_boolean = Boolean(value);
      break;
    case 'short_answer':
    case 'long_answer':
      this.answer_text = String(value || '');
      break;
    case 'file_upload':
      if (typeof value === 'object') {
        this.file_url = value.url;
        this.file_name = value.name;
        this.file_size = value.size;
      }
      break;
  }

  this.auto_saved_at = new Date();
  return this.save();
};

module.exports = Answer;
