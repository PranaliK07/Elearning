const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Attendance = sequelize.define('Attendance', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('present', 'absent'),
    allowNull: false
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  gradeId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  markedById: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  note: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  indexes: [
    { unique: true, fields: ['date', 'studentId'] },
    { fields: ['gradeId', 'date'] }
  ]
});

module.exports = Attendance;

