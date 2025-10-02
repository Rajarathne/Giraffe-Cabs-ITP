const express = require('express');
const router = express.Router();
const {
  getAllBookings,
  getUserBookings,
  getBookingById,
  createBooking,
  updateBookingStatus,
  updateBookingPricing,
  updateUserBooking,
  deleteUserBooking,
  deleteBooking,
  getBookingStats,
  generateDailyBookingReport,
  generateMonthlyBookingReport,
  generateBookingAnalyticsReport,
  generateRevenueReport,
  generateCustomerReport,
  generateVehicleUtilizationReport,
  generateBookingInvoice
} = require('../Controllers/bookingController');
const { protect } = require('../Middleware/authMiddleware');

// Public routes (none for bookings)

// Protected routes
router.get('/user', protect, getUserBookings);
router.post('/', protect, createBooking);
router.put('/:id/user', protect, updateUserBooking);
router.delete('/:id/user', protect, deleteUserBooking);

// Admin only routes
router.get('/', protect, getAllBookings);
router.get('/stats/overview', protect, getBookingStats);

// Booking Reports (Admin only) - Must come before /:id route
router.get('/reports/daily', protect, generateDailyBookingReport);
router.get('/reports/monthly', protect, generateMonthlyBookingReport);
router.get('/reports/analytics', protect, generateBookingAnalyticsReport);
router.get('/reports/revenue', protect, generateRevenueReport);
router.get('/reports/customers', protect, generateCustomerReport);
router.get('/reports/vehicles', protect, generateVehicleUtilizationReport);

// Specific booking routes (must come before generic /:id route)
router.put('/:id/status', protect, updateBookingStatus);
router.put('/:id/pricing', (req, res, next) => {
  console.log('Pricing route hit for booking ID:', req.params.id);
  next();
}, protect, updateBookingPricing);
router.get('/:id/invoice', protect, generateBookingInvoice);
router.delete('/:id', protect, deleteBooking);

// This route must come last to avoid conflicts with other routes
router.get('/:id', protect, getBookingById);

module.exports = router;