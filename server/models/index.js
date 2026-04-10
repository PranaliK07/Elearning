const User = require('./User');
const Grade = require('./Grade');
const Subject = require('./Subject');
const Topic = require('./Topic');
const Lesson = require('./Lesson');
const Content = require('./Content');
const Quiz = require('./Quiz');
const Progress = require('./Progress');
const Achievement = require('./Achievement');
const WatchTime = require('./WatchTime');
const Announcement = require('./Announcement');
const Comment = require('./Comment');
const Like = require('./Like');
const Bookmark = require('./Bookmark');
const Notification = require('./Notification');
const Assignment = require('./Assignment');
const Submission = require('./Submission');
const RoleAccess = require('./RoleAccess');
const ClassCommunication = require('./ClassCommunication');
const sequelize = require('../config/database');
const Feedback = require('./Feedback');
const Attendance = require('./Attendance');

// Grade Associations
Grade.hasMany(Subject, { onDelete: 'CASCADE' });
Subject.belongsTo(Grade);

// Subject Associations
Subject.hasMany(Topic, { onDelete: 'CASCADE' });
Topic.belongsTo(Subject);

// Topic Associations
Topic.hasMany(Content, { onDelete: 'CASCADE' });
Content.belongsTo(Topic);
Topic.hasMany(Quiz, { onDelete: 'CASCADE' });
Quiz.belongsTo(Topic);
Topic.hasMany(Lesson, { onDelete: 'CASCADE' });
Lesson.belongsTo(Topic);

// Lesson Associations
Lesson.hasMany(Content, { onDelete: 'CASCADE' });
Content.belongsTo(Lesson);
Lesson.hasMany(Quiz, { onDelete: 'CASCADE' });
Quiz.belongsTo(Lesson);
Lesson.hasMany(Assignment, { onDelete: 'CASCADE' });
Assignment.belongsTo(Lesson);

// User Associations
User.belongsTo(Grade);
Grade.hasMany(User, { foreignKey: 'GradeId', onDelete: 'SET NULL' });
User.belongsTo(User, { as: 'parent', foreignKey: 'ParentId' });
User.hasMany(User, { as: 'children', foreignKey: 'ParentId' });
User.hasMany(ClassCommunication, { as: 'sentCommunications', foreignKey: 'teacherId', onDelete: 'CASCADE' });
User.hasMany(Progress, { onDelete: 'CASCADE' });
User.belongsToMany(Achievement, { through: 'UserAchievements' });
User.hasMany(WatchTime, { onDelete: 'CASCADE' });
User.hasMany(Comment, { onDelete: 'CASCADE' });
User.hasMany(Like, { onDelete: 'CASCADE' });
User.hasMany(Bookmark, { onDelete: 'CASCADE' });
User.hasMany(Notification, { as: 'ReceivedNotifications', foreignKey: 'userId' });
User.hasMany(Notification, { as: 'SentNotifications', foreignKey: 'senderId' });

// Content Associations
Content.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });
Content.hasMany(Progress, { onDelete: 'CASCADE' });
Content.hasMany(WatchTime, { onDelete: 'CASCADE' });
Content.hasMany(Comment, { onDelete: 'CASCADE' });
Content.hasMany(Like, { onDelete: 'CASCADE' });
Content.hasMany(Bookmark, { onDelete: 'CASCADE' });
Content.belongsTo(Grade, { foreignKey: 'GradeId' });
Content.belongsTo(Subject, { foreignKey: 'SubjectId' });
Grade.hasMany(Content, { foreignKey: 'GradeId' });
Subject.hasMany(Content, { foreignKey: 'SubjectId' });

// Lesson grade/subject associations
Lesson.belongsTo(Grade, { foreignKey: 'GradeId' });
Lesson.belongsTo(Subject, { foreignKey: 'SubjectId' });
Grade.hasMany(Lesson, { foreignKey: 'GradeId' });
Subject.hasMany(Lesson, { foreignKey: 'SubjectId' });

// Quiz Associations
Quiz.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });
Quiz.hasMany(Progress, { onDelete: 'CASCADE' });

// Progress Associations
Progress.belongsTo(User);
Progress.belongsTo(Content);
Progress.belongsTo(Quiz);

// WatchTime Associations
WatchTime.belongsTo(User);
WatchTime.belongsTo(Content);

// Achievement Associations
Achievement.belongsToMany(User, { through: 'UserAchievements' });

// Comment Associations
Comment.belongsTo(User);
Comment.belongsTo(Content);
Comment.hasMany(Comment, { as: 'Replies', foreignKey: 'parentId' });

// Like Associations
Like.belongsTo(User);
Like.belongsTo(Content);

// Bookmark Associations
Bookmark.belongsTo(User);
Bookmark.belongsTo(Content);

// Notification Associations
Notification.belongsTo(User, { as: 'recipient', foreignKey: 'userId' });
Notification.belongsTo(User, { as: 'sender', foreignKey: 'senderId' });

Announcement.belongsTo(User, { as: 'author' });

// Assignment Associations
Assignment.belongsTo(User, { as: 'teacher', foreignKey: 'teacherId' });
Assignment.belongsTo(Subject, { foreignKey: 'subjectId' });
Assignment.belongsTo(Grade, { foreignKey: 'gradeId' });
Assignment.hasMany(Submission, { foreignKey: 'assignmentId', onDelete: 'CASCADE' });

// Submission Associations
Submission.belongsTo(Assignment, { foreignKey: 'assignmentId' });
Submission.belongsTo(User, { as: 'student', foreignKey: 'studentId' });

// Class communication associations
ClassCommunication.belongsTo(User, { as: 'teacher', foreignKey: 'teacherId' });
ClassCommunication.belongsTo(Grade, { foreignKey: 'gradeId' });
Grade.hasMany(ClassCommunication, { foreignKey: 'gradeId' });

// Feedback associations (teacher/admin -> student)
User.hasMany(Feedback, { as: 'receivedFeedback', foreignKey: 'studentId', onDelete: 'CASCADE' });
User.hasMany(Feedback, { as: 'givenFeedback', foreignKey: 'authorId', onDelete: 'CASCADE' });
Feedback.belongsTo(User, { as: 'student', foreignKey: 'studentId' });
Feedback.belongsTo(User, { as: 'author', foreignKey: 'authorId' });

// Attendance associations
Attendance.belongsTo(User, { as: 'student', foreignKey: 'studentId' });
Attendance.belongsTo(User, { as: 'markedBy', foreignKey: 'markedById' });
Attendance.belongsTo(Grade, { foreignKey: 'gradeId' });
Grade.hasMany(Attendance, { foreignKey: 'gradeId', onDelete: 'CASCADE' });
User.hasMany(Attendance, { as: 'attendance', foreignKey: 'studentId', onDelete: 'CASCADE' });

module.exports = {
  sequelize,
  User,
  Grade,
  Subject,
  Topic,
  Lesson,
  Content,
  Quiz,
  Progress,
  Achievement,
  WatchTime,
  Announcement,
  Comment,
  Like,
  Bookmark,
  Notification,
  Assignment,
  Submission,
  RoleAccess,
  ClassCommunication,
  Feedback,
  Attendance
};
