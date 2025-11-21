// Handles logout and session status
exports.logout = async (req, res) => {
  try {
    if (!req.session) {
      return res.status(200).json({ success: true, message: 'No active session' });
    }

    req.session.destroy((err) => {
      if (err) {
        console.error('Session destroy error:', err);
        return res.status(500).json({ success: false, message: 'Failed to destroy session' });
      }
      // clear cookie on client
      res.clearCookie('connect.sid');
      return res.status(200).json({ success: true, message: 'Logout successful, session destroyed' });
    });
  } catch (err) {
    console.error('Logout error:', err);
    return res.status(500).json({ success: false, message: 'Logout failed' });
  }
};

exports.status = async (req, res) => {
  try {
    if (req.session && req.session.user) {
      return res.status(200).json({ success: true, loggedIn: true, user: req.session.user });
    }
    return res.status(200).json({ success: true, loggedIn: false });
  } catch (err) {
    console.error('Session status error:', err);
    return res.status(500).json({ success: false, message: 'Failed to get session status' });
  }
};
