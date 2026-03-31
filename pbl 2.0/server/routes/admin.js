'use strict';

const router = require('express').Router();
const {
  getGlobalAnalytics,
  getEventStats,
  listUsers,
  listAllEvents,
  adminDisableEvent,
  adminEnableEvent,
} = require('../controllers/adminController');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate, authorize('admin'));

router.get('/analytics', getGlobalAnalytics);
router.get('/event/:eventId/analytics', getEventStats);
router.get('/users', listUsers);
router.get('/events', listAllEvents);
router.patch('/events/:eventId/disable', adminDisableEvent);
router.patch('/events/:eventId/enable', adminEnableEvent);

module.exports = router;
