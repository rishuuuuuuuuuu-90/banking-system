'use strict';

const Event = require('../models/Event');

// GET /api/events
const listEvents = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      category,
      status = 'active',
      sort = '-date',
    } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (search) filter.$text = { $search: search };

    const skip = (Number(page) - 1) * Number(limit);

    const [events, total] = await Promise.all([
      Event.find(filter)
        .populate('organizerId', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit)),
      Event.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Events fetched successfully',
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

// GET /api/events/:id
const getEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id).populate(
      'organizerId',
      'name email'
    );
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    return res.status(200).json({ success: true, message: 'Event fetched', data: { event } });
  } catch (err) {
    next(err);
  }
};

// POST /api/events
const createEvent = async (req, res, next) => {
  try {
    const { title, description, date, venue, price, totalSeats, bannerImage, category } =
      req.body;
    const event = await Event.create({
      title,
      description,
      date,
      venue,
      price,
      totalSeats,
      bannerImage,
      category,
      organizerId: req.user._id,
    });
    return res.status(201).json({ success: true, message: 'Event created', data: { event } });
  } catch (err) {
    next(err);
  }
};

// PUT /api/events/:id
const updateEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Only organizer owner or admin can update
    if (
      req.user.role !== 'admin' &&
      event.organizerId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this event' });
    }

    const allowedFields = [
      'title', 'description', 'date', 'venue', 'price', 'totalSeats',
      'bannerImage', 'category', 'status',
    ];
    const updates = {};
    allowedFields.forEach((f) => {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    });

    // Adjust availableSeats if totalSeats changed
    if (updates.totalSeats !== undefined) {
      const diff = updates.totalSeats - event.totalSeats;
      updates.availableSeats = Math.max(0, event.availableSeats + diff);
    }

    const updated = await Event.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json({ success: true, message: 'Event updated', data: { event: updated } });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/events/:id
const deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (
      req.user.role !== 'admin' &&
      event.organizerId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this event' });
    }

    await event.deleteOne();
    return res.status(200).json({ success: true, message: 'Event deleted' });
  } catch (err) {
    next(err);
  }
};

// GET /api/events/organizer/my-events
const getMyEvents = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [events, total] = await Promise.all([
      Event.find({ organizerId: req.user._id })
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit)),
      Event.countDocuments({ organizerId: req.user._id }),
    ]);

    return res.status(200).json({
      success: true,
      message: 'My events fetched',
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

// PATCH /api/events/:id/disable  (admin only)
const disableEvent = async (req, res, next) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
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

module.exports = {
  listEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  getMyEvents,
  disableEvent,
};
