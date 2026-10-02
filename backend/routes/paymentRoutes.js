// This code is used for the paymentRoutes routes to define the payment API endpoints.
const express = require('express');
const router = express.Router();
const { getPaymentConfig, createOrder } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

router.get('/config', getPaymentConfig);
router.post('/order', protect, createOrder);

module.exports = router;
