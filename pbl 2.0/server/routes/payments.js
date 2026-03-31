'use strict';

const router = require('express').Router();
const {
  createPaymentIntent,
  verifyPayment,
  handleWebhook,
  getPaymentHistory,
} = require('../controllers/paymentController');
const { authenticate } = require('../middlewares/auth');
const { validate, createPaymentIntentSchema, verifyPaymentSchema } = require('../middlewares/validation');

// Stripe webhook uses raw body - mounted separately in app.js
router.post('/webhook', handleWebhook);

router.post('/create-intent', authenticate, validate(createPaymentIntentSchema), createPaymentIntent);
router.post('/verify', authenticate, validate(verifyPaymentSchema), verifyPayment);
router.get('/history', authenticate, getPaymentHistory);

module.exports = router;
