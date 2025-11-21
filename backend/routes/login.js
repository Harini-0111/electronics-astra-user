const express = require('express');
const router = express.Router();
const loginController = require('../controllers/loginController');

/**
 * @route POST /login
 * @desc  Login user using MongoDB + JWT
 * @body  { email, password }
 */
router.post('/', loginController.login);

module.exports = router;
