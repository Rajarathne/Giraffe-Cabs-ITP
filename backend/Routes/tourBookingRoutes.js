const express = require('express');
const router = express.Router();
const tourBookingController = require('../Controllers/tourBookingController');
const { protect } = require('../Middleware/authMiddleware');

// User routes (authentication required)
router.post('/', protect, tourBookingController.createTourBooking);
router.get('/my-bookings', protect, tourBookingController.getUserTourBookings);

// Admin routes (authentication and admin role required)
router.get('/', protect, (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin role required.' });
  }
  next();
}, tourBookingController.getAllTourBookings);

router.put('/:id/status', protect, (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin role required.' });
  }
  next();
}, tourBookingController.updateTourBookingStatus);

router.get('/stats/overview', protect, (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin role required.' });
  }
  next();
}, tourBookingController.getTourBookingStats);

router.delete('/:id', protect, (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin role required.' });
  }
  next();
}, tourBookingController.deleteTourBooking);

// User routes that need to be after admin routes to avoid conflicts
router.get('/:id', protect, tourBookingController.getTourBookingById);
router.get('/:id/invoice', protect, tourBookingController.generateTourBookingInvoice);
router.get('/:id/invoice/download', protect, tourBookingController.downloadTourBookingInvoice);

module.exports = router;
