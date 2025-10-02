const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const vehicleProviderSchema = new mongoose.Schema({
  // Basic Information
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    match: [/^[0-9+\-\s()]+$/, 'Please enter a valid phone number']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  
  // Address Information
  address: {
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    district: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true }
  },
  
  // Business Information
  businessName: {
    type: String,
    required: [true, 'Business name is required'],
    trim: true,
    maxlength: [100, 'Business name cannot exceed 100 characters']
  },
  businessRegistrationNumber: {
    type: String,
    required: [true, 'Business registration number is required'],
    unique: true,
    trim: true
  },
  businessType: {
    type: String,
    required: true,
    enum: ['Individual', 'Company', 'Partnership'],
    default: 'Individual'
  },
  
  // Banking Information
  bankDetails: {
    bankName: { type: String, required: true, trim: true },
    accountNumber: { type: String, required: true, trim: true },
    accountHolderName: { type: String, required: true, trim: true },
    branch: { type: String, required: true, trim: true }
  },
  
  // Status and Verification
  status: {
    type: String,
    enum: ['pending', 'approved', 'suspended', 'rejected'],
    default: 'approved'
  },
  isVerified: {
    type: Boolean,
    default: true
  },
  verificationDocuments: [{
    documentType: { type: String, required: true },
    documentUrl: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now }
  }],
  
  // Profile Information
  profileImage: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters']
  },
  
  // Statistics
  totalEarnings: {
    type: Number,
    default: 0
  },
  totalVehicles: {
    type: Number,
    default: 0
  },
  activeContracts: {
    type: Number,
    default: 0
  },
  
  // Timestamps
  joinedAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for better performance
vehicleProviderSchema.index({ email: 1 });
vehicleProviderSchema.index({ businessRegistrationNumber: 1 });
vehicleProviderSchema.index({ status: 1 });

// Hash password before saving
vehicleProviderSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
vehicleProviderSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Get full name
vehicleProviderSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Get full address
vehicleProviderSchema.virtual('fullAddress').get(function() {
  return `${this.address.street}, ${this.address.city}, ${this.address.district} ${this.address.postalCode}`;
});

// Ensure virtual fields are serialized
vehicleProviderSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.password;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('VehicleProvider', vehicleProviderSchema);



