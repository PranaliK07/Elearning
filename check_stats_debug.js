require('dotenv').config({ path: './server/.env' });
const { Subject, Topic, Content, Quiz, Lesson } = require('./server/models');

async function check() {
  try {
    const subjects = await Subject.findAll({
      include: [
        {
          model: Topic,
          include: [
            { model: Content },
            { model: Quiz },
            { 
              model: Lesson,
              include: [
                { model: Content },
                { model: Quiz }
              ]
            }
          ]
        }
      ]
    });

    subjects.forEach(s => {
      console.log(`Subject: ${s.name}`);
      let vCount = 0;
      let qCount = 0;
      s.Topics.forEach(t => {
        vCount += (t.Contents || []).filter(c => c.type === 'video').length;
        qCount += (t.Quizzes || []).length;
        
        (t.Lessons || []).forEach(l => {
          vCount += (l.Contents || []).filter(c => c.type === 'video').length;
          qCount += (l.Quizzes || []).length;
        });
      });
      console.log(` - Topics: ${s.Topics.length}`);
      console.log(` - Videos: ${vCount}`);
      console.log(` - Quizzes: ${qCount}`);
    });

  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

check();
