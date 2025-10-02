const mongoose = require('mongoose');

const rentalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true
  },
  rentalType: {
    type: String,
    required: true,
    enum: ['daily', 'monthly']
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  duration: {
    type: Number,
    required: true // in days
  },
  totalAmount: {
    type: Number,
    required: true
  },
  monthlyFee: {
    type: Number,
    default: 0
  },
  dailyFee: {
    type: Number,
    default: 0
  },
  conditions: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'active', 'completed', 'cancelled'],
    default: 'pending'
  },
  vehicleDetails: {
    vehicleNumber: String,
    brand: String,
    model: String,
    year: Number
  },
  userDetails: {
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
    address: String
  },
  purpose: {
    type: String,
    required: true,
    trim: true
  },
  specialRequirements: {
    type: String,
    trim: true
  },
  adminNotes: {
    type: String,
    trim: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  contractId: {
    type: String,
    unique: true,
    sparse: true
  },
  contractTerms: {
    type: String,
    trim: true
  },
  adminGuidelines: {
    type: String,
    trim: true
  },
  contractCreatedAt: {
    type: Date
  },
  contractActivatedAt: {
    type: Date
  },
  contractCompletedAt: {
    type: Date
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

module.exports = mongoose.model('Rental', rentalSchema);

