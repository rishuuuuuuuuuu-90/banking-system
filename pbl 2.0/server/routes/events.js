'use strict';

const router = require('express').Router();
const {
  listEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  getMyEvents,
  disableEvent,
} = require('../controllers/eventController');
const { authenticate, authorize } = require('../middlewares/auth');
const { validate, createEventSchema, updateEventSchema } = require('../middlewares/validation');

// Public routes
router.get('/', listEvents);
router.get('/organizer/my-events', authenticate, authorize('organizer'), getMyEvents);
router.get('/:id', getEvent);

// Organizer routes
router.post('/', authenticate, authorize('organizer', 'admin'), validate(createEventSchema), createEvent);
router.put('/:id', authenticate, authorize('organizer', 'admin'), validate(updateEventSchema), updateEvent);
router.delete('/:id', authenticate, authorize('organizer', 'admin'), deleteEvent);

// Admin route
router.patch('/:id/disable', authenticate, authorize('admin'), disableEvent);

module.exports = router;
