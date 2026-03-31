'use strict';

const { bookTicket } = require('../services/ticketService');
const Ticket = require('../models/Ticket');
const Event = require('../models/Event');
const Payment = require('../models/Payment');

// POST /api/tickets/book
const book = async (req, res, next) => {
  try {
    const { eventId, paymentIntentId } = req.body;
    const result = await bookTicket({
      userId: req.user._id,
      eventId,
      paymentIntentId,
    });

    if (!result.success) {
      return res.status(result.statusCode).json({
        success: false,
        message: result.message,
      });
    }

    return res.status(result.statusCode).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/tickets/my-tickets
const getMyTickets = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [tickets, total] = await Promise.all([
      Ticket.find({ userId: req.user._id })
        .populate('eventId', 'title date venue price status bannerImage')
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit)),
      Ticket.countDocuments({ userId: req.user._id }),
    ]);

    return res.status(200).json({
      success: true,
      message: 'My tickets fetched',
      data: {
        tickets,
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

// GET /api/tickets/:id
const getTicket = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('eventId', 'title date venue price status')
      .populate('userId', 'name email');

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    // Only owner, organizer of the event, or admin can view
    const isOwner = ticket.userId._id.toString() === req.user._id.toString();
    if (!isOwner && req.user.role === 'student') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    return res.status(200).json({ success: true, message: 'Ticket fetched', data: { ticket } });
  } catch (err) {
    next(err);
  }
};

// POST /api/tickets/validate
const validateTicket = async (req, res, next) => {
  try {
    const { ticketNumber } = req.body;

    const ticket = await Ticket.findOne({ ticketNumber })
      .populate('eventId', 'title date venue organizerId')
      .populate('userId', 'name email');

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    // Only organizer of the event or admin can validate
    if (
      req.user.role !== 'admin' &&
      ticket.eventId.organizerId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized to validate this ticket' });
    }

    if (ticket.isUsed) {
      return res.status(400).json({
        success: false,
        message: 'Ticket has already been used.',
        data: { ticket },
      });
    }

    if (ticket.paymentStatus !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Ticket payment is not completed.',
        data: { ticket },
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Ticket is valid',
      data: { ticket },
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/tickets/:id/scan
const scanTicket = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('eventId', 'title date venue organizerId');

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    // Only organizer of the event or admin can scan
    if (
      req.user.role !== 'admin' &&
      ticket.eventId.organizerId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized to scan this ticket' });
    }

    if (ticket.isUsed) {
      return res.status(400).json({
        success: false,
        message: 'Ticket has already been scanned/used.',
        data: { ticket },
      });
    }

    if (ticket.paymentStatus !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Ticket payment is not completed.',
      });
    }

    ticket.isUsed = true;
    ticket.scannedAt = new Date();
    ticket.scannedBy = req.user._id;
    await ticket.save();

    return res.status(200).json({
      success: true,
      message: 'Ticket scanned and marked as used',
      data: { ticket },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/tickets/event/:eventId
const getEventTickets = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Only organizer owner or admin
    if (
      req.user.role !== 'admin' &&
      event.organizerId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized to view event tickets' });
    }

    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [tickets, total] = await Promise.all([
      Ticket.find({ eventId: req.params.eventId })
        .populate('userId', 'name email')
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit)),
      Ticket.countDocuments({ eventId: req.params.eventId }),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Event tickets fetched',
      data: {
        tickets,
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

module.exports = { book, getMyTickets, getTicket, validateTicket, scanTicket, getEventTickets };
