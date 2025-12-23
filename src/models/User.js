// ============================================
// User Model - Students & Admin
// ============================================

const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Name is required'
      },
      len: {
        args: [2, 100],
        msg: 'Name must be between 2 and 100 characters'
      }
    }
  },
  
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: {
      name: 'unique_email',
      msg: 'Email already exists'
    },
    validate: {
      notEmpty: {
        msg: 'Email is required'
      },
      isEmail: {
        msg: 'Please provide a valid email address'
      }
    }
  },
  
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Password is required'
      },
      len: {
        args: [6, 100],
        msg: 'Password must be at least 6 characters'
      }
    }
  },
  
  role: {
    type: DataTypes.ENUM('student', 'admin'),
    defaultValue: 'student',
    allowNull: false
  },
  
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  }
}, {
  tableName: 'users',
  timestamps: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

// Instance method to check password
User.prototype.checkPassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

// Instance method to get safe user data (without password)
User.prototype.getSafeData = function() {
  const user = this.toJSON();
  delete user.password;
  return user;
};

module.exports = User;