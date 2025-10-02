const mongoose = require('mongoose');

const vehicleRequestSchema = new mongoose.Schema({
  vehicleProvider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VehicleProvider',
    required: true
  },
  vehicleNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
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
    required: true,
    min: 1990,
    max: new Date().getFullYear() + 1
  },
  color: {
    type: String,
    required: true,
    trim: true
  },
  capacity: {
    type: Number,
    required: true,
    min: 1
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
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  features: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  adminNotes: {
    type: String,
    maxlength: [500, 'Admin notes cannot exceed 500 characters']
  },
  // Vehicle photos (can be added later)
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
  // Approval details
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  rejectedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for better performance
vehicleRequestSchema.index({ vehicleProvider: 1 });
vehicleRequestSchema.index({ vehicleNumber: 1 });
vehicleRequestSchema.index({ status: 1 });
vehicleRequestSchema.index({ createdAt: -1 });

// Virtual for full vehicle name
vehicleRequestSchema.virtual('fullVehicleName').get(function() {
  return `${this.year} ${this.brand} ${this.model}`;
});

// Virtual for status badge class
vehicleRequestSchema.virtual('statusClass').get(function() {
  const statusClasses = {
    pending: 'status-pending',
    approved: 'status-approved',
    rejected: 'status-rejected'
  };
  return statusClasses[this.status] || '';
});

// Ensure virtual fields are serialized
vehicleRequestSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('VehicleRequest', vehicleRequestSchema);
















