// ============================================
// Submission Model
// ============================================

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Submission = sequelize.define('Submission', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  assignment_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'assignments',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  student_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  attempt_number: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 1
    }
  },
  status: {
    type: DataTypes.ENUM('in_progress', 'submitted', 'graded', 'late'),
    defaultValue: 'in_progress',
    allowNull: false
  },
  submitted_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  total_score: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  max_score: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  percentage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 100
    }
  },
  time_taken: {
    type: DataTypes.INTEGER, // in minutes
    allowNull: true,
    validate: {
      min: 0
    }
  },
  // File submission (if any)
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
  graded_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  graded_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  feedback: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Auto-save data (JSON)
  auto_save_data: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Stores temporary answers during auto-save'
  }
}, {
  tableName: 'assignment_submissions',
  indexes: [
    { fields: ['assignment_id'] },
    { fields: ['student_id'] },
    { fields: ['assignment_id', 'student_id'] },
    { fields: ['assignment_id', 'student_id', 'attempt_number'], unique: true },
    { fields: ['status'] },
    { fields: ['submitted_at'] }
  ]
});

// Instance methods
Submission.prototype.isSubmitted = function() {
  return this.status === 'submitted' || this.status === 'graded' || this.status === 'late';
};

Submission.prototype.isGraded = function() {
  return this.status === 'graded';
};

Submission.prototype.isLate = function() {
  return this.status === 'late';
};

Submission.prototype.calculatePercentage = function() {
  if (this.total_score === null || this.max_score === null || this.max_score === 0) {
    return null;
  }
  return (this.total_score / this.max_score) * 100;
};

Submission.prototype.markAsLate = function() {
  this.status = 'late';
  return this.save();
};

Submission.prototype.submit = function() {
  this.status = 'submitted';
  this.submitted_at = new Date();
  return this.save();
};

module.exports = Submission;
