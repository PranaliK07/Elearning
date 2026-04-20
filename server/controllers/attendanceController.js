const { Attendance, Grade, Notification, User, sequelize } = require('../models');
const { Op } = require('sequelize');

const normalizeDateOnly = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
};

const listDatesInclusive = (from, to) => {
  const start = new Date(`${from}T00:00:00.000Z`);
  const end = new Date(`${to}T00:00:00.000Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return [];
  if (start.getTime() > end.getTime()) return [];

  const dates = [];
  const cursor = new Date(start);
  while (cursor.getTime() <= end.getTime()) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
};

const getGradeAttendance = async (req, res) => {
  try {
    const { gradeId } = req.params;
    const date = normalizeDateOnly(req.query.date) || new Date().toISOString().slice(0, 10);

    const grade = await Grade.findByPk(gradeId, { attributes: ['id', 'name', 'level'] });
    if (!grade) return res.status(404).json({ message: 'Class not found' });

    const students = await User.findAll({
      where: {
        role: 'student',
        [Op.or]: [{ GradeId: grade.id }, { grade: grade.level }]
      },
      attributes: ['id', 'name', 'email', 'avatar', 'grade', 'GradeId'],
      order: [['name', 'ASC']]
    });

    const attendanceRows = await Attendance.findAll({
      where: { gradeId: grade.id, date },
      attributes: ['id', 'studentId', 'status', 'note', 'markedById', 'updatedAt']
    });

    const byStudentId = new Map(attendanceRows.map((row) => [row.studentId, row]));

    res.json({
      grade,
      date,
      students: students.map((s) => {
        const existing = byStudentId.get(s.id);
        return {
          id: s.id,
          name: s.name,
          email: s.email,
          avatar: s.avatar,
          attendance: existing
            ? { status: existing.status, note: existing.note || '' }
            : { status: 'absent', note: '' }
        };
      })
    });
  } catch (error) {
    console.error('Get grade attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getGradeAttendanceReport = async (req, res) => {
  try {
    const { gradeId } = req.params;
    const today = new Date().toISOString().slice(0, 10);
    const defaultFrom = (() => {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      return d.toISOString().slice(0, 10);
    })();

    const from = normalizeDateOnly(req.query.from) || defaultFrom;
    const to = normalizeDateOnly(req.query.to) || today;
    const dates = listDatesInclusive(from, to);
    if (!dates.length) return res.status(400).json({ message: 'Invalid date range' });

    const grade = await Grade.findByPk(gradeId, { attributes: ['id', 'name', 'level'] });
    if (!grade) return res.status(404).json({ message: 'Class not found' });

    const students = await User.findAll({
      where: {
        role: 'student',
        [Op.or]: [{ GradeId: grade.id }, { grade: grade.level }]
      },
      attributes: ['id', 'name', 'email', 'avatar', 'grade', 'GradeId'],
      order: [['name', 'ASC']]
    });

    const attendance = await Attendance.findAll({
      where: {
        gradeId: grade.id,
        date: { [Op.between]: [from, to] }
      },
      attributes: ['studentId', 'date', 'status', 'note'],
      order: [['date', 'ASC']]
    });

    res.json({
      grade,
      from,
      to,
      dates,
      students: students.map((s) => ({
        id: s.id,
        name: s.name,
        email: s.email,
        avatar: s.avatar
      })),
      attendance
    });
  } catch (error) {
    console.error('Get grade attendance report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const markGradeAttendance = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { gradeId } = req.params;
    const date = normalizeDateOnly(req.body?.date) || new Date().toISOString().slice(0, 10);
    const records = Array.isArray(req.body?.records) ? req.body.records : [];

    const grade = await Grade.findByPk(gradeId, { attributes: ['id', 'name', 'level'], transaction });
    if (!grade) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Class not found' });
    }

    const allowedStatuses = new Set(['present', 'absent']);
    const normalized = records
      .map((r) => ({
        studentId: Number(r?.studentId),
        status: typeof r?.status === 'string' ? r.status.toLowerCase().trim() : '',
        note: typeof r?.note === 'string' ? r.note : ''
      }))
      .filter((r) => Number.isFinite(r.studentId) && r.studentId > 0 && allowedStatuses.has(r.status));

    if (normalized.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ message: 'No valid attendance records provided' });
    }

    const studentIds = [...new Set(normalized.map((r) => r.studentId))];
    const validStudents = await User.findAll({
      where: {
        id: { [Op.in]: studentIds },
        role: 'student',
        [Op.or]: [{ GradeId: grade.id }, { grade: grade.level }]
      },
      attributes: ['id'],
      transaction
    });
    const validStudentSet = new Set(validStudents.map((s) => s.id));

    const saved = [];
    for (const item of normalized) {
      if (!validStudentSet.has(item.studentId)) continue;

      const existing = await Attendance.findOne({
        where: { date, studentId: item.studentId },
        transaction
      });

      if (existing) {
        existing.status = item.status;
        existing.gradeId = grade.id;
        existing.markedById = req.user.id;
        existing.note = item.note || null;
        await existing.save({ transaction });
        saved.push(existing);
      } else {
        const created = await Attendance.create({
          date,
          status: item.status,
          studentId: item.studentId,
          gradeId: grade.id,
          markedById: req.user.id,
          note: item.note || null
        }, { transaction });
        saved.push(created);
      }
    }

    await transaction.commit();

    try {
      const formattedDate = new Date(`${date}T00:00:00.000Z`).toLocaleDateString();

      if (saved.length) {
        await Notification.bulkCreate(
          saved.map((row) => ({
            userId: row.studentId,
            senderId: req.user.id,
            type: 'reminder',
            title: 'Attendance Updated',
            message: `Your attendance for ${formattedDate} was marked as ${row.status}.`,
            data: {
              attendanceId: row.id,
              date,
              status: row.status,
              gradeId: grade.id
            }
          }))
        );
      }

      await Notification.create({
        userId: req.user.id,
        senderId: req.user.id,
        type: 'announcement',
        title: 'Attendance Saved',
        message: `Attendance for ${grade.name} on ${formattedDate} was saved successfully.`,
        data: {
          date,
          gradeId: grade.id,
          savedCount: saved.length
        }
      });
    } catch (notifErr) {
      console.error('Attendance notification error:', notifErr);
    }

    res.json({ success: true, date, grade: { id: grade.id, name: grade.name, level: grade.level }, savedCount: saved.length });
  } catch (error) {
    await transaction.rollback();
    console.error('Mark grade attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getMyAttendance = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    const defaultFrom = new Date(today);
    defaultFrom.setDate(defaultFrom.getDate() - 30);

    const from = normalizeDateOnly(req.query.from) || defaultFrom.toISOString().slice(0, 10);
    const to = normalizeDateOnly(req.query.to) || today.toISOString().slice(0, 10);

    const rows = await Attendance.findAll({
      where: {
        studentId: userId,
        date: { [Op.between]: [from, to] }
      },
      attributes: ['date', 'status', 'note', 'gradeId', 'markedById'],
      order: [['date', 'DESC']]
    });

    res.json({ from, to, attendance: rows });
  } catch (error) {
    console.error('Get my attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getGradeAttendance,
  getGradeAttendanceReport,
  markGradeAttendance,
  getMyAttendance,
  getAttendanceSummary
};

async function getAttendanceSummary(req, res) {
  try {
    const date = normalizeDateOnly(req.query.date) || new Date().toISOString().slice(0, 10);

    const grouped = await Attendance.findAll({
      where: { date },
      attributes: [
        'gradeId',
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['gradeId', 'status'],
      raw: true
    });

    const gradeIds = Array.from(new Set(grouped.map((g) => g.gradeId))).filter(Boolean);
    const grades = await Grade.findAll({
      where: { id: { [Op.in]: gradeIds } },
      attributes: ['id', 'name', 'level'],
      order: [['level', 'ASC']],
      raw: true
    });
    const gradeById = new Map(grades.map((g) => [g.id, g]));

    const byGrade = new Map();
    let present = 0;
    let absent = 0;
    let totalMarked = 0;

    for (const row of grouped) {
      const count = Number(row.count) || 0;
      const gradeId = row.gradeId;
      const status = row.status;

      if (!byGrade.has(gradeId)) {
        const g = gradeById.get(gradeId) || { id: gradeId, name: `Class ${gradeId}`, level: null };
        byGrade.set(gradeId, { grade: g, present: 0, absent: 0, total: 0 });
      }

      const agg = byGrade.get(gradeId);
      if (status === 'present') agg.present += count;
      if (status === 'absent') agg.absent += count;
      agg.total += count;

      if (status === 'present') present += count;
      if (status === 'absent') absent += count;
      totalMarked += count;
    }

    res.json({
      date,
      totals: { present, absent, totalMarked },
      classes: Array.from(byGrade.values()).sort((a, b) => (a.grade?.level || 0) - (b.grade?.level || 0))
    });
  } catch (error) {
    console.error('Get attendance summary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}
