const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  type: {
    type: DataTypes.ENUM('achievement', 'quiz_result', 'comment', 'like', 'announcement', 'reminder', 'doubt'),
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  data: {
    type: DataTypes.TEXT,
    defaultValue: '{}',
    get() {
      const val = this.getDataValue('data');
      return val ? JSON.parse(val) : {};
    },
    set(val) {
      const stringVal = typeof val === 'string' ? val : JSON.stringify(val || {});
      this.setDataValue('data', stringVal);
    }
  },

  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  senderId: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
});

module.exports = Notification;