// This code is used for the Message database model to define the schema for MongoDB.
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    message: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
