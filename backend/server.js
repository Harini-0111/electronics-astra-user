const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const pool = require('./config/db');
const Student = require('./models/Student');
const dbStatus = require('./utils/dbStatus');
const authRoutes = require('./routes/auth');
const sessionRoutes = require('./routes/session');
const studentRoutes = require('./routes/studentRoutes');
const session = require('express-session');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
  origin: 'http://localhost:3000', // Update with your frontend URL
  credentials: true,
}));

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
// Session routes (logout, status)
app.use('/', sessionRoutes);
// Student profile routes
app.use('/', studentRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'User Backend Server is running',
    timestamp: new Date().toISOString(),
  });
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
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════╗
║  User Backend Server                  ║
║  Running on PORT: ${PORT}              ║
║  URL: http://localhost:${PORT}        ║
╚═══════════════════════════════════════╝
  `);
});

module.exports = app;
