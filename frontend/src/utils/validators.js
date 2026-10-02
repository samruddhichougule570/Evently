// This code is used for the form validation rules (the backend enforces the SAME rules in backend/utils/validators.js).
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Each rule has a label (shown as a live checklist) and a test
export const PASSWORD_RULES = [
    { id: 'length', label: 'At least 8 characters', test: (p) => p.length >= 8 },
    { id: 'lower', label: 'One lowercase letter (a-z)', test: (p) => /[a-z]/.test(p) },
    { id: 'upper', label: 'One uppercase letter (A-Z)', test: (p) => /[A-Z]/.test(p) },
    { id: 'number', label: 'One number (0-9)', test: (p) => /[0-9]/.test(p) },
    { id: 'special', label: 'One special character (@ # $ ! ...)', test: (p) => /[^A-Za-z0-9]/.test(p) }
];

export const isPasswordValid = (password) => PASSWORD_RULES.every((rule) => rule.test(password));

export const getNameError = (name) => {
    const trimmed = name.trim();
    if (!trimmed) return 'Please enter your name';
    if (trimmed.length < 2) return 'Name must be at least 2 characters';
    if (trimmed.length > 60) return 'Name must be at most 60 characters';
    return '';
};

export const getEmailError = (email) => {
    const trimmed = email.trim();
    if (!trimmed) return 'Please enter your email address';
    if (!EMAIL_REGEX.test(trimmed)) return 'Please enter a valid email address (e.g. name@example.com)';
    return '';
};
