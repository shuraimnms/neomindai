const User = require('../models/User')
const Video = require('../models/Video')
const { Op } = require('sequelize')
const fetch = require('node-fetch')
const { verifyToken } = require('../config/jwt')

// Basic rule-based processor for chat queries. Returns { answer, sources }
const processQuery = async (user, question) => {
  const q = (question || '').toLowerCase()
  const sources = []

  try {
    // Student profile
    if (q.includes('profile') || q.includes('my profile') || q.includes('account')) {
      if (!user) return { answer: 'Not authenticated. Please log in.', sources }
      const u = await User.findByPk(user.id, { attributes: { exclude: ['password'] } })
      sources.push('/api/student/profile')
      return { answer: `Name: ${u.name}\nEmail: ${u.email}\nRole: ${u.role}`, sources }
    }

    // Count students
    if (q.includes('how many students') || q.includes('students count') || q === 'students') {
      const total = await User.count({ where: { role: 'student' } })
      sources.push('/api/admin/students')
      return { answer: `There are ${total} students registered.`, sources }
    }

    // List students (admin only)
    if (q.includes('list students') || (q.includes('students') && q.includes('list')) ) {
      if (!user || user.role !== 'admin') return { answer: 'You need admin access to list students.', sources }
      const students = await User.findAll({ where: { role: 'student' }, limit: 50, attributes: ['id', 'name', 'email', 'is_active'] })
      sources.push('/api/admin/students')
      const list = students.map(s => `${s.name} <${s.email}>${s.is_active ? '' : ' (inactive)'}`).slice(0, 20).join('\n')
      return { answer: `Students:\n${list}`, sources }
    }

    // Videos
    if (q.includes('video') || q.includes('videos') || q.includes('recent videos')) {
      const vids = await Video.findAll({ order: [['created_at', 'DESC']], limit: 10 })
      sources.push('/api/student/videos')
      const list = vids.map(v => `- ${v.title || v.name || v.url || 'Untitled'}`).slice(0, 10).join('\n')
      return { answer: `Recent videos:\n${list}`, sources }
    }

    // Basic stats (admin)
    if (q.includes('dashboard') || q.includes('stats') || q.includes('how many')) {
      const totalStudents = await User.count({ where: { role: 'student' } })
      const activeStudents = await User.count({ where: { role: 'student', is_active: true } })
      const totalVideos = await Video.count()
      sources.push('/api/admin/dashboard')
      return { answer: `Students: ${totalStudents} (active: ${activeStudents}). Videos: ${totalVideos}.`, sources }
    }

    // Fallback: if OPENAI_API_KEY present, use OpenAI to answer
    if (process.env.OPENAI_API_KEY) {
      try {
        // Build a small context
        const ctx = []
        if (user) {
          const u = await User.findByPk(user.id, { attributes: { exclude: ['password'] } })
          ctx.push(`User: ${u.name} <${u.email}> role=${u.role}`)
        }
        const vids = await Video.findAll({ order: [['created_at', 'DESC']], limit: 5 })
        if (vids.length) ctx.push(`Recent videos: ${vids.map(v => v.title || v.name).join(', ')}`)

        const prompt = `You are Academy assistant. Use the following context to answer user question. Context: ${ctx.join(' | ')}\n\nQuestion: ${question}`

        const resp = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
          },
          body: JSON.stringify({ model: 'gpt-3.5-turbo', messages: [{ role: 'system', content: 'You are a helpful assistant.' }, { role: 'user', content: prompt }], max_tokens: 500 })
        })

        const json = await resp.json()
        const text = json?.choices?.[0]?.message?.content || 'No answer from LLM.'
        sources.push('openai')
        return { answer: text, sources }
      } catch (err) {
        console.error('OpenAI call failed', err)
      }
    }

    // Generic fallback: summary of available data
    const total = await User.count({ where: { role: 'student' } })
    const videosCount = await Video.count()
    sources.push('/api')
    return { answer: `I can report ${total} students and ${videosCount} videos. Ask something specific like "my profile", "recent videos", or "students" (admin).`, sources }

  } catch (error) {
    console.error('Chat processQuery error:', error)
    return { answer: 'Sorry, I could not process that request.', sources }
  }
}

// Express handler for POST /api/chat/query (protected)
const handleQuery = async (req, res) => {
  try {
    const { question } = req.body
    if (!question) return res.status(400).json({ status: 'error', message: 'Question is required' })
    const result = await processQuery(req.user, question)
    res.status(200).json({ status: 'success', data: result })
  } catch (err) {
    console.error('handleQuery error', err)
    res.status(500).json({ status: 'error', message: 'Failed to answer' })
  }
}

module.exports = {
  processQuery,
  handleQuery
}
