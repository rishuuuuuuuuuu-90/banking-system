'use strict';

const { getAnalytics, getEventAnalytics } = require('../services/adminService');
const User = require('../models/User');
const Event = require('../models/Event');

// GET /api/admin/analytics
const getGlobalAnalytics = async (req, res, next) => {
  try {
    const analytics = await getAnalytics();
    return res.status(200).json({
      success: true,
      message: 'Analytics fetched',
      data: analytics,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/event/:eventId/analytics
const getEventStats = async (req, res, next) => {
  try {
    const analytics = await getEventAnalytics(req.params.eventId);
    if (!analytics) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    return res.status(200).json({
      success: true,
      message: 'Event analytics fetched',
      data: analytics,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/users
const listUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const filter = {};
    if (role) filter.role = role;

    const [users, total] = await Promise.all([
      User.find(filter).sort('-createdAt').skip(skip).limit(Number(limit)),
      User.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Users fetched',
      data: {
        users,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/events
const listAllEvents = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const filter = {};
    if (status) filter.status = status;

    const [events, total] = await Promise.all([
      Event.find(filter)
        .populate('organizerId', 'name email')
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit)),
      Event.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: 'All events fetched',
      data: {
        events,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/events/:eventId/disable
const adminDisableEvent = async (req, res, next) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.eventId,
      { status: 'disabled' },
      { new: true }
    );
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    return res.status(200).json({ success: true, message: 'Event disabled', data: { event } });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/events/:eventId/enable
const adminEnableEvent = async (req, res, next) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.eventId,
      { status: 'active' },
      { new: true }
    );
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    return res.status(200).json({ success: true, message: 'Event enabled', data: { event } });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getGlobalAnalytics,
  getEventStats,
  listUsers,
  listAllEvents,
  adminDisableEvent,
  adminEnableEvent,
};
