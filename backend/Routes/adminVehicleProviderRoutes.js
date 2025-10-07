const express = require('express');
const router = express.Router();
const {
  getAllVehicleProviders,
  getVehicleProviderById,
  updateVehicleProviderStatus,
  getVehicleProviderStats,
  deleteVehicleProvider,
  bulkUpdateVehicleProviderStatus
} = require('../Controllers/adminVehicleProviderController');
const { protect } = require('../Middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(protect);

// Admin-only middleware
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
  }
  next();
};

// Apply admin-only middleware to all routes
router.use(adminOnly);

// Routes
router.get('/', getAllVehicleProviders);
router.get('/stats', getVehicleProviderStats);
router.get('/:id', getVehicleProviderById);
router.put('/:id/status', updateVehicleProviderStatus);
router.put('/bulk/status', bulkUpdateVehicleProviderStatus);
router.delete('/:id', deleteVehicleProvider);

module.exports = router;


































