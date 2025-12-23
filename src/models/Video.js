// ============================================
// Video Model - Recorded Classes
// ============================================

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Video = sequelize.define('Video', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Title is required'
      },
      len: {
        args: [3, 200],
        msg: 'Title must be between 3 and 200 characters'
      }
    }
  },
  
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: ''
  },
  
  video_url: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Video URL is required'
      },
      isUrl: {
        msg: 'Please provide a valid URL'
      }
    }
  },
  
  thumbnail_url: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      isUrl: {
        msg: 'Please provide a valid thumbnail URL',
        args: {
          protocols: ['http', 'https'],
          require_protocol: true
        }
      }
    }
  },
  
  duration: {
    type: DataTypes.STRING(20),
    allowNull: true,
    defaultValue: '00:00'
  }
}, {
  tableName: 'videos',
  timestamps: true
});

module.exports = Video;