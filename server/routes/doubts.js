const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const dc = require('../controllers/doubtController');

// All routes require authentication
router.use(protect);

// Admin routes
router.get('/all', authorize('admin'), dc.getAllDoubts);

// Student routes
router.get('/teachers', dc.getTeachers);
router.post('/', authorize('student'), dc.submitDoubt);
router.get('/student', authorize('student'), dc.getStudentDoubts);

// Teacher routes
router.get('/teacher', authorize('teacher'), dc.getTeacherDoubts);
router.put('/:id/respond', authorize('teacher'), dc.respondToDoubt);

module.exports = router;
