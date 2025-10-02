const express = require('express');
const router = express.Router();
const {
  getAllServiceRecords,
  getServiceRecordsByVehicle,
  createServiceRecord,
  updateServiceRecord,
  deleteServiceRecord,
  getServiceStats,
  getUpcomingServices,
  getServiceReminders,
  generateServiceRecordsReport,
  generateServiceAnalyticsReport
} = require('../Controllers/serviceController');
const { protect } = require('../Middleware/authMiddleware');

// Protected routes
router.get('/', protect, getAllServiceRecords);
router.get('/vehicle/:vehicleId', protect, getServiceRecordsByVehicle);
router.post('/', protect, createServiceRecord);
router.put('/:id', protect, updateServiceRecord);
router.delete('/:id', protect, deleteServiceRecord);
router.get('/stats/overview', protect, getServiceStats);
router.get('/upcoming', protect, getUpcomingServices);
router.get('/reminders', protect, getServiceReminders);

// Service Report Routes (Admin only)
router.get('/reports/records', protect, generateServiceRecordsReport);
router.get('/reports/analytics', protect, generateServiceAnalyticsReport);

module.exports = router;







