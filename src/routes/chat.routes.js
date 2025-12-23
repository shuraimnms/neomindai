const express = require('express')
const router = express.Router()
const { handleQuery } = require('../controllers/chat.controller')
const { protect } = require('../middleware/auth.middleware')

// Protected chat endpoint (POST /api/chat/query)
router.post('/query', protect, handleQuery)

module.exports = router
