const express = require('express');
const userController = require('../controllers/userController');

const router = express.Router();

/**
 * @route   GET /profile
 * @desc    Get logged-in user's profile
 * @access  Private
 */
router.get('/profile', userController.getProfile);

/**
 * @route   PUT /profile
 * @desc    Update logged-in user's profile
 * @access  Private
 * @body    { name, phone, address, date_of_birth }
 */
router.put('/profile', userController.updateProfile);

/**
 * @route   DELETE /profile
 * @desc    Delete user account and session
 * @access  Private
 */
router.delete('/profile', userController.deleteAccount);

/**
 * @route   POST /logout
 * @desc    Logout and destroy session
 * @access  Private
 */
router.post('/logout', userController.logout);

/**
 * @route   GET /session-status
 * @desc    Check if user is logged in
 * @access  Public
 */
router.get('/session-status', userController.getSessionStatus);

/**
 * @route   PUT /change-password
 * @desc    Change password for logged-in user
 * @access  Private
 * @body    { currentPassword, newPassword }
 */
router.put('/change-password', userController.changePassword);

module.exports = router;
