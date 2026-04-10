const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  getGrades,
  getGrade,
  createGrade,
  updateGrade,
  deleteGrade,
  getGradeSubjects,
  getGradeStats
} = require('../controllers/gradeController');

// All routes require authentication
router.use(protect);

// Public grade routes (all authenticated users)
router.get('/', getGrades);
router.get('/:id', getGrade);
router.get('/:id/subjects', getGradeSubjects);
router.get('/:id/stats', getGradeStats);

// Admin only routes
router.post('/', authorize('admin', 'teacher'), validate.grade, validate.handleValidationErrors, createGrade);
router.put('/:id', authorize('admin', 'teacher'), validate.grade, validate.handleValidationErrors, updateGrade);
router.delete('/:id', authorize('admin', 'teacher'), deleteGrade);

module.exports = router;
