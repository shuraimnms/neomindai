const express = require('express');
const router = express.Router();
const {
  getAllBooks,
  getBookById,
  downloadBook
} = require('../controllers/library.controller');

// Public library routes (students)
router.get('/', getAllBooks);
router.get('/:id', getBookById);
router.get('/:id/download', downloadBook);

module.exports = router;
