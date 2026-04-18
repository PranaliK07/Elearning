require('dotenv').config();
const { sequelize } = require('./models');

async function forceFix() {
  try {
    const [quizzes] = await sequelize.query("SELECT id, questions FROM Quizzes");
    console.log(`Checking ${quizzes.length} quizzes with raw SQL...`);

    for (const quiz of quizzes) {
      let rawData = quiz.questions;
      let finalData = rawData;
      
      // Clean up string until it's a real array/object
      while (typeof finalData === 'string') {
        try {
          const parsed = JSON.parse(finalData);
          if (parsed === finalData) break; // Avoid infinite loop if string parses to same string
          finalData = parsed;
        } catch (e) {
          break;
        }
      }

      if (Array.isArray(finalData)) {
        console.log(`Quiz ${quiz.id}: Fixing data. Character length was ${rawData.length}, True array length is ${finalData.length}`);
        const cleanJson = JSON.stringify(finalData);
        await sequelize.query("UPDATE Quizzes SET questions = ? WHERE id = ?", {
          replacements: [cleanJson, quiz.id]
        });
      }
    }
    console.log('✅ DATABASE FULLY NORMALIZED VIA RAW SQL.');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    process.exit();
  }
}

forceFix();
