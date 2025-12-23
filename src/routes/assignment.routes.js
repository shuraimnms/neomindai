// ============================================
// Assignment Routes (Student-facing)
// Mounted at /api/assignments
// ============================================

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const {
  getAssignmentsForStudent,
  getAssignmentForStudentById,
  submitAssignment
} = require('../controllers/assignment.controller');

const { suggestImprovement } = require('../controllers/assignment.controller');

// Upload dir for submissions
const UPLOAD_DIR = path.join(__dirname, '../../uploads/submissions');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    const safe = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    cb(null, safe);
  }
});

const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

// All routes require authenticated student role
router.use(protect, restrictTo('student'));

// List assignments for student
router.get('/', getAssignmentsForStudent);

// Get single assignment
router.get('/:id', getAssignmentForStudentById);

// Submit assignment (text + optional file)
router.post('/:id/submit', upload.single('file'), submitAssignment);

// Suggest improvement (AI-like) for student's text answer
router.post('/:id/suggest', express.json(), suggestImprovement);

module.exports = router;
