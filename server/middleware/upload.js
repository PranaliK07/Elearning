const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

// Create upload directories if they don't exist
const createDirectories = () => {
  const dirs = [
    './uploads',
    './uploads/videos',
    './uploads/thumbnails',
    './uploads/avatars',
    './uploads/badges',
    './uploads/assignments',
    './uploads/reading',
    './uploads/temp'
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

createDirectories();

// Video storage
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/videos/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `video-${uniqueSuffix}${ext}`);
  }
});

// Image storage (thumbnails, avatars, badges)
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const type = req.body.type || file.fieldname || 'general';
    if (type === 'avatar' || file.fieldname === 'avatar') {
      cb(null, './uploads/avatars/');
    } else if (type === 'badge' || file.fieldname === 'badge') {
      cb(null, './uploads/badges/');
    } else {
      cb(null, './uploads/thumbnails/');
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const type = req.body.type || file.fieldname || 'img';
    cb(null, `${type}-${uniqueSuffix}${ext}`);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedVideoTypes = (process.env.ALLOWED_VIDEO_TYPES || 'video/mp4,video/mpeg,video/quicktime').split(',');
  const allowedImageTypes = (process.env.ALLOWED_IMAGE_TYPES || 'image/jpeg,image/png,image/gif,image/webp').split(',');
  const allowedDocumentTypes = (process.env.ALLOWED_DOCUMENT_TYPES || 'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/png,image/jpeg,image/jpg').split(',');

  if (file.fieldname === 'video') {
    if (allowedVideoTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid video format. Only MP4, MPEG, and QuickTime are allowed.'), false);
    }
  } else if (['thumbnail', 'avatar', 'badge'].includes(file.fieldname)) {
    if (allowedImageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid image format. Only JPEG, PNG, GIF, and WebP are allowed.'), false);
    }
  } else if (file.fieldname === 'attachment' || file.fieldname === 'reading') {
    if (allowedDocumentTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid document format. Upload PDF, DOC, DOCX, etc.'), false);
    }
  } else {
    cb(new Error('Unexpected file field'), false);
  }
};

// Multer instances
const uploadVideo = multer({
  storage: videoStorage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 104857600 },
  fileFilter: fileFilter
});

const uploadImage = multer({
  storage: imageStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: fileFilter
});

const uploadAvatar = multer({
  storage: imageStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: fileFilter
});

const assignmentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/assignments/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname) || '';
    cb(null, `assignment-${uniqueSuffix}${ext}`);
  }
});

const uploadAssignment = multer({
  storage: assignmentStorage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB cap for docs
  fileFilter: fileFilter
});

const readingStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/reading/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname) || '';
    cb(null, `reading-${uniqueSuffix}${ext}`);
  }
});

const uploadReading = multer({
  storage: readingStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: fileFilter
});

const combinedStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'video') {
      cb(null, './uploads/videos/');
    } else if (file.fieldname === 'reading') {
      cb(null, './uploads/reading/');
    } else {
      cb(null, './uploads/thumbnails/');
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

const uploadMultiple = multer({
  storage: combinedStorage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 104857600 },
  fileFilter: fileFilter
}).fields([
  { name: 'video', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 },
  { name: 'reading', maxCount: 1 }
]);

// Image optimization middleware
const optimizeImage = async (req, res, next) => {
  if (!req.file) return next();

  try {
    const filePath = req.file.path;
    const optimizedPath = filePath.replace(/(\.[^.]+)$/, '-optimized$1');

    const ext = path.extname(filePath).toLowerCase();
    const pipeline = sharp(filePath).resize(800, 600, { fit: 'inside', withoutEnlargement: true });

    if (ext === '.png') {
      await pipeline.png({ quality: 80 }).toFile(optimizedPath);
    } else if (ext === '.webp') {
      await pipeline.webp({ quality: 80 }).toFile(optimizedPath);
    } else {
      await pipeline.jpeg({ quality: 80 }).toFile(optimizedPath);
    }

    // Replace original with optimized
    if (fs.existsSync(optimizedPath)) {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      fs.renameSync(optimizedPath, filePath);
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Error handler for multer
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large' });
    }
    return res.status(400).json({ message: err.message });
  }
  if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
};

module.exports = {
  uploadVideo,
  uploadImage,
  uploadAvatar,
  uploadAssignment,
  uploadReading,
  uploadMultiple,
  optimizeImage,
  handleUploadError
};
