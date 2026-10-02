// This code is used for the eventController controller to handle business logic and incoming requests.
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Feedback = require('../models/Feedback');
const path = require('path');
const { DAY_MS } = require('../utils/dates');
const fs = require('fs');

// Escape user input so characters like "(" or "*" can't break / abuse the search regex
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// @desc    Get events (with optional search + filters)
// @route   GET /api/events?search=&category=&status=upcoming|past
// @access  Public
const getEvents = async (req, res) => {
    const { search, category, status } = req.query;
    const filter = {};

    // Search across title, description and speaker names
    if (search && String(search).trim()) {
        const regex = new RegExp(escapeRegex(String(search).trim()), 'i');
        filter.$or = [{ title: regex }, { description: regex }, { 'sessions.speaker': regex }];
    }

    if (category && category !== 'All') {
        filter.category = String(category);
    }

    // Upcoming = the event day hasn't fully passed yet, Past = it has (same rule as utils/dates.js)
    const cutoff = new Date(Date.now() - DAY_MS);
    if (status === 'upcoming') filter.date = { $gt: cutoff };
    if (status === 'past') filter.date = { $lte: cutoff };

    // Past events show newest first, everything else soonest first
    const events = await Event.find(filter).sort({ date: status === 'past' ? -1 : 1 });
    res.json(events);
};

// @desc    Get single event
// @route   GET /api/events/:id
// @access  Public
const getEventById = async (req, res) => {
    const event = await Event.findById(req.params.id);
    if (!event) {
        res.status(404);
        throw new Error('Event not found');
    }
    res.json(event);
};

// sessions arrives as a JSON string from multipart form data - parse it safely
const parseSessions = (sessions) => {
    try {
        return JSON.parse(sessions);
    } catch (e) {
        return null;
    }
};

// @desc    Create an event
// @route   POST /api/events
// @access  Private/Admin
const createEvent = async (req, res) => {
    const { title, description, date, category, sessions, coordinatorName, coordinatorPhone, entryFee, capacity } = req.body;

    const event = await Event.create({
        title,
        description,
        date,
        category,
        imageUrl: req.file ? `/uploads/${req.file.filename}` : '',
        sessions: (sessions && parseSessions(sessions)) || [],
        coordinatorName,
        coordinatorPhone,
        entryFee: entryFee ? Number(entryFee) : 0,
        capacity: capacity ? Number(capacity) : 0,
        user: req.user._id
    });

    res.status(201).json(event);
};

// @desc    Update an event
// @route   PUT /api/events/:id
// @access  Private/Admin
const updateEvent = async (req, res) => {
    const event = await Event.findById(req.params.id);
    if (!event) {
        res.status(404);
        throw new Error('Event not found');
    }

    const { title, description, date, category, sessions, coordinatorName, coordinatorPhone, entryFee, capacity } = req.body;

    event.title = title ?? event.title;
    event.description = description ?? event.description;
    event.date = date ?? event.date;
    event.category = category ?? event.category;
    event.coordinatorName = coordinatorName ?? event.coordinatorName;
    event.coordinatorPhone = coordinatorPhone ?? event.coordinatorPhone;
    event.entryFee = entryFee !== undefined ? Number(entryFee) : event.entryFee;

    if (capacity !== undefined) {
        const newCapacity = Number(capacity);
        // Can't shrink the venue below the number of people already registered
        if (newCapacity > 0 && newCapacity < event.registeredCount) {
            res.status(400);
            throw new Error(`Capacity can't be less than the ${event.registeredCount} people already registered`);
        }
        event.capacity = newCapacity;
    }

    if (sessions) {
        const parsed = parseSessions(sessions);
        if (parsed) event.sessions = parsed;
    }

    if (req.file) {
        // Remove the old image file if a new one was uploaded
        if (event.imageUrl && event.imageUrl.startsWith('/uploads/')) {
            const oldPath = path.join(__dirname, '..', event.imageUrl);
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }
        event.imageUrl = `/uploads/${req.file.filename}`;
    }

    const updatedEvent = await event.save();
    res.json(updatedEvent);
};

// @desc    Delete an event (and its registrations + feedback, so nothing is left orphaned)
// @route   DELETE /api/events/:id
// @access  Private/Admin
const deleteEvent = async (req, res) => {
    const event = await Event.findById(req.params.id);
    if (!event) {
        res.status(404);
        throw new Error('Event not found');
    }

    if (event.imageUrl && event.imageUrl.startsWith('/uploads/')) {
        const filePath = path.join(__dirname, '..', event.imageUrl);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await Registration.deleteMany({ event: event._id });
    await Feedback.deleteMany({ event: event._id });
    await event.deleteOne();
    res.json({ message: 'Event removed' });
};

module.exports = { getEvents, getEventById, createEvent, updateEvent, deleteEvent };
