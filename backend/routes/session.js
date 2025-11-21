const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');

// POST /logout
router.post('/logout', sessionController.logout);

// GET /session-status
router.get('/session-status', sessionController.status);

module.exports = router;
