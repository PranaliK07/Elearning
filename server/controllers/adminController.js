const { User, Content, Quiz, Achievement, Announcement, RoleAccess, sequelize, Grade, ClassCommunication, Notification } = require('../models');
const { Op } = require('sequelize');
const fs = require('fs');
const { exec } = require('child_process');
const { sendSmsAndWhatsappToRecipients, normalizePhone } = require('../utils/parentMessaging');

const allowedModules = [
  'dashboard',
  'subjects',
  'play',
  'progress',
  'achievements',
  'profile',
  'new-lesson',
  'subject-topic',
  'assignments',
  'attendance',
  'class-management',
  'communications',
  'content',
  'users',
  'reports',
  'reports-issues',
  'settings',
  'business-settings',
  'doubts',
  'feedback',
  'study-material'
];

const defaultRoleAccess = {
  admin: ['dashboard', 'subjects', 'play', 'progress', 'achievements', 'profile', 'users', 'content', 'reports', 'reports-issues', 'settings', 'new-lesson', 'subject-topic', 'assignments', 'attendance', 'class-management', 'communications', 'business-settings', 'doubts', 'feedback', 'study-material'],
  teacher: ['dashboard', 'subjects', 'play', 'progress', 'achievements', 'profile', 'new-lesson', 'subject-topic', 'assignments', 'attendance', 'class-management', 'reports', 'communications', 'feedback', 'study-material'],
  student: ['dashboard', 'subjects', 'play', 'progress', 'achievements', 'profile', 'attendance', 'doubts', 'feedback', 'study-material']
};

const ROLE_ACCESS_VERSION = 13;

// --- Business settings: role-based sidebar access ---
const getRoleAccess = async (req, res) => {
  try {
    const roles = ['admin', 'teacher', 'student'];
    const records = await RoleAccess.findAll();

    // Seed defaults if table is empty
    if (!records.length) {
      const created = await Promise.all(
        roles.map(role => RoleAccess.create({
          role,
          modules: defaultRoleAccess[role],
          version: ROLE_ACCESS_VERSION
        }))
      );
      return res.json(Object.fromEntries(created.map(r => [r.role, r.modules])));
    }

    const sanitized = {};
    for (const rec of records) {
      let mods = rec.modules;
      if (typeof mods === 'string') {
        try { mods = JSON.parse(mods); } catch (e) { mods = []; }
      }
      if (!Array.isArray(mods)) mods = [];

      if ((rec.version || 1) < ROLE_ACCESS_VERSION) {
        const next = new Set(mods.filter((module) => allowedModules.includes(module)));
        next.add('play');
        next.add('progress');
        next.add('achievements');
        next.add('profile');
        next.add('attendance');
        if (rec.role === 'admin' || rec.role === 'teacher') next.add('class-management');
        if (rec.role === 'admin' || rec.role === 'teacher') next.add('reports');
        if (rec.role === 'admin') {
          next.add('reports-issues');
          next.add('users');
          next.add('content');
          next.add('settings');
          next.add('business-settings');
        }
        if (rec.role === 'admin' || rec.role === 'teacher') {
          next.add('communications');
          next.add('new-lesson');
          next.add('subject-topic');
        }
        next.add('feedback');
        next.add('study-material');
        rec.set('modules', Array.from(next));
        rec.set('version', ROLE_ACCESS_VERSION);
        await rec.save();
        mods = rec.modules;
      }

      sanitized[rec.role] = mods.filter(m => allowedModules.includes(m));
    }

    // Fill any missing role with defaults to keep UI stable
    roles.forEach(role => {
      if (!sanitized[role]) sanitized[role] = defaultRoleAccess[role] || [];
    });

    // Backward-compat: ensure students can see homework in sidebar
    if (sanitized.student && !sanitized.student.includes('homework')) {
      sanitized.student = [...sanitized.student, 'homework'];
    }

    res.json(sanitized);
  } catch (error) {
    console.error('Get role access error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const saveRoleAccess = async (req, res) => {
  try {
    const incoming = req.body || {};
    const roles = ['admin', 'teacher', 'student'];

    const updates = {};
    roles.forEach(role => {
      const list = Array.isArray(incoming[role]) ? incoming[role] : defaultRoleAccess[role] || [];
      // Deduplicate + validate against allowed modules
      updates[role] = Array.from(new Set(list.filter(m => allowedModules.includes(m))));
    });

    // Update or create each role
    await Promise.all(
      roles.map(async role => {
        const record = await RoleAccess.findOne({ where: { role } });
        if (record) {
          record.set('modules', updates[role]);
          record.set('version', ROLE_ACCESS_VERSION);
          record.changed('modules', true);
          await record.save();
        } else {
          await RoleAccess.create({
            role,
            modules: updates[role],
            version: ROLE_ACCESS_VERSION
          });
        }
      })
    );

    res.json({ success: true, roleAccess: updates });
  } catch (error) {
    console.error('Save role access error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getSystemStats = async (req, res) => {
  try {
    const stats = {
      users: {
        total: await User.count(),
        students: await User.count({ where: { role: 'student' } }),
        teachers: await User.count({ where: { role: 'teacher' } }),
        admins: await User.count({ where: { role: 'admin' } }),
        active: await User.count({ where: { isActive: true } })
      },
      content: {
        total: await Content.count(),
        videos: await Content.count({ where: { type: 'video' } }),
        readings: await Content.count({ where: { type: 'reading' } }),
        quizzes: await Quiz.count()
      },
      achievements: await Achievement.count(),
      storage: {
        videos: getFolderSize('./uploads/videos'),
        thumbnails: getFolderSize('./uploads/thumbnails'),
        avatars: getFolderSize('./uploads/avatars')
      }
    };

    res.json(stats);
  } catch (error) {
    console.error('Get system stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getUserAnalytics = async (req, res) => {
  try {
    const { timeframe = 'month' } = req.query;

    let startDate;
    const today = new Date();

    switch (timeframe) {
      case 'week':
        startDate = new Date(today.setDate(today.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(today.setMonth(today.getMonth() - 1));
        break;
      case 'year':
        startDate = new Date(today.setFullYear(today.getFullYear() - 1));
        break;
      default:
        startDate = new Date(today.setMonth(today.getMonth() - 1));
    }

    const newUsers = await User.count({
      where: { createdAt: { [Op.gte]: startDate } }
    });

    const activeUsers = await User.count({
      where: { lastActive: { [Op.gte]: startDate } }
    });

    const usersByGrade = await User.findAll({
      where: { role: 'student' },
      attributes: [
        'grade',
        [sequelize.fn('COUNT', sequelize.col('grade')), 'count']
      ],
      group: ['grade']
    });

    res.json({
      timeframe,
      newUsers,
      activeUsers,
      totalUsers: await User.count(),
      usersByGrade
    });
  } catch (error) {
    console.error('Get user analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getContentAnalytics = async (req, res) => {
  try {
    const popularContent = await Content.findAll({
      attributes: ['id', 'title', 'type', 'views', 'likes'],
      order: [['views', 'DESC']],
      limit: 10
    });

    const contentByType = await Content.findAll({
      attributes: [
        'type',
        [sequelize.fn('COUNT', sequelize.col('type')), 'count']
      ],
      group: ['type']
    });

    const totalViews = await Content.sum('views');
    const totalLikes = await Content.sum('likes');

    res.json({
      popularContent,
      contentByType,
      totalViews,
      totalLikes
    });
  } catch (error) {
    console.error('Get content analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getPlatformMetrics = async (req, res) => {
  try {
    const metrics = {
      engagement: {
        dailyActiveUsers: await User.count({
          where: { lastActive: { [Op.gte]: new Date(Date.now() - 24*60*60*1000) } }
        }),
        weeklyActiveUsers: await User.count({
          where: { lastActive: { [Op.gte]: new Date(Date.now() - 7*24*60*60*1000) } }
        }),
        monthlyActiveUsers: await User.count({
          where: { lastActive: { [Op.gte]: new Date(Date.now() - 30*24*60*60*1000) } }
        })
      },
      performance: {
        averageWatchTime: 0, // Calculate from WatchTime
        completionRate: 0, // Calculate from Progress
        quizPassRate: 0 // Calculate from Progress
      }
    };

    res.json(metrics);
  } catch (error) {
    console.error('Get platform metrics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// --- Admin: Class Communication ---
const getClassCommunications = async (req, res) => {
  try {
    const where = {};

    if (req.query.teacherId) where.teacherId = Number(req.query.teacherId);
    if (req.query.gradeId) where.gradeId = Number(req.query.gradeId);
    if (req.query.audience && ['students', 'parents', 'both'].includes(req.query.audience)) {
      where.audience = req.query.audience;
    }

    const communications = await ClassCommunication.findAll({
      where,
      include: [
        { model: Grade, attributes: ['id', 'name', 'level'], required: false },
        { model: User, as: 'teacher', attributes: ['id', 'name', 'email', 'avatar', 'role'], required: false }
      ],
      order: [['createdAt', 'DESC']],
      limit: req.query.limit ? Math.min(Number(req.query.limit) || 50, 200) : 50
    });

    res.json(communications);
  } catch (error) {
    console.error('Get admin class communications error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const sendClassCommunication = async (req, res) => {
  try {
    const { title, message, audience = 'both', gradeId, senderId } = req.body;

    if (!title || !String(title).trim()) {
      return res.status(400).json({ message: 'Title is required' });
    }
    if (!message || !String(message).trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }
    if (!['students', 'parents', 'both'].includes(audience)) {
      return res.status(400).json({ message: 'Invalid audience value' });
    }

    let grade = null;
    if (gradeId) {
      grade = await Grade.findByPk(Number(gradeId));
      if (!grade) {
        return res.status(404).json({ message: 'Class not found' });
      }
    }

    let sender = req.user;
    if (senderId) {
      const teacher = await User.findByPk(Number(senderId), { attributes: ['id', 'role', 'isActive'] });
      if (!teacher || teacher.role !== 'teacher' || !teacher.isActive) {
        return res.status(400).json({ message: 'Invalid sender teacher' });
      }
      sender = teacher;
    }

    const studentWhere = { role: 'student', isActive: true };
    if (grade) {
      studentWhere[Op.or] = [
        { GradeId: grade.id },
        { grade: grade.level }
      ];
    }

    const students = await User.findAll({
      where: studentWhere,
      attributes: ['id', 'ParentId', 'parentPhone']
    });

    const recipientIds = new Set();
    if (audience === 'students' || audience === 'both') {
      students.forEach((student) => recipientIds.add(student.id));
    }

    let parentRecipients = [];
    if (audience === 'parents' || audience === 'both') {
      const parentIds = [...new Set(students.map((student) => student.ParentId).filter(Boolean))];
      if (parentIds.length) {
        const parents = await User.findAll({
          where: {
            id: { [Op.in]: parentIds },
            role: 'parent',
            isActive: true
          },
          attributes: ['id', 'name', 'parentPhone']
        });
        parents.forEach((parent) => recipientIds.add(parent.id));
        parentRecipients = parents;
      }
    }

    const communication = await ClassCommunication.create({
      title: String(title).trim(),
      message: String(message).trim(),
      audience,
      teacherId: sender.id,
      gradeId: grade ? grade.id : null,
      recipientCount: recipientIds.size
    });

    const notifications = [...recipientIds].map((recipientId) => ({
      userId: recipientId,
      type: 'announcement',
      title: communication.title,
      message: communication.message,
      data: {
        source: 'class_communication',
        communicationId: communication.id,
        audience: communication.audience,
        class: grade ? grade.name : 'All Classes'
      }
    }));

    if (notifications.length) {
      await Notification.bulkCreate(notifications);
    }

    // Optional: deliver parent communications via SMS + WhatsApp (Twilio) when audience includes parents.
    if (audience === 'parents' || audience === 'both') {
      const className = grade ? grade.name : 'All Classes';
      const senderName = sender?.name || req.user?.name || 'Staff';

      const recipientByPhone = new Map();
      const defaultCountryCode = process.env.PHONE_DEFAULT_COUNTRY_CODE;
      const addRecipient = (id, phone) => {
        const normalized = normalizePhone(phone, defaultCountryCode);
        if (!normalized) return;
        if (!recipientByPhone.has(normalized)) {
          recipientByPhone.set(normalized, { id, parentPhone: phone });
        }
      };

      parentRecipients.forEach((p) => addRecipient(p.id, p.parentPhone));
      students.forEach((s) => addRecipient(`student-${s.id}`, s.parentPhone));
      const recipientsToMessage = Array.from(recipientByPhone.values());
      if (!recipientsToMessage.length) {
        return res.status(201).json({
          success: true,
          message: 'Class communication sent successfully',
          communication,
          recipients: notifications.length
        });
      }

      setImmediate(() => {
        sendSmsAndWhatsappToRecipients({
          recipients: recipientsToMessage,
          title: communication.title,
          message: communication.message,
          senderName,
          className
        }).then((result) => {
          if (result?.skipped) {
            console.warn('Parent SMS/WhatsApp skipped:', result?.reason);
          }
        }).catch((err) => {
          console.error('Parent SMS/WhatsApp send error:', err);
        });
      });
    }

    res.status(201).json({
      success: true,
      message: 'Class communication sent successfully',
      communication,
      recipients: notifications.length
    });
  } catch (error) {
    console.error('Send admin class communication error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const manageUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    switch (action) {
      case 'activate':
        user.isActive = true;
        await user.save();
        break;
      case 'deactivate':
        user.isActive = false;
        await user.save();
        break;
      case 'resetPassword':
        // Implement password reset
        break;
      default:
        return res.status(400).json({ message: 'Invalid action' });
    }

    res.json({ success: true, message: `User ${action}d successfully` });
  } catch (error) {
    console.error('Manage user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const manageContent = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;

    const content = await Content.findByPk(id);

    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }

    switch (action) {
      case 'publish':
        content.isPublished = true;
        await content.save();
        break;
      case 'unpublish':
        content.isPublished = false;
        await content.save();
        break;
      case 'feature':
        // Implement feature flag
        break;
      default:
        return res.status(400).json({ message: 'Invalid action' });
    }

    res.json({ success: true, message: `Content ${action}d successfully` });
  } catch (error) {
    console.error('Manage content error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const createAnnouncement = async (req, res) => {
  try {
    const { title, content, priority, targetRole, targetGrades, expiresAt } = req.body;

    const announcement = await Announcement.create({
      title,
      content,
      priority,
      targetRole,
      targetGrades,
      expiresAt,
      authorId: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Announcement created successfully',
      announcement
    });
  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getReports = async (req, res) => {
  try {
    // Implement report generation
    const reports = [];

    res.json(reports);
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const resolveReport = async (req, res) => {
  try {
    const { id } = req.params;
    // Implement report resolution

    res.json({ success: true, message: 'Report resolved' });
  } catch (error) {
    console.error('Resolve report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getSystemLogs = async (req, res) => {
  try {
    const logFile = './logs/app.log';
    
    if (fs.existsSync(logFile)) {
      const logs = fs.readFileSync(logFile, 'utf8').split('\n').slice(-100);
      res.json(logs);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error('Get system logs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const backupDatabase = async (req, res) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = `./backups/backup-${timestamp}.sql`;
    
    const cmd = `mysqldump -u ${process.env.DB_USER} -p${process.env.DB_PASSWORD} ${process.env.DB_NAME} > ${backupFile}`;
    
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.error('Backup error:', error);
        return res.status(500).json({ message: 'Backup failed' });
      }
      
      res.json({
        success: true,
        message: 'Database backed up successfully',
        file: backupFile
      });
    });
  } catch (error) {
    console.error('Backup database error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const restoreDatabase = async (req, res) => {
  try {
    const { file } = req.body;
    
    const cmd = `mysql -u ${process.env.DB_USER} -p${process.env.DB_PASSWORD} ${process.env.DB_NAME} < ${file}`;
    
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.error('Restore error:', error);
        return res.status(500).json({ message: 'Restore failed' });
      }
      
      res.json({
        success: true,
        message: 'Database restored successfully'
      });
    });
  } catch (error) {
    console.error('Restore database error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper function to get folder size
const getFolderSize = (folderPath) => {
  try {
    let totalSize = 0;
    const files = fs.readdirSync(folderPath);
    
    files.forEach(file => {
      const stats = fs.statSync(`${folderPath}/${file}`);
      totalSize += stats.size;
    });
    
    return totalSize;
  } catch (error) {
    return 0;
  }
};

module.exports = {
  getSystemStats,
  getUserAnalytics,
  getContentAnalytics,
  getPlatformMetrics,
  getClassCommunications,
  sendClassCommunication,
  manageUser,
  manageContent,
  createAnnouncement,
  getReports,
  resolveReport,
  getSystemLogs,
  backupDatabase,
  restoreDatabase,
  getRoleAccess,
  saveRoleAccess
};
