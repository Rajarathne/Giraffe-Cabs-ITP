const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'LKR'
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['cash', 'card']
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  // Stripe specific fields
  stripePaymentIntentId: {
    type: String
  },
  stripeChargeId: {
    type: String
  },
  // Customer details
  customerName: {
    type: String
  },
  customerEmail: {
    type: String
  },
  customerPhone: {
    type: String
  },
  // Payment details
  paymentDetails: {
    cardLast4: String,
    cardBrand: String,
    cardExpMonth: Number,
    cardExpYear: Number
  },
  // Transaction details
  transactionId: {
    type: String,
    unique: true,
    sparse: true
  },
  processedAt: {
    type: Date
  },
  failureReason: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
paymentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Generate transaction ID
paymentSchema.pre('save', function(next) {
  if (this.isNew && !this.transactionId) {
    this.transactionId = 'TXN_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  next();
});

module.exports = mongoose.model('Payment', paymentSchema);

