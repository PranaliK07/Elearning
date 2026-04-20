const { Feedback, User } = require('../models');
const { createNotification } = require('../utils/notifications');

const parseRating = (value) => {
  const rating = Number(value);
  if (!Number.isFinite(rating)) return null;
  const intRating = Math.trunc(rating);
  if (intRating < 1 || intRating > 5) return null;
  return intRating;
};

const createFeedback = async (req, res) => {
  try {
    const { studentId, rating, comment } = req.body || {};

    const parsedStudentId = Number(studentId);
    if (!Number.isFinite(parsedStudentId)) {
      return res.status(400).json({ message: 'Valid studentId is required' });
    }

    const parsedRating = parseRating(rating);
    if (!parsedRating) {
      return res.status(400).json({ message: 'Rating must be an integer between 1 and 5' });
    }

    const student = await User.findByPk(parsedStudentId, { attributes: ['id', 'role', 'isActive'] });
    if (!student || student.role !== 'student' || !student.isActive) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const feedback = await Feedback.create({
      studentId: student.id,
      authorId: req.user.id,
      rating: parsedRating,
      comment: typeof comment === 'string' && comment.trim() ? comment.trim() : null
    });

    // Notify the student
    try {
      await createNotification(
        student.id,
        'achievement', // Using achievement as a placeholder for feedback recognition
        'New Platform Feedback! ⭐',
        `A teacher has submitted feedback for you. Rating: ${parsedRating}/5. Read it now!`,
        { feedbackId: feedback.id }
      );
    } catch (notifErr) {
      console.error('Feedback notification error:', notifErr);
    }

    return res.status(201).json({ success: true, feedback });
  } catch (error) {
    console.error('Create feedback error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

const getStudentFeedback = async (req, res) => {
  try {
    const studentId = Number(req.params.studentId);
    if (!Number.isFinite(studentId)) {
      return res.status(400).json({ message: 'Valid studentId is required' });
    }

    const student = await User.findByPk(studentId, { attributes: ['id', 'role', 'isActive'] });
    if (!student || student.role !== 'student' || !student.isActive) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const feedback = await Feedback.findAll({
      where: { studentId },
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'name', 'email', 'avatar', 'role'],
        required: false
      }],
      order: [['createdAt', 'DESC']]
    });

    return res.json({ studentId, feedback });
  } catch (error) {
    console.error('Get student feedback error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

const getMyFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findAll({
      where: { studentId: req.user.id },
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'name', 'email', 'avatar', 'role'],
        required: false
      }],
      order: [['createdAt', 'DESC']]
    });

    return res.json({ studentId: req.user.id, feedback });
  } catch (error) {
    console.error('Get my feedback error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createFeedback,
  getStudentFeedback,
  getMyFeedback
};

