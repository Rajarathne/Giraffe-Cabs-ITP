const express = require('express');
const router = express.Router();
const tourPackageController = require('../Controllers/tourPackageController');
const { protect } = require('../Middleware/authMiddleware');

// Public routes (no authentication required)
router.get('/available', tourPackageController.getAvailableTourPackages);
router.post('/calculate-price', tourPackageController.calculateTourPrice);

// Admin routes (authentication and admin role required)
router.get('/', protect, (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin role required.' });
  }
  next();
}, tourPackageController.getAllTourPackages);

router.get('/stats/overview', protect, (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin role required.' });
  }
  next();
}, tourPackageController.getTourPackageStats);

router.post('/', protect, (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin role required.' });
  }
  next();
}, tourPackageController.createTourPackage);

router.put('/:id', protect, (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin role required.' });
  }
  next();
}, tourPackageController.updateTourPackage);

router.delete('/:id', protect, (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin role required.' });
  }
  next();
}, tourPackageController.deleteTourPackage);

// Get single package (public)
router.get('/:id', tourPackageController.getTourPackageById);

// Report generation routes (Admin only)
router.get('/reports/analytics', protect, (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin role required.' });
  }
  next();
}, tourPackageController.generateTourPackageAnalyticsReport);

router.get('/reports/revenue', protect, (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin role required.' });
  }
  next();
}, tourPackageController.generateTourPackageRevenueReport);

router.get('/reports/destinations', protect, (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin role required.' });
  }
  next();
}, tourPackageController.generatePopularDestinationsReport);

module.exports = router;

