const { Topic, Subject, Content, Quiz } = require('../models');

const getTopics = async (req, res) => {
  try {
    const { subjectId } = req.query;
    const where = {};
    
    if (subjectId) where.SubjectId = subjectId;

    const topics = await Topic.findAll({
      where,
      include: [Subject],
      order: [['order', 'ASC']]
    });

    res.json(topics);
  } catch (error) {
    console.error('Get topics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getTopic = async (req, res) => {
  try {
    const topic = await Topic.findByPk(req.params.id, {
      include: [Subject, Content, Quiz]
    });

    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    res.json(topic);
  } catch (error) {
    console.error('Get topic error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const createTopic = async (req, res) => {
  try {
    const { name, description, thumbnail, subjectId, order, estimatedTime } = req.body;

    const subject = await Subject.findByPk(subjectId);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    const topic = await Topic.create({
      name,
      description,
      thumbnail,
      order,
      estimatedTime,
      SubjectId: subjectId
    });

    res.status(201).json({
      success: true,
      message: 'Topic created successfully',
      topic
    });
  } catch (error) {
    console.error('Create topic error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateTopic = async (req, res) => {
  try {
    const topic = await Topic.findByPk(req.params.id);

    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    const { name, description, thumbnail, order, estimatedTime, isActive } = req.body;

    if (name !== undefined) topic.name = name;
    if (description !== undefined) topic.description = description;
    if (thumbnail !== undefined) topic.thumbnail = thumbnail;
    if (order !== undefined) topic.order = order;
    if (estimatedTime !== undefined) topic.estimatedTime = estimatedTime;
    if (isActive !== undefined) topic.isActive = isActive;

    await topic.save();

    res.json({
      success: true,
      message: 'Topic updated successfully',
      topic
    });
  } catch (error) {
    console.error('Update topic error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteTopic = async (req, res) => {
  try {
    const topic = await Topic.findByPk(req.params.id);

    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    await topic.destroy();

    res.json({ success: true, message: 'Topic deleted successfully' });
  } catch (error) {
    console.error('Delete topic error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getTopicContents = async (req, res) => {
  try {
    const topic = await Topic.findByPk(req.params.id);
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    const contents = await Content.findAll({
      where: { TopicId: req.params.id },
      order: [['order', 'ASC'], ['createdAt', 'DESC']]
    });

    res.json(contents);
  } catch (error) {
    console.error('Get topic contents error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getTopicQuizzes = async (req, res) => {
  try {
    const topic = await Topic.findByPk(req.params.id, {
      include: [Quiz]
    });

    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    const quizzes = topic.Quizzes.map(quiz => {
      const qData = quiz.toJSON();
      if (qData.questions) {
        if (typeof qData.questions === 'string') {
          try {
            qData.questions = JSON.parse(qData.questions);
          } catch (e) {
            qData.questions = [];
          }
        }
        
        if (Array.isArray(qData.questions)) {
          qData.questions = qData.questions.map(q => ({
            ...q,
            correctAnswer: undefined
          }));
        } else {
          qData.questions = [];
        }
      } else {
        qData.questions = [];
      }
      return qData;
    });

    res.json(quizzes);
  } catch (error) {
    console.error('Get topic quizzes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const reorderTopics = async (req, res) => {
  try {
    const { topics } = req.body; // Array of { id, order }

    for (const item of topics) {
      await Topic.update(
        { order: item.order },
        { where: { id: item.id } }
      );
    }

    res.json({ success: true, message: 'Topics reordered successfully' });
  } catch (error) {
    console.error('Reorder topics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getTopics,
  getTopic,
  createTopic,
  updateTopic,
  deleteTopic,
  getTopicContents,
  getTopicQuizzes,
  reorderTopics
};
