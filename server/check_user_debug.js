require('dotenv').config();
const { User, Grade } = require('./models');

async function checkUser() {
  try {
    const users = await User.findAll({ 
      where: { role: 'student' },
      include: [Grade]
    });
    
    console.log(`\n=== STUDENT REPORT ===`);
    users.forEach(u => {
      console.log(`- [${u.id}] ${u.name}`);
      console.log(`  Grade ID: ${u.GradeId}`);
      console.log(`  Grade Field (level): ${u.grade}`);
      console.log(`  Joined Grade Level: ${u.Grade?.level || 'NONE'}`);
    });
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    process.exit();
  }
}

checkUser();
