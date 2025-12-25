// ============================================
// Assignment Recipient Model
// ============================================

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AssignmentRecipient = sequelize.define('AssignmentRecipient', {
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
  recipient_type: {
    type: DataTypes.ENUM('all_students', 'selected_students', 'batch'),
    allowNull: false,
    defaultValue: 'all_students'
  },
  // For selected_students type
  student_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  // For batch type
  batch_id: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'Reference to batch/class table (to be implemented)'
  },
  batch_name: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'assignment_recipients',
  indexes: [
    { fields: ['assignment_id'] },
    { fields: ['recipient_type'] },
    { fields: ['student_id'] },
    { fields: ['batch_id'] },
    { fields: ['assignment_id', 'student_id'], unique: true }
  ]
});

// Instance methods
AssignmentRecipient.prototype.isAllStudents = function() {
  return this.recipient_type === 'all_students';
};

AssignmentRecipient.prototype.isSelectedStudent = function() {
  return this.recipient_type === 'selected_students';
};

AssignmentRecipient.prototype.isBatch = function() {
  return this.recipient_type === 'batch';
};

module.exports = AssignmentRecipient;
