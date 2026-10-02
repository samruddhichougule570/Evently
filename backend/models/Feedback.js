// This code is used for the Feedback database model.
// One document = one user's rating/comment submitted after attending an event.
const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true }
}, { timestamps: true });

// One feedback per user per event
feedbackSchema.index({ user: 1, event: 1 }, { unique: true });

module.exports = mongoose.model('Feedback', feedbackSchema);
