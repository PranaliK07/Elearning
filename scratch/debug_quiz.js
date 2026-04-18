require('dotenv').config({ path: './server/.env' });
const { sequelize, Quiz } = require('./server/models');

async function inspectQuiz() {
  try {
    await sequelize.authenticate();
    const quiz = await Quiz.findOne({ order: [['createdAt', 'DESC']] });
    if (quiz) {
      console.log('ID:', quiz.id);
      console.log('Title:', quiz.title);
      console.log('Questions Type:', typeof quiz.questions);
      console.log('Questions Length:', quiz.questions?.length);
      console.log('Questions Preview:', JSON.stringify(quiz.questions).substring(0, 100));
      
      const parsed = typeof quiz.questions === 'string' ? JSON.parse(quiz.questions) : quiz.questions;
      console.log('Parsed Length:', Array.isArray(parsed) ? parsed.length : 'Not an array');
    } else {
      console.log('No quizzes found');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    process.exit();
  }
}

inspectQuiz();
