// This code is used for the errorMiddleware - ONE central place that turns any thrown error into a clean JSON response.
// Controllers no longer need their own try/catch: Express 5 forwards errors from async handlers here automatically.

// 404 for any route that doesn't exist
const notFound = (req, res, next) => {
    res.status(404);
    next(new Error(`Route not found - ${req.originalUrl}`));
};

const errorHandler = (err, req, res, next) => {
    // Controllers set res.status(...) before throwing; otherwise assume a server error
    let status = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
    let message = err.message || 'Server error';

    if (err.code === 11000) {
        // MongoDB unique-index violation
        status = 400;
        message = 'This record already exists';
    } else if (err.name === 'ValidationError') {
        // Mongoose schema validation (required, min, max, enum...)
        status = 400;
        message = Object.values(err.errors).map((e) => e.message).join(', ');
    } else if (err.name === 'CastError') {
        // e.g. a malformed ObjectId in the URL
        status = 400;
        message = `Invalid ${err.path}`;
    } else if (err.name === 'MulterError' || err.message === 'Please upload an image file') {
        status = 400;
    } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        status = 401;
        message = 'Not authorized, token failed';
    }

    res.status(status).json({
        message,
        stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
    });
};

module.exports = { notFound, errorHandler };
