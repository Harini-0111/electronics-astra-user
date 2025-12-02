const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const pool = require('./config/db');
const { connectMongoDB } = require('./config/mongodb');
const Student = require('./models/Student');
const dbStatus = require('./utils/dbStatus');
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/studentRoutes');
const session = require('express-session');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CORS - allow a small development allowlist and correctly handle preflight.
// This middleware sets Access-Control-Allow-* headers and handles OPTIONS requests.
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
];
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  }
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Session middleware - register before routes
const SESSION_SECRET = process.env.SESSION_SECRET || process.env.JWT_SECRET || 'change_this_secret';
app.use(session({
  name: 'connect.sid',
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  },
}));

// Initialize database
const initializeDatabase = async () => {
  try {
    // Test connection
    const result = await pool.query('SELECT NOW()');
    console.log('✓ PostgreSQL Database connected');
    dbStatus.setConnected(true);

    // Create tables
    await Student.createTable();
  } catch (err) {
    // Log the error but don't terminate the process. Endpoints that require DB
    // will still fail until DB is available, but keeping the server running is
    // helpful during development so the app can respond with helpful errors.
    console.error('✗ Database connection error:', err);
    dbStatus.setConnected(false);
    console.error('Continuing without DB connection — fix Postgres credentials or start Postgres.');
  }
};

// Initialize on startup
initializeDatabase();

// Routes
app.use('/api/auth', authRoutes);
// Student profile + session routes (logout, status, change-password)
app.use('/', studentRoutes);
// (Removed userRoutes - user/friend endpoints were deleted to keep student-only flow)

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'User Backend Server is running',
    timestamp: new Date().toISOString(),
  });
});

// Debug endpoint: returns request headers, cookies and session for troubleshooting
// Use only in development. Remove or protect in production.
app.get('/debug-session', (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      message: 'Debug session info',
      headers: req.headers,
      cookies: req.cookies,
      session: req.session,
    });
  } catch (err) {
    console.error('Debug session error:', err);
    return res.status(500).json({ success: false, message: 'Failed to read session' });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Start server
const PORT = process.env.PORT || 5001;

// Initialize databases then start server
async function startServer() {
  try {
    // Connect to MongoDB Atlas
    await connectMongoDB();
    console.log('✅ MongoDB Atlas connected and ready');

    // Start Express server
    app.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════╗
║  User Backend Server                  ║
║  Running on PORT: ${PORT}              ║
║  URL: http://localhost:${PORT}        ║
║  PostgreSQL: Connected                ║
║  MongoDB Atlas: Connected (GridFS)    ║
╚═══════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
