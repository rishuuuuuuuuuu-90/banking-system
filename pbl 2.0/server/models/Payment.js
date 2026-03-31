'use strict';

const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    ticketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ticket',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    stripePaymentId: {
      type: String,
      default: '',
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Amount cannot be negative'],
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      default: 'card',
    },
    currency: {
      type: String,
      default: 'usd',
    },
    transactionId: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

paymentSchema.index({ userId: 1 });
paymentSchema.index({ eventId: 1 });
paymentSchema.index({ stripePaymentId: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
