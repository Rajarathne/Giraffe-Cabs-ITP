const express = require('express');
const router = express.Router();
const {
  createPaymentIntent,
  createPayment,
  getAllPayments,
  getUserPayments,
  getPaymentById,
  updatePaymentStatus,
  deletePayment,
  getPaymentStats
} = require('../Controllers/paymentController');
const { protect } = require('../Middleware/authMiddleware');

// Protected routes
router.post('/create-payment-intent', protect, createPaymentIntent);
router.post('/', protect, createPayment);
router.get('/user', protect, getUserPayments);
router.get('/:id', protect, getPaymentById);

// Admin only routes
router.get('/', protect, getAllPayments);
router.put('/:id/status', protect, updatePaymentStatus);
router.delete('/:id', protect, deletePayment);
router.get('/stats/overview', protect, getPaymentStats);

module.exports = router;




















































































