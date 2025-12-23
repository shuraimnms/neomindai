// ============================================
// Assignment Model
// ============================================

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Assignment = sequelize.define('Assignment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 255]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  category: {
    type: DataTypes.ENUM('quiz', 'assignment', 'test', 'exam'),
    defaultValue: 'assignment',
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('draft', 'published', 'locked'),
    defaultValue: 'draft',
    allowNull: false
  },
  // Settings
  start_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  due_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  time_limit: {
    type: DataTypes.INTEGER, // in minutes, null for no limit
    allowNull: true,
    validate: {
      min: 1
    }
  },
  attempt_limit: {
    type: DataTypes.INTEGER, // 1 for single attempt, null for unlimited
    allowNull: true,
    validate: {
      min: 1
    }
  },
  allow_late_submission: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  auto_evaluation: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  manual_evaluation: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  shuffle_questions: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  shuffle_options: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  total_marks: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  created_by: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  }
}, {
  tableName: 'assignments',
  indexes: [
    { fields: ['status'] },
    { fields: ['due_date'] },
    { fields: ['created_by'] },
    { fields: ['category'] }
  ]
});

// Instance methods
Assignment.prototype.isPublished = function() {
  return this.status === 'published';
};

Assignment.prototype.isLocked = function() {
  return this.status === 'locked';
};

Assignment.prototype.isAvailable = function() {
  if (!this.isPublished()) return false;
  if (this.start_date && new Date() < this.start_date) return false;
  return true;
};

Assignment.prototype.isOverdue = function() {
  return this.due_date && new Date() > this.due_date;
};

Assignment.prototype.canSubmitLate = function() {
  return this.allow_late_submission && this.isOverdue();
};

module.exports = Assignment;
