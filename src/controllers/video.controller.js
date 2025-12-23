// ============================================
// Video Controller
// ============================================

const Video = require('../models/Video');
const { Op } = require('sequelize');

// @desc    Get all videos (with pagination)
// @route   GET /api/videos
// @access  Private (students & admin)
const getAllVideos = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;
    
    // Build search conditions
    const whereClause = {};
    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    // Get videos with pagination
    const { count, rows: videos } = await Video.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });
    
    // Calculate total pages
    const totalPages = Math.ceil(count / limit);
    
    res.status(200).json({
      status: 'success',
      message: 'Videos fetched successfully',
      data: {
        videos,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
    
  } catch (error) {
    console.error('Get videos error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch videos'
    });
  }
};

// @desc    Get single video
// @route   GET /api/videos/:id
// @access  Private (students & admin)
const getVideoById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const video = await Video.findByPk(id);
    
    if (!video) {
      return res.status(404).json({
        status: 'error',
        message: 'Video not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Video fetched successfully',
      data: { video }
    });
    
  } catch (error) {
    console.error('Get video error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch video'
    });
  }
};

// @desc    Create new video (Admin only)
// @route   POST /api/videos
// @access  Private (Admin only)
const createVideo = async (req, res) => {
  try {
    const { title, description, video_url, thumbnail_url, duration } = req.body;
    
    // Validate required fields
    if (!title || !video_url) {
      return res.status(400).json({
        status: 'error',
        message: 'Title and video URL are required'
      });
    }
    
    // Create video
    const video = await Video.create({
      title,
      description: description || '',
      video_url,
      thumbnail_url: thumbnail_url || '',
      duration: duration || '00:00'
    });
    
    res.status(201).json({
      status: 'success',
      message: 'Video created successfully',
      data: { video }
    });
    
  } catch (error) {
    console.error('Create video error:', error);
    
    // Handle validation errors
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map(err => err.message);
      return res.status(400).json({
        status: 'error',
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to create video'
    });
  }
};

// @desc    Update video (Admin only)
// @route   PUT /api/videos/:id
// @access  Private (Admin only)
const updateVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, video_url, thumbnail_url, duration } = req.body;
    
    // Find video
    const video = await Video.findByPk(id);
    if (!video) {
      return res.status(404).json({
        status: 'error',
        message: 'Video not found'
      });
    }
    
    // Update video
    await video.update({
      title: title || video.title,
      description: description !== undefined ? description : video.description,
      video_url: video_url || video.video_url,
      thumbnail_url: thumbnail_url !== undefined ? thumbnail_url : video.thumbnail_url,
      duration: duration || video.duration
    });
    
    res.status(200).json({
      status: 'success',
      message: 'Video updated successfully',
      data: { video }
    });
    
  } catch (error) {
    console.error('Update video error:', error);
    
    // Handle validation errors
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map(err => err.message);
      return res.status(400).json({
        status: 'error',
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to update video'
    });
  }
};

// @desc    Delete video (Admin only)
// @route   DELETE /api/videos/:id
// @access  Private (Admin only)
const deleteVideo = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find video
    const video = await Video.findByPk(id);
    if (!video) {
      return res.status(404).json({
        status: 'error',
        message: 'Video not found'
      });
    }
    
    // Delete video
    await video.destroy();
    
    res.status(200).json({
      status: 'success',
      message: 'Video deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete video error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete video'
    });
  }
};

module.exports = {
  getAllVideos,
  getVideoById,
  createVideo,
  updateVideo,
  deleteVideo
};