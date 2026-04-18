// Manually set env vars for debug BEFORE requiring models
process.env.DB_HOST = 'localhost';
process.env.DB_USER = 'root';
process.env.DB_PASSWORD = '';
process.env.DB_NAME = 'learning1_db';
process.env.DB_PORT = '3306';

const { Topic, Subject } = require('./server/models');

async function check() {
  try {
    const topics = await Topic.findAll({ include: [Subject] });
    
    topics.forEach(t => {
      console.log(`Topic: ${t.name} (ID: ${t.id}) | Subject: ${t.Subject?.name} (ID: ${t.SubjectId})`);
    });

  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

check();
