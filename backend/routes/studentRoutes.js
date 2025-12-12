
const express = require('express');
const studentController = require('../controllers/studentController');

const router = express.Router();

/**
 * @route   GET /friend-profile/:userid
 * @desc    View public profile of a friend by userid
 * @access  Private
 */
router.get('/friend-profile/:userid', studentController.getFriendProfile);

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

/**
 * @route   PUT /change-password
 * @desc    Change password for logged-in student
 * @access  Private
 */
router.put('/change-password', studentController.changePassword);

/**
 * @route   POST /logout
 * @desc    Logout and destroy session
 * @access  Private
 */
router.post('/logout', studentController.logout);

/**
 * @route   GET /session-status
 * @desc    Check if session is active
 * @access  Public
 */
router.get('/session-status', studentController.getSessionStatus);

/**
 * Friend endpoints
 */
router.post('/friends/request', studentController.sendFriendRequest);
router.post('/friends/accept', studentController.acceptFriendRequest);
router.get('/friends/requests', studentController.getFriendRequests);
router.get('/friends', studentController.getFriends);

/**
 * Library endpoints
 */
const upload = require('../config/multer');
const resourceUpload = require('../config/resourceMulter');

// Upload file
router.post('/library/upload', upload.single('file'), studentController.uploadFile);

// Get all library files
router.get('/library', studentController.getLibrary);

// Get my uploads
router.get('/library/my-uploads', studentController.getMyUploads);

// Download file
router.get('/library/:fileId/download', studentController.downloadFile);
router.delete('/library/:fileId', studentController.deleteLibraryFile);

// Share file with friend
router.post('/library/share', studentController.shareFileWithFriend);

// Get files shared with me
router.get('/library/shared-with-me', studentController.getSharedWithMe);

/**
 * Resources endpoints (PDF/JPG/PNG, 10MB)
 */
router.post('/resources/upload', resourceUpload.single('file'), studentController.uploadResource);
router.get('/resources', studentController.getResources);
router.get('/resources/:fileId/download', studentController.downloadResource);

module.exports = router;
