require('dotenv').config({ path: './server/.env' });
const { sequelize, User, Notification, Quiz, Content } = require('./server/models');

async function checkDatabase() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connection has been established successfully.');

    const userCount = await User.count();
    console.log(`✅ Users: ${userCount}`);

    const quizCount = await Quiz.count();
    console.log(`✅ Quizzes: ${quizCount}`);

    const notificationCount = await Notification.count();
    console.log(`✅ Notifications: ${notificationCount}`);

    const contentCount = await Content.count();
    console.log(`✅ Contents: ${contentCount}`);

    console.log('✅ ALL MODELS ACCESSIBLE');
  } catch (error) {
    console.error('❌ Database check FAILED:', error.name, error.message);
    if (error.original) console.error('Original Error:', error.original.message);
    if (error.stack) console.error(error.stack);
  } finally {
    process.exit();
  }
}

checkDatabase();
