const Payment = require('../Models/Payment');
const Booking = require('../Models/Booking');
const stripe = require('stripe')('sk_test_51S8bzS4wZaTWdecpFx35c3HmBFOp3i5oetvvxSALP3G6nQkXXe3mape30PBJfynrrG9C8bcJPPc5lPLj4mLjf6Ir00w9kj9VB4');

// Create Payment Intent for Stripe
const createPaymentIntent = async (req, res) => {
  try {
    const { bookingId, amount, currency = 'lkr' } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Create payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // Amount in cents
      currency: currency,
      metadata: {
        bookingId: bookingId,
        userId: req.user._id.toString()
      }
    });

    res.json({
      clientSecret: paymentIntent.client_secret
    });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Create Payment Record
const createPayment = async (req, res) => {
  try {
    const { bookingId, amount, paymentMethod, status = 'pending', stripePaymentIntentId } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const paymentData = {
      booking: bookingId,
      user: req.user._id,
      amount,
      paymentMethod,
      status,
      stripePaymentIntentId
    };

    const payment = new Payment(paymentData);
    const savedPayment = await payment.save();

    // Update booking payment status
    booking.paymentStatus = status;
    booking.paymentMethod = paymentMethod;
    await booking.save();

    // Populate related data
    await savedPayment.populate('booking user', 'firstName lastName email totalPrice serviceType');

    res.status(201).json(savedPayment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get All Payments (Admin only)
const getAllPayments = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const payments = await Payment.find()
      .populate('booking', 'serviceType totalPrice pickupLocation dropoffLocation')
      .populate('user', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get User's Payments
const getUserPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user._id })
      .populate('booking', 'serviceType totalPrice pickupLocation dropoffLocation')
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Payment by ID
const getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('booking', 'serviceType totalPrice pickupLocation dropoffLocation')
      .populate('user', 'firstName lastName email');

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Check if user can access this payment
    if (req.user.role !== 'admin' && payment.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Payment Status (Admin only)
const updatePaymentStatus = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { status } = req.body;
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    payment.status = status;
    if (status === 'completed') {
      payment.processedAt = new Date();
    }

    const updatedPayment = await payment.save();

    // Update booking payment status
    const booking = await Booking.findById(payment.booking);
    if (booking) {
      booking.paymentStatus = status;
      await booking.save();
    }

    await updatedPayment.populate('booking user', 'firstName lastName email totalPrice serviceType');

    res.json(updatedPayment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete Payment (Admin only)
const deletePayment = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    await Payment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Payment Statistics (Admin only)
const getPaymentStats = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const totalPayments = await Payment.countDocuments();
    const completedPayments = await Payment.countDocuments({ status: 'completed' });
    const pendingPayments = await Payment.countDocuments({ status: 'pending' });
    const failedPayments = await Payment.countDocuments({ status: 'failed' });

    const totalRevenue = await Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const paymentsByMethod = await Payment.aggregate([
      { $group: { _id: '$paymentMethod', count: { $sum: 1 }, total: { $sum: '$amount' } } }
    ]);

    const monthlyRevenue = await Payment.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    res.json({
      totalPayments,
      completedPayments,
      pendingPayments,
      failedPayments,
      totalRevenue: totalRevenue[0]?.total || 0,
      paymentsByMethod,
      monthlyRevenue
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createPaymentIntent,
  createPayment,
  getAllPayments,
  getUserPayments,
  getPaymentById,
  updatePaymentStatus,
  deletePayment,
  getPaymentStats
};

