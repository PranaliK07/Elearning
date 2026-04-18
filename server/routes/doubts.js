const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  submitDoubt,
  getStudentDoubts,
  getTeacherDoubts,
  respondToDoubt,
  getTeachers
} = require('../controllers/doubtController');

router.use(protect);

router.get('/teachers', getTeachers);
router.post('/', authorize('student'), submitDoubt);
router.get('/student', authorize('student'), getStudentDoubts);
router.get('/teacher', authorize('teacher'), getTeacherDoubts);
router.put('/:id/respond', authorize('teacher'), respondToDoubt);

module.exports = router;
