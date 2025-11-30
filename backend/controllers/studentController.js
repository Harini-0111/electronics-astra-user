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
 * Get Session Status - Check if user is logged in
 * @route   GET /session-status
 * @access  Public
 */
exports.getSessionStatus = (req, res) => {
  if (req.session && req.session.user) {
    return res.status(200).json({ success: true, loggedIn: true, user: req.session.user });
  }
  return res.status(200).json({ success: true, loggedIn: false });
};

/**
 * Logout - Destroy session
 * @route   POST /logout
 * @access  Private
 */
exports.logout = [
  requireLogin,
  (req, res) => {
    try {
      req.session.destroy((err) => {
        if (err) {
          console.error('Session destroy error:', err);
          return res.status(500).json({ success: false, message: 'Failed to logout' });
        }
        res.clearCookie('connect.sid');
        return res.status(200).json({ success: true, message: 'Logout successful' });
      });
    } catch (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ success: false, message: 'Failed to logout' });
    }
  },
];

/**
 * Change Password - Allow logged-in student to change their password
 * @route   PUT /change-password
 * @access  Private
 * @body    { currentPassword, newPassword }
 */
exports.changePassword = [
  requireLogin,
  async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const bcrypt = require('bcryptjs');

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ success: false, message: 'Please provide both current password and new password' });
      }

      if (currentPassword === newPassword) {
        return res.status(400).json({ success: false, message: 'New password must be different from current password' });
      }

      const userId = req.session.user.id;
      const student = await Student.findById(userId);
      if (!student) {
        return res.status(404).json({ success: false, message: 'Student not found' });
      }

      const isPasswordValid = await bcrypt.compare(currentPassword, student.password);
      if (!isPasswordValid) {
        return res.status(401).json({ success: false, message: 'Current password is wrong' });
      }

      const salt = await bcrypt.genSalt(10);
      const newHashedPassword = await bcrypt.hash(newPassword, salt);

      await Student.changePassword(userId, newHashedPassword);

      return res.status(200).json({ success: true, message: 'Password updated successfully', data: { id: student.id, email: student.email } });
    } catch (err) {
      console.error('Change Password error:', err);
      return res.status(500).json({ success: false, message: err.message || 'Failed to change password' });
    }
  },
];

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

/**
 * Send Friend Request - send a friend request to a student by userid
 * @route POST /friends/request
 * @body { targetUserId }
 */
exports.sendFriendRequest = [
  requireLogin,
  async (req, res) => {
    try {
      const fromUserId = req.session.user.id;
      const { targetUserId } = req.body;
      if (!targetUserId) return res.status(400).json({ success: false, message: 'Please provide targetUserId' });

      const result = await Student.sendFriendRequest(fromUserId, targetUserId);
      return res.status(200).json({ success: true, message: 'Friend request sent', data: result });
    } catch (err) {
      console.error('Send Friend Request error:', err);
      return res.status(400).json({ success: false, message: err.message || 'Failed to send friend request' });
    }
  },
];

/**
 * Accept Friend Request - accept a pending request from another student
 * @route POST /friends/accept
 * @body { fromUserId }
 */
exports.acceptFriendRequest = [
  requireLogin,
  async (req, res) => {
    try {
      const toUserId = req.session.user.id;
      const { fromUserId } = req.body;
      if (!fromUserId) return res.status(400).json({ success: false, message: 'Please provide fromUserId' });

      // The client provides the public `userid` (commonly a 5-digit value).
      // Accept numbers or strings; normalize and validate before lookup.
      const raw = typeof fromUserId === 'string' ? fromUserId.trim() : String(fromUserId);
      // Accept only digit strings of reasonable length (4-6 digits)
      if (!/^[0-9]{4,6}$/.test(raw)) {
        return res.status(400).json({ success: false, message: 'Invalid fromUserId format; expected 4-6 digits' });
      }
      const fromUserNumeric = parseInt(raw, 10);
      const fromStudent = await Student.findByUserId(fromUserNumeric);
      if (!fromStudent) {
        return res.status(404).json({ success: false, message: 'Requesting user not found' });
      }

      const result = await Student.acceptFriendRequest(toUserId, fromStudent.id);
      return res.status(200).json({ success: true, message: 'Friend request accepted', data: result });
    } catch (err) {
      console.error('Accept Friend Request error:', err);
      return res.status(400).json({ success: false, message: err.message || 'Failed to accept friend request' });
    }
  },
];

/**
 * Get Friend Requests - list incoming friend requests
 * @route GET /friends/requests
 */
exports.getFriendRequests = [
  requireLogin,
  async (req, res) => {
    try {
      const userId = req.session.user.id;
      const requests = await Student.getFriendRequests(userId);
      return res.status(200).json({ success: true, data: requests });
    } catch (err) {
      console.error('Get Friend Requests error:', err);
      return res.status(500).json({ success: false, message: err.message || 'Failed to get friend requests' });
    }
  },
];

/**
 * Get Friends - list accepted friends
 * @route GET /friends
 */
exports.getFriends = [
  requireLogin,
  async (req, res) => {
    try {
      const userId = req.session.user.id;
      const friends = await Student.getFriends(userId);
      return res.status(200).json({ success: true, data: friends });
    } catch (err) {
      console.error('Get Friends error:', err);
      return res.status(500).json({ success: false, message: err.message || 'Failed to get friends' });
    }
  },
];
