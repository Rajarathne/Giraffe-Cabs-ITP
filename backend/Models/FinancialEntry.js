const mongoose = require('mongoose');

const financialEntrySchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['income', 'expense']
  },
  category: {
    type: String,
    required: true,
    enum: [
      // Income categories
      'booking_fees', 'rental_income', 'service_fees', 'other_income',
      // Expense categories
      'driver_salary', 'fuel', 'maintenance', 'insurance', 'office_rent', 'utilities', 'marketing', 'other_expense'
    ]
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  reference: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for better query performance
financialEntrySchema.index({ type: 1, date: -1 });
financialEntrySchema.index({ category: 1, date: -1 });

module.exports = mongoose.model('FinancialEntry', financialEntrySchema);























































