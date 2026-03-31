'use strict';

const router = require('express').Router();
const {
  book,
  getMyTickets,
  getTicket,
  validateTicket,
  scanTicket,
  getEventTickets,
} = require('../controllers/ticketController');
const { authenticate, authorize } = require('../middlewares/auth');
const { validate, bookTicketSchema, validateTicketSchema } = require('../middlewares/validation');
const { ticketValidationLimiter } = require('../middlewares/rateLimiter');

router.post('/book', authenticate, authorize('student'), validate(bookTicketSchema), book);
router.get('/my-tickets', authenticate, getMyTickets);
router.post('/validate', authenticate, authorize('organizer', 'admin'), ticketValidationLimiter, validate(validateTicketSchema), validateTicket);
router.get('/event/:eventId', authenticate, authorize('organizer', 'admin'), getEventTickets);
router.get('/:id', authenticate, getTicket);
router.patch('/:id/scan', authenticate, authorize('organizer', 'admin'), scanTicket);

module.exports = router;
