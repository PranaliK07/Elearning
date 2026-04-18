const { User } = require('../server/models');

async function createMockTeacher() {
  try {
    const email = 'teacher_test_' + Math.floor(Math.random() * 1000) + '@example.com';
    const teacher = await User.create({
      name: 'Teacher Demo',
      email: email,
      password: 'password123',
      role: 'teacher',
      isActive: true,
      isDeleted: false
    });
    console.log('Successfully created mock teacher:', teacher.email);
    process.exit(0);
  } catch (err) {
    console.error('Error creating teacher:', err.message);
    process.exit(1);
  }
}

createMockTeacher();
