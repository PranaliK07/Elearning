const { Notification } = require('../models');

/**
 * Create a notification for a user
 * @param {number} userId - ID of the user to notify
 * @param {string} type - Type of notification (e.g., 'achievement', 'doubt', 'content')
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {object} data - Additional data (optional)
 */
const createNotification = async (userId, type, title, message, data = {}, senderId = null) => {
  try {
    const notificationUserId = Number(userId);
    const notificationSenderId = senderId ? Number(senderId) : null;

    if (!notificationUserId || isNaN(notificationUserId)) {
      console.error('[Notification Service] Cannot create notification: Invalid userId provided', userId);
      return null;
    }

    const notification = await Notification.create({
      userId: notificationUserId,
      senderId: notificationSenderId,
      type,
      title,
      message,
      data
    });
    console.log(`[Notification Service] Success! Notification ID: ${notification.id} for user ${notificationUserId} from ${notificationSenderId || 'System'}`);
    return notification;
  } catch (error) {
    console.error('[Notification Service] Error creating notification:', error);
    return null;
  }
};

/**
 * Send notification to multiple users (e.g., all students in a grade)
 * @param {Array} userIds - Array of user IDs
 * @param {string} type 
 * @param {string} title 
 * @param {string} message 
 * @param {object} data 
 */
const notifyMultipleUsers = async (userIds, type, title, message, data = {}) => {
  try {
    const stringifiedData = JSON.stringify(data);
    const notifications = userIds.map(id => ({
      userId: id,
      type,
      title,
      message,
      data: stringifiedData
    }));
    await Notification.bulkCreate(notifications);
    console.log(`Bulk notifications created for ${userIds.length} users: ${title}`);
  } catch (error) {
    console.error('Notify multiple users error:', error);
  }
};

module.exports = {
  createNotification,
  notifyMultipleUsers
};
