const { User, Progress, Achievement, Grade } = require('../models');
const { Op } = require('sequelize');
const crypto = require('crypto');
const { hardDeleteUserById } = require('../utils/hardDeleteUser');

const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search } = req.query;
    const offset = (page - 1) * limit;

    const where = { isDeleted: false };
    if (role) where.role = role;
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }

    const users = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password', 'verificationToken', 'resetPasswordToken'] },
      include: [
        { model: Grade },
        { model: User, as: 'parent', attributes: ['id', 'name', 'email'], required: false }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      users: users.rows,
      total: users.count,
      page: parseInt(page),
      totalPages: Math.ceil(users.count / limit)
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password', 'verificationToken', 'resetPasswordToken'] },
      include: [
        { model: Grade },
        { model: Achievement },
        { model: User, as: 'parent', attributes: ['id', 'name', 'email'], required: false },
        { model: User, as: 'children', attributes: ['id', 'name', 'email', 'role'], required: false }
      ]
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const createUser = async (req, res) => {
  try {
    const { name, email, role = 'student', grade, isActive, studentEmail, studentId, parentPhone } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: 'Name is required' });
    }
    if (!email || !String(email).trim()) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const normalizedRole = String(role).trim().toLowerCase();
    const allowedRoles = new Set(['student', 'teacher', 'admin', 'parent']);
    if (!allowedRoles.has(normalizedRole)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    let existing = await User.findOne({ where: { email: String(email).trim().toLowerCase() } });

    // Restore flow: allow re-creating a previously deleted user with the same email
    if (existing && existing.isDeleted) {
      if (normalizedRole === 'parent') {
        const phone = typeof parentPhone === 'string' ? parentPhone.trim() : '';
        if (!phone) {
          return res.status(400).json({ message: 'Parent mobile number is required' });
        }
        if (phone.length < 7 || phone.length > 20) {
          return res.status(400).json({ message: 'Parent mobile number must be between 7 and 20 characters' });
        }
      }

      const temporaryPassword = crypto.randomBytes(6).toString('hex');
      existing.name = String(name).trim();
      existing.role = normalizedRole;
      existing.grade = grade || null;
      existing.isActive = isActive === undefined ? true : Boolean(isActive);
      existing.isDeleted = false;
      existing.password = temporaryPassword;
      existing.parentPhone = normalizedRole === 'parent'
        ? String(parentPhone).trim()
        : (existing.parentPhone || null);
      await existing.save();

      if (normalizedRole === 'parent' && (studentEmail || studentId)) {
        let student = null;
        if (studentId) {
          student = await User.findByPk(studentId);
        } else if (studentEmail) {
          student = await User.findOne({ where: { email: String(studentEmail).trim().toLowerCase(), role: 'student' } });
        }

        if (!student || student.role !== 'student') {
          return res.status(404).json({ message: 'Student not found to link parent' });
        }

        student.ParentId = existing.id;
        await student.save();
      }

      return res.status(201).json({
        success: true,
        message: 'User restored successfully',
        temporaryPassword,
        user: existing.getPublicProfile()
      });
    }

    if (normalizedRole === 'parent' && existing && (studentEmail || studentId)) {
      let student = null;
      if (studentId) {
        student = await User.findByPk(studentId);
      } else if (studentEmail) {
        student = await User.findOne({ where: { email: String(studentEmail).trim().toLowerCase(), role: 'student' } });
      }

      if (!student || student.role !== 'student') {
        return res.status(404).json({ message: 'Student not found to link parent' });
      }

      student.ParentId = existing.id;
      await student.save();

      return res.status(200).json({
        success: true,
        message: 'Existing parent linked to student successfully',
        user: existing.getPublicProfile(),
        linkedStudent: { id: student.id, name: student.name, email: student.email }
      });
    }

    if (existing) {
      return res.status(400).json({ message: 'User already exists' });
    }

    if (normalizedRole === 'parent') {
      const phone = typeof parentPhone === 'string' ? parentPhone.trim() : '';
      if (!phone) {
        return res.status(400).json({ message: 'Parent mobile number is required' });
      }
      if (phone.length < 7 || phone.length > 20) {
        return res.status(400).json({ message: 'Parent mobile number must be between 7 and 20 characters' });
      }
    }

    const temporaryPassword = crypto.randomBytes(6).toString('hex');
    const user = await User.create({
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      password: temporaryPassword,
      role: normalizedRole,
      grade: grade || null,
      parentPhone: normalizedRole === 'parent' ? String(parentPhone).trim() : null,
      isActive: isActive === undefined ? true : Boolean(isActive)
    });

    if (normalizedRole === 'parent' && (studentEmail || studentId)) {
      let student = null;
      if (studentId) {
        student = await User.findByPk(studentId);
      } else if (studentEmail) {
        student = await User.findOne({ where: { email: String(studentEmail).trim().toLowerCase(), role: 'student' } });
      }

      if (student && student.role === 'student') {
        student.ParentId = user.id;
        await student.save();
      }
    }

    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      temporaryPassword,
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error('Create user error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

const linkParent = async (req, res) => {
  try {
    const studentId = req.params.id;
    const { parentId, parentEmail } = req.body;

    const student = await User.findByPk(studentId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ message: 'Student not found' });
    }

    let parent = null;
    if (parentId) {
      parent = await User.findByPk(parentId);
    } else if (parentEmail) {
      parent = await User.findOne({ where: { email: String(parentEmail).trim().toLowerCase(), role: 'parent' } });
    }

    if (!parent || parent.role !== 'parent') {
      return res.status(404).json({ message: 'Parent not found' });
    }

    student.ParentId = parent.id;
    await student.save();

    return res.json({
      success: true,
      message: 'Parent linked successfully',
      student: { id: student.id, name: student.name, email: student.email },
      parent: { id: parent.id, name: parent.name, email: parent.email }
    });
  } catch (error) {
    console.error('Link parent error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

const updateUser = async (req, res) => {
  try {
    const { name, email, role, grade, isActive, parentEmail, parentId, clearParent } = req.body;
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name) user.name = name;
    if (email && String(email).trim().toLowerCase() !== user.email) {
      const exists = await User.findOne({
        where: {
          email: String(email).trim().toLowerCase(),
          id: { [Op.ne]: user.id }
        }
      });
      if (exists) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      user.email = String(email).trim().toLowerCase();
    }
    if (role) user.role = role;
    if (grade !== undefined) user.grade = grade;
    if (isActive !== undefined) user.isActive = isActive;

    if (clearParent) {
      user.ParentId = null;
    } else if (parentId || parentEmail) {
      let parent = null;
      if (parentId) {
        parent = await User.findByPk(parentId);
      } else if (parentEmail) {
        parent = await User.findOne({
          where: { email: String(parentEmail).trim().toLowerCase(), role: 'parent' }
        });
      }
      if (!parent || parent.role !== 'parent') {
        return res.status(404).json({ message: 'Parent not found' });
      }
      user.ParentId = parent.id;
    }

    await user.save();

    res.json({
      success: true,
      message: 'User updated successfully',
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const result = await hardDeleteUserById(req.params.id);
    if (!result.deleted) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    if (error?.statusCode === 400) {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};

const getUserStats = async (req, res) => {
  try {
    const userId = req.params.id;

    const progress = await Progress.findAll({
      where: { UserId: userId },
      include: ['Content']
    });

    const stats = {
      totalWatchTime: progress.reduce((sum, p) => sum + p.watchTime, 0),
      completedLessons: progress.filter(p => p.completed).length,
      totalLessons: progress.length,
      averageQuizScore: progress.filter(p => p.quizScore).reduce((sum, p) => sum + p.quizScore, 0) / 
                       progress.filter(p => p.quizScore).length || 0,
      achievements: await user.countAchievements()
    };

    res.json(stats);
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getUserProgress = async (req, res) => {
  try {
    const userId = req.params.id;

    const progress = await Progress.findAll({
      where: { UserId: userId },
      include: [{
        model: Content,
        include: [{
          model: Topic,
          include: [Subject]
        }]
      }],
      order: [['updatedAt', 'DESC']]
    });

    res.json(progress);
  } catch (error) {
    console.error('Get user progress error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getUserAchievements = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      include: [Achievement]
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.Achievements);
  } catch (error) {
    console.error('Get user achievements error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user || user.isDeleted) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getTeachers = async (req, res) => {
  try {
    const teachers = await User.findAll({
      where: { role: 'teacher', isActive: true, isDeleted: false },
      attributes: ['id', 'name', 'email', 'avatar']
    });

    res.json(teachers);
  } catch (error) {
    console.error('Get teachers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getStudents = async (req, res) => {
  try {
    const { grade } = req.query;
    const where = { role: 'student', isActive: true, isDeleted: false };
    
    if (grade) where.grade = grade;

    const students = await User.findAll({
      where,
      attributes: ['id', 'name', 'email', 'avatar', 'grade', 'points'],
      order: [['name', 'ASC']]
    });

    res.json(students);
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getUserStats,
  getUserProgress,
  getUserAchievements,
  toggleUserStatus,
  linkParent,
  getTeachers,
  getStudents
};
