const express = require('express');
const router = express.Router();
const {
  createVehicleRequest,
  getVehicleRequestsByProvider,
  getAllVehicleRequests,
  getVehicleRequestById,
  updateVehicleRequestStatus,
  updateVehicleRequestDetails,
  deleteVehicleRequest,
  getVehicleRequestStats
} = require('../Controllers/vehicleRequestController');
const { protect } = require('../Middleware/authMiddleware');
const { protect: protectVehicleProvider } = require('../Middleware/vehicleProviderAuthMiddleware');

// Vehicle Provider Routes
router.post('/', protectVehicleProvider, createVehicleRequest);
router.get('/my-requests', protectVehicleProvider, getVehicleRequestsByProvider);
router.delete('/:id', protectVehicleProvider, deleteVehicleRequest);

// Admin Routes
router.get('/admin/all', protect, getAllVehicleRequests);
router.get('/admin/stats', protect, getVehicleRequestStats);
router.get('/admin/:id', protect, getVehicleRequestById);
router.put('/admin/:id/status', protect, updateVehicleRequestStatus);
router.put('/admin/:id/edit', protect, updateVehicleRequestDetails);

module.exports = router;

