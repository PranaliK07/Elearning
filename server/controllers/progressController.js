const { Progress, Content, User, WatchTime } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');

const getProgress = async (req, res) => {
  try {
    const progress = await Progress.findAll({
      where: { UserId: req.user.id },
      include: [{
        model: Content,
        include: ['Topic']
      }],
      order: [['updatedAt', 'DESC']]
    });

    res.json(progress);
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateProgress = async (req, res) => {
  try {
    const { contentId, watchTime, completed, quizScore, notesDownloaded } = req.body;
    const userId = req.user.id;

    let progress = await Progress.findOne({
      where: {
        UserId: userId,
        ContentId: contentId
      }
    });

    if (progress) {
      // Update existing progress
      if (watchTime !== undefined) progress.watchTime += watchTime || 0;
      progress.lastWatched = new Date();
      
      if (completed !== undefined) {
        progress.completed = completed;
        progress.completedAt = completed ? new Date() : null;
      }
      
      if (quizScore !== undefined) {
        progress.quizScore = quizScore;
        progress.quizAttempts += 1;
      }

      if (notesDownloaded !== undefined) {
        progress.notesDownloaded = notesDownloaded;
        // If notes are downloaded, we can mark the content as partially completed or fully completed depending on logic
        // For achievement purposes, we just need notesDownloaded to be true
        if (notesDownloaded) progress.completed = true; 
      }
      
      await progress.save();
    } else {
      // Create new progress
      progress = await Progress.create({
        UserId: userId,
        ContentId: contentId,
        watchTime: watchTime || 0,
        lastWatched: new Date(),
        completed: completed || notesDownloaded || false,
        completedAt: (completed || notesDownloaded) ? new Date() : null,
        quizScore: quizScore || null,
        notesDownloaded: notesDownloaded || false
      });
    }

    // Record watch time for analytics
    if (watchTime) {
      await WatchTime.create({
        UserId: userId,
        ContentId: contentId,
        minutes: Math.ceil(watchTime / 60),
        date: new Date()
      });

      // Update user total watch time
      await User.increment('totalWatchTime', {
        by: watchTime,
        where: { id: userId }
      });
    }

    // Check for achievements (you can implement this)
    // await checkAchievements(userId);

    res.json(progress);
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getWatchTimeStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);

    // Get last 30 days watch time
    const thirtyDaysAgo = moment().subtract(30, 'days').toDate();

    const watchTimes = await WatchTime.findAll({
      where: {
        UserId: userId,
        date: { [Op.gte]: thirtyDaysAgo }
      },
      order: [['date', 'ASC']]
    });

    // Group by date
    const dailyStats = {};
    watchTimes.forEach(wt => {
      const date = moment(wt.date).format('YYYY-MM-DD');
      dailyStats[date] = (dailyStats[date] || 0) + wt.minutes;
    });

    // Format for chart
    const chartData = Object.entries(dailyStats).map(([date, minutes]) => ({
      date,
      minutes
    }));

    res.json({
      totalWatchTime: user.totalWatchTime,
      dailyStats: chartData,
      averagePerDay: chartData.length ? 
        chartData.reduce((sum, d) => sum + d.minutes, 0) / chartData.length : 0
    });
  } catch (error) {
    console.error('Get watch time stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getSubjectProgress = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const userId = req.user.id;

    // Get total number of lessons/content for this subject
    const totalCount = await Content.count({
      where: { 
        SubjectId: subjectId,
        isPublished: true
      }
    });

    const progressRecords = await Progress.findAll({
      where: { UserId: userId },
      include: [{
        model: Content,
        where: { 
          SubjectId: subjectId,
          isPublished: true
        },
        required: true
      }]
    });

    const completed = progressRecords.filter(p => p.completed).length;
    const percentage = totalCount > 0 ? Math.round((completed / totalCount) * 100) : 0;

    res.json({
      total: totalCount,
      completed,
      percentage,
      progress: progressRecords
    });
  } catch (error) {
    console.error('Get subject progress error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getGradeProgress = async (req, res) => {
  try {
    const { gradeId } = req.params;
    const userId = req.user.id;

    // Get total number of lessons/content for this grade
    const totalCount = await Content.count({
      where: { 
        GradeId: gradeId,
        isPublished: true
      }
    });

    const progressRecords = await Progress.findAll({
      where: { UserId: userId },
      include: [{
        model: Content,
        where: { 
          GradeId: gradeId,
          isPublished: true
        },
        required: true
      }]
    });

    const completed = progressRecords.filter(p => p.completed).length;
    const percentage = totalCount > 0 ? Math.round((completed / totalCount) * 100) : 0;

    res.json({
      total: totalCount,
      completed,
      percentage,
      progress: progressRecords
    });
  } catch (error) {
    console.error('Get grade progress error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getDailyStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = moment().startOf('day').toDate();

    const todayProgress = await WatchTime.sum('minutes', {
      where: {
        UserId: userId,
        date: { [Op.gte]: today }
      }
    });

    const weekProgress = await WatchTime.findAll({
      where: {
        UserId: userId,
        date: { [Op.gte]: moment().subtract(7, 'days').toDate() }
      },
      group: ['date'],
      attributes: [
        [sequelize.fn('DATE', sequelize.col('date')), 'date'],
        [sequelize.fn('SUM', sequelize.col('minutes')), 'minutes']
      ]
    });

    res.json({
      today: todayProgress || 0,
      week: weekProgress
    });
  } catch (error) {
    console.error('Get daily stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getWeeklyReport = async (req, res) => {
  try {
    const userId = req.user.id;
    const startOfWeek = moment().startOf('week').toDate();
    const endOfWeek = moment().endOf('week').toDate();

    const weeklyProgress = await Progress.findAll({
      where: {
        UserId: userId,
        updatedAt: { [Op.between]: [startOfWeek, endOfWeek] }
      },
      include: [Content]
    });

    const watchTime = await WatchTime.sum('minutes', {
      where: {
        UserId: userId,
        date: { [Op.between]: [startOfWeek, endOfWeek] }
      }
    });

    const completedLessons = weeklyProgress.filter(p => p.completed).length;
    const quizScores = weeklyProgress.filter(p => p.quizScore).map(p => p.quizScore);
    const avgQuizScore = quizScores.length ? 
      quizScores.reduce((a, b) => a + b, 0) / quizScores.length : 0;

    res.json({
      weekStart: startOfWeek,
      weekEnd: endOfWeek,
      totalWatchTime: watchTime || 0,
      completedLessons,
      totalLessons: weeklyProgress.length,
      avgQuizScore,
      progress: weeklyProgress
    });
  } catch (error) {
    console.error('Get weekly report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getMonthlyReport = async (req, res) => {
  try {
    const userId = req.user.id;
    const startOfMonth = moment().startOf('month').toDate();
    const endOfMonth = moment().endOf('month').toDate();

    const monthlyProgress = await Progress.findAll({
      where: {
        UserId: userId,
        updatedAt: { [Op.between]: [startOfMonth, endOfMonth] }
      },
      include: [Content]
    });

    const watchTime = await WatchTime.sum('minutes', {
      where: {
        UserId: userId,
        date: { [Op.between]: [startOfMonth, endOfMonth] }
      }
    });

    const completedLessons = monthlyProgress.filter(p => p.completed).length;
    const achievements = await req.user.countAchievements();

    res.json({
      month: moment().format('MMMM YYYY'),
      totalWatchTime: watchTime || 0,
      completedLessons,
      achievements,
      totalPoints: req.user.points
    });
  } catch (error) {
    console.error('Get monthly report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getAchievementProgress = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: ['Achievements']
    });

    // You can define achievement criteria here
    const achievements = [
      {
        id: 'watch_10',
        name: 'First Steps',
        description: 'Watch 10 minutes of content',
        current: user.totalWatchTime,
        target: 10,
        percentage: Math.min(100, (user.totalWatchTime / 10) * 100)
      },
      {
        id: 'complete_5',
        name: 'Quick Learner',
        description: 'Complete 5 lessons',
        current: await Progress.count({ where: { UserId: req.user.id, completed: true } }),
        target: 5,
        percentage: 0
      }
    ];

    achievements.forEach(a => {
      a.percentage = Math.min(100, (a.current / a.target) * 100);
    });

    res.json(achievements);
  } catch (error) {
    console.error('Get achievement progress error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getProgress,
  updateProgress,
  getWatchTimeStats,
  getSubjectProgress,
  getGradeProgress,
  getDailyStats,
  getWeeklyReport,
  getMonthlyReport,
  getAchievementProgress
};