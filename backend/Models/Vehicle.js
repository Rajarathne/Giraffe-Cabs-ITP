const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  vehicleNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  vehicleType: {
    type: String,
    required: true,
    enum: ['van', 'bus', 'wedding_car', 'car', 'goods_vehicle', 'bike', 'lorry']
  },
  brand: {
    type: String,
    required: true,
    trim: true
  },
  model: {
    type: String,
    required: true,
    trim: true
  },
  year: {
    type: Number,
    required: true
  },
  color: {
    type: String,
    required: true,
    trim: true
  },
  capacity: {
    type: Number,
    required: true
  },
  fuelType: {
    type: String,
    required: true,
    enum: ['petrol', 'diesel', 'electric', 'hybrid']
  },
  transmission: {
    type: String,
    required: true,
    enum: ['manual', 'automatic']
  },
  // Pricing fields
  dailyRate: {
    type: Number,
    required: true,
    min: 0
  },
  monthlyRate: {
    type: Number,
    required: true,
    min: 0
  },
  weddingRate: {
    type: Number,
    default: 50000,
    min: 0
  },
  airportRate: {
    type: Number,
    min: 0
  },
  cargoRate: {
    type: Number,
    min: 0
  },
  // Ride types this vehicle can handle
  rideTypes: [{
    type: String,
    enum: ['wedding', 'daily', 'airport', 'cargo']
  }],
  // Vehicle photos
  photos: [{
    url: {
      type: String
    },
    caption: {
      type: String,
      default: ''
    },
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  // Legacy support for existing images field
  images: [{
    type: String
  }],
  features: [{
    type: String
  }],
  isAvailable: {
    type: Boolean,
    default: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  description: {
    type: String,
    trim: true
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },
  // Rental tracking fields
  rentalStartDate: {
    type: Date
  },
  rentalEndDate: {
    type: Date
  },
  currentRentalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Rental'
  }
});

module.exports = mongoose.model('Vehicle', vehicleSchema);

