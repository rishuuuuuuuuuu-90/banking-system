'use strict';

const Joi = require('joi');

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map((d) => d.message);
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      error: errors,
    });
  }
  next();
};

// Auth schemas
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('student', 'organizer').default('student'),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  profileImage: Joi.string().uri().allow(''),
  password: Joi.string().min(6),
});

// Event schemas
const createEventSchema = Joi.object({
  title: Joi.string().min(3).max(200).required(),
  description: Joi.string().min(10).required(),
  date: Joi.date().greater('now').required(),
  venue: Joi.string().min(3).required(),
  price: Joi.number().min(0).required(),
  totalSeats: Joi.number().integer().min(1).required(),
  bannerImage: Joi.string().uri().allow('').optional(),
  category: Joi.string()
    .valid('academic', 'cultural', 'sports', 'technical', 'social', 'other')
    .default('other'),
});

const updateEventSchema = Joi.object({
  title: Joi.string().min(3).max(200),
  description: Joi.string().min(10),
  date: Joi.date(),
  venue: Joi.string().min(3),
  price: Joi.number().min(0),
  totalSeats: Joi.number().integer().min(1),
  bannerImage: Joi.string().uri().allow('').optional(),
  category: Joi.string().valid(
    'academic',
    'cultural',
    'sports',
    'technical',
    'social',
    'other'
  ),
  status: Joi.string().valid('active', 'cancelled'),
});

// Ticket schemas
const bookTicketSchema = Joi.object({
  eventId: Joi.string().hex().length(24).required(),
  paymentIntentId: Joi.string().optional().allow(''),
});

const validateTicketSchema = Joi.object({
  ticketNumber: Joi.string().required(),
});

// Payment schemas
const createPaymentIntentSchema = Joi.object({
  eventId: Joi.string().hex().length(24).required(),
});

const verifyPaymentSchema = Joi.object({
  paymentIntentId: Joi.string().required(),
  eventId: Joi.string().hex().length(24).required(),
});

module.exports = {
  validate,
  registerSchema,
  loginSchema,
  updateProfileSchema,
  createEventSchema,
  updateEventSchema,
  bookTicketSchema,
  validateTicketSchema,
  createPaymentIntentSchema,
  verifyPaymentSchema,
};
