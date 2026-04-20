require('dotenv').config({ path: './server/.env' });
const { Notification, User } = require('./server/models');

async function check() {
  try {
    const counts = await Notification.count();
    console.log(`Total notifications: ${counts}`);
    
    const latest = await Notification.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']],
      include: [{ model: User, as: 'recipient', attributes: ['name', 'role'] }]
    });
    
    console.log('Latest 5 notifications:');
    latest.forEach(n => {
      console.log(`[${n.createdAt}] To: ${n.recipient?.name} (${n.recipient?.role}) | ${n.title}: ${n.message}`);
    });
  } catch (e) {
    console.error(e);
  } finally {
    process.exit();
  }
}

check();
