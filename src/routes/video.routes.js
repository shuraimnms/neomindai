// ============================================
// Video Routes
// ============================================

const express = require('express');
const router = express.Router();
const {
  getAllVideos,
  getVideoById,
  createVideo,
  updateVideo,
  deleteVideo
} = require('../controllers/video.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

// Public routes (protected but for all authenticated users)
router.get('/', protect, getAllVideos);
router.get('/:id', protect, getVideoById);

// Admin only routes
router.post('/', protect, restrictTo('admin'), createVideo);
router.put('/:id', protect, restrictTo('admin'), updateVideo);
router.delete('/:id', protect, restrictTo('admin'), deleteVideo);

module.exports = router;