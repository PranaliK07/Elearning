const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimiters = require('./middleware/rateLimiters');
require('dotenv').config();

const sequelize = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

// Import Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const gradeRoutes = require('./routes/grades');
const subjectRoutes = require('./routes/subjects');
const topicRoutes = require('./routes/topics');
const contentRoutes = require('./routes/content');
const quizRoutes = require('./routes/quiz');
const progressRoutes = require('./routes/progress');
const achievementRoutes = require('./routes/achievements');
const dashboardRoutes = require('./routes/dashboard');
const uploadRoutes = require('./routes/upload');
const adminRoutes = require('./routes/admin');
const teacherRoutes = require('./routes/teacher');
const searchRoutes = require('./routes/search');
const notificationRoutes = require('./routes/notifications');
const assignmentRoutes = require('./routes/assignments');
const reportsRoutes = require('./routes/reports');
const contactRoutes = require('./routes/contact');
const feedbackRoutes = require('./routes/feedback');
const attendanceRoutes = require('./routes/attendance');
const doubtRoutes = require('./routes/doubts');

const app = express();

// Emergency Diagnostics
const fs = require('fs');
app.use((req, res, next) => {
  res.on('finish', () => {
    if (res.statusCode >= 500) {
      const logEntry = `\n--- 500 ERROR ---\nTime: ${new Date().toISOString()}\nPath: ${req.originalUrl}\nMethod: ${req.method}\nIP: ${req.ip}\n`;
      fs.appendFileSync(path.join(__dirname, 'emergency_log.txt'), logEntry);
    }
  });
  next();
});

// Security Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS Configuration
app.use(cors({
  origin: [process.env.CLIENT_URL, 'http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Rate Limiting (enable in production)
if (process.env.NODE_ENV === 'production') {
  app.use('/api/auth', rateLimiters.auth);
  app.use('/api/upload', rateLimiters.upload);
  app.use('/api/', (req, res, next) => {
    if (req.path.startsWith('/auth') || req.path.startsWith('/upload')) {
      return next();
    }
    return rateLimiters.api(req, res, next);
  });
}

// Body Parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static Files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request Logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// API Routes
app.get('/api/test-error', (req, res, next) => {
  next(new Error('Test 500 error logging works!'));
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/topics', topicRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/doubts', doubtRoutes);


// Use routes


// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Error Handler
app.use(errorHandler);

// 404 Handler
app.all('*', (req, res, next) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
});


// Database Connection & Server Start
const PORT = process.env.PORT || 5000;

sequelize.authenticate()
  .then(() => {
    logger.info('✅ Database connected successfully');
    logger.info(`🔍 Database Host: ${process.env.DB_HOST}`);
    logger.info(`🔍 Database Name: ${process.env.DB_NAME}`);
    sequelize.sync({ alter: true })
      .then(() => {
        logger.info('✅ Database synced successfully (alter: true)');
      })
      .catch((err) => {
        logger.error('❌ Database sync FAILED:', err);
        // We don't exit here if we can still run, but we must log it
      });
    
    app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📝 Environment: ${process.env.NODE_ENV}`);
      logger.info(`🔗 API: ${process.env.API_URL}`);
    });
  })
  .catch(err => {
    logger.error('❌ Unable to connect to database:', err);
    process.exit(1);
  });

// Graceful Shutdown
process.on('SIGTERM', () => {
  logger.info('👋 SIGTERM received, shutting down gracefully');
  sequelize.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('👋 SIGINT received, shutting down gracefully');
  sequelize.close();
  process.exit(0);
});

module.exports = app;
