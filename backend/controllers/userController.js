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
