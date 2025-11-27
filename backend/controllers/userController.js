const Student = require('../models/Student');

/**
 * Middleware to check if user is logged in (has valid session)
 */
const requireLogin = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({
      success: false,
      message: 'Please login first',
    });
  }
  next();
};

/**
 * POST /add-friend
 * Body: { targetUserId }
 */
exports.addFriend = [
  requireLogin,
  async (req, res) => {
    try {
      const { targetUserId } = req.body;

      if (!targetUserId) {
        return res.status(400).json({ success: false, message: 'Please provide targetUserId' });
      }

      // Validate that targetUserId exists (userid field)
      const target = await Student.findByUserId(targetUserId);
      if (!target) {
        return res.status(404).json({ success: false, message: 'Target user not found' });
      }

      // Placeholder: actual friend request persistence not implemented yet
      return res.status(200).json({
        success: true,
        message: `Friend request sent to ${targetUserId}`,
      });
    } catch (err) {
      console.error('Add Friend error:', err);
      return res.status(500).json({ success: false, message: err.message || 'Failed to send friend request' });
    }
  },
];

/**
 * POST /accept-friend
 * Body: { targetUserId }
 */
exports.acceptFriend = [
  requireLogin,
  async (req, res) => {
    try {
      const { targetUserId } = req.body;

      if (!targetUserId) {
        return res.status(400).json({ success: false, message: 'Please provide targetUserId' });
      }

      // Validate that targetUserId exists (userid field)
      const target = await Student.findByUserId(targetUserId);
      if (!target) {
        return res.status(404).json({ success: false, message: 'Target user not found' });
      }

      // Placeholder: acceptance logic to be implemented later
      return res.status(200).json({
        success: true,
        message: `Friend request from ${targetUserId} accepted`,
      });
    } catch (err) {
      console.error('Accept Friend error:', err);
      return res.status(500).json({ success: false, message: err.message || 'Failed to accept friend request' });
    }
  },
];

/**
 * Logout - Destroy session
 * @route   POST /logout
 * @access  Private (requires session)
 */
exports.logout = [
  requireLogin,
  (req, res) => {
    try {
      req.session.destroy((err) => {
        if (err) {
          console.error('Session destroy error:', err);
          return res.status(500).json({
            success: false,
            message: 'Failed to logout',
          });
        }

        // Clear session cookie
        res.clearCookie('connect.sid');

        return res.status(200).json({
          success: true,
          message: 'Logout successful',
        });
      });
    } catch (err) {
      console.error('Logout error:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to logout',
      });
    }
  },
];

/**
 * Get Session Status - Check if user is logged in
 * @route   GET /session-status
 * @access  Public
 */
exports.getSessionStatus = (req, res) => {
  if (req.session && req.session.user) {
    return res.status(200).json({
      success: true,
      loggedIn: true,
      user: req.session.user,
    });
  }

  return res.status(200).json({
    success: true,
    loggedIn: false,
  });
};

/**
 * Change Password - Allow logged-in user to change their password
 * @route   PUT /change-password
 * @access  Private (requires session)
 * @body    { currentPassword, newPassword }
 */
exports.changePassword = [
  requireLogin,
  async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const bcrypt = require('bcryptjs');

      // Validate empty fields
      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Please provide both current password and new password',
        });
      }

      // Prevent using the same password
      if (currentPassword === newPassword) {
        return res.status(400).json({
          success: false,
          message: 'New password must be different from current password',
        });
      }

      const userId = req.session.user.id;

      // Fetch student record
      const student = await Student.findById(userId);
      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found',
        });
      }

      // Compare current password with stored hashed password
      const isPasswordValid = await bcrypt.compare(currentPassword, student.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Current password is wrong',
        });
      }

      // Hash the new password
      const salt = await bcrypt.genSalt(10);
      const newHashedPassword = await bcrypt.hash(newPassword, salt);

      // Update password in database
      await Student.changePassword(userId, newHashedPassword);

      return res.status(200).json({
        success: true,
        message: 'Password updated successfully',
        data: {
          id: student.id,
          email: student.email,
        },
      });
    } catch (err) {
      console.error('Change Password error:', err);
      return res.status(500).json({
        success: false,
        message: err.message || 'Failed to change password',
      });
    }
  },
];
