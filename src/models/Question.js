// ============================================
// Question Model
// ============================================

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Question = sequelize.define('Question', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  assignment_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Assignments',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  title: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  type: {
    type: DataTypes.ENUM(
      'mcq_single',
      'mcq_multiple',
      'true_false',
      'short_answer',
      'long_answer',
      'file_upload'
    ),
    allowNull: false
  },
  marks: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 0
    }
  },
  order_index: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  // For file upload questions
  allowed_file_types: {
    type: DataTypes.JSON, // ['pdf', 'doc', 'docx', 'txt']
    allowNull: true
  },
  max_file_size: {
    type: DataTypes.INTEGER, // in MB
    allowNull: true,
    validate: {
      min: 1,
      max: 50
    }
  },
  // For auto-evaluation
  correct_answer: {
    type: DataTypes.JSON, // Store correct answers as JSON
    allowNull: true,
    comment: 'For MCQ: array of option_ids, for true_false: boolean, for others: null'
  },
  // For manual evaluation criteria
  evaluation_criteria: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'assignment_questions',
  indexes: [
    { fields: ['assignment_id'] },
    { fields: ['assignment_id', 'order_index'] },
    { fields: ['type'] }
  ]
});

// Instance methods
Question.prototype.isAutoGradable = function() {
  return ['mcq_single', 'mcq_multiple', 'true_false'].includes(this.type);
};

Question.prototype.isFileUpload = function() {
  return this.type === 'file_upload';
};

Question.prototype.isTextAnswer = function() {
  return ['short_answer', 'long_answer'].includes(this.type);
};

Question.prototype.getCorrectAnswerIds = function() {
  if (!this.correct_answer) return [];
  return Array.isArray(this.correct_answer) ? this.correct_answer : [this.correct_answer];
};

Question.prototype.checkAnswer = function(studentAnswer) {
  if (!this.isAutoGradable()) return null; // Manual grading required

  const correctAnswers = this.getCorrectAnswerIds();

  switch (this.type) {
    case 'mcq_single':
      return correctAnswers.includes(studentAnswer) ? this.marks : 0;

    case 'mcq_multiple':
      if (!Array.isArray(studentAnswer)) return 0;
      const correctCount = studentAnswer.filter(ans => correctAnswers.includes(ans)).length;
      const wrongCount = studentAnswer.length - correctCount;
      // Partial credit: correct - wrong (but not negative)
      const score = Math.max(0, (correctCount * this.marks / correctAnswers.length) - (wrongCount * this.marks / correctAnswers.length));
      return score;

    case 'true_false':
      return studentAnswer === correctAnswers[0] ? this.marks : 0;

    default:
      return null;
  }
};

module.exports = Question;
