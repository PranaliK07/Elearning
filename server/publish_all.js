require('dotenv').config();
const { Quiz } = require('./models');

async function publishAll() {
  try {
    const [updatedCount] = await Quiz.update(
      { isPublished: true },
      { where: {} }
    );
    console.log(`\n✅ Success: Force-published ${updatedCount} quizzes.`);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    process.exit();
  }
}

publishAll();
