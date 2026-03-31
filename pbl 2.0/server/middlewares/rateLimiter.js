'use strict';

const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 10 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const ticketValidationLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30,
  message: {
    success: false,
    message: 'Too many validation requests, please slow down.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { authLimiter, generalLimiter, ticketValidationLimiter };
