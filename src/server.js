// ============================================
// server.js - Academy MVP Backend
// ============================================

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

// Database
const { testConnection, syncDatabase } = require('./config/database');
const seedDatabase = require('./config/seed');

// Models (to set up associations)
require('./models/index');

// Routes
const authRoutes = require('./routes/auth.routes');
const videoRoutes = require('./routes/video.routes');
const studentRoutes = require('./routes/student.routes');
const adminRoutes = require('./routes/admin.routes');
const chatRoutes = require('./routes/chat.routes');
const libraryRoutes = require('./routes/library.routes');

// Auth utilities
const { verifyToken } = require('./config/jwt');

// Initialize Express app
const app = express();

// ========================
// Middleware Configuration
// ========================

// Update CORS configuration (around line 30-35)
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:5173',
      'https://neoxmind.netlify.app',
      'https://your-frontend-url.vercel.app'
    ];

    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

app.use(morgan('dev')); // HTTP request logger
app.use(cookieParser()); // Parse cookies
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// ========================
// Database Initialization
// ========================
const initializeDatabase = async () => {
  console.log('🔌 Initializing database connection...');
  
  try {
    // Test connection
    const connected = await testConnection();
    if (!connected) {
      console.warn('⚠️  Database connection failed, but server will continue');
      return false;
    }
    
    // Sync database (create tables if they don't exist)
    await syncDatabase(false); // Sync without forcing to preserve existing data
    
    // Seed database with default admin
    await seedDatabase();
    
    console.log('✅ Database initialized successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    return false;
  }
};

// ========================
// API Routes
// ========================

// Health check
app.get('/api/health', async (req, res) => {
  const dbStatus = await testConnection();
  
  res.status(200).json({
    status: 'success',
    message: 'Server is running smoothly',
    timestamp: new Date().toISOString(),
    service: process.env.APP_NAME || 'Academy Backend',
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    database: dbStatus ? 'connected' : 'disconnected',
    auth: 'JWT-based',
    endpoints: 'All routes operational',
    cors: {
      allowedOrigins: [
        process.env.FRONTEND_URL,
        'http://localhost:5173',
        'https://your-frontend-url.vercel.app'
      ]
    }
  });
});

// Welcome route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Academy MVP API',
    version: '1.0.0',
    status: 'operational',
    database: 'PostgreSQL',
    authentication: 'JWT',
    cors: 'Dynamic origin configuration',
    endpoints: {
      auth: '/api/auth',
      videos: '/api/videos',
      student: '/api/student',
      admin: '/api/admin',
      health: '/api/health'
    }
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/library', libraryRoutes);

// ========================
// 404 Handler
// ========================
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} not found`,
    available_routes: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        admin_login: 'POST /api/auth/admin/login',
        me: 'GET /api/auth/me',
        logout: 'POST /api/auth/logout'
      },
      videos: {
        get_all: 'GET /api/videos',
        get_one: 'GET /api/videos/:id',
        create: 'POST /api/videos (admin)',
        update: 'PUT /api/videos/:id (admin)',
        delete: 'DELETE /api/videos/:id (admin)'
      },
      student: {
        dashboard: 'GET /api/student/dashboard',
        profile: 'GET /api/student/profile',
        update_profile: 'PUT /api/student/profile',
        videos: 'GET /api/student/videos'
      },
      admin: {
        dashboard: 'GET /api/admin/dashboard',
        students: 'GET /api/admin/students',
        student_details: 'GET /api/admin/students/:id',
        toggle_student: 'PUT /api/admin/students/:id/toggle'
      },
      health: 'GET /api/health'
    }
  });
});

// ========================
// Error Handler
// ========================
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  
  // Handle CORS errors specifically
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      status: 'error',
      message: 'CORS policy: Origin not allowed',
      allowed_origins: [
        process.env.FRONTEND_URL,
        'http://localhost:5173',
        'https://neoxmind.netlify.app',
        'https://your-frontend-url.vercel.app'
      ]
    });
  }
  
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ========================
// Server Startup (with Socket.IO)
// ========================
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Initialize database
    await initializeDatabase();

    // Create HTTP server and attach socket.io for realtime chat
    const httpServer = http.createServer(app);
    const io = new Server(httpServer, {
      cors: {
        origin: function (origin, callback) {
          const allowedOrigins = [
            process.env.FRONTEND_URL,
            'http://localhost:5173',
            'https://neoxmind.netlify.app',
            'https://your-frontend-url.vercel.app'
          ];

          if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
          } else {
            callback(new Error('Not allowed by CORS'));
          }
        },
        credentials: true,
      },
    });

    // Simple socket auth using token in handshake.auth.token
    io.on('connection', async (socket) => {
      try {
        const token = socket.handshake.auth?.token || socket.handshake.query?.token || null;
        let user = null;
        if (token) {
          const decoded = verifyToken(token);
          if (decoded) {
            const UserModel = require('./models/User');
            const u = await UserModel.findByPk(decoded.id);
            if (u && u.is_active) user = u.getSafeData();
          }
        }

        socket.on('chat:query', async ({ id, question }) => {
          const { processQuery } = require('./controllers/chat.controller');
          const result = await processQuery(user, question);
          socket.emit('chat:response', { id, ...result });
        });
        
        socket.on('disconnect', () => {
          console.log('Client disconnected:', socket.id);
        });
        
      } catch (err) {
        console.error('Socket connection error', err);
      }
    });

    // Store io instance for use in other parts of the app if needed
    app.set('socketio', io);

    httpServer.listen(PORT, () => {
      console.log('='.repeat(70));
      console.log(`🚀 Server started successfully!`);
      console.log(`📡 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔗 URL: http://localhost:${PORT}`);
      console.log(`📊 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`🗄️  Database: PostgreSQL`);
      console.log(`🔐 Authentication: JWT`);
      console.log(`🌐 CORS: Dynamic origin configuration`);
      console.log(`👤 Default Admin: ${process.env.ADMIN_EMAIL}`);
      console.log('='.repeat(70));
      console.log(`⏰ Started at: ${new Date().toLocaleString()}`);
      console.log('='.repeat(70));
      console.log('\n📚 API ENDPOINTS:');
      console.log('\n🔐 AUTHENTICATION:');
      console.log('  POST /api/auth/register          - Register student');
      console.log('  POST /api/auth/login             - Login user');
      console.log('  POST /api/auth/admin/login       - Admin login');
      console.log('  GET  /api/auth/me                - Get current user');
      console.log('  POST /api/auth/logout            - Logout');

      console.log('\n🎥 VIDEOS:');
      console.log('  GET  /api/videos                 - Get all videos');
      console.log('  GET  /api/videos/:id             - Get single video');
      console.log('  POST /api/videos                 - Create video (admin)');
      console.log('  PUT  /api/videos/:id             - Update video (admin)');
      console.log('  DELETE /api/videos/:id           - Delete video (admin)');

      console.log('\n👨‍🎓 STUDENT:');
      console.log('  GET  /api/student/dashboard      - Student dashboard');
      console.log('  GET  /api/student/profile        - Student profile');
      console.log('  PUT  /api/student/profile        - Update profile');
      console.log('  GET  /api/student/videos         - Get student videos');

      console.log('\n👔 ADMIN:');
      console.log('  GET  /api/admin/dashboard        - Admin dashboard');
      console.log('  GET  /api/admin/students         - Get all students');
      console.log('  GET  /api/admin/students/:id     - Student details');
      console.log('  PUT  /api/admin/students/:id/toggle - Toggle student status');

      console.log('\n💬 CHAT:');
      console.log('  POST /api/chat/query             - Protected chat query (POST)');
      console.log('  Socket.IO events: chat:query -> chat:response');

      console.log('\n📚 LIBRARY:');
      console.log('  GET  /api/library               - Library resources');

      console.log('\n🩺 HEALTH:');
      console.log('  GET  /api/health                 - Health check');
      console.log('='.repeat(70));
      console.log('\n🌐 CORS ALLOWED ORIGINS:');
      console.log(`  - ${process.env.FRONTEND_URL || 'Not set in .env'}`);
      console.log('  - http://localhost:5173');
      console.log('  - https://your-frontend-url.vercel.app');
      console.log('='.repeat(70));
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start server
startServer();

// Export app for testing
module.exports = app;