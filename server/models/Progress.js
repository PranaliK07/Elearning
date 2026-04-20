const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Progress = sequelize.define('Progress', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  watchTime: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Watch time in seconds'
  },
  lastWatched: {
    type: DataTypes.DATE
  },
  completed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  completedAt: {
    type: DataTypes.DATE
  },
  quizScore: {
    type: DataTypes.INTEGER
  },
  quizAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  quizPassed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  lastQuizAttempt: {
    type: DataTypes.DATE
  },
  notes: {
    type: DataTypes.TEXT
  },
  notesDownloaded: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  bookmarked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
});

module.exports = Progress;