// This code is used for the Registration database model.
// One document = one user signed up ("RSVP") for one event, and it doubles as the user's TICKET:
// ticketCode is what the QR code contains, and the admin's scan at the door flips `attended` to true.
const mongoose = require('mongoose');
const { generateTicketCode } = require('../utils/ticket');

const registrationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },

    // Attendance
    attended: { type: Boolean, default: false },
    checkedInAt: { type: Date },
    ticketCode: { type: String, unique: true, sparse: true, default: generateTicketCode },

    // Payment info - 'free' for free events, 'paid' once payment succeeds (Razorpay test/live, or the demo gateway)
    paymentStatus: { type: String, enum: ['free', 'paid'], default: 'free' },
    amountPaid: { type: Number, default: 0 },
    paymentMethod: { type: String },
    paymentRef: { type: String },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String }
}, { timestamps: true });

// Prevent the same user from registering for the same event twice
registrationSchema.index({ user: 1, event: 1 }, { unique: true });

module.exports = mongoose.model('Registration', registrationSchema);
