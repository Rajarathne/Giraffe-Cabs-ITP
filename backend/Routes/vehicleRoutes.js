const express = require('express');
const router = express.Router();
const {
  getAllVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getVehiclesByType,
  getVehicleStats,
  generateVehicleInventoryReport,
  generateVehicleAnalyticsReport,
  generateVehicleDetailsReport,
  generateVehicleUtilizationReport,
  generateVehicleMaintenanceReport,
  generateVehicleRevenueReport,
  testPDFGeneration
} = require('../Controllers/vehicleController');
const { protect } = require('../Middleware/authMiddleware');
const upload = require('../Middleware/uploadMiddleware');

// Public routes
router.get('/', getAllVehicles);
router.get('/type/:type', getVehiclesByType);
router.get('/:id', getVehicleById);

// Protected routes (Admin only)
// Handle both file uploads and JSON data
router.post('/', protect, (req, res, next) => {
  // If request has files, use multer, otherwise just continue
  if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
    upload.array('photos', 10)(req, res, next);
  } else {
    next();
  }
}, createVehicle);

router.put('/:id', protect, (req, res, next) => {
  // If request has files, use multer, otherwise just continue
  if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
    upload.array('photos', 10)(req, res, next);
  } else {
    next();
  }
}, updateVehicle);
router.delete('/:id', protect, deleteVehicle);
router.get('/stats/overview', protect, getVehicleStats);

// Vehicle Report Routes (Admin only)
router.get('/reports/inventory', protect, generateVehicleInventoryReport);
router.get('/reports/analytics', protect, generateVehicleAnalyticsReport);
router.get('/reports/details', protect, generateVehicleDetailsReport);
router.get('/reports/utilization', protect, generateVehicleUtilizationReport);
router.get('/reports/maintenance', protect, generateVehicleMaintenanceReport);
router.get('/reports/revenue', protect, generateVehicleRevenueReport);

// Test PDF generation route
router.get('/test-pdf', testPDFGeneration);

module.exports = router;