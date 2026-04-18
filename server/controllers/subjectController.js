const { Subject, Grade, Topic, Content, Quiz, Lesson } = require('../models');

const getSubjects = async (req, res) => {
  try {
    const { gradeId } = req.query;
    const where = {};
    
    if (gradeId) where.GradeId = gradeId;

    const subjects = await Subject.findAll({
      where,
      include: [
        { model: Grade },
        {
          model: Topic,
          include: [
            { 
              model: Content, 
              where: { isPublished: true },
              required: false
            },
            { 
              model: Quiz, 
              where: { isPublished: true },
              required: false
            },
            {
              model: Lesson,
              include: [
                { 
                  model: Content, 
                  where: { isPublished: true },
                  required: false
                },
                { 
                  model: Quiz, 
                  where: { isPublished: true },
                  required: false
                }
              ]
            }
          ]
        },
        { 
          model: Content, 
          where: { isPublished: true },
          required: false
        }
      ],
      order: [['order', 'ASC']]
    });

    // Transform to include counts
    const processedSubjects = subjects.map(subject => {
      const s = subject.toJSON();
      let videoCount = 0;
      let quizCount = 0;
      let topicCount = s.Topics?.length || 0;

      const processContent = (items) => {
        if (!items || !Array.isArray(items)) return;
        items.forEach(c => {
          if (c.type === 'video') videoCount++;
          if (c.type === 'quiz') quizCount++;
        });
      };

      const processQuizzes = (items) => {
        if (!items || !Array.isArray(items)) return;
        quizCount += items.length;
      };

      // 1. Direct Subject Items
      processContent(s.Contents || s.contents);

      // 2. Items from Topics and Lessons
      if (s.Topics) {
        s.Topics.forEach(topic => {
          // Topic Level
          processContent(topic.Contents || topic.contents);
          processQuizzes(topic.Quizzes || topic.quizzes);

          // Lesson Level
          const lessons = topic.Lessons || topic.lessons;
          if (lessons && Array.isArray(lessons)) {
            lessons.forEach(lesson => {
              processContent(lesson.Contents || lesson.contents);
              processQuizzes(lesson.Quizzes || lesson.quizzes);
            });
          }
        });
      }

      return {
        ...s,
        topicCount,
        videoCount,
        quizCount
      };
    });

    res.json(processedSubjects);
  } catch (error) {
    console.error('Get subjects error:', error);
    res.status(500).json({ message: 'Server error', details: error.message, stack: error.stack });
  }
};

const getSubject = async (req, res) => {
  try {
    const subject = await Subject.findByPk(req.params.id, {
      include: [Grade, Topic]
    });

    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    res.json(subject);
  } catch (error) {
    console.error('Get subject error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const createSubject = async (req, res) => {
  try {
    const { name, description, icon, color, gradeId, order } = req.body;

    const grade = await Grade.findByPk(gradeId);
    if (!grade) {
      return res.status(404).json({ message: 'Grade not found' });
    }

    const subject = await Subject.create({
      name,
      description,
      icon,
      color,
      order,
      GradeId: gradeId
    });

    res.status(201).json({
      success: true,
      message: 'Subject created successfully',
      subject
    });
  } catch (error) {
    console.error('Create subject error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateSubject = async (req, res) => {
  try {
    const subject = await Subject.findByPk(req.params.id);

    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    const { name, description, icon, color, order, isActive } = req.body;

    if (name !== undefined) subject.name = name;
    if (description !== undefined) subject.description = description;
    if (icon !== undefined) subject.icon = icon;
    if (color !== undefined) subject.color = color;
    if (order !== undefined) subject.order = order;
    if (isActive !== undefined) subject.isActive = isActive;

    await subject.save();

    res.json({
      success: true,
      message: 'Subject updated successfully',
      subject
    });
  } catch (error) {
    console.error('Update subject error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findByPk(req.params.id);

    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    await subject.destroy();

    res.json({ success: true, message: 'Subject deleted successfully' });
  } catch (error) {
    console.error('Delete subject error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getSubjectTopics = async (req, res) => {
  try {
    const subject = await Subject.findByPk(req.params.id, {
      include: [{
        model: Topic,
        include: [Content, Quiz]
      }]
    });

    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    const subjectData = subject.toJSON();
    if (subjectData.Topics) {
      subjectData.Topics.forEach(topic => {
        if (topic.Quizzes) {
          topic.Quizzes = topic.Quizzes.map(quiz => {
            if (quiz.questions) {
              if (typeof quiz.questions === 'string') {
                try {
                  quiz.questions = JSON.parse(quiz.questions);
                } catch (e) {
                  quiz.questions = [];
                }
              }

              if (Array.isArray(quiz.questions)) {
                // Securely remove correct answers
                quiz.questions = quiz.questions.map(q => ({
                  ...q,
                  correctAnswer: undefined
                }));
              }
            }
            return quiz;
          });
        }
      });
    }

    res.json(subjectData.Topics);
  } catch (error) {
    console.error('Get subject topics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getSubjectStats = async (req, res) => {
  try {
    const subjectId = req.params.id;

    const topicCount = await Topic.count({
      where: { SubjectId: subjectId }
    });

    const contentCount = await Content.count({
      include: [{
        model: Topic,
        where: { SubjectId: subjectId }
      }]
    });

    res.json({
      subjectId,
      topicCount,
      contentCount,
      quizCount: 0 // You can calculate this
    });
  } catch (error) {
    console.error('Get subject stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getSubjects,
  getSubject,
  createSubject,
  updateSubject,
  deleteSubject,
  getSubjectTopics,
  getSubjectStats
};
