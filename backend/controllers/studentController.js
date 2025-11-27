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
 * Get Profile - Retrieve logged-in student's details
 * @route   GET /profile
 * @access  Private
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
 * Update Profile - Allow student to update their profile information
 * @route   PUT /profile
 * @access  Private
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
 * Delete Account - Permanently delete student account and session
 * @route   DELETE /profile
 * @access  Private
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
