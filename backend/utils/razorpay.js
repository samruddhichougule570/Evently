// This code is used for the Razorpay helpers (test mode or live mode - decided purely by the keys in .env).
// If the keys are NOT set, the app quietly falls back to the demo gateway so nothing breaks.
const crypto = require('crypto');
const Razorpay = require('razorpay');

const isRazorpayConfigured = () => Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

let client;
const getClient = () => {
    if (!client) {
        client = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
        });
    }
    return client;
};

// Razorpay signs "order_id|payment_id" with our secret. If our own calculation matches, the payment is genuine.
const verifySignature = (orderId, paymentId, signature) => {
    const expected = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');
    const a = Buffer.from(expected);
    const b = Buffer.from(String(signature || ''));
    return a.length === b.length && crypto.timingSafeEqual(a, b);
};

module.exports = { isRazorpayConfigured, getClient, verifySignature };
