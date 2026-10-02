// This code is used for the authMiddleware middleware to intercept and process requests before they reach controllers.
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verifies the JWT and attaches the real user (from the DB) to req.user.
// The token is read from the HTTP-only cookie first (browser), with a Bearer header as a fallback (Postman/testing).
const protect = async (req, res, next) => {
    let token = req.cookies && req.cookies.token;

    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        res.status(401);
        throw new Error('Not authorized, no token');
    }

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        res.status(401);
        throw new Error('Not authorized, token failed');
    }

    // The token only holds the user id - role is always read fresh from the database
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
        res.status(401);
        throw new Error('Not authorized, user no longer exists');
    }

    req.user = user;
    next();
};

// Middleware to ensure the authenticated user has administrative privileges
const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403);
        throw new Error('Not authorized as an admin');
    }
};

module.exports = { protect, admin };
