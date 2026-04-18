const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Quiz = sequelize.define('Quiz', {
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
    type: DataTypes.TEXT
  },
  questions: {
    type: DataTypes.TEXT,
    allowNull: false,
    get() {
      const rawValue = this.getDataValue('questions');
      if (!rawValue) return [];
      try {
        // Handle potential double-encoding safely
        let data = rawValue;
        while (typeof data === 'string') {
          const parsed = JSON.parse(data);
          if (parsed === data) break;
          data = parsed;
        }
        return data;
      } catch (e) {
        return [];
      }
    },
    set(value) {
      this.setDataValue('questions', typeof value === 'string' ? value : JSON.stringify(value));
    }
  },
  timeLimit: {
    type: DataTypes.INTEGER,
    defaultValue: 10,
    comment: 'Time limit in minutes'
  },
  passingScore: {
    type: DataTypes.INTEGER,
    defaultValue: 70,
    validate: {
      min: 0,
      max: 100
    }
  },
  maxAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 2
  },
  attempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  avgScore: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  isPublished: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  createdBy: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Users',
      key: 'id'
    }
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

module.exports = Quiz;
