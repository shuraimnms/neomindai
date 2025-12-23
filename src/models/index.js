// ============================================
// Models Index - Define all associations
// ============================================

const User = require('./User');
const Assignment = require('./Assignment');
const Question = require('./Question');
const Option = require('./Option');
const Submission = require('./Submission');
const Answer = require('./Answer');
const AssignmentRecipient = require('./AssignmentRecipient');

// Assignment relationships
Assignment.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'creator'
});

Assignment.hasMany(Question, {
  foreignKey: 'assignment_id',
  as: 'questions',
  onDelete: 'CASCADE'
});

Assignment.hasMany(Submission, {
  foreignKey: 'assignment_id',
  as: 'submissions',
  onDelete: 'CASCADE'
});

Assignment.hasMany(AssignmentRecipient, {
  foreignKey: 'assignment_id',
  as: 'recipients',
  onDelete: 'CASCADE'
});

// Question relationships
Question.belongsTo(Assignment, {
  foreignKey: 'assignment_id',
  as: 'assignment'
});

Question.hasMany(Option, {
  foreignKey: 'question_id',
  as: 'options',
  onDelete: 'CASCADE'
});

Question.hasMany(Answer, {
  foreignKey: 'question_id',
  as: 'answers',
  onDelete: 'CASCADE'
});

// Option relationships
Option.belongsTo(Question, {
  foreignKey: 'question_id',
  as: 'question'
});

// Submission relationships
Submission.belongsTo(Assignment, {
  foreignKey: 'assignment_id',
  as: 'assignment'
});

Submission.belongsTo(User, {
  foreignKey: 'student_id',
  as: 'student'
});

Submission.belongsTo(User, {
  foreignKey: 'graded_by',
  as: 'grader'
});

Submission.hasMany(Answer, {
  foreignKey: 'submission_id',
  as: 'answers',
  onDelete: 'CASCADE'
});

// Answer relationships
Answer.belongsTo(Submission, {
  foreignKey: 'submission_id',
  as: 'submission'
});

Answer.belongsTo(Question, {
  foreignKey: 'question_id',
  as: 'question'
});

Answer.belongsTo(User, {
  foreignKey: 'graded_by',
  as: 'grader'
});

// AssignmentRecipient relationships
AssignmentRecipient.belongsTo(Assignment, {
  foreignKey: 'assignment_id',
  as: 'assignment'
});

AssignmentRecipient.belongsTo(User, {
  foreignKey: 'student_id',
  as: 'student'
});

// User relationships (additional for assignments)
User.hasMany(Assignment, {
  foreignKey: 'created_by',
  as: 'createdAssignments'
});

User.hasMany(Submission, {
  foreignKey: 'student_id',
  as: 'submissions'
});

User.hasMany(Submission, {
  foreignKey: 'graded_by',
  as: 'gradedSubmissions'
});

User.hasMany(Answer, {
  foreignKey: 'graded_by',
  as: 'gradedAnswers'
});

User.hasMany(AssignmentRecipient, {
  foreignKey: 'student_id',
  as: 'assignedAssignments'
});

module.exports = {
  User,
  Assignment,
  Question,
  Option,
  Submission,
  Answer,
  AssignmentRecipient
};
