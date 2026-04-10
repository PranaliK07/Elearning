const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [2, 100]
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('student', 'teacher', 'admin', 'parent'),
    defaultValue: 'student'
  },
  ParentId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  grade: {
    type: DataTypes.INTEGER,
    validate: {
      min: 1,
      max: 12
    }
  },
  avatar: {
    type: DataTypes.STRING,
    defaultValue: 'default-avatar.png'
  },
  bio: {
    type: DataTypes.TEXT
  },
  points: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  totalWatchTime: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  streak: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lastActive: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  emailVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  verificationToken: {
    type: DataTypes.STRING
  },
  resetPasswordToken: {
    type: DataTypes.STRING
  },
  resetPasswordExpire: {
    type: DataTypes.DATE
  },
  parentPhone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  parentEmail: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  trialStartsAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  trialEndsAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    }
  }
});

// Instance methods
User.prototype.validatePassword = async function(password) {
  return bcrypt.compare(password, this.password);
};

User.prototype.getPublicProfile = function() {
  return {
    id: this.id,
    name: this.name,
    email: this.email,
    role: this.role,
    grade: this.grade,
    ParentId: this.ParentId,
    avatar: this.avatar,
    bio: this.bio,
    points: this.points,
    totalWatchTime: this.totalWatchTime,
    streak: this.streak,
    lastActive: this.lastActive,
    parentPhone: this.parentPhone,
    parentEmail: this.parentEmail,
    isDeleted: this.isDeleted,
    trialStartsAt: this.trialStartsAt,
    trialEndsAt: this.trialEndsAt
  };
};

module.exports = User;
