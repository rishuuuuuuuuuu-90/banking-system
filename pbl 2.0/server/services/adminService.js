'use strict';

const Ticket = require('../models/Ticket');
const Event = require('../models/Event');
const Payment = require('../models/Payment');

const getAnalytics = async () => {
  const [
    totalRevenue,
    ticketsSold,
    totalTickets,
    totalEvents,
    activeEvents,
    completedEvents,
    disabledEvents,
    cancelledEvents,
  ] = await Promise.all([
    Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Ticket.countDocuments({ paymentStatus: 'completed' }),
    Ticket.countDocuments({}),
    Event.countDocuments({}),
    Event.countDocuments({ status: 'active' }),
    Event.countDocuments({ status: 'completed' }),
    Event.countDocuments({ status: 'disabled' }),
    Event.countDocuments({ status: 'cancelled' }),
  ]);

  const revenue = totalRevenue.length > 0 ? totalRevenue[0].total : 0;
  const attendanceRate = totalTickets > 0
    ? ((Ticket.countDocuments({ isUsed: true }) / totalTickets) * 100).toFixed(2)
    : 0;

  // Most popular event by tickets sold
  const popularEventAgg = await Ticket.aggregate([
    { $group: { _id: '$eventId', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 1 },
    {
      $lookup: {
        from: 'events',
        localField: '_id',
        foreignField: '_id',
        as: 'event',
      },
    },
    { $unwind: '$event' },
  ]);

  const popularEvent = popularEventAgg.length > 0
    ? { event: popularEventAgg[0].event, ticketsSold: popularEventAgg[0].count }
    : null;

  // Attendance count from DB
  const usedTickets = await Ticket.countDocuments({ isUsed: true });
  const attendance = totalTickets > 0
    ? ((usedTickets / totalTickets) * 100).toFixed(2)
    : 0;

  return {
    revenue,
    ticketsSold,
    totalTickets,
    attendance: parseFloat(attendance),
    popularEvent,
    eventStats: {
      total: totalEvents,
      active: activeEvents,
      completed: completedEvents,
      disabled: disabledEvents,
      cancelled: cancelledEvents,
    },
  };
};

const getEventAnalytics = async (eventId) => {
  const [event, tickets, revenue] = await Promise.all([
    Event.findById(eventId),
    Ticket.find({ eventId }).populate('userId', 'name email'),
    Payment.aggregate([
      { $match: { eventId: require('mongoose').Types.ObjectId.createFromHexString(eventId), status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
  ]);

  if (!event) return null;

  const totalTickets = tickets.length;
  const usedTickets = tickets.filter((t) => t.isUsed).length;
  const completedTickets = tickets.filter((t) => t.paymentStatus === 'completed').length;
  const totalRevenue = revenue.length > 0 ? revenue[0].total : 0;
  const attendanceRate = totalTickets > 0
    ? ((usedTickets / totalTickets) * 100).toFixed(2)
    : 0;

  return {
    event,
    tickets,
    stats: {
      totalTickets,
      usedTickets,
      completedTickets,
      totalRevenue,
      attendanceRate: parseFloat(attendanceRate),
      availableSeats: event.availableSeats,
      totalSeats: event.totalSeats,
      occupancyRate: event.totalSeats > 0
        ? (((event.totalSeats - event.availableSeats) / event.totalSeats) * 100).toFixed(2)
        : 0,
    },
  };
};

module.exports = { getAnalytics, getEventAnalytics };
