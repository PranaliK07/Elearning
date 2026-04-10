const { Grade, Subject, User } = require('../models');

const sendServerError = (res, context, error) => {
  console.error(`${context} error:`, error);

  if (error?.name === 'SequelizeValidationError') {
    const first = error?.errors?.[0];
    return res.status(400).json({
      message: first?.message || 'Validation error'
    });
  }

  if (error?.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      message: 'Duplicate entry'
    });
  }

  const isDev = process.env.NODE_ENV === 'development';
  return res.status(500).json({
    message: 'Server error',
    ...(isDev && {
      context,
      details: error?.message,
      sqlMessage: error?.original?.sqlMessage || error?.parent?.sqlMessage,
      code: error?.original?.code || error?.parent?.code
    })
  });
};

const ensureDefaultGrades = async () => {
  const existing = await Grade.findAll({ attributes: ['level'] });
  const existingLevels = new Set(existing.map((g) => g.level));
  const defaults = [
    { level: 1, name: 'Class 1', description: 'Beginner Level - Foundation', icon: '📚', color: '#FF6B6B', order: 1 },
    { level: 2, name: 'Class 2', description: 'Building Basic Concepts', icon: '🌟', color: '#4ECDC4', order: 2 },
    { level: 3, name: 'Class 3', description: 'Intermediate Learning', icon: '🎨', color: '#45B7D1', order: 3 },
    { level: 4, name: 'Class 4', description: 'Advanced Concepts', icon: '📚', color: '#96CEB4', order: 4 },
    { level: 5, name: 'Class 5', description: 'Mastery Level', icon: '🚀', color: '#FFEAA7', order: 5 }
  ];

  const missing = defaults.filter((g) => !existingLevels.has(g.level));
  if (missing.length > 0) {
    await Grade.bulkCreate(missing);
  }
};

const getGrades = async (req, res) => {
  try {
    try {
      await ensureDefaultGrades();
    } catch (seedError) {
      console.warn('ensureDefaultGrades failed:', seedError?.message);
    }

    const queryWithSubjects = () =>
      Grade.findAll({
        order: [['level', 'ASC']],
        include: [
          {
            model: Subject,
            attributes: ['id', 'name', 'icon'],
            required: false
          }
        ]
      });

    try {
      const grades = await queryWithSubjects();
      return res.json(grades);
    } catch (joinError) {
      const code = joinError?.original?.code || joinError?.parent?.code;
      const sqlMessage = joinError?.original?.sqlMessage || joinError?.parent?.sqlMessage || '';
      const mightBeSchemaMismatch =
        code === 'ER_BAD_FIELD_ERROR' ||
        code === 'ER_NO_SUCH_TABLE' ||
        /Unknown column/i.test(sqlMessage) ||
        /doesn't exist/i.test(sqlMessage);

      if (!mightBeSchemaMismatch) {
        throw joinError;
      }

      console.warn('Grades join failed, falling back without subjects:', {
        code,
        sqlMessage
      });

      const grades = await Grade.findAll({ order: [['level', 'ASC']] });
      return res.json(grades);
    }
  } catch (error) {
    return sendServerError(res, 'Get grades', error);
  }
};

const getGrade = async (req, res) => {
  try {
    let grade;
    try {
      grade = await Grade.findByPk(req.params.id, { include: [Subject] });
    } catch (joinError) {
      const code = joinError?.original?.code || joinError?.parent?.code;
      const sqlMessage = joinError?.original?.sqlMessage || joinError?.parent?.sqlMessage || '';
      const mightBeSchemaMismatch =
        code === 'ER_BAD_FIELD_ERROR' ||
        code === 'ER_NO_SUCH_TABLE' ||
        /Unknown column/i.test(sqlMessage) ||
        /doesn't exist/i.test(sqlMessage);

      if (!mightBeSchemaMismatch) throw joinError;
      console.warn('Grade join failed, falling back without subjects:', { code, sqlMessage });
      grade = await Grade.findByPk(req.params.id);
    }

    if (!grade) {
      return res.status(404).json({ message: 'Grade not found' });
    }

    res.json(grade);
  } catch (error) {
    return sendServerError(res, 'Get grade', error);
  }
};

const createGrade = async (req, res) => {
  try {
    const { level, name, description, thumbnail, icon, color, order } = req.body;

    const existingGrade = await Grade.findOne({ where: { level } });
    if (existingGrade) {
      return res.status(400).json({ message: 'Grade level already exists' });
    }

    const grade = await Grade.create({
      level,
      name,
      description,
      thumbnail,
      icon,
      color,
      order
    });

    res.status(201).json({
      success: true,
      message: 'Grade created successfully',
      grade
    });
  } catch (error) {
    return sendServerError(res, 'Create grade', error);
  }
};

const updateGrade = async (req, res) => {
  try {
    const grade = await Grade.findByPk(req.params.id);

    if (!grade) {
      return res.status(404).json({ message: 'Grade not found' });
    }

    const { name, description, thumbnail, icon, color, order } = req.body;

    if (name) grade.name = name;
    if (description) grade.description = description;
    if (thumbnail) grade.thumbnail = thumbnail;
    if (icon) grade.icon = icon;
    if (color) grade.color = color;
    if (order) grade.order = order;

    await grade.save();

    res.json({
      success: true,
      message: 'Grade updated successfully',
      grade
    });
  } catch (error) {
    return sendServerError(res, 'Update grade', error);
  }
};

const deleteGrade = async (req, res) => {
  try {
    const grade = await Grade.findByPk(req.params.id);

    if (!grade) {
      return res.status(404).json({ message: 'Grade not found' });
    }

    await grade.destroy();

    res.json({ success: true, message: 'Grade deleted successfully' });
  } catch (error) {
    return sendServerError(res, 'Delete grade', error);
  }
};

const getGradeSubjects = async (req, res) => {
  try {
    const grade = await Grade.findByPk(req.params.id, {
      include: [Subject]
    });

    if (!grade) {
      return res.status(404).json({ message: 'Grade not found' });
    }

    res.json(grade.Subjects);
  } catch (error) {
    return sendServerError(res, 'Get grade subjects', error);
  }
};

const getGradeStats = async (req, res) => {
  try {
    const gradeId = req.params.id;

    const studentCount = await User.count({
      where: { grade: gradeId, role: 'student' }
    });

    const subjectCount = await Subject.count({
      where: { GradeId: gradeId }
    });

    res.json({
      gradeId,
      studentCount,
      subjectCount,
      totalContent: 0 // You can calculate this
    });
  } catch (error) {
    return sendServerError(res, 'Get grade stats', error);
  }
};

module.exports = {
  getGrades,
  getGrade,
  createGrade,
  updateGrade,
  deleteGrade,
  getGradeSubjects,
  getGradeStats
};
