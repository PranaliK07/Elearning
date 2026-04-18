const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getAchievements,
  getAchievement,
  getUserAchievements,
  checkAndAwardAchievements,
  getAchievementLeaderboard,
  createAchievement,
  updateAchievement,
  deleteAchievement,
  getDailyGoalProgress
} = require('../controllers/achievementController');


// All routes require authentication
router.use(protect);

// Achievement routes
router.get('/', getAchievements);
router.get('/user', getUserAchievements);
router.get('/leaderboard', getAchievementLeaderboard);
router.get('/daily-goal', getDailyGoalProgress);
router.get('/:id', getAchievement);

// System route for checking achievements
router.post('/check', checkAndAwardAchievements);

// Admin only routes
router.post('/', authorize('admin'), createAchievement);
router.put('/:id', authorize('admin'), updateAchievement);
router.delete('/:id', authorize('admin'), deleteAchievement);

module.exports = router;