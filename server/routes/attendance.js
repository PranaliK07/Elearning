const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getGradeAttendance, getGradeAttendanceReport, markGradeAttendance, getMyAttendance, getAttendanceSummary } = require('../controllers/attendanceController');

router.use(protect);

router.get('/me', authorize('student'), getMyAttendance);
router.get('/summary', authorize('admin'), getAttendanceSummary);
router.get('/grade/:gradeId/report', authorize('teacher', 'admin'), getGradeAttendanceReport);
router.get('/grade/:gradeId', authorize('teacher', 'admin'), getGradeAttendance);
router.post('/grade/:gradeId/mark', authorize('teacher', 'admin'), markGradeAttendance);

module.exports = router;

