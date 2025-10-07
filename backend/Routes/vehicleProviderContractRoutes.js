const express = require('express');
const router = express.Router();
const {
  createContractRequest,
  getVehicleProviderContracts,
  getContractById,
  updateContract,
  deleteContract,
  generateContractPDF,
  getContractStatistics
} = require('../Controllers/vehicleProviderContractController');
const { protect } = require('../Middleware/vehicleProviderAuthMiddleware');

// All routes are protected
router.use(protect);

// Contract management routes
router.post('/contracts', createContractRequest);
router.get('/contracts', getVehicleProviderContracts);
router.get('/contracts/statistics', getContractStatistics);
router.get('/contracts/:id', getContractById);
router.put('/contracts/:id', updateContract);
router.delete('/contracts/:id', deleteContract);
router.get('/contracts/:id/pdf', generateContractPDF);

module.exports = router;












































