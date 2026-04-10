const { body, validationResult } = require('express-validator');

const validate = {
  // Registration validation
  register: [
    body('name')
      .notEmpty().withMessage('Name is required')
      .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
    body('email')
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Please provide a valid email')
      .normalizeEmail(),
    body('password')
      .notEmpty().withMessage('Password is required')
      .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role')
      .optional()
      .isIn(['student', 'teacher', 'admin']).withMessage('Role must be either student, teacher, or admin'),
    body('grade')
      .optional()
    ,
    body('parentPhone')
      .if(body('role').equals('student'))
      .notEmpty().withMessage('Parent phone is required for students')
      .isLength({ min: 7, max: 20 }).withMessage('Parent phone must be between 7 and 20 characters')
    ,
    body('parentEmail')
      .if(body('role').equals('student'))
      .notEmpty().withMessage('Parent email is required for students')
      .isEmail().withMessage('Parent email must be valid')
  ],

  // Login validation
  login: [
    body('email')
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Please provide a valid email'),
    body('password')
      .notEmpty().withMessage('Password is required')
  ],

  // Content validation
  content: [
    body('title')
      .notEmpty().withMessage('Title is required')
      .isLength({ max: 200 }).withMessage('Title too long'),
    body('type')
      .notEmpty().withMessage('Content type is required')
      .isIn(['video', 'reading', 'quiz', 'activity']),
    body('description')
      .optional()
      .isLength({ max: 1000 }).withMessage('Description too long'),
    body('duration')
      .optional()
      .isInt({ min: 0 }).withMessage('Duration must be a positive number')
  ],

  // Quiz validation
  quiz: [
    body('title')
      .notEmpty().withMessage('Quiz title is required'),
    body('questions')
      .isArray({ min: 1 }).withMessage('At least one question is required'),
    body('timeLimit')
      .optional()
      .isInt({ min: 1, max: 180 }).withMessage('Time limit must be between 1 and 180 minutes'),
    body('passingScore')
      .optional()
      .isInt({ min: 0, max: 100 }).withMessage('Passing score must be between 0 and 100')
  ],

  // Topic validation
  topic: [
    body('name')
      .notEmpty().withMessage('Topic name is required'),
    body('subjectId')
      .notEmpty().withMessage('Subject ID is required')
      .isInt().withMessage('Subject ID must be a number')
  ],


  // Profile update validation
  profileUpdate: [
    body('name')
      .optional()
      .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
    body('grade')
      .optional({ nullable: true, checkFalsy: true })
      .isInt({ min: 1, max: 12 }).withMessage('Grade must be between 1 and 12'),
    body('bio')
      .optional()
      .isLength({ max: 500 }).withMessage('Bio too long')
    ,
    body('parentPhone')
      .optional()
      .isLength({ min: 7, max: 20 }).withMessage('Parent phone must be between 7 and 20 characters')
    ,
    body('parentEmail')
      .optional()
      .isEmail().withMessage('Parent email must be valid')
  ],

  // Grade validation
  grade: [
    body('level')
      .notEmpty().withMessage('Grade level is required'),
    body('name')
      .notEmpty().withMessage('Grade name is required')
  ],

  // Subject validation
  subject: [
    body('name')
      .notEmpty().withMessage('Subject name is required'),
    body('gradeId')
      .notEmpty().withMessage('Grade ID is required')
      .isInt().withMessage('Grade ID must be a number')
  ],

  // Comment validation
  comment: [
    body('text')
      .notEmpty().withMessage('Comment text is required')
      .isLength({ max: 500 }).withMessage('Comment too long')
  ],

  // Validation result handler
  handleValidationErrors: (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const firstError = errors.array()[0].msg;
      return res.status(400).json({
        status: 'error',
        message: firstError,
        errors: errors.array().map(err => ({
          field: err.param,
          message: err.msg
        }))
      });
    }
    next();
  }

};

module.exports = validate;
