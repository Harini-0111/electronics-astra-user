const Student = require('../models/Student');
const bcrypt = require('bcryptjs');

/* -------------------------------------------------------------------------- */
/*                               LOGIN MIDDLEWARE                             */
/* -------------------------------------------------------------------------- */

const requireLogin = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({
      success: false,
      message: 'Please login first',
    });
  }
  next();
};

/* -------------------------------------------------------------------------- */
/*                           GET SESSION STATUS                               */
/* -------------------------------------------------------------------------- */

const getSessionStatus = (req, res) => {
  if (req.session && req.session.user) {
    return res.status(200).json({
      success: true,
      loggedIn: true,
      user: req.session.user,
    });
  }

  return res.status(200).json({ success: true, loggedIn: false });
};

/* -------------------------------------------------------------------------- */
/*                                   LOGOUT                                   */
/* -------------------------------------------------------------------------- */

const logout = [
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

/* -------------------------------------------------------------------------- */
/*                              CHANGE PASSWORD                               */
/* -------------------------------------------------------------------------- */

const changePassword = [
  requireLogin,
  async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Provide both current and new password',
        });
      }

      if (currentPassword === newPassword) {
        return res.status(400).json({
          success: false,
          message: 'New password must be different',
        });
      }

      const userId = req.session.user.id;
      const student = await Student.findById(userId);

      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found',
        });
      }

      const isPasswordValid = await bcrypt.compare(
        currentPassword,
        student.password
      );

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Wrong current password',
        });
      }

      const salt = await bcrypt.genSalt(10);
      const newHashedPassword = await bcrypt.hash(newPassword, salt);

      await Student.changePassword(userId, newHashedPassword);

      return res.status(200).json({
        success: true,
        message: 'Password updated successfully',
        data: { id: student.id, email: student.email },
      });
    } catch (err) {
      console.error('Change Password error:', err);
      return res.status(500).json({
        success: false,
        message: err.message || 'Password update failed',
      });
    }
  },
];

/* -------------------------------------------------------------------------- */
/*                                 PROFILE                                    */
/* -------------------------------------------------------------------------- */

const getProfile = [
  requireLogin,
  async (req, res) => {
    try {
      const userId = req.session.user.id;
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

const updateProfile = [
  requireLogin,
  async (req, res) => {
    try {
      const userId = req.session.user.id;
      const { name, phone, address, date_of_birth } = req.body;

      const updatedProfile = await Student.updateProfile(userId, {
        name,
        phone,
        address,
        date_of_birth,
      });

      if (name) req.session.user.name = name;

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

const deleteAccount = [
  requireLogin,
  async (req, res) => {
    try {
      const userId = req.session.user.id;

      const deleted = await Student.deleteProfile(userId);

      req.session.destroy(() => {});

      return res.status(200).json({
        success: true,
        message: 'Account deleted successfully',
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

/* -------------------------------------------------------------------------- */
/*                              FRIEND REQUESTS                               */
/* -------------------------------------------------------------------------- */

const sendFriendRequest = [
  requireLogin,
  async (req, res) => {
    try {
      const fromUserId = req.session.user.id;
      const { targetUserId } = req.body;

      const result = await Student.sendFriendRequest(fromUserId, targetUserId);

      return res.status(200).json({
        success: true,
        message: 'Friend request sent',
        data: result,
      });
    } catch (err) {
      console.error('Send Friend Request error:', err);
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
  },
];

const acceptFriendRequest = [
  requireLogin,
  async (req, res) => {
    try {
      const toUserId = req.session.user.id;
      const { fromUserId } = req.body;

      const numericId = parseInt(fromUserId, 10);
      const requester = await Student.findByUserId(numericId);

      if (!requester) {
        return res.status(404).json({
          success: false,
          message: 'Requesting user not found',
        });
      }

      const result = await Student.acceptFriendRequest(toUserId, requester.id);

      return res.status(200).json({
        success: true,
        message: 'Friend request accepted',
        data: result,
      });
    } catch (err) {
      console.error('Accept Friend Request error:', err);
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
  },
];

const getFriendRequests = [
  requireLogin,
  async (req, res) => {
    try {
      const userId = req.session.user.id;
      const requests = await Student.getFriendRequests(userId);

      return res.status(200).json({ success: true, data: requests });
    } catch (err) {
      console.error('Get Friend Requests error:', err);
      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  },
];

const getFriends = [
  requireLogin,
  async (req, res) => {
    try {
      const userId = req.session.user.id;
      const friends = await Student.getFriends(userId);

      return res.status(200).json({ success: true, data: friends });
    } catch (err) {
      console.error('Get Friends error:', err);
      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  },
];

/* -------------------------------------------------------------------------- */
/*                          VIEW FRIEND PROFILE                               */
/* -------------------------------------------------------------------------- */

const getFriendProfile = [
  requireLogin,
  async (req, res) => {
    try {
      const { userid } = req.params;

      if (!/^[0-9]{4,6}$/.test(userid)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid userid format',
        });
      }

      const numericId = parseInt(userid, 10);
      const friend = await Student.findByUserId(numericId);

      if (!friend) {
        return res.status(404).json({
          success: false,
          message: 'Friend not found',
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          name: friend.name,
          email: friend.email,
          userid: friend.userid,
          phone: friend.phone,
          address: friend.address,
          date_of_birth: friend.date_of_birth,
        },
      });
    } catch (err) {
      console.error('Get Friend Profile error:', err);
      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  },
];

/* -------------------------------------------------------------------------- */
/*                                   EXPORTS                                  */
/* -------------------------------------------------------------------------- */

module.exports = {
  requireLogin,
  getSessionStatus,
  logout,
  changePassword,
  getProfile,
  updateProfile,
  deleteAccount,
  sendFriendRequest,
  acceptFriendRequest,
  getFriendRequests,
  getFriends,
  getFriendProfile,
};
