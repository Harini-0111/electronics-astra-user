const express = require('express');
const userController = require('../controllers/userController');

const router = express.Router();

/**
 * @route   POST /add-friend
 * @desc    Send a friend request to another user by userid
 * @access  Private
 */
router.post('/add-friend', userController.addFriend);

/**
 * @route   POST /accept-friend
 * @desc    Accept a friend request from another user by userid
 * @access  Private
 */
router.post('/accept-friend', userController.acceptFriend);

module.exports = router;
