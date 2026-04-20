const { Notification } = require('../models');
const sequelize = require('../config/database');

async function test() {
  try {
    await sequelize.authenticate();
    const count = await Notification.count({
      where: {
        userId: 6, // Example user ID from logs
        isRead: false,
        isDeleted: false
      }
    });
    console.log('Unread count:', count);
  } catch (error) {
    console.error('Error in Notification.count:', error);
  } finally {
    await sequelize.close();
  }
}

test();
