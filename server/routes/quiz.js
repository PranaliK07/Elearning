const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  getQuizzes,
  getQuiz,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  startQuiz,
  submitQuiz,
  getQuizResults,
  getQuizLeaderboard,
  getQuizStats,
  getAvailableQuizzes
} = require('../controllers/quizController');

// Public quiz routes
router.get('/available', getAvailableQuizzes);
router.get('/', getQuizzes);
router.get('/:id', getQuiz);
router.get('/:id/questions', getQuiz);
router.get('/:id/leaderboard', getQuizLeaderboard);
router.get('/:id/stats', getQuizStats);

// Protected / user-specific quiz routes
router.get('/:id/results', protect, getQuizResults);
router.post('/:id/start', protect, startQuiz);
router.post('/:id/submit', protect, submitQuiz);

// Teacher and Admin routes
router.post('/', protect, authorize('teacher', 'admin'), validate.quiz, validate.handleValidationErrors, createQuiz);
router.put('/:id', protect, authorize('teacher', 'admin'), validate.quiz, validate.handleValidationErrors, updateQuiz);
router.delete('/:id', protect, authorize('teacher', 'admin'), deleteQuiz);

module.exports = router;
