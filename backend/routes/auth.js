const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new student
 * @access  Public
 * @body    { name, email, password }
 */
router.post('/register', authController.register);

/**
 * @route   POST /api/auth/verify-otp
 * @desc    Verify OTP and complete registration
 * @access  Public
 * @body    { email, otp }
 */
router.post('/verify-otp', authController.verifyOTP);

/**
 * @route   POST /api/auth/resend-otp
 * @desc    Resend OTP to email
 * @access  Public
 * @body    { email }
 */
router.post('/resend-otp', authController.resendOTP);

/**
 * @route   POST /api/auth/login
 * @desc    Login user (after email verification)
 * @access  Public
 * @body    { email, password }
 */
router.post('/login', authController.login);

// Forgot / reset password
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/check-reset-otp', authController.checkResetOTP);

module.exports = router;
