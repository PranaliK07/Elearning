const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { 
  uploadVideo, 
  uploadImage, 
  uploadAvatar,
  uploadAssignment,
  uploadReading,
  uploadMultiple,
  optimizeImage,
  handleUploadError 
} = require('../middleware/upload');
const {
  uploadVideoFile,
  uploadThumbnail,
  uploadUserAvatar,
  uploadBadgeImage,
  uploadAssignmentFile,
  uploadReadingFile,
  deleteFile
} = require('../controllers/uploadController');

// All routes require authentication
router.use(protect);

// Video upload (teachers and admins)
router.post('/video',
  authorize('teacher', 'admin'),
  uploadVideo.single('video'),
  handleUploadError,
  uploadVideoFile
);

// Thumbnail upload
router.post('/thumbnail',
  authorize('teacher', 'admin'),
  uploadImage.single('thumbnail'),
  optimizeImage,
  handleUploadError,
  uploadThumbnail
);

// Multiple file upload (video + thumbnail)
router.post('/content',
  authorize('teacher', 'admin'),
  uploadMultiple,
  handleUploadError,
  uploadVideoFile
);

// Avatar upload
router.post('/avatar',
  uploadAvatar.single('avatar'),
  optimizeImage,
  handleUploadError,
  uploadUserAvatar
);

// Badge upload (admin only)
router.post('/badge',
  authorize('admin'),
  uploadImage.single('badge'),
  optimizeImage,
  handleUploadError,
  uploadBadgeImage
);

// Assignment/doc upload (teachers, students, admins)
router.post('/assignment',
  authorize('teacher', 'student', 'admin'),
  uploadAssignment.single('attachment'),
  handleUploadError,
  uploadAssignmentFile
);

// Reading material upload (teachers and admins)
router.post('/reading',
  authorize('teacher', 'admin'),
  uploadReading.single('reading'),
  handleUploadError,
  uploadReadingFile
);

// Delete file
router.delete('/:filename',
  authorize('teacher', 'admin'),
  deleteFile
);

module.exports = router;
