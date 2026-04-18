require('dotenv').config({ path: './server/.env' });
const { Quiz, Topic, Subject, Grade } = require('./server/models');

async function testQuery() {
  try {
    const userGradeLevel = 10; // example
    const include = [
      {
        model: Topic,
        required: true,
        include: [{
          model: Subject,
          required: true,
          include: [{
            model: Grade,
            required: true,
            where: userGradeLevel ? { level: userGradeLevel } : {}
          }]
        }]
      }
    ];

    const quizzes = await Quiz.findAll({
      where: { isPublished: true },
      include,
      limit: 20
    });

    console.log('Success! Found quizzes:', quizzes.length);
  } catch (error) {
    console.error('FAILED query:', error.name, error.message);
    if (error.original) console.error('Original:', error.original.message);
    if (error.stack) console.error(error.stack);
  } finally {
    process.exit();
  }
}

testQuery();
