'use strict';

const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, 'Event date is required'],
    },
    venue: {
      type: String,
      required: [true, 'Venue is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
      default: 0,
    },
    totalSeats: {
      type: Number,
      required: [true, 'Total seats is required'],
      min: [1, 'At least 1 seat required'],
    },
    availableSeats: {
      type: Number,
      min: [0, 'Available seats cannot be negative'],
    },
    organizerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    bannerImage: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['active', 'disabled', 'completed', 'cancelled'],
      default: 'active',
    },
    category: {
      type: String,
      enum: ['academic', 'cultural', 'sports', 'technical', 'social', 'other'],
      default: 'other',
    },
  },
  { timestamps: true }
);

// Set availableSeats to totalSeats on creation
eventSchema.pre('save', function (next) {
  if (this.isNew && this.availableSeats === undefined) {
    this.availableSeats = this.totalSeats;
  }
  next();
});

// Indexes for performance
eventSchema.index({ date: 1, status: 1 });
eventSchema.index({ organizerId: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Event', eventSchema);
