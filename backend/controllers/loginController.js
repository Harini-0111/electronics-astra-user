const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

// Ensure mongoose is connected (lazy connect if not already connected)
const ensureMongoConnection = async () => {
  if (mongoose.connection.readyState === 1) return; // already connected
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI not defined in .env');
  await mongoose.connect(uri, {
    // current driver options are applied by default
  });
};

// POST /login - session-based
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    // Ensure MongoDB connection
    await ensureMongoConnection();

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    // Create server-side session (store minimal info)
    req.session.user = { id: user._id.toString(), email: user.email, name: user.name };

    return res.status(200).json({
      success: true,
      message: 'Login successful, session created',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error('Login error (mongo):', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
