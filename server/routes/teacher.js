const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getMyClasses,
  getMyStudents,
  getStudentDetails,
  createAssignment,
  gradeAssignment,
  provideFeedback,
  getClassProgress,
  getSubjectProgress,
  createAnnouncement,
  getPendingReviews,
  getClassCommunications,
  getStudentCommunications,
  getCommunicationById,
  sendClassCommunication
} = require('../controllers/teacherController');

router.use(protect);
const requireTeacher = authorize('teacher');
const requireTeacherOrAdmin = authorize('teacher', 'admin');
const requireStudentOrHigher = authorize('student', 'teacher', 'admin');
const requireAuthenticatedUser = authorize('student', 'parent', 'teacher', 'admin');

// Class management
router.get('/classes', requireTeacher, getMyClasses);
router.get('/students', requireTeacher, getMyStudents);
router.get('/students/:id', requireTeacher, getStudentDetails);
router.get('/progress/class/:classId', requireTeacher, getClassProgress);
router.get('/progress/subject/:subjectId', requireTeacher, getSubjectProgress);

// Assignment management
router.post('/assignments', requireTeacherOrAdmin, createAssignment);
router.post('/assignments/:id/grade', requireTeacherOrAdmin, gradeAssignment);
router.post('/feedback/:studentId', requireTeacherOrAdmin, provideFeedback);

// Announcements
router.post('/announcements', requireTeacher, createAnnouncement);

// Reviews
router.get('/pending-reviews', requireTeacher, getPendingReviews);

// Class communication
router.get('/communications', requireTeacherOrAdmin, getClassCommunications);
router.get('/communications/feed', requireStudentOrHigher, getStudentCommunications);
router.get('/communications/item/:id', requireAuthenticatedUser, getCommunicationById);
router.post('/communications', requireTeacherOrAdmin, sendClassCommunication);

module.exports = router;
