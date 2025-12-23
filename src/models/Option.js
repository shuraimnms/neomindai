// ============================================
// Option Model (MCQ Options)
// ============================================

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Option = sequelize.define('Option', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
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
  text: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  order_index: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  is_correct: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  }
}, {
  tableName: 'assignment_options',
  indexes: [
    { fields: ['question_id'] },
    { fields: ['question_id', 'order_index'] },
    { fields: ['question_id', 'is_correct'] }
  ]
});

// Instance methods
Option.prototype.markAsCorrect = function() {
  this.is_correct = true;
  return this.save();
};

Option.prototype.markAsIncorrect = function() {
  this.is_correct = false;
  return this.save();
};

module.exports = Option;
