const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');
const Book = require('../models/Book');

const UPLOAD_DIR = path.join(__dirname, '../../uploads/books');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Public: Get all books (students)
const getAllBooks = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', category = '' } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { author: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }
    if (category) where.category = { [Op.iLike]: `%${category}%` };

    const { count, rows } = await Book.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    res.status(200).json({
      status: 'success',
      message: 'Books fetched',
      data: { books: rows, pagination: { total: count, page: parseInt(page), limit: parseInt(limit) } }
    });
  } catch (err) {
    console.error('Get books error', err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch books' });
  }
};

// Public: Get single book
const getBookById = async (req, res) => {
  try {
    const { id } = req.params;
    const book = await Book.findByPk(id);
    if (!book) return res.status(404).json({ status: 'error', message: 'Book not found' });
    res.status(200).json({ status: 'success', data: { book } });
  } catch (err) {
    console.error('Get book error', err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch book' });
  }
};

// Public: Download or redirect to external link
const downloadBook = async (req, res) => {
  try {
    const { id } = req.params;
    const book = await Book.findByPk(id);
    if (!book) return res.status(404).json({ status: 'error', message: 'Book not found' });

    if (book.external_link) {
      return res.redirect(book.external_link);
    }

    if (book.file_url) {
      const filePath = path.isAbsolute(book.file_url) ? book.file_url : path.join(UPLOAD_DIR, path.basename(book.file_url));
      if (fs.existsSync(filePath)) return res.download(filePath, `${book.title}.pdf`);
      return res.status(404).json({ status: 'error', message: 'File not found on server' });
    }

    return res.status(400).json({ status: 'error', message: 'No file or external link available' });
  } catch (err) {
    console.error('Download book error', err);
    res.status(500).json({ status: 'error', message: 'Failed to download book' });
  }
};

// Admin: Create book (expects fields + optional file upload handled by multer)
const createBook = async (req, res) => {
  try {
    const { title, author, description, category, external_link } = req.body;

    if (!title) return res.status(400).json({ status: 'error', message: 'Title is required' });

    let file_url = null;
    if (req.file) {
      // store relative path
      file_url = `/uploads/books/${req.file.filename}`;
    }

    const book = await Book.create({
      title,
      author: author || '',
      description: description || '',
      category: category || '',
      file_url,
      external_link: external_link || null
    });

    res.status(201).json({ status: 'success', message: 'Book created', data: { book } });
  } catch (err) {
    console.error('Create book error', err);
    res.status(500).json({ status: 'error', message: 'Failed to create book' });
  }
};

// Admin: Update book
const updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    const book = await Book.findByPk(id);
    if (!book) return res.status(404).json({ status: 'error', message: 'Book not found' });

    const { title, author, description, category, external_link } = req.body;
    let file_url = book.file_url;
    if (req.file) {
      // remove old file if present
      if (book.file_url) {
        const oldPath = path.join(UPLOAD_DIR, path.basename(book.file_url));
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      file_url = `/uploads/books/${req.file.filename}`;
    }

    await book.update({
      title: title || book.title,
      author: author !== undefined ? author : book.author,
      description: description !== undefined ? description : book.description,
      category: category !== undefined ? category : book.category,
      file_url,
      external_link: external_link !== undefined ? external_link : book.external_link
    });

    res.status(200).json({ status: 'success', message: 'Book updated', data: { book } });
  } catch (err) {
    console.error('Update book error', err);
    res.status(500).json({ status: 'error', message: 'Failed to update book' });
  }
};

// Admin: Delete book
const deleteBook = async (req, res) => {
  try {
    const { id } = req.params;
    const book = await Book.findByPk(id);
    if (!book) return res.status(404).json({ status: 'error', message: 'Book not found' });

    if (book.file_url) {
      const filePath = path.join(UPLOAD_DIR, path.basename(book.file_url));
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await book.destroy();
    res.status(200).json({ status: 'success', message: 'Book deleted' });
  } catch (err) {
    console.error('Delete book error', err);
    res.status(500).json({ status: 'error', message: 'Failed to delete book' });
  }
};

module.exports = {
  getAllBooks,
  getBookById,
  downloadBook,
  createBook,
  updateBook,
  deleteBook
};
