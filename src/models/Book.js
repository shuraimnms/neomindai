// ============================================
// Book Model - Library
// ============================================

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Book = sequelize.define('Book', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },

  title: {
    type: DataTypes.STRING(300),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Title is required' },
      len: { args: [1, 300], msg: 'Title must be between 1 and 300 characters' }
    }
  },

  author: {
    type: DataTypes.STRING(200),
    allowNull: true,
    defaultValue: ''
  },

  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: ''
  },

  category: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: ''
  },

  file_url: {
    type: DataTypes.TEXT,
    allowNull: true
  },

  external_link: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      isUrl: {
        msg: 'Please provide a valid URL',
        args: { protocols: ['http', 'https'], require_protocol: true }
      }
    }
  }
}, {
  tableName: 'books',
  timestamps: true
});

module.exports = Book;
