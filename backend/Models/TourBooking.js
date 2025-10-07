const mongoose = require('mongoose');

const tourBookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tourPackage: { type: mongoose.Schema.Types.ObjectId, ref: 'TourPackage', required: true },
  bookingDate: { type: Date, required: true },
  numberOfPassengers: { type: Number, required: true, min: 1 },
  passengers: [{ firstName: { type: String, required: true }, lastName: { type: String, required: true }, age: { type: Number, required: true, min: 0 }, passportNumber: String, emergencyContact: String, specialRequirements: String }],
  contactPerson: { name: { type: String, required: true }, email: { type: String, required: true }, phone: { type: String, required: true }, address: String },
  pricing: { basePrice: { type: Number, required: true }, totalPrice: { type: Number, required: true }, discountApplied: { type: Number, default: 0 }, finalPrice: { type: Number, required: true }, adminSetPrice: Number, isPriceConfirmed: { type: Boolean, default: false } },
  payment: { method: { type: String, enum: ['full_upfront','installment'], required: true }, status: { type: String, enum: ['pending','partial','completed','refunded'], default: 'pending' }, amountPaid: { type: Number, default: 0 }, remainingAmount: Number, installmentPlan: { numberOfInstallments: Number, installmentAmount: Number, dueDates: [Date] } },
  status: { type: String, enum: ['pending','confirmed','rejected','cancelled','completed'], default: 'pending' },
  adminNotes: String,
  adminActions: [{ action: { type: String, enum: ['price_set','confirmed','rejected','cancelled','completed'] }, note: String, adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, timestamp: { type: Date, default: Date.now } }],
  specialRequests: String,
  dietaryRequirements: [String],
  accessibilityNeeds: [String],
  documents: [{ type: { type: String, enum: ['passport','id_copy','medical_certificate','other'] }, fileName: String, fileUrl: String, uploadedAt: { type: Date, default: Date.now } }],
  invoice: { invoiceNumber: String, generatedAt: Date, downloadUrl: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Pre-save hook to update `updatedAt` and calculate remaining amount for installments
tourBookingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  if (this.payment.method === 'installment' && this.pricing.finalPrice != null) {
    this.payment.remainingAmount = this.pricing.finalPrice - this.payment.amountPaid;
  }
  next();
});

// Indexes
tourBookingSchema.index({ user: 1, status: 1 });
tourBookingSchema.index({ tourPackage: 1, status: 1 });
tourBookingSchema.index({ bookingDate: 1 });
tourBookingSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('TourBooking', tourBookingSchema);




































































































