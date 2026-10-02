// This code is used for the paymentController to start a Razorpay checkout for a paid event.
// The money flow: (1) server creates an ORDER -> (2) browser opens Razorpay checkout -> (3) server VERIFIES the
// signature inside registrationController before creating the registration. The browser is never trusted.
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const { isPastEvent } = require('../utils/dates');
const { isRazorpayConfigured, getClient } = require('../utils/razorpay');

// @desc    Tell the frontend which gateway to use ('razorpay' or the built-in 'demo')
// @route   GET /api/payments/config
// @access  Public
const getPaymentConfig = (req, res) => {
    if (isRazorpayConfigured()) {
        res.json({ mode: 'razorpay', keyId: process.env.RAZORPAY_KEY_ID });
    } else {
        res.json({ mode: 'demo' });
    }
};

// @desc    Create a Razorpay order for an event's entry fee
// @route   POST /api/payments/order
// @access  Private
const createOrder = async (req, res) => {
    if (!isRazorpayConfigured()) {
        res.status(400);
        throw new Error('Razorpay is not configured on the server');
    }

    const event = await Event.findById(req.body.eventId);
    if (!event) {
        res.status(404);
        throw new Error('Event not found');
    }
    if (isPastEvent(event.date)) {
        res.status(400);
        throw new Error('Registration is closed - this event has already happened');
    }
    if (!(event.entryFee > 0)) {
        res.status(400);
        throw new Error('This event is free - no payment needed');
    }
    if (event.capacity > 0 && event.registeredCount >= event.capacity) {
        res.status(409);
        throw new Error('Sorry, this event is full');
    }
    if (await Registration.findOne({ user: req.user._id, event: event._id })) {
        res.status(400);
        throw new Error('You are already registered for this event');
    }

    // Razorpay amounts are in the smallest unit (paise): ₹200 -> 20000. The amount comes from OUR database, never from the browser.
    const order = await getClient().orders.create({
        amount: Math.round(event.entryFee * 100),
        currency: 'INR',
        receipt: `evt_${Date.now()}`,
        notes: { eventId: String(event._id), userId: String(req.user._id) }
    });

    res.json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        eventTitle: event.title
    });
};

module.exports = { getPaymentConfig, createOrder };
