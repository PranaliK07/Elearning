const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Assignment = sequelize.define('Assignment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('active', 'draft', 'closed'),
    defaultValue: 'active'
  },
  attachmentUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  LessonId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Lessons',
      key: 'id'
    }
  }
});

module.exports = Assignment;
