// This code is used for the eventRoutes routes to define API endpoints.
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { getEvents, getEventById, createEvent, updateEvent, deleteEvent } = require('../controllers/eventController');
const { protect, admin } = require('../middleware/authMiddleware');

const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, 'uploads/');
    },
    filename(req, file, cb) {
        cb(
            null,
            `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
        );
    }
});

const upload = multer({
    storage,
    fileFilter: function(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png|webp|gif)$/i)) {
            return cb(new Error('Please upload an image file'), false);
        }
        cb(null, true);
    }
});

router.route('/')
    .get(getEvents)
    .post(protect, admin, upload.single('image'), createEvent);

router.route('/:id')
    .get(getEventById)
    .put(protect, admin, upload.single('image'), updateEvent)
    .delete(protect, admin, deleteEvent);

module.exports = router;
