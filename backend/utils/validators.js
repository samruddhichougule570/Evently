// This code is used for the shared validation rules for sign-up (the frontend has the same rules in src/utils/validators.js).
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Returns a message describing the first broken rule, or null when the password is fine
const getPasswordProblem = (password) => {
    if (password.length < 8) return 'Password must be at least 8 characters long';
    if (password.length > 64) return 'Password must be at most 64 characters long';
    if (!/[a-z]/.test(password)) return 'Password must contain a lowercase letter';
    if (!/[A-Z]/.test(password)) return 'Password must contain an uppercase letter';
    if (!/[0-9]/.test(password)) return 'Password must contain a number';
    if (!/[^A-Za-z0-9]/.test(password)) return 'Password must contain a special character (e.g. @ # $ !)';
    return null;
};

module.exports = { EMAIL_REGEX, getPasswordProblem };
