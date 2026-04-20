const { Content, Topic, User, Progress, Comment, Like, Bookmark, Grade, Subject, Lesson, Notification } = require('../models');
const { Op } = require('sequelize');
const { createNotification } = require('../utils/notifications');

const resolveStudentGradeId = async (user) => {
  if (!user) return null;
  if (user.GradeId) return user.GradeId;
  if (user.grade) {
    const grade = await Grade.findOne({
      where: {
        [Op.or]: [{ id: user.grade }, { level: user.grade }]
      }
    });
    return grade?.id || null;
  }
  return null;
};

const getContents = async (req, res) => {
  try {
    const { topicId, subjectId, gradeId, type, page = 1, limit = 10 } = req.query;
    const where = {};
    const parsedLimit = Math.max(1, Math.min(parseInt(limit, 10) || 10, 100));
    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);

    if (topicId) where.TopicId = topicId;
    if (subjectId) where.SubjectId = subjectId;
    if (gradeId) where.GradeId = gradeId;
    if (type) where.type = type;

    if (req.user?.role === 'student') {
      const studentGradeId = await resolveStudentGradeId(req.user);
      if (studentGradeId) {
        where.GradeId = {
          [Op.or]: [{ [Op.eq]: studentGradeId }, { [Op.is]: null }]
        };
      }
    }

    const contents = await Content.findAndCountAll({
      where,
      include: [
        {
          model: Topic,
          include: [Subject]
        },
        { model: Lesson },
        { model: Subject },
        { model: Grade },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'avatar']
        }
      ],
      limit: parsedLimit,
      offset: (parsedPage - 1) * parsedLimit,
      order: [['order', 'ASC'], ['createdAt', 'DESC']]
    });

    res.json({
      contents: contents.rows,
      total: contents.count,
      page: parsedPage,
      totalPages: Math.ceil(contents.count / parsedLimit)
    });
  } catch (error) {
    console.error('Get contents error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getContent = async (req, res) => {
  try {
    const content = await Content.findByPk(req.params.id, {
      include: [
        {
          model: Topic,
          include: [Subject]
        },
        { model: Lesson },
        { model: Subject },
        { model: Grade },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'avatar']
        }
      ]
    });

    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }

    if (req.user?.role === 'student') {
      const studentGradeId = await resolveStudentGradeId(req.user);
      if (studentGradeId && content.GradeId && content.GradeId !== studentGradeId) {
        return res.status(403).json({ message: 'Not authorized to access this content' });
      }
    }

    res.json(content);
  } catch (error) {
    console.error('Get content error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const createContent = async (req, res) => {
  try {
    const {
      title,
      type,
      description,
      videoUrl,
      videoFile,
      thumbnail,
      readingMaterial,
      duration,
      isPremium,
      topicId,
      TopicId,
      lessonId,
      LessonId,
      order,
      tags,
      metadata,
      gradeId,
      GradeId,
      subjectId,
      SubjectId,
      isPublished
    } = req.body;

    const finalTopicId = Number(topicId || TopicId || 0);
    if (!finalTopicId) {
      return res.status(400).json({ message: 'Topic is required' });
    }

    const topic = await Topic.findByPk(finalTopicId);
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found (id: ' + finalTopicId + ')' });
    }

    const finalSubjectId = Number(subjectId || SubjectId || topic.SubjectId || 0) || null;
    const finalGradeId = Number(gradeId || GradeId || 0) || null;

    if (finalSubjectId) {
      const subject = await Subject.findByPk(finalSubjectId);
      if (!subject) {
        return res.status(404).json({ message: `Subject not found (id: ${finalSubjectId})` });
      }
      if (subject.id !== topic.SubjectId) {
        return res.status(400).json({ message: 'Topic does not belong to selected subject' });
      }
    }

    if (finalGradeId) {
      const grade = await Grade.findByPk(finalGradeId);
      if (!grade) {
        return res.status(404).json({ message: `Grade not found (id: ${finalGradeId})` });
      }
    }

    const finalLessonId = Number(lessonId || LessonId || 0) || null;

    if (finalLessonId) {
      const lesson = await Lesson.findByPk(finalLessonId);
      if (!lesson) {
        return res.status(404).json({ message: `Lesson not found (id: ${finalLessonId})` });
      }
      if (lesson.TopicId && lesson.TopicId !== finalTopicId) {
        return res.status(400).json({ message: 'Lesson does not belong to selected topic' });
      }
    }

    const content = await Content.create({
      title,
      type,
      description,
      videoUrl,
      videoFile,
      thumbnail,
      readingMaterial,
      duration,
      isPremium,
      order,
      tags,
      metadata,
      TopicId: finalTopicId,
      SubjectId: finalSubjectId,
      GradeId: finalGradeId,
      LessonId: finalLessonId,
      isPublished: isPublished !== undefined ? isPublished : true,
      createdBy: req.user.id
    });

    // Notify students and teachers about new content uploads
    try {
      const studentWhere = { role: 'student' };
      if (finalGradeId) {
        const targetGrade = await Grade.findByPk(finalGradeId, { attributes: ['id', 'level'] });
        studentWhere[Op.or] = [
          { GradeId: finalGradeId },
          ...(targetGrade?.level ? [{ grade: targetGrade.level }] : [])
        ];
      }
      
      const students = await User.findAll({
        where: studentWhere,
        attributes: ['id']
      });
      const teachers = await User.findAll({
        where: {
          role: 'teacher',
          isActive: true,
          isDeleted: false,
          id: { [Op.ne]: req.user.id }
        },
        attributes: ['id']
      });
      
      if (students.length > 0 || teachers.length > 0) {
        const typeLabel = type === 'reading'
          ? 'New Notes Uploaded'
          : type === 'video'
            ? 'New Video Uploaded'
            : 'New Study Material Uploaded';

        await Notification.bulkCreate([
          ...students.map((student) => ({
            userId: student.id,
            senderId: req.user.id,
            type: 'announcement',
            title: typeLabel,
            message: `"${title}" has been uploaded to your classroom library.`,
            data: { contentId: content.id, contentType: type, gradeId: finalGradeId }
          })),
          ...teachers.map((teacher) => ({
            userId: teacher.id,
            senderId: req.user.id,
            type: 'announcement',
            title: typeLabel,
            message: `"${title}" has been uploaded and is now available for students.`,
            data: { contentId: content.id, contentType: type, gradeId: finalGradeId }
          }))
        ]);
      }
    } catch (notifErr) {
      console.error('New content notification error:', notifErr);
    }

    res.status(201).json({
      success: true,
      message: 'Content created successfully',
      content
    });
  } catch (error) {
    console.error('Create content error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateContent = async (req, res) => {
  try {
    const content = await Content.findByPk(req.params.id);

    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }

    const {
      title,
      description,
      videoUrl,
      readingMaterial,
      duration,
      isPremium,
      isPublished,
      order,
      tags,
      metadata,
      topicId,
      TopicId,
      lessonId,
      LessonId,
      gradeId,
      GradeId,
      subjectId,
      SubjectId
    } = req.body;

    const nextTopicId = topicId !== undefined || TopicId !== undefined
      ? Number(topicId || TopicId || 0) || null
      : content.TopicId;
    const nextSubjectId = subjectId !== undefined || SubjectId !== undefined
      ? Number(subjectId || SubjectId || 0) || null
      : content.SubjectId;
    const nextGradeId = gradeId !== undefined || GradeId !== undefined
      ? Number(gradeId || GradeId || 0) || null
      : content.GradeId;

    if (nextTopicId) {
      const topic = await Topic.findByPk(nextTopicId);
      if (!topic) {
        return res.status(404).json({ message: `Topic not found (id: ${nextTopicId})` });
      }
      if (nextSubjectId && topic.SubjectId !== nextSubjectId) {
        return res.status(400).json({ message: 'Topic does not belong to selected subject' });
      }
      content.TopicId = nextTopicId;
      content.SubjectId = nextSubjectId || topic.SubjectId;
    } else if (nextSubjectId !== undefined) {
      content.SubjectId = nextSubjectId;
    }

    if (lessonId !== undefined || LessonId !== undefined) {
      const nextLessonId = Number(lessonId || LessonId || 0) || null;
      if (nextLessonId) {
        const lesson = await Lesson.findByPk(nextLessonId);
        if (!lesson) {
          return res.status(404).json({ message: `Lesson not found (id: ${nextLessonId})` });
        }
        if (content.TopicId && lesson.TopicId && lesson.TopicId !== content.TopicId) {
          return res.status(400).json({ message: 'Lesson does not belong to selected topic' });
        }
      }
      content.LessonId = nextLessonId;
    }

    if (nextGradeId !== undefined) {
      content.GradeId = nextGradeId;
    }

    if (title !== undefined) content.title = title;
    if (description !== undefined) content.description = description;
    if (videoUrl !== undefined) content.videoUrl = videoUrl;
    if (readingMaterial !== undefined) content.readingMaterial = readingMaterial;
    if (duration !== undefined) content.duration = duration;
    if (isPremium !== undefined) content.isPremium = isPremium;
    if (isPublished !== undefined) content.isPublished = isPublished;
    if (order !== undefined) content.order = order;
    if (tags !== undefined) content.tags = tags;
    if (metadata !== undefined) content.metadata = { ...content.metadata, ...metadata };

    await content.save();

    res.json({
      success: true,
      message: 'Content updated successfully',
      content
    });
  } catch (error) {
    console.error('Update content error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteContent = async (req, res) => {
  try {
    const content = await Content.findByPk(req.params.id);

    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }

    await content.destroy();

    res.json({ success: true, message: 'Content deleted successfully' });
  } catch (error) {
    console.error('Delete content error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getContentProgress = async (req, res) => {
  try {
    const progress = await Progress.findOne({
      where: {
        ContentId: req.params.id,
        UserId: req.user.id
      }
    });

    res.json(progress || { watchTime: 0, completed: false });
  } catch (error) {
    console.error('Get content progress error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const incrementViews = async (req, res) => {
  try {
    await Content.increment('views', {
      by: 1,
      where: { id: req.params.id }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Increment views error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const toggleLike = async (req, res) => {
  try {
    const contentId = req.params.id;
    const userId = req.user.id;

    const existingLike = await Like.findOne({
      where: {
        ContentId: contentId,
        UserId: userId
      }
    });

    if (existingLike) {
      await existingLike.destroy();
      await Content.decrement('likes', { by: 1, where: { id: contentId } });
      res.json({ liked: false });
    } else {
      await Like.create({
        ContentId: contentId,
        UserId: userId
      });
      await Content.increment('likes', { by: 1, where: { id: contentId } });
      
      // Notify creator about the like
      try {
        const content = await Content.findByPk(contentId);
        if (content && content.createdBy !== userId) {
          await createNotification(
            content.createdBy,
            'like',
            'Someone liked your content! ❤️',
            `${req.user.name} liked your lesson "${content.title}"`,
            { contentId, likedBy: userId }
          );
        }
      } catch (notifErr) {
        console.error('Like notification error:', notifErr);
      }
      
      res.json({ liked: true });
    }
  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const addComment = async (req, res) => {
  try {
    const { text } = req.body;

    const comment = await Comment.create({
      text,
      ContentId: req.params.id,
      UserId: req.user.id
    });

    const commentWithUser = await Comment.findByPk(comment.id, {
      include: [{
        model: User,
        attributes: ['id', 'name', 'avatar']
      }, {
        model: Content,
        attributes: ['id', 'title', 'createdBy']
      }]
    });

    // Notify content creator
    try {
      if (commentWithUser.Content && commentWithUser.Content.createdBy !== req.user.id) {
        await createNotification(
          commentWithUser.Content.createdBy,
          'comment',
          'New Comment on your Lesson! 💬',
          `${req.user.name} commented on "${commentWithUser.Content.title}": "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`,
          { contentId: commentWithUser.Content.id, commentId: comment.id }
        );
      }
    } catch (notifErr) {
      console.error('Comment notification error:', notifErr);
    }

    res.status(201).json(commentWithUser);
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getComments = async (req, res) => {
  try {
    const comments = await Comment.findAll({
      where: { ContentId: req.params.id },
      include: [{
        model: User,
        attributes: ['id', 'name', 'avatar']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json(comments);
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findOne({
      where: {
        id: req.params.commentId,
        ContentId: req.params.id
      }
    });

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user owns the comment or is admin
    if (comment.UserId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await comment.destroy();

    res.json({ success: true, message: 'Comment deleted' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const toggleBookmark = async (req, res) => {
  try {
    const contentId = req.params.id;
    const userId = req.user.id;

    const existingBookmark = await Bookmark.findOne({
      where: {
        ContentId: contentId,
        UserId: userId
      }
    });

    if (existingBookmark) {
      await existingBookmark.destroy();
      res.json({ bookmarked: false });
    } else {
      await Bookmark.create({
        ContentId: contentId,
        UserId: userId
      });
      res.json({ bookmarked: true });
    }
  } catch (error) {
    console.error('Toggle bookmark error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getRecommendedContent = async (req, res) => {
  try {
    // Get content based on user's grade and watch history
    const user = await User.findByPk(req.user.id);
    const studentGradeId = req.user?.role === 'student'
      ? await resolveStudentGradeId(req.user)
      : null;

    const recommended = await Content.findAll({
      where: {
        isPublished: true,
        ...(studentGradeId ? {
          [Op.or]: [{ GradeId: studentGradeId }, { GradeId: null }]
        } : {})
      },
      include: [{
        model: Topic,
        include: [{
          model: Subject,
          required: false,
          where: user.grade ? { GradeId: user.grade } : undefined
        }]
      }],
      limit: 10,
      order: [['views', 'DESC']]
    });

    res.json(recommended);
  } catch (error) {
    console.error('Get recommended content error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getTrendingContent = async (req, res) => {
  try {
    const studentGradeId = req.user?.role === 'student'
      ? await resolveStudentGradeId(req.user)
      : null;
    const trending = await Content.findAll({
      where: {
        isPublished: true,
        ...(studentGradeId ? {
          [Op.or]: [{ GradeId: studentGradeId }, { GradeId: null }]
        } : {})
      },
      include: [
        { model: Topic, include: [Subject] },
        { model: Subject },
        { model: Grade },
        { model: User, as: 'creator', attributes: ['id', 'name', 'avatar'] }
      ],
      limit: 10,
      order: [
        ['views', 'DESC'],
        ['likes', 'DESC']
      ]
    });

    res.json(trending);
  } catch (error) {
    console.error('Get trending content error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const searchContent = async (req, res) => {
  try {
    const { q } = req.query;
    const studentGradeId = req.user?.role === 'student'
      ? await resolveStudentGradeId(req.user)
      : null;

    const contents = await Content.findAll({
      where: {
        [Op.or]: [
          { title: { [Op.like]: `%${q}%` } },
          { description: { [Op.like]: `%${q}%` } },
          { tags: { [Op.like]: `%${q}%` } }
        ],
        isPublished: true,
        ...(studentGradeId ? {
          [Op.or]: [{ GradeId: studentGradeId }, { GradeId: null }]
        } : {})
      },
      include: [{
        model: Topic,
        include: [Subject]
      }],
      limit: 20
    });

    res.json(contents);
  } catch (error) {
    console.error('Search content error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getClassVideos = async (req, res) => {
  try {
    const gradeInput = Number(req.params.grade || req.user.grade || 0) || null;
    let gradeId = null;

    if (gradeInput) {
      const grade = await Grade.findOne({
        where: {
          [Op.or]: [{ id: gradeInput }, { level: gradeInput }]
        }
      });
      gradeId = grade?.id || null;
    }

    const videos = await Content.findAll({
      where: {
        type: 'video',
        isPublished: true
      },
      include: [
        { model: Grade },
        { model: Subject },
        { model: Topic, include: [Subject] },
        { model: User, as: 'creator', attributes: ['id', 'name', 'avatar'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: 50
    });

    const filtered = videos.filter((video) => {
      if (!gradeId) return true;
      const byContent = !video.GradeId || video.GradeId === gradeId;
      const subjectGrade = video.Subject?.GradeId || video.Topic?.Subject?.GradeId || null;
      const bySubject = !subjectGrade || subjectGrade === gradeId;
      return byContent && bySubject;
    });

    const normalized = filtered.slice(0, 12).map((video) => ({
      ...video.toJSON(),
      subjectName: video.Subject?.name || video.Topic?.Subject?.name || 'General',
      topicName: video.Topic?.name || 'General',
      thumbnail: video.thumbnail || video.Topic?.thumbnail || null
    }));

    res.json(normalized);
  } catch (error) {
    console.error('Get class videos error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getContents,
  getContent,
  createContent,
  updateContent,
  deleteContent,
  getContentProgress,
  incrementViews,
  toggleLike,
  addComment,
  getComments,
  deleteComment,
  toggleBookmark,
  getRecommendedContent,
  getTrendingContent,
  searchContent,
  getClassVideos
};
