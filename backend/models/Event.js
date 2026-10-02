// This code is used for the Event database model to define the schema for MongoDB.
const mongoose = require('mongoose');

// A session is a slot within an event (e.g. "Keynote 10 AM"), with its own speaker
const sessionSchema = new mongoose.Schema({
    title: { type: String, required: true },
    speaker: { type: String, required: true },
    startTime: { type: String, required: true }, // e.g. "10:00 AM"
    endTime: { type: String }
}, { _id: true });

const eventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: Date, required: true },
    category: {
        type: String,
        required: true,
        enum: ['Birthday', 'Anniversary', 'Professional Events', 'Celebration']
    },
    imageUrl: { type: String }, // Path to the uploaded image
    sessions: [sessionSchema], // Sessions & speakers for this event
    coordinatorName: { type: String }, // Point of contact for this event
    coordinatorPhone: { type: String }, // WhatsApp/contact number for the coordinator (e.g. "918766065795")
    entryFee: { type: Number, default: 0, min: 0 }, // 0 = Free entry
    capacity: { type: Number, default: 0, min: 0 }, // Max attendees. 0 = unlimited
    registeredCount: { type: Number, default: 0, min: 0 }, // Seats taken (kept in sync atomically by registrationController)
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // Admin who created it
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);
