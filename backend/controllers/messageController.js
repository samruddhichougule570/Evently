// This code is used for the messageController controller to handle business logic and incoming requests.
const Message = require('../models/Message');

// @desc    Create a new message
// @route   POST /api/messages
// @access  Public
const createMessage = async (req, res) => {
    const { name, email, message } = req.body;
    const newMessage = await Message.create({ name, email, message });
    res.status(201).json({ message: 'Message sent successfully', data: newMessage });
};

// @desc    Get all messages
// @route   GET /api/messages
// @access  Private/Admin
const getMessages = async (req, res) => {
    const messages = await Message.find().sort({ createdAt: -1 });
    res.json(messages);
};

module.exports = { createMessage, getMessages };
