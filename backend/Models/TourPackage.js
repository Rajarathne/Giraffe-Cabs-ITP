const mongoose = require('mongoose');

const tourPackageSchema = new mongoose.Schema({
  packageName: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  destination: { type: String, required: true, trim: true },
  visitLocations: [{
    location: { type: String, required: true },
    description: String,
    duration: String
  }],
  tourDays: { type: Number, required: true, min: 1 },
  fullDistance: { type: Number, required: true, min: 0 },
  minPassengers: { type: Number, required: true, min: 1, default: 10 },
  maxPassengers: { type: Number, required: true, min: 1, default: 20 },
  pricePerPerson: { type: Number, required: true, min: 0 },
  totalPackagePrice: { type: Number, min: 0 },
  tourCategory: { type: String, required: true, enum: ['Adventure','Pilgrimage','Nature','Cultural','Family','Corporate'] },
  tourType: { type: String, required: true, enum: ['One-day','Multi-day','Seasonal'] },
  discountOptions: {
    earlyBooking: { percentage: { type: Number, min: 0, max: 100, default: 0 }, daysBefore: { type: Number, min: 0, default: 0 } },
    groupDiscount: { percentage: { type: Number, min: 0, max: 100, default: 0 }, minGroupSize: { type: Number, min: 0, default: 0 } }
  },
  includedServices: [{ service: { type: String, required: true }, description: String }],
  excludedServices: [{ service: { type: String, required: true }, description: String }],
  paymentType: { type: String, required: true, enum: ['full_upfront','installment'] },
  vehicleTypes: [{ type: String, enum: ['van','bus','car','jeep'] }],
  accommodationDetails: {
    type: { type: String, enum: ['hotel','guesthouse','resort','camping','none'] },
    name: String,
    rating: { type: Number, min: 1, max: 5 },
    location: String,
    amenities: [String]
  },
  mealPlan: { breakfast: { type: Boolean, default: false }, lunch: { type: Boolean, default: false }, dinner: { type: Boolean, default: false }, description: String },
  tourGuide: { available: { type: Boolean, default: false }, guideName: String, guideExperience: String, languages: [String] },
  safetyInfo: { insurance: { type: Boolean, default: false }, emergencyContact: String, medicalSupport: { type: Boolean, default: false }, safetyGuidelines: [String] },
  images: [{ url: String, caption: String, isPrimary: { type: Boolean, default: false } }],
  status: { type: String, enum: ['active','inactive','seasonal'], default: 'active' },
  isAvailable: { type: Boolean, default: true },
  seasonalInfo: { startDate: Date, endDate: Date, bestTimeToVisit: String },
  specialRequirements: [String],
  cancellationPolicy: String,
  termsAndConditions: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Pre-save hook to update `updatedAt`
tourPackageSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Indexes for faster search
tourPackageSchema.index({ destination: 1, tourCategory: 1, status: 1 });
tourPackageSchema.index({ pricePerPerson: 1 });
tourPackageSchema.index({ tourDays: 1 });

module.exports = mongoose.model('TourPackage', tourPackageSchema);
















































































