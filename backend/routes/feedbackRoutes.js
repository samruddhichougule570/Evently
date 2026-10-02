// This code is used for the feedbackRoutes routes to define API endpoints for post-event feedback.
const express = require('express');
const router = express.Router();
const { submitFeedback, getEventFeedback } = require('../controllers/feedbackController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, submitFeedback);
router.get('/event/:eventId', getEventFeedback);

module.exports = router;
