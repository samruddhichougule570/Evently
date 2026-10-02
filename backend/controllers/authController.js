// This code is used for the authController controller to handle business logic and incoming requests.
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { EMAIL_REGEX, getPasswordProblem } = require('../utils/validators');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Cookie settings: httpOnly means JavaScript in the browser can NEVER read the token (protects against XSS theft)
const cookieOptions = {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days, same as the JWT
};

// Sets the token cookie and sends back the user profile (the token itself is NOT sent in the JSON body)
const sendAuthResponse = (res, user, status = 200) => {
    res.cookie('token', generateToken(user._id), cookieOptions);
    res.status(status).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
    });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    // Never trust the browser's validation - check again on the server
    if (name.length < 2 || name.length > 60) {
        res.status(400);
        throw new Error('Name must be between 2 and 60 characters');
    }
    if (!EMAIL_REGEX.test(email)) {
        res.status(400);
        throw new Error('Please enter a valid email address');
    }
    const passwordProblem = getPasswordProblem(password);
    if (passwordProblem) {
        res.status(400);
        throw new Error(passwordProblem);
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    // role defaults to 'user' - nobody can self-register as admin
    const user = await User.create({ name, email, password });
    sendAuthResponse(res, user, 201);
};

// @desc    Auth user & set token cookie
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (!EMAIL_REGEX.test(email) || !password) {
        res.status(400);
        throw new Error('Please enter a valid email and password');
    }

    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
        sendAuthResponse(res, user);
    } else {
        res.status(401);
        throw new Error('Invalid email or password');
    }
};

// @desc    Log out - clear the token cookie
// @route   POST /api/auth/logout
// @access  Public
const logoutUser = (req, res) => {
    res.clearCookie('token', { httpOnly: true, sameSite: 'lax', secure: cookieOptions.secure });
    res.json({ message: 'Logged out' });
};

// @desc    Get the currently logged-in user (used to restore a session on page load)
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
    res.json({ _id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role });
};

module.exports = { registerUser, loginUser, logoutUser, getMe };
