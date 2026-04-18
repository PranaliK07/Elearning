require('dotenv').config({ path: './server/.env' });
const { sequelize } = require('./server/models');

async function checkColumns() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected');

    const [users] = await sequelize.query('DESCRIBE Users');
    console.log('Users columns:', users.map(c => c.Field).join(', '));

    const [quizzes] = await sequelize.query('DESCRIBE Quizzes');
    console.log('Quizzes columns:', quizzes.map(c => c.Field).join(', '));

    const [notifications] = await sequelize.query('DESCRIBE Notifications');
    console.log('Notifications columns:', notifications.map(c => c.Field).join(', '));

  } catch (error) {
    console.error('❌ Check columns FAILED:', error.message);
  } finally {
    process.exit();
  }
}

checkColumns();
