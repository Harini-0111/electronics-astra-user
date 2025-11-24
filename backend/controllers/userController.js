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
 * Get Profile - Retrieve logged-in user's details
 * @route   GET /profile
 * @access  Private (requires session)
 */
exports.getProfile = [
  requireLogin,
  async (req, res) => {
    try {
      const userId = req.session.user.id;

      // Fetch student profile from database
      const profile = await Student.getProfile(userId);

      return res.status(200).json({
        success: true,
        message: 'Profile retrieved successfully',
        data: profile,
      });
    } catch (err) {
      console.error('Get Profile error:', err);
      return res.status(500).json({
        success: false,
        message: err.message || 'Failed to retrieve profile',
      });
    }
  },
];

/**
 * Update Profile - Allow user to update their profile information
 * @route   PUT /profile
 * @access  Private (requires session)
 * @body    { name, phone, address, date_of_birth }
 */
exports.updateProfile = [
  requireLogin,
  async (req, res) => {
    try {
      const userId = req.session.user.id;
      const { name, phone, address, date_of_birth } = req.body;

      // Update profile in database (only provided fields are updated)
      const updatedProfile = await Student.updateProfile(userId, {
        name,
        phone,
        address,
        date_of_birth,
      });

      // Update session user info
      if (name) {
        req.session.user.name = name;
      }

      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: updatedProfile,
      });
    } catch (err) {
      console.error('Update Profile error:', err);
      return res.status(500).json({
        success: false,
        message: err.message || 'Failed to update profile',
      });
    }
  },
];

/**
 * Delete Account - Permanently delete user account and session
 * @route   DELETE /profile
 * @access  Private (requires session)
 */
exports.deleteAccount = [
  requireLogin,
  async (req, res) => {
    try {
      const userId = req.session.user.id;

      // Delete student from database
      const deleted = await Student.deleteProfile(userId);

      // Destroy session after successful deletion
      req.session.destroy((err) => {
        if (err) {
          console.error('Session destroy error:', err);
        }
      });

      return res.status(200).json({
        success: true,
        message: 'Account deleted successfully and session destroyed',
        data: {
          deletedUserId: deleted.id,
          deletedEmail: deleted.email,
        },
      });
    } catch (err) {
      console.error('Delete Account error:', err);
      return res.status(500).json({
        success: false,
        message: err.message || 'Failed to delete account',
      });
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
