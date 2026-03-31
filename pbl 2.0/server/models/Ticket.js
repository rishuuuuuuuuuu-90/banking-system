'use strict';

const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema(
  {
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
    ticketNumber: {
      type: String,
      required: true,
      unique: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    qrCode: {
      type: String,
      default: '',
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
    scannedAt: {
      type: Date,
    },
    scannedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Amount cannot be negative'],
    },
  },
  { timestamps: true }
);

// Compound unique index to prevent duplicate bookings
ticketSchema.index({ userId: 1, eventId: 1 }, { unique: true });

module.exports = mongoose.model('Ticket', ticketSchema);
