const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Grade = sequelize.define('Grade', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  level: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 12
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  thumbnail: {
    type: DataTypes.STRING
  },
  icon: {
    type: DataTypes.STRING,
    defaultValue: '📚'
  },
  color: {
    type: DataTypes.STRING,
    defaultValue: '#3f51b5'
  },
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
});

module.exports = Grade;
