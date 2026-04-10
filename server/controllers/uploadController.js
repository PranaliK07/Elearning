const fs = require('fs');
const path = require('path');
const { Content, User } = require('../models');

const uploadVideoFile = async (req, res) => {
  try {
    // Handle multiple files if present
    if (req.files) {
      const response = { success: true, message: 'Files uploaded successfully' };

      if (req.files.video && req.files.video[0]) {
        response.videoUrl = `/uploads/videos/${req.files.video[0].filename}`;
        response.videoFilename = req.files.video[0].filename;
      }

      if (req.files.thumbnail && req.files.thumbnail[0]) {
        response.thumbnailUrl = `/uploads/thumbnails/${req.files.thumbnail[0].filename}`;
        response.thumbnailFilename = req.files.thumbnail[0].filename;
      }

      if (req.files.reading && req.files.reading[0]) {
        response.readingUrl = `/uploads/reading/${req.files.reading[0].filename}`;
        response.readingFilename = req.files.reading[0].filename;
      }

      return res.json(response);
    }

    // Handle single file
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const fileUrl = `/uploads/videos/${req.file.filename}`;

    res.json({
      success: true,
      fileUrl,
      filename: req.file.filename,
      message: 'Video uploaded successfully'
    });
  } catch (error) {
    console.error('Upload video error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


const uploadThumbnail = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const fileUrl = `/uploads/thumbnails/${req.file.filename}`;

    res.json({
      success: true,
      fileUrl,
      filename: req.file.filename,
      message: 'Thumbnail uploaded successfully'
    });
  } catch (error) {
    console.error('Upload thumbnail error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const uploadUserAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const user = await User.findByPk(req.user.id);

    // Delete old avatar if not default
    if (user.avatar && user.avatar !== 'default-avatar.png') {
      const oldPath = path.join(__dirname, '../uploads/avatars/', user.avatar);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    user.avatar = req.file.filename;
    await user.save();

    res.json({
      success: true,
      avatar: `/uploads/avatars/${req.file.filename}`,
      message: 'Avatar uploaded successfully'
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const uploadBadgeImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const fileUrl = `/uploads/badges/${req.file.filename}`;

    res.json({
      success: true,
      fileUrl,
      filename: req.file.filename,
      message: 'Badge image uploaded successfully'
    });
  } catch (error) {
    console.error('Upload badge error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const uploadAssignmentFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const fileUrl = `/uploads/assignments/${req.file.filename}`;

    res.json({
      success: true,
      fileUrl,
      filename: req.file.filename,
      message: 'Assignment file uploaded successfully'
    });
  } catch (error) {
    console.error('Upload assignment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const uploadReadingFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const fileUrl = `/uploads/reading/${req.file.filename}`;

    res.json({
      success: true,
      fileUrl,
      filename: req.file.filename,
      message: 'Reading material uploaded successfully'
    });
  } catch (error) {
    console.error('Upload reading material error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteFile = async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../uploads/', filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ success: true, message: 'File deleted successfully' });
    } else {
      res.status(404).json({ message: 'File not found' });
    }
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  uploadVideoFile,
  uploadThumbnail,
  uploadUserAvatar,
  uploadBadgeImage,
  uploadAssignmentFile,
  uploadReadingFile,
  deleteFile
};
