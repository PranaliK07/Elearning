const { Quiz, Progress, Notification, User, Topic, Lesson, Subject, Grade } = require('../models');
const { Op } = require('sequelize');

const normalizeQuestions = (questions) => {
  if (!Array.isArray(questions) || questions.length === 0) {
    return { error: 'At least one question is required' };
  }

  const normalized = [];

  for (let i = 0; i < questions.length; i += 1) {
    const raw = questions[i] || {};
    const questionText = String(raw.question || '').trim();
    
    // Process options: trim and filter out empties, but preserve original if possible
    const rawOptions = Array.isArray(raw.options) ? raw.options : [];
    const options = rawOptions
      .map((opt) => String(opt || '').trim())
      .filter(opt => opt.length > 0);

    if (!questionText) {
      return { error: `Question ${i + 1} text is required` };
    }
    if (options.length < 2) {
      return { error: `Question ${i + 1} needs at least 2 valid options` };
    }

    const rawAnswer = raw.correctAnswer;
    let correctAnswer = null;

    if (rawAnswer !== undefined && rawAnswer !== null) {
      const answerText = String(rawAnswer).trim();
      
      // Check if the answer exactly matches any of our processed options
      if (options.includes(answerText)) {
        correctAnswer = answerText;
      } else {
        // If no exact match (e.g. user sent index or something else), 
        // fallback to logic that checks if it was intended as an index
        const numeric = parseInt(answerText, 10);
        if (!isNaN(numeric) && numeric >= 0 && numeric < options.length) {
            correctAnswer = options[numeric];
        } else if (!isNaN(numeric) && numeric > 0 && numeric <= options.length) {
            correctAnswer = options[numeric - 1];
        }
      }
    }

    if (!correctAnswer) {
      return { error: `Question ${i + 1} must have a correct answer selected from the options` };
    }

    normalized.push({
      id: raw.id || i + 1,
      question: questionText,
      options,
      correctAnswer,
      type: raw.type || 'single'
    });
  }

  return { questions: normalized };
};

const getQuizzes = async (req, res) => {
  try {
  const { topicId, lessonId, page = 1, limit = 10 } = req.query;
  const where = {};
  
  if (topicId) where.TopicId = topicId;
  if (lessonId) where.LessonId = lessonId;

    const quizzes = await Quiz.findAndCountAll({
      where,
      include: [Topic, Lesson],
      limit: parseInt(limit),
      offset: (page - 1) * limit,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      quizzes: quizzes.rows,
      total: quizzes.count,
      page: parseInt(page),
      totalPages: Math.ceil(quizzes.count / limit)
    });
  } catch (error) {
    console.error('Get quizzes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findByPk(req.params.id, {
      include: [Topic, Lesson]
    });

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    const quizData = quiz.toJSON();
    
    // Safety check for questions format
    if (quizData.questions) {
      if (typeof quizData.questions === 'string') {
        try {
          quizData.questions = JSON.parse(quizData.questions);
        } catch (e) {
          console.error('Failed to parse questions JSON for quiz:', req.params.id);
          quizData.questions = [];
        }
      }

      if (Array.isArray(quizData.questions)) {
        quizData.questions = quizData.questions.map(q => ({
          ...q,
          correctAnswer: undefined // Securely remove correct answer
        }));
      } else {
        quizData.questions = [];
      }
    } else {
      quizData.questions = [];
    }

    res.json(quizData);
  } catch (error) {
    console.error('Get quiz error details:', {
      id: req.params.id,
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      message: 'Server error loading quiz details',
      error: error.message 
    });
  }
};

const createQuiz = async (req, res) => {
  try {
    const {
      title,
      description,
      questions,
      timeLimit,
      passingScore,
      maxAttempts,
      topicId,
      lessonId,
      isPublished
    } = req.body;

    const topic = await Topic.findByPk(topicId);
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    const { questions: normalizedQuestions, error: questionError } = normalizeQuestions(questions);
    if (questionError) {
      return res.status(400).json({ message: questionError });
    }

    const quiz = await Quiz.create({
      title,
      description,
      questions: normalizedQuestions,
      timeLimit: timeLimit || 10,
      passingScore: passingScore || 70,
      maxAttempts: maxAttempts || 2,
      TopicId: topicId,
      LessonId: lessonId || null,
      isPublished: isPublished !== undefined ? isPublished : true,
      createdBy: req.user.id
    });

    // Notify students and teachers about the new quiz
    try {
      const topic = await Topic.findByPk(topicId, {
        include: [{ model: Subject, include: [Grade] }]
      });
      const gradeId = topic?.Subject?.GradeId;
      const gradeLevel = topic?.Subject?.Grade?.level;
      
      const students = await User.findAll({
        where: {
          role: 'student',
          ...(gradeId
            ? {
                [Op.or]: [
                  { GradeId: gradeId },
                  ...(gradeLevel ? [{ grade: gradeLevel }] : [])
                ]
              }
            : {})
        },
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
        await Notification.bulkCreate([
          ...students.map((student) => ({
            userId: student.id,
            senderId: req.user.id,
            type: 'quiz_result',
            title: 'New Quiz Uploaded',
            message: `A new quiz "${title}" has been posted in ${topic?.name || 'your class'}.`,
            data: { quizId: quiz.id, topicId, gradeId }
          })),
          ...teachers.map((teacher) => ({
            userId: teacher.id,
            senderId: req.user.id,
            type: 'announcement',
            title: 'Quiz Uploaded',
            message: `A new quiz "${title}" has been uploaded in ${topic?.name || 'your class'}.`,
            data: { quizId: quiz.id, topicId, gradeId }
          }))
        ]);
      }
    } catch (notifErr) {
      console.error('Create quiz notification error:', notifErr);
    }

    res.status(201).json({
      success: true,
      quiz
    });
  } catch (error) {
    console.error('Create quiz error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findByPk(req.params.id);

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    if (req.user.role === 'teacher' && quiz.createdBy !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const {
      title,
      description,
      questions,
      timeLimit,
      passingScore,
      maxAttempts,
      isPublished,
      lessonId
    } = req.body;

    if (title !== undefined) quiz.title = title;
    if (description !== undefined) quiz.description = description;
    if (questions !== undefined) {
      const { questions: normalizedQuestions, error: questionError } = normalizeQuestions(questions);
      if (questionError) {
        return res.status(400).json({ message: questionError });
      }
      quiz.questions = normalizedQuestions;
    }
    if (timeLimit !== undefined) quiz.timeLimit = timeLimit;
    if (passingScore !== undefined) quiz.passingScore = passingScore;
    if (maxAttempts !== undefined) quiz.maxAttempts = maxAttempts;
    if (isPublished !== undefined) quiz.isPublished = isPublished;
    if (lessonId !== undefined) quiz.LessonId = lessonId || null;
    if (req.body.topicId !== undefined) quiz.TopicId = req.body.topicId || null;

    await quiz.save();

    res.json({
      success: true,
      message: 'Quiz updated successfully',
      quiz
    });
  } catch (error) {
    console.error('Update quiz error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findByPk(req.params.id);

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    if (req.user.role === 'teacher' && quiz.createdBy !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await quiz.destroy();

    res.json({ success: true, message: 'Quiz deleted successfully' });
  } catch (error) {
    console.error('Delete quiz error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const startQuiz = async (req, res) => {
  try {
    const quizId = req.params.id;
    const userId = req.user.id;

    const quiz = await Quiz.findByPk(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Check attempts
    const attempts = await Progress.count({
      where: {
        QuizId: quizId,
        UserId: userId
      }
    });

    if (attempts >= quiz.maxAttempts) {
      return res.status(400).json({ message: 'Maximum attempts reached' });
    }

    // Safe questions handling
    let quizQuestions = quiz.questions;
    if (typeof quizQuestions === 'string') {
      try {
        quizQuestions = JSON.parse(quizQuestions);
      } catch (e) {
        quizQuestions = [];
      }
    }

    if (!Array.isArray(quizQuestions)) {
      quizQuestions = [];
    }

    // Create quiz session
    const session = {
      quizId: quiz.id,
      startTime: new Date(),
      timeLimit: quiz.timeLimit,
      questions: quizQuestions.map((q, idx) => ({
        id: q.id || idx,
        question: q.question,
        options: q.options,
        type: q.type || 'multiple'
      }))
    };

    res.json({
      success: true,
      session
    });
  } catch (error) {
    console.error('Start quiz error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const submitQuiz = async (req, res) => {
  try {
    const quizId = req.params.id;
    const userId = req.user.id;

    // Fetch quiz with limit
    const quiz = await Quiz.findByPk(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // ENFORCE ATTEMPT LIMIT
    const existingAttempts = await Progress.count({
      where: {
        QuizId: quizId,
        UserId: userId
      }
    });

    if (existingAttempts >= quiz.maxAttempts) {
      return res.status(403).json({ 
        message: 'Maximum attempts reached',
        maxAttempts: quiz.maxAttempts,
        currentAttempts: existingAttempts
      });
    }

    const { answers, timeSpent } = req.body;

    // ROBUST QUESTION PARSING (Nuclear Fix for multi-encoded JSON)
    let quizQuestions = quiz.questions;
    
    // Attempt 1: Standard Parse
    if (typeof quizQuestions === 'string') {
      try {
        quizQuestions = JSON.parse(quizQuestions);
      } catch (e) {
        console.error('Submit Quiz: Parse 1 failed', e);
      }
    }
    
    // Attempt 2: Double-encoded check
    if (typeof quizQuestions === 'string') {
      try {
        quizQuestions = JSON.parse(quizQuestions);
      } catch (e) {
         console.error('Submit Quiz: Parse 2 failed', e);
      }
    }

    // Safety fallback
    if (!Array.isArray(quizQuestions)) {
      console.error('Submit Quiz: Questions data is not an array after parsing');
      return res.status(500).json({ message: 'Quiz data format error. Please re-save this quiz.' });
    }

    let score = 0;
    const results = [];
    
    // Only iterate if we have a valid array
    quizQuestions.forEach((q, index) => {
      // Validate question object structure
      if (!q || typeof q !== 'object') return;

      const submitted = answers && answers[index] !== undefined && answers[index] !== null
        ? String(answers[index]).trim()
        : '';
        
      const expected = q.correctAnswer !== undefined && q.correctAnswer !== null
        ? String(q.correctAnswer).trim()
        : '';
      
      const isCorrect = expected && submitted === expected;
      if (isCorrect) score++;
      
      results.push({
        question: q.question || `Question ${index + 1}`,
        correct: isCorrect,
        correctAnswer: q.correctAnswer,
        userAnswer: (answers && answers[index]) ?? null
      });
    });

    const totalQuestions = results.length;
    const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
    const passed = percentage >= quiz.passingScore;

    // Save progress
    const progress = await Progress.create({
      UserId: userId,
      QuizId: quizId,
      quizScore: percentage,
      quizAttempts: 1,
      quizPassed: passed,
      lastQuizAttempt: new Date(),
      completed: true
    });

    // Update quiz stats
    const previousAttempts = quiz.attempts || 0;
    const nextAttempts = previousAttempts + 1;
    const nextAvgScore = ((quiz.avgScore || 0) * previousAttempts + percentage) / nextAttempts;
    await Quiz.update(
      { attempts: nextAttempts, avgScore: nextAvgScore },
      { where: { id: quizId } }
    );

    res.json({
      success: true,
      score,
      total: totalQuestions,
      percentage,
      passed,
      results,
      timeSpent
    });
  } catch (error) {
    console.error('Submit quiz error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getQuizResults = async (req, res) => {
  try {
    const results = await Progress.findAll({
      where: {
        QuizId: req.params.id,
        UserId: req.user.id
      },
      order: [['createdAt', 'DESC']]
    });

    res.json(results);
  } catch (error) {
    console.error('Get quiz results error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getQuizLeaderboard = async (req, res) => {
  try {
    const leaderboard = await Progress.findAll({
      where: {
        QuizId: req.params.id,
        quizPassed: true
      },
      include: [{
        model: User,
        attributes: ['id', 'name', 'avatar']
      }],
      order: [['quizScore', 'DESC']],
      limit: 10
    });

    res.json(leaderboard);
  } catch (error) {
    console.error('Get quiz leaderboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getQuizStats = async (req, res) => {
  try {
    const quiz = await Quiz.findByPk(req.params.id);

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    res.json({
      totalAttempts: quiz.attempts,
      averageScore: quiz.avgScore,
      passRate: 0 // Calculate this
    });
  } catch (error) {
    console.error('Get quiz stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getAvailableQuizzes = async (req, res) => {
  try {
    const userGradeLevel = req.user?.grade;
    const userId = req.user?.id ?? 'anonymous';
    console.log(`🔍 Fetching available quizzes for user ${userId}, grade: ${userGradeLevel}`);

    let gradeFilter = undefined;
    if (userGradeLevel) {
      // Allow for string or number comparison
      gradeFilter = { level: userGradeLevel };
    }

    const include = [
      {
        model: Topic,
        required: false, // Keep it left join to catch quizzes without a topic if they exist
        include: [{
          model: Subject,
          required: false,
          include: [{
            model: Grade,
            required: false,
            where: gradeFilter
          }]
        }]
      }
    ];

    const quizzes = await Quiz.findAll({
      where: { isPublished: true },
      include,
      order: [['createdAt', 'DESC']],
      limit: 30
    });

    // If we have a grade filter, we need to filter out quizzes that specifically belong to OTHER grades.
    // Quizzes with no grade affinity (incomplete path) should remain visible.
    let filteredQuizzes = quizzes;
    if (userGradeLevel) {
      filteredQuizzes = quizzes.filter(quiz => {
        // If it COMPLETELY resolves to a grade, enforce that it matches the user's grade.
        const quizGradeLevel = quiz.Topic?.Subject?.Grade?.level;
        if (quizGradeLevel !== undefined && quizGradeLevel !== null) {
          return Number(quizGradeLevel) === Number(userGradeLevel);
        }
        // If the path is incomplete (no grade found in the Topic->Subject path),
        // we show it as a "General" or "Topic-Specific" quiz.
        return true;
      });
    }

    // Securely process quizzes before sending to client
    const processedQuizzes = filteredQuizzes.map(quiz => {
      const qData = quiz.toJSON();
      
      // Safety check and secure questions
      if (qData.questions) {
        if (typeof qData.questions === 'string') {
          try {
            qData.questions = JSON.parse(qData.questions);
          } catch (e) {
            qData.questions = [];
          }
        }

        if (Array.isArray(qData.questions)) {
          // IMPORTANT: Remove correct answers in list view for security
          const sanitizedQuestions = qData.questions.map(q => ({
            ...q,
            correctAnswer: undefined
          }));
          qData.questions = sanitizedQuestions;
          qData.questionCount = sanitizedQuestions.length;
        } else {
          qData.questions = [];
          qData.questionCount = 0;
        }
      } else {
        qData.questions = [];
        qData.questionCount = 0;
      }
      
      return qData;
    });
    
    res.json(processedQuizzes);
  } catch (error) {
    console.error('Get available quizzes error details:', {
      message: error.message,
      stack: error.stack,
      user: { id: req.user?.id, grade: req.user?.grade }
    });
    res.status(500).json({ 
      message: 'Server error loading quizzes',
      error: error.message 
    });
  }
};

module.exports = {
  getQuizzes,
  getQuiz,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  startQuiz,
  submitQuiz,
  getQuizResults,
  getQuizLeaderboard,
  getQuizStats,
  getAvailableQuizzes
};
