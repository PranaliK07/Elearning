require('dotenv').config();
const { Quiz } = require('./models');

async function fixQuizzes() {
  try {
    const quizzes = await Quiz.findAll();
    console.log(`Checking ${quizzes.length} quizzes...`);
    
    for (const quiz of quizzes) {
      let data = quiz.questions;
      let changed = false;
      
      console.log(`Quiz ${quiz.id}: type is ${typeof data}`);
      
      // Keep parsing while it's a string
      while (typeof data === 'string') {
        try {
          const parsed = JSON.parse(data);
          data = parsed;
          changed = true;
          console.log(`  Parsed once... now type is ${typeof data}`);
        } catch (e) {
          console.log(`  Parsing failed at this level: ${e.message}`);
          break;
        }
      }
      
      if (changed && Array.isArray(data)) {
        console.log(`  Saving Quiz ${quiz.id} with proper array (length ${data.length})`);
        quiz.questions = data;
        await quiz.save();
      } else {
        console.log(`  No change needed or not an array for Quiz ${quiz.id}`);
      }
    }
    
    console.log('\n✅ All quizzes normalized.');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    process.exit();
  }
}

fixQuizzes();
