// This code is used for the feedbackController to handle post-event feedback logic.
const Feedback = require('../models/Feedback');
const Registration = require('../models/Registration');
const Event = require('../models/Event');

// @desc    Submit feedback for an event (only for past events the user actually attended)
// @route   POST /api/feedback
// @access  Private
const submitFeedback = async (req, res) => {
    const { eventId, rating, comment } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
        res.status(404);
        throw new Error('Event not found');
    }

    // Rule 1: the event must be over
    if (new Date(event.date) > new Date()) {
        res.status(400);
        throw new Error('Feedback opens once the event has taken place');
    }

    // Rule 2: the user must have registered...
    const registration = await Registration.findOne({ user: req.user._id, event: eventId });
    if (!registration) {
        res.status(403);
        throw new Error('You can only give feedback for events you registered for');
    }

    // Rule 3: ...and the organiser must have marked them as attended
    if (!registration.attended) {
        res.status(403);
        throw new Error('Feedback is only for attendees - the organiser marks attendance after the event');
    }

    try {
        const feedback = await Feedback.create({ user: req.user._id, event: eventId, rating, comment });
        res.status(201).json(feedback);
    } catch (error) {
        if (error.code === 11000) {
            res.status(400);
            throw new Error('You already submitted feedback for this event');
        }
        throw error; // validation errors etc. go to the central error handler
    }
};

// @desc    Get all feedback for a specific event, plus the average rating
// @route   GET /api/feedback/event/:eventId
// @access  Public
const getEventFeedback = async (req, res) => {
    const feedbackList = await Feedback.find({ event: req.params.eventId })
        .populate('user', 'name')
        .sort({ createdAt: -1 });

    const averageRating = feedbackList.length
        ? (feedbackList.reduce((sum, f) => sum + f.rating, 0) / feedbackList.length).toFixed(1)
        : null;

    res.json({ feedback: feedbackList, averageRating, count: feedbackList.length });
};

module.exports = { submitFeedback, getEventFeedback };
