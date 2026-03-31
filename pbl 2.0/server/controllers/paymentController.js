'use strict';

const { getStripe } = require('../utils/stripe');
const Payment = require('../models/Payment');
const Ticket = require('../models/Ticket');
const Event = require('../models/Event');

// POST /api/payments/create-intent
const createPaymentIntent = async (req, res, next) => {
  try {
    const { eventId } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.price === 0) {
      return res.status(400).json({ success: false, message: 'This is a free event. No payment required.' });
    }

    // Check for existing ticket
    const existing = await Ticket.findOne({ userId: req.user._id, eventId });
    if (existing && existing.paymentStatus === 'completed') {
      return res.status(409).json({ success: false, message: 'You already have a ticket for this event.' });
    }

    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(event.price * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        eventId: eventId,
        userId: req.user._id.toString(),
        eventTitle: event.title,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Payment intent created',
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: event.price,
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/payments/verify
const verifyPayment = async (req, res, next) => {
  try {
    const { paymentIntentId, eventId } = req.body;
    const stripe = getStripe();

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        message: `Payment not completed. Status: ${paymentIntent.status}`,
      });
    }

    // Update payment and ticket records
    const ticket = await Ticket.findOne({ userId: req.user._id, eventId });
    if (ticket) {
      ticket.paymentStatus = 'completed';
      await ticket.save();

      await Payment.findOneAndUpdate(
        { ticketId: ticket._id },
        {
          stripePaymentId: paymentIntentId,
          status: 'completed',
          transactionId: paymentIntentId,
        },
        { upsert: true }
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      data: { ticket, paymentIntent: { id: paymentIntent.id, status: paymentIntent.status } },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/payments/webhook  (raw body required)
const handleWebhook = async (req, res, next) => {
  const sig = req.headers['stripe-signature'];

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(400).json({ success: false, message: 'Webhook signature missing' });
  }

  let event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).json({ success: false, message: `Webhook Error: ${err.message}` });
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const intent = event.data.object;
        const { eventId, userId } = intent.metadata;

        if (eventId && userId) {
          const ticket = await Ticket.findOne({ userId, eventId });
          if (ticket && ticket.paymentStatus !== 'completed') {
            ticket.paymentStatus = 'completed';
            await ticket.save();

            await Payment.findOneAndUpdate(
              { ticketId: ticket._id },
              {
                stripePaymentId: intent.id,
                status: 'completed',
                transactionId: intent.id,
              },
              { upsert: true }
            );
          }
        }
        break;
      }
      case 'payment_intent.payment_failed': {
        const intent = event.data.object;
        const { eventId, userId } = intent.metadata;
        if (eventId && userId) {
          await Ticket.findOneAndUpdate(
            { userId, eventId },
            { paymentStatus: 'failed' }
          );
          await Payment.findOneAndUpdate(
            { stripePaymentId: intent.id },
            { status: 'failed' }
          );
        }
        break;
      }
      default:
        break;
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    next(err);
  }
};

// GET /api/payments/history
const getPaymentHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [payments, total] = await Promise.all([
      Payment.find({ userId: req.user._id })
        .populate('eventId', 'title date venue')
        .populate('ticketId', 'ticketNumber paymentStatus')
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit)),
      Payment.countDocuments({ userId: req.user._id }),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Payment history fetched',
      data: {
        payments,
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

module.exports = { createPaymentIntent, verifyPayment, handleWebhook, getPaymentHistory };
