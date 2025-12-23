// ============================================
// Health Routes
// ============================================

const express = require('express');
const router = express.Router();

// Detailed health check
router.get('/detailed', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV,
    nodeVersion: process.version
  });
});

module.exports = router;