// Manually set env vars for debug BEFORE requiring models
process.env.DB_HOST = 'localhost';
process.env.DB_USER = 'root';
process.env.DB_PASSWORD = '';
process.env.DB_NAME = 'learning1_db';
process.env.DB_PORT = '3306';

const { Content, Quiz, Topic } = require('./server/models');

async function check() {
  try {
    const contents = await Content.findAll();
    const quizzes = await Quiz.findAll();
    
    console.log('--- CONTENTS ---');
    contents.forEach(c => {
      console.log(`Content: ${c.title} | Type: ${c.type} | TopicId: ${c.TopicId} | Published: ${c.isPublished}`);
    });

    console.log('\n--- QUIZZES ---');
    quizzes.forEach(q => {
      console.log(`Quiz: ${q.title} | TopicId: ${q.TopicId} | Published: ${q.isPublished}`);
    });

  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

check();
