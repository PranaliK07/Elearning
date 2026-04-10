const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const requireModuleAccess = require('../middleware/moduleAccess');
const {
  createFeedback,
  getStudentFeedback,
  getMyFeedback
} = require('../controllers/feedbackController');

router.use(protect);

router.get('/my', authorize('student'), requireModuleAccess('feedback'), getMyFeedback);
router.get('/student/:studentId', authorize('teacher', 'admin'), requireModuleAccess('feedback'), getStudentFeedback);
router.post('/', authorize('teacher', 'admin'), requireModuleAccess('feedback'), createFeedback);

module.exports = router;

