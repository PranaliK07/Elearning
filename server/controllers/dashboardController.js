const {
  User,
  Progress,
  Content,
  Achievement,
  Announcement,
  Assignment,
  Submission,
  Grade,
  Subject,
  Topic,
  WatchTime,
  Quiz
} = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');

const getStudentDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);

    const continueWatching = await Progress.findAll({
      where: { UserId: userId, completed: false },
      include: [{ model: Content, where: { isPublished: true }, required: false }],
      order: [['updatedAt', 'DESC']],
      limit: 5
    });

    const recentAchievements = await user.getAchievements({
      limit: 3,
      order: [['createdAt', 'DESC']]
    });

    const recommended = await Content.findAll({
      where: { isPublished: true },
      include: [{ model: Topic, include: [{ model: Subject, required: false }] }],
      limit: 6,
      order: [['views', 'DESC']]
    });

    const weekStart = moment().startOf('week').toDate();
    const weeklyProgress = await Progress.count({
      where: { UserId: userId, completed: true, updatedAt: { [Op.gte]: weekStart } }
    });

    const watchTime = await WatchTime.sum('minutes', {
      where: { UserId: userId, date: { [Op.gte]: weekStart } }
    });

    const announcements = await Announcement.findAll({
      where: {
        [Op.or]: [{ targetRole: 'all' }, { targetRole: req.user.role }],
        [Op.or]: [{ expiresAt: null }, { expiresAt: { [Op.gt]: new Date() } }]
      },
      order: [['pinned', 'DESC'], ['createdAt', 'DESC']],
      limit: 5
    });

    res.json({
      user: user.getPublicProfile(),
      stats: {
        points: user.points,
        streak: user.streak,
        weeklyProgress,
        watchTime: watchTime || 0,
        totalWatchTime: user.totalWatchTime
      },
      continueWatching,
      recentAchievements,
      recommended,
      announcements
    });
  } catch (error) {
    console.error('Get student dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getTeacherDashboard = async (req, res) => {
  try {
    const teacherId = req.user.id;

    const totalStudents = await User.count({ where: { role: 'student' } });
    const assignmentsCount = await Assignment.count({
      where: {
        [Op.or]: [{ teacherId }, { teacherId: null }]
      }
    });

    const recentSubmissions = await Submission.findAll({
      include: [
        { model: User, as: 'student', attributes: ['id', 'name', 'avatar'] },
        {
          model: Assignment,
          attributes: ['id', 'title', 'teacherId'],
          where: {
            [Op.or]: [{ teacherId }, { teacherId: null }]
          }
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    const students = await User.findAll({
      where: { role: 'student' },
      attributes: ['id', 'name', 'email', 'avatar', 'grade', 'updatedAt'],
      include: [{ model: Grade, attributes: ['id', 'name', 'level'] }],
      order: [['updatedAt', 'DESC']],
      limit: 50
    });

    const classes = await Grade.findAll({
      include: [{ model: Subject, include: [Topic] }],
      order: [['level', 'ASC']]
    });

    const stats = {
      totalStudents,
      activeClasses: classes.length,
      assignments: assignmentsCount,
      avgProgress: 0
    };

    res.json({ students, classes, stats, recentSubmissions });
  } catch (error) {
    console.error('Get teacher dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getAdminDashboard = async (req, res) => {
  try {
    const totalUsers = await User.count();
    const totalStudents = await User.count({ where: { role: 'student' } });
    const totalTeachers = await User.count({ where: { role: 'teacher' } });
    const totalContent = await Content.count();
    const totalQuizzes = await Quiz.count();

    const recentUsers = await User.findAll({
      attributes: ['id', 'name', 'email', 'role', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    const popularContent = await Content.findAll({
      order: [['views', 'DESC']],
      limit: 5
    });

    res.json({
      stats: { totalUsers, totalStudents, totalTeachers, totalContent, totalQuizzes },
      recentUsers,
      popularContent,
      systemHealth: {
        database: 'healthy',
        storage: 'good',
        lastBackup: null
      }
    });
  } catch (error) {
    console.error('Get admin dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getRecentActivity = async (req, res) => {
  try {
    const activities = await Progress.findAll({
      where: { UserId: req.user.id },
      include: [Content],
      order: [['updatedAt', 'DESC']],
      limit: 10
    });
    res.json(activities);
  } catch (error) {
    console.error('Get recent activity error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getContinueWatching = async (req, res) => {
  try {
    const continueWatching = await Progress.findAll({
      where: { UserId: req.user.id, completed: false },
      include: [Content],
      order: [['updatedAt', 'DESC']],
      limit: 5
    });
    res.json(continueWatching);
  } catch (error) {
    console.error('Get continue watching error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getRecommendedForYou = async (req, res) => {
  try {
    const recommended = await Content.findAll({
      where: { isPublished: true },
      include: [{ model: Topic, include: [Subject] }],
      limit: 6,
      order: [['views', 'DESC']]
    });
    res.json(recommended);
  } catch (error) {
    console.error('Get recommended error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.findAll({
      where: {
        [Op.or]: [{ targetRole: 'all' }, { targetRole: req.user.role }],
        [Op.or]: [{ expiresAt: null }, { expiresAt: { [Op.gt]: new Date() } }]
      },
      include: [{ model: User, as: 'author', attributes: ['id', 'name', 'avatar'] }],
      order: [['pinned', 'DESC'], ['createdAt', 'DESC']]
    });
    res.json(announcements);
  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getQuickStats = async (req, res) => {
  try {
    const stats = {
      points: req.user.points,
      streak: req.user.streak,
      completedLessons: await Progress.count({
        where: { UserId: req.user.id, completed: true }
      }),
      achievements: await req.user.countAchievements(),
      watchTime: req.user.totalWatchTime
    };
    res.json(stats);
  } catch (error) {
    console.error('Get quick stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getStudentDashboard,
  getTeacherDashboard,
  getAdminDashboard,
  getRecentActivity,
  getContinueWatching,
  getRecommendedForYou,
  getAnnouncements,
  getQuickStats
};
