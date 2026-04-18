require('dotenv').config();
const { Quiz, Topic, Subject, Grade } = require('./models');

async function listQuizzes() {
  try {
    const quizzes = await Quiz.findAll({
      include: [{
        model: Topic,
        required: false,
        include: [{
          model: Subject,
          required: false,
          include: [Grade]
        }]
      }]
    });
    
    console.log(`\n=== DATABASE QUIZ REPORT ===`);
    console.log(`Total Quizzes in DB: ${quizzes.length}`);
    
    quizzes.forEach(q => {
      console.log(`\n- QUIZ ID: ${q.id}`);
      console.log(`  Title: "${q.title}"`);
      console.log(`  Is Published: ${q.isPublished}`);
      console.log(`  Topic: ${q.Topic?.name || 'MISSING'}`);
      console.log(`  Subject: ${q.Topic?.Subject?.name || 'MISSING'}`);
      console.log(`  Grade Level: ${q.Topic?.Subject?.Grade?.level || 'MISSING'}`);
    });
    console.log(`\n============================\n`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    process.exit();
  }
}

listQuizzes();
