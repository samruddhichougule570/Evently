// This code is used for the messageRoutes routes to define API endpoints.
const express = require('express');
const router = express.Router();
const { createMessage, getMessages } = require('../controllers/messageController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
    .post(createMessage)
    .get(protect, admin, getMessages);

module.exports = router;
