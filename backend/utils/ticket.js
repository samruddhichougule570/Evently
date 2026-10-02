// This code is used for generating unique ticket codes. The code is what gets encoded inside the QR ticket.
const crypto = require('crypto');

// e.g. "EVT-9F3A1C7B" - short enough to type by hand if the QR can't be scanned
const generateTicketCode = () => `EVT-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

module.exports = { generateTicketCode };
