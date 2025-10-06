const mongoose = require('mongoose');

const vehicleProviderContractSchema = new mongoose.Schema({
  // Contract Information
  contractId: {
    type: String,
    required: true,
    unique: true,
    default: function() {
      return 'VPC-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
    }
  },
  
  // Parties
  vehicleProvider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VehicleProvider',
    required: true
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Vehicle Information
  vehicle: {
    vehicleNumber: {
      type: String,
      required: [true, 'Vehicle number is required'],
      trim: true,
      uppercase: true
    },
    brand: {
      type: String,
      required: [true, 'Vehicle brand is required'],
      trim: true
    },
    model: {
      type: String,
      required: [true, 'Vehicle model is required'],
      trim: true
    },
    year: {
      type: Number,
      required: [true, 'Vehicle year is required'],
      min: [1990, 'Vehicle year must be 1990 or later'],
      max: [new Date().getFullYear() + 1, 'Vehicle year cannot be in the future']
    },
    color: {
      type: String,
      required: [true, 'Vehicle color is required'],
      trim: true
    },
    vehicleType: {
      type: String,
      required: [true, 'Vehicle type is required'],
      enum: ['Car', 'Van', 'Bus', 'Truck', 'Motorcycle', 'Other'],
      default: 'Car'
    },
    fuelType: {
      type: String,
      required: [true, 'Fuel type is required'],
      enum: ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG', 'LPG'],
      default: 'Petrol'
    },
    transmission: {
      type: String,
      required: [true, 'Transmission type is required'],
      enum: ['Manual', 'Automatic', 'Semi-Automatic'],
      default: 'Manual'
    },
    seatingCapacity: {
      type: Number,
      required: [true, 'Seating capacity is required'],
      min: [1, 'Seating capacity must be at least 1'],
      max: [50, 'Seating capacity cannot exceed 50']
    },
    engineCapacity: {
      type: String,
      required: [true, 'Engine capacity is required'],
      trim: true
    },
    mileage: {
      type: Number,
      required: [true, 'Vehicle mileage is required'],
      min: [0, 'Mileage cannot be negative']
    },
    features: [{
      type: String,
      trim: true
    }],
    condition: {
      type: String,
      required: [true, 'Vehicle condition is required'],
      enum: ['Excellent', 'Good', 'Fair', 'Poor'],
      default: 'Good'
    },
    insuranceDetails: {
      insuranceCompany: { type: String, required: true, trim: true },
      policyNumber: { type: String, required: true, trim: true },
      expiryDate: { type: Date, required: true }
    },
    registrationDetails: {
      registrationNumber: { type: String, required: true, trim: true },
      registrationDate: { type: Date, required: true },
      expiryDate: { type: Date, required: true }
    },
    vehicleImages: [{
      imageUrl: { type: String, required: true },
      imageType: { 
        type: String, 
        enum: ['Front', 'Back', 'Side', 'Interior', 'Engine', 'Other'],
        default: 'Other'
      },
      uploadedAt: { type: Date, default: Date.now }
    }]
  },
  
  // Contract Terms
  contractTerms: {
    startDate: {
      type: Date,
      required: [true, 'Contract start date is required']
    },
    endDate: {
      type: Date,
      required: [true, 'Contract end date is required']
    },
    duration: {
      type: Number, // in months
      required: [true, 'Contract duration is required'],
      min: [1, 'Contract duration must be at least 1 month'],
      max: [60, 'Contract duration cannot exceed 60 months']
    },
    monthlyFee: {
      type: Number,
      required: [true, 'Monthly fee is required'],
      min: [0, 'Monthly fee cannot be negative']
    },
    paymentTerms: {
      type: String,
      required: [true, 'Payment terms are required'],
      enum: ['Monthly', 'Quarterly', 'Semi-Annual', 'Annual'],
      default: 'Monthly'
    },
    paymentMethod: {
      type: String,
      required: [true, 'Payment method is required'],
      enum: ['Bank Transfer', 'Cash', 'Cheque', 'Online Payment'],
      default: 'Bank Transfer'
    },
    latePaymentPenalty: {
      type: Number,
      default: 0,
      min: [0, 'Late payment penalty cannot be negative']
    },
    securityDeposit: {
      type: Number,
      default: 0,
      min: [0, 'Security deposit cannot be negative']
    }
  },
  
  // Contract Status
  status: {
    type: String,
    enum: ['pending', 'under_review', 'approved', 'active', 'suspended', 'terminated', 'expired'],
    default: 'pending'
  },
  
  // Admin Actions
  adminActions: [{
    action: {
      type: String,
      required: true,
      enum: ['created', 'reviewed', 'approved', 'rejected', 'suspended', 'terminated', 'modified']
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    notes: {
      type: String,
      trim: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Payment History
  paymentHistory: [{
    paymentId: {
      type: String,
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Payment amount cannot be negative']
    },
    paymentDate: {
      type: Date,
      required: true
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ['Bank Transfer', 'Cash', 'Cheque', 'Online Payment']
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    notes: {
      type: String,
      trim: true
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Additional Information
  specialConditions: [{
    type: String,
    trim: true
  }],
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  lastPaymentDate: {
    type: Date,
    default: null
  },
  nextPaymentDate: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for better performance
vehicleProviderContractSchema.index({ contractId: 1 });
vehicleProviderContractSchema.index({ vehicleProvider: 1 });
vehicleProviderContractSchema.index({ status: 1 });
vehicleProviderContractSchema.index({ 'contractTerms.startDate': 1 });
vehicleProviderContractSchema.index({ 'contractTerms.endDate': 1 });

// Virtual for contract duration in days
vehicleProviderContractSchema.virtual('durationInDays').get(function() {
  if (this.contractTerms.startDate && this.contractTerms.endDate) {
    return Math.ceil((this.contractTerms.endDate - this.contractTerms.startDate) / (1000 * 60 * 60 * 24));
  }
  return null;
});

// Virtual for total earnings
vehicleProviderContractSchema.virtual('totalEarnings').get(function() {
  return this.paymentHistory
    .filter(payment => payment.status === 'completed')
    .reduce((total, payment) => total + payment.amount, 0);
});

// Virtual for remaining payments
vehicleProviderContractSchema.virtual('remainingPayments').get(function() {
  if (this.status === 'active' && this.contractTerms.endDate) {
    const now = new Date();
    const endDate = new Date(this.contractTerms.endDate);
    const monthsRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24 * 30));
    return Math.max(0, monthsRemaining);
  }
  return 0;
});

// Pre-save middleware to update next payment date
vehicleProviderContractSchema.pre('save', function(next) {
  if (this.isModified('contractTerms.startDate') || this.isModified('contractTerms.paymentTerms')) {
    const startDate = new Date(this.contractTerms.startDate);
    const paymentTerms = this.contractTerms.paymentTerms;
    
    let nextPaymentDate = new Date(startDate);
    
    switch (paymentTerms) {
      case 'Monthly':
        nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
        break;
      case 'Quarterly':
        nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 3);
        break;
      case 'Semi-Annual':
        nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 6);
        break;
      case 'Annual':
        nextPaymentDate.setFullYear(nextPaymentDate.getFullYear() + 1);
        break;
    }
    
    this.nextPaymentDate = nextPaymentDate;
  }
  
  this.updatedAt = new Date();
  next();
});

// Ensure virtual fields are serialized
vehicleProviderContractSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('VehicleProviderContract', vehicleProviderContractSchema);


































