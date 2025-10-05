const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  serviceType: {
    type: String,
    required: true,
    enum: ['wedding', 'airport', 'cargo', 'daily']
  },
  pickupLocation: {
    type: String,
    required: true,
    trim: true
  },
  dropoffLocation: {
    type: String,
    required: true,
    trim: true
  },
  pickupDate: {
    type: Date,
    required: true
  },
  pickupTime: {
    type: String,
    required: true
  },
  returnDate: {
    type: Date
  },
  returnTime: {
    type: String
  },
  passengers: {
    type: Number,
    required: true,
    min: 1
  },
  distance: {
    type: Number,
    default: 0
  },
  totalPrice: {
    type: Number,
    default: 0
  },
  // Admin pricing fields
  adminCalculatedDistance: {
    type: Number,
    default: 0
  },
  adminSetPrice: {
    type: Number,
    default: 0
  },
  pricePerKm: {
    type: Number,
    default: 0
  },
  isPriceConfirmed: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  additionalNotes: {
    type: String,
    trim: true
  },
  // Service specific fields
  serviceDetails: {
    // Wedding specific
    decorationColor: String,
    flowerBouquet: String,
    vehicleColor: String,
    days: Number,
    
    // Airport specific
    flightTime: String,
    bags: Number,
    vehicleType: String,
    
    // Cargo specific
    cargoWeight: Number,
    goodsType: String,
    
    // Daily specific
    hours: Number
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'completed', 'failed'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'stripe'],
    default: 'cash'
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
bookingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);