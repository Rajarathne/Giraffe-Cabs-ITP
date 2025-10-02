const express = require('express');
const router = express.Router();
const {
  createRentalRequest,
  getUserRentals,
  getAllRentals,
  getAvailableVehicles,
  updateRentalStatus,
  updateRental,
  deleteRental,
  getRentalStats,
  generateRentalContractPDF,
  generateRentalExcelReport,
  generateRentalPDFReport
} = require('../Controllers/rentalController');
const { protect } = require('../Middleware/authMiddleware');

// Protected routes
router.post('/', protect, createRentalRequest);
router.get('/my-rentals', protect, getUserRentals);
router.get('/all', protect, getAllRentals);
router.get('/available-vehicles', getAvailableVehicles);
router.get('/stats/overview', protect, getRentalStats);
router.put('/:id/status', protect, updateRentalStatus);
router.put('/:id', protect, updateRental);
router.delete('/:id', protect, deleteRental);
router.get('/:id/contract-pdf', protect, generateRentalContractPDF);

// Report generation routes
router.get('/reports/excel', protect, generateRentalExcelReport);
router.get('/reports/pdf', protect, generateRentalPDFReport);

// Test route to verify the endpoint is working
router.get('/test/:id', (req, res) => {
  res.json({ message: 'Test route working', id: req.params.id });
});

module.exports = router;





