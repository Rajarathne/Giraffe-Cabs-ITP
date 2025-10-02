const express = require('express');
const router = express.Router();
const {
  getAllFinancialEntries,
  createFinancialEntry,
  updateFinancialEntry,
  deleteFinancialEntry,
  getFinancialSummary,
  generateMonthlyReport,
  generateExpenseReport,
  generateIncomeReport
} = require('../Controllers/financialController');
const { protect } = require('../Middleware/authMiddleware');

// All routes are protected and admin-only
router.get('/', protect, getAllFinancialEntries);
router.post('/', protect, createFinancialEntry);
router.put('/:id', protect, updateFinancialEntry);
router.delete('/:id', protect, deleteFinancialEntry);
router.get('/summary', protect, getFinancialSummary);

// Report generation routes
router.get('/reports/monthly', protect, generateMonthlyReport);
router.get('/reports/expense', protect, generateExpenseReport);
router.get('/reports/income', protect, generateIncomeReport);

module.exports = router;







