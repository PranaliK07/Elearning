const sequelize = require('../config/database');
const { Op } = require('sequelize');
const {
  User,
  Progress,
  WatchTime,
  Comment,
  Like,
  Bookmark,
  Notification,
  Submission,
  Assignment,
  ClassCommunication,
  Feedback,
  Content,
  Quiz,
  Lesson,
  Announcement
} = require('../models');

const hardDeleteUserById = async (userId, options = {}) => {
  const id = Number(userId);
  if (!Number.isFinite(id)) {
    throw Object.assign(new Error('Valid user id is required'), { statusCode: 400 });
  }

  const run = async (t) => {
    const user = await User.findByPk(id, { transaction: t });
    if (!user) return { deleted: false };

    // Unlink children if deleting a parent
    await User.update(
      { ParentId: null },
      { where: { ParentId: id }, transaction: t }
    );

    // Notifications where user is recipient or sender
    await Notification.destroy({
      where: { [Op.or]: [{ userId: id }, { senderId: id }] },
      transaction: t
    });

    // Feedback authored by / received for this user
    await Feedback.destroy({
      where: { [Op.or]: [{ studentId: id }, { authorId: id }] },
      transaction: t
    });

    // Student learning/progress data
    await Progress.destroy({ where: { UserId: id }, transaction: t });
    await WatchTime.destroy({ where: { UserId: id }, transaction: t });

    // Social/content interactions
    await Like.destroy({ where: { UserId: id }, transaction: t });
    await Bookmark.destroy({ where: { UserId: id }, transaction: t });

    // Comments: preserve other users' replies by detaching parentId
    const comments = await Comment.findAll({
      where: { UserId: id },
      attributes: ['id'],
      transaction: t
    });
    const commentIds = comments.map((c) => c.id);
    if (commentIds.length) {
      await Comment.update(
        { parentId: null },
        { where: { parentId: { [Op.in]: commentIds } }, transaction: t }
      );
    }
    await Comment.destroy({ where: { UserId: id }, transaction: t });

    // Assignment submissions by this student
    await Submission.destroy({ where: { studentId: id }, transaction: t });

    // Keep created content, but detach creator to avoid FK restrict on user delete
    await Content.update({ createdBy: null }, { where: { createdBy: id }, transaction: t });
    await Quiz.update({ createdBy: null }, { where: { createdBy: id }, transaction: t });
    await Lesson.update({ createdBy: null }, { where: { createdBy: id }, transaction: t });

    // Keep assignments/comms/announcements, but detach author to avoid FK restrict
    await Assignment.update({ teacherId: null }, { where: { teacherId: id }, transaction: t });
    await ClassCommunication.update({ teacherId: null }, { where: { teacherId: id }, transaction: t });
    await Announcement.update({ authorId: null }, { where: { authorId: id }, transaction: t });

    // Achievements join table (created by belongsToMany)
    await sequelize.query('DELETE FROM UserAchievements WHERE UserId = ?', {
      replacements: [id],
      transaction: t
    });

    await user.destroy({ transaction: t });
    return { deleted: true };
  };

  if (options.transaction) return run(options.transaction);
  return sequelize.transaction(run);
};

module.exports = { hardDeleteUserById };

