const express = require('express');
const router = express.Router();
const {
  registerVehicleProvider,
  loginVehicleProvider,
  getVehicleProviderProfile,
  updateVehicleProviderProfile,
  uploadProfileImage,
  uploadVerificationDocuments,
  changePassword,
  upload
} = require('../Controllers/vehicleProviderAuthController');
const { protect } = require('../Middleware/vehicleProviderAuthMiddleware');

// Public routes
router.post('/register', registerVehicleProvider);
router.post('/login', loginVehicleProvider);

// Protected routes
router.get('/profile', protect, getVehicleProviderProfile);
router.put('/profile', protect, updateVehicleProviderProfile);
router.post('/profile/image', protect, upload.single('profileImage'), uploadProfileImage);
router.post('/verification-documents', protect, upload.array('documents', 5), uploadVerificationDocuments);
router.put('/change-password', protect, changePassword);

module.exports = router;




































