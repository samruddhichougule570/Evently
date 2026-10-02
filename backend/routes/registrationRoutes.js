// This code is used for the registrationRoutes routes to define API endpoints for event sign-up, tickets & attendance.
const express = require('express');
const router = express.Router();
const {
    registerForEvent,
    cancelRegistration,
    getMyRegistrations,
    getEventRegistrations,
    markAttendance,
    checkIn
} = require('../controllers/registrationController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/', protect, registerForEvent);
router.post('/checkin', protect, admin, checkIn);
router.get('/my', protect, getMyRegistrations);
router.get('/event/:eventId', protect, admin, getEventRegistrations);
router.put('/:id/attendance', protect, admin, markAttendance);
router.delete('/:eventId', protect, cancelRegistration);

module.exports = router;
