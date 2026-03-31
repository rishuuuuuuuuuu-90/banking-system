'use strict';

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const Ticket = require('../models/Ticket');
const Event = require('../models/Event');
const Payment = require('../models/Payment');
const { generateQRCode } = require('../utils/qrCode');

/**
 * Atomically book a ticket for a user/event using a Mongoose session/transaction.
 * Prevents overbooking and duplicate bookings.
 */
const bookTicket = async ({ userId, eventId, paymentIntentId }) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Check for duplicate booking
    const existing = await Ticket.findOne({ userId, eventId }).session(session);
    if (existing) {
      await session.abortTransaction();
      session.endSession();
      return { success: false, statusCode: 409, message: 'You already have a ticket for this event.' };
    }

    // Fetch event and check availability
    const event = await Event.findById(eventId).session(session);
    if (!event) {
      await session.abortTransaction();
      session.endSession();
      return { success: false, statusCode: 404, message: 'Event not found.' };
    }

    if (event.status !== 'active') {
      await session.abortTransaction();
      session.endSession();
      return { success: false, statusCode: 400, message: 'This event is not accepting bookings.' };
    }

    if (event.availableSeats <= 0) {
      await session.abortTransaction();
      session.endSession();
      return { success: false, statusCode: 400, message: 'No seats available for this event.' };
    }

    // Decrement availableSeats atomically
    const updatedEvent = await Event.findOneAndUpdate(
      { _id: eventId, availableSeats: { $gt: 0 } },
      { $inc: { availableSeats: -1 } },
      { new: true, session }
    );

    if (!updatedEvent) {
      await session.abortTransaction();
      session.endSession();
      return { success: false, statusCode: 400, message: 'No seats available for this event.' };
    }

    // Generate unique ticket number
    const ticketNumber = `TKT-${uuidv4().toUpperCase().replace(/-/g, '').slice(0, 12)}`;

    // Determine payment status
    const paymentStatus = event.price === 0 ? 'completed' : 'pending';

    // Create ticket
    const [ticket] = await Ticket.create(
      [
        {
          userId,
          eventId,
          ticketNumber,
          paymentStatus,
          amount: event.price,
        },
      ],
      { session }
    );

    // Create payment record if event is paid
    if (event.price > 0) {
      await Payment.create(
        [
          {
            ticketId: ticket._id,
            userId,
            eventId,
            stripePaymentId: paymentIntentId || '',
            amount: event.price,
            status: 'pending',
            currency: 'usd',
          },
        ],
        { session }
      );
    }

    // Generate QR code
    const qrPayload = {
      ticketNumber: ticket.ticketNumber,
      eventId: eventId.toString(),
      userId: userId.toString(),
    };
    const qrCode = await generateQRCode(qrPayload);
    ticket.qrCode = qrCode;
    await ticket.save({ session });

    await session.commitTransaction();
    session.endSession();

    return {
      success: true,
      statusCode: 201,
      message: 'Ticket booked successfully',
      data: { ticket, event: updatedEvent },
    };
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};

module.exports = { bookTicket };
