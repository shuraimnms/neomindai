// ============================================
// Admin Routes
// ============================================

const express = require('express');
const router = express.Router();
const {
  getAdminDashboard,
  getAllStudents,
  toggleStudentStatus,
  getStudentDetails
} = require('../controllers/admin.controller');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
  createBook,
  updateBook,
  deleteBook,
  getAllBooks: getAllBooksAdmin,
  getBookById
} = require('../controllers/library.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

// All routes require admin role
router.use(protect, restrictTo('admin'));

// Dashboard
router.get('/dashboard', getAdminDashboard);

// Student management
router.get('/students', getAllStudents);
router.get('/students/:id', getStudentDetails);
router.put('/students/:id/toggle', toggleStudentStatus);

// -------------------------
// Admin Library (Books)
// -------------------------
const UPLOAD_DIR = path.join(__dirname, '../../uploads/books');
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

const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB

router.get('/library', getAllBooksAdmin);
router.post('/library', upload.single('file'), createBook);
router.get('/library/:id', getBookById);
router.put('/library/:id', upload.single('file'), updateBook);
router.delete('/library/:id', deleteBook);

// (Assignments removed)

module.exports = router;