const mongoose = require('mongoose');

const serviceRecordSchema = new mongoose.Schema({
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true
  },
  serviceDate: {
    type: Date,
    required: true
  },
  serviceType: {
    type: String,
    required: true,
    enum: ['routine', 'repair', 'maintenance', 'inspection', 'emergency']
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  mileage: {
    type: Number,
    required: true
  },
  cost: {
    type: Number,
    required: true
  },
  serviceProvider: {
    type: String,
    required: true,
    trim: true
  },
  partsReplaced: [{
    partName: String,
    partNumber: String,
    cost: Number
  }],
  nextServiceDue: {
    type: Date
  },
  nextServiceMileage: {
    type: Number
  },
  technician: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  receipts: [{
    type: String // File paths or URLs
  }],
  isWarranty: {
    type: Boolean,
    default: false
  },
  warrantyExpiry: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ServiceRecord', serviceRecordSchema);

