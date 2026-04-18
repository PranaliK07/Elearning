const { Notification } = require('../models');
const { Op } = require('sequelize');

const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const notifications = await Notification.findAndCountAll({
      where: {
        userId: req.user.id,
        isDeleted: false
      },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (page - 1) * limit
    });

    res.json({
      notifications: notifications.rows,
      total: notifications.count,
      page: parseInt(page),
      totalPages: Math.ceil(notifications.count / limit),
      unreadCount: await Notification.count({
        where: {
          userId: req.user.id,
          isRead: false,
          isDeleted: false
        }
      })
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    notification.isRead = true;
    await notification.save();

    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    await Notification.update(
      { isRead: true },
      {
        where: {
          userId: req.user.id,
          isRead: false
        }
      }
    );

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    notification.isDeleted = true;
    await notification.save();

    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not identified' });
    }

    const count = await Notification.count({
      where: {
        userId: userId,
        isRead: false,
        isDeleted: false
      }
    });

    res.json({ count });
  } catch (error) {
    console.error('Get unread count error details:', {
      userId: req.user?.id,
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      message: 'Server error loading unread count',
      error: error.message 
    });
  }
};

const getNotificationSettings = async (req, res) => {
  try {
    // Get user's notification preferences
    const settings = {
      email: true,
      push: true,
      inApp: true,
      types: {
        achievement: true,
        quiz: true,
        comment: true,
        like: true,
        announcement: true
      }
    };

    res.json(settings);
  } catch (error) {
    console.error('Get notification settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateNotificationSettings = async (req, res) => {
  try {
    const { email, push, inApp, types } = req.body;

    // Save settings to user preferences
    // You can store this in User model or a separate Settings model

    res.json({
      success: true,
      message: 'Notification settings updated'
    });
  } catch (error) {
    console.error('Update notification settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper function to create notification (used internally)
const createNotification = async (userId, type, title, message, data = {}) => {
  try {
    await Notification.create({
      userId,
      type,
      title,
      message,
      data
    });
  } catch (error) {
    console.error('Create notification error:', error);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
  getNotificationSettings,
  updateNotificationSettings,
  createNotification
};