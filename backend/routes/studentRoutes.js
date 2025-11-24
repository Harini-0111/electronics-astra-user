const express = require('express');
const studentController = require('../controllers/studentController');

const router = express.Router();

/**
 * @route   GET /profile
 * @desc    Get logged-in student's profile
 * @access  Private
 */
router.get('/profile', studentController.getProfile);

/**
 * @route   PUT /profile
 * @desc    Update logged-in student's profile
 * @access  Private
 * @body    { name, phone, address, date_of_birth }
 */
router.put('/profile', studentController.updateProfile);

/**
 * @route   DELETE /profile
 * @desc    Delete student account and session
 * @access  Private
 */
router.delete('/profile', studentController.deleteAccount);

module.exports = router;
