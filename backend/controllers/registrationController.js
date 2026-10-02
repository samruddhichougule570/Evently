// This code is used for the registrationController to handle event sign-up ("RSVP"), seats, payment, tickets and attendance logic.
const crypto = require('crypto');
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const { isPastEvent } = require('../utils/dates');
const { generateTicketCode } = require('../utils/ticket');
const { isRazorpayConfigured, getClient, verifySignature } = require('../utils/razorpay');

// Push the fresh seat count to every connected browser (Socket.io) so cards/pages update live
const broadcastSeats = (req, event) => {
    const io = req.app.get('io');
    if (io && event) {
        io.emit('seats:update', {
            eventId: String(event._id),
            registeredCount: event.registeredCount,
            capacity: event.capacity
        });
    }
};

// Registrations created before tickets existed have no ticketCode - give them one and SAVE it,
// so the QR a user sees today is the same QR the admin scans tomorrow.
const withTicketCodes = async (registrations) => {
    for (const r of registrations) {
        if (!r.ticketCode) {
            r.ticketCode = generateTicketCode();
            await Registration.updateOne({ _id: r._id, ticketCode: { $exists: false } }, { ticketCode: r.ticketCode });
        }
    }
    return registrations;
};

// If someone paid through Razorpay but we then can't give them a seat, send the money back
const refundQuietly = async (paymentId) => {
    if (!paymentId || !isRazorpayConfigured()) return;
    try {
        await getClient().payments.refund(paymentId, { speed: 'normal' });
    } catch (err) {
        console.error(`Refund failed for ${paymentId}: ${err.message} - refund manually from the Razorpay dashboard`);
    }
};

// @desc    Register the logged-in user for an event
// @route   POST /api/registrations
// @access  Private
const registerForEvent = async (req, res) => {
    const { eventId, paymentMethod, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
        res.status(404);
        throw new Error('Event not found');
    }

    // Server-side rule: registration is closed once the event day has passed
    if (isPastEvent(event.date)) {
        res.status(400);
        throw new Error('Registration is closed - this event has already happened');
    }

    // ---- Payment step (only for paid events) ----
    let payment = { paymentStatus: 'free', amountPaid: 0 };
    let razorpayPaid = false;

    if (event.entryFee > 0) {
        if (isRazorpayConfigured()) {
            // REAL gateway (Razorpay test/live): never trust the browser - verify the signature and the order itself
            if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
                res.status(402);
                throw new Error(`Payment of ₹${event.entryFee} is required to register`);
            }
            if (!verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
                res.status(400);
                throw new Error('Payment verification failed');
            }

            // The order must be for THIS event, THIS user and the full fee (stops "pay for a cheap event, use it for an expensive one")
            const order = await getClient().orders.fetch(razorpay_order_id);
            const validOrder =
                order.amount === Math.round(event.entryFee * 100) &&
                order.notes?.eventId === String(event._id) &&
                order.notes?.userId === String(req.user._id);
            if (!validOrder) {
                res.status(400);
                throw new Error('Payment does not match this event');
            }

            // One payment can only ever buy one ticket
            if (await Registration.findOne({ razorpayPaymentId: razorpay_payment_id })) {
                res.status(400);
                throw new Error('This payment has already been used');
            }

            razorpayPaid = true;
            payment = {
                paymentStatus: 'paid',
                amountPaid: event.entryFee,
                paymentMethod: 'Razorpay',
                paymentRef: razorpay_payment_id,
                razorpayOrderId: razorpay_order_id,
                razorpayPaymentId: razorpay_payment_id
            };
        } else {
            // DEMO gateway (no keys configured): simulated payment, no real money
            if (!paymentMethod) {
                res.status(402);
                throw new Error(`Payment of ₹${event.entryFee} is required to register`);
            }
            payment = {
                paymentStatus: 'paid',
                amountPaid: event.entryFee,
                paymentMethod,
                paymentRef: `SIM-${crypto.randomBytes(5).toString('hex').toUpperCase()}`
            };
        }
    }

    // ATOMIC seat claim: "if there is still room, add 1" happens as ONE database operation.
    // Two people clicking for the last seat at the same instant can't both succeed.
    const updatedEvent = await Event.findOneAndUpdate(
        {
            _id: eventId,
            $or: [{ capacity: 0 }, { $expr: { $lt: ['$registeredCount', '$capacity'] } }]
        },
        { $inc: { registeredCount: 1 } },
        { new: true }
    );
    if (!updatedEvent) {
        if (razorpayPaid) await refundQuietly(razorpay_payment_id);
        res.status(409);
        throw new Error(razorpayPaid ? 'Sorry, this event is full - your payment has been refunded' : 'Sorry, this event is full');
    }

    let registration;
    try {
        // ticketCode is generated automatically by the model
        registration = await Registration.create({ user: req.user._id, event: eventId, ...payment });
    } catch (error) {
        // Roll back the seat we just claimed, then report the problem
        await Event.updateOne({ _id: eventId }, { $inc: { registeredCount: -1 } });
        if (razorpayPaid) await refundQuietly(razorpay_payment_id);
        if (error.code === 11000) {
            res.status(400);
            throw new Error('You are already registered for this event');
        }
        throw error;
    }

    broadcastSeats(req, updatedEvent);
    res.status(201).json(registration);
};

// @desc    Cancel the logged-in user's registration for an event
// @route   DELETE /api/registrations/:eventId
// @access  Private
const cancelRegistration = async (req, res) => {
    const event = await Event.findById(req.params.eventId);
    if (event && isPastEvent(event.date)) {
        res.status(400);
        throw new Error("You can't cancel a registration for an event that has already happened");
    }

    const registration = await Registration.findOneAndDelete({
        user: req.user._id,
        event: req.params.eventId
    });
    if (!registration) {
        res.status(404);
        throw new Error('Registration not found');
    }

    // Free the seat (never let the counter drop below 0)
    const updatedEvent = await Event.findOneAndUpdate(
        { _id: req.params.eventId, registeredCount: { $gt: 0 } },
        { $inc: { registeredCount: -1 } },
        { new: true }
    );
    broadcastSeats(req, updatedEvent);
    res.json({ message: 'Registration cancelled' });
};

// @desc    Get all events the logged-in user has registered for (each one is also a ticket with a QR code)
// @route   GET /api/registrations/my
// @access  Private
const getMyRegistrations = async (req, res) => {
    const registrations = await Registration.find({ user: req.user._id }).populate('event').lean();
    res.json(await withTicketCodes(registrations));
};

// @desc    Get every registrant (participant) for a specific event, for the admin
// @route   GET /api/registrations/event/:eventId
// @access  Private/Admin
const getEventRegistrations = async (req, res) => {
    const registrations = await Registration.find({ event: req.params.eventId })
        .populate('user', 'name email')
        .sort({ createdAt: 1 })
        .lean();
    res.json(await withTicketCodes(registrations));
};

// @desc    Toggle a participant's attended status manually (fallback when a QR can't be scanned)
// @route   PUT /api/registrations/:id/attendance
// @access  Private/Admin
const markAttendance = async (req, res) => {
    const registration = await Registration.findById(req.params.id);
    if (!registration) {
        res.status(404);
        throw new Error('Registration not found');
    }
    registration.attended = !registration.attended;
    registration.checkedInAt = registration.attended ? new Date() : undefined;
    await registration.save();
    res.json(registration);
};

// @desc    QR check-in: the admin scans a ticket at the door and the person is marked as attended
// @route   POST /api/registrations/checkin   body: { ticketCode, eventId? }
// @access  Private/Admin
const checkIn = async (req, res) => {
    const code = String(req.body.ticketCode || '').trim().toUpperCase();
    if (!code) {
        res.status(400);
        throw new Error('Ticket code is required');
    }

    const registration = await Registration.findOne({ ticketCode: code })
        .populate('user', 'name email')
        .populate('event', 'title date');
    if (!registration) {
        res.status(404);
        throw new Error('Invalid ticket - no registration found for this code');
    }

    // The admin picked an event on the scanner screen - a ticket for a different event must be rejected
    if (req.body.eventId && String(registration.event._id) !== String(req.body.eventId)) {
        res.status(400);
        throw new Error(`This ticket is for "${registration.event.title}", not the selected event`);
    }

    // Same QR scanned twice (or shared with a friend) -> report it instead of silently accepting
    if (registration.attended) {
        return res.status(409).json({
            status: 'already_checked_in',
            message: `${registration.user.name} was already checked in`,
            name: registration.user.name,
            checkedInAt: registration.checkedInAt
        });
    }

    registration.attended = true;
    registration.checkedInAt = new Date();
    await registration.save();

    res.json({
        status: 'checked_in',
        message: `${registration.user.name} checked in`,
        name: registration.user.name,
        email: registration.user.email,
        eventTitle: registration.event.title,
        paymentStatus: registration.paymentStatus,
        checkedInAt: registration.checkedInAt
    });
};

module.exports = {
    registerForEvent,
    cancelRegistration,
    getMyRegistrations,
    getEventRegistrations,
    markAttendance,
    checkIn
};
