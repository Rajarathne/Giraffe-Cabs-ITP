const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const config = require('./config');
require('dotenv').config();

const app = express();
const PORT = config.PORT;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend/build')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection
const MONGODB_URI = config.MONGODB_URI;

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  family: 4 // Use IPv4, skip trying IPv6
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  console.log('Please check your internet connection and MongoDB Atlas settings');
});

// Routes
app.use('/api/auth', require('./Routes/authRoutes'));
app.use('/api/vehicles', require('./Routes/vehicleRoutes'));
app.use('/api/rentals', require('./Routes/rentalRoutes'));
app.use('/api/services', require('./Routes/serviceRoutes'));
app.use('/api/bookings', require('./Routes/bookingRoutes'));
app.use('/api/payments', require('./Routes/paymentRoutes'));
app.use('/api/financial', require('./Routes/financialRoutes'));
app.use('/api/tour-packages', require('./Routes/tourPackageRoutes'));
app.use('/api/tour-bookings', require('./Routes/tourBookingRoutes'));

// Vehicle Provider Routes
app.use('/api/vehicle-provider/auth', require('./Routes/vehicleProviderAuthRoutes'));
app.use('/api/vehicle-provider', require('./Routes/vehicleProviderContractRoutes'));
app.use('/api/vehicle-provider/vehicle-requests', require('./Routes/vehicleRequestRoutes'));

// Admin Vehicle Provider Management Routes
app.use('/api/admin/vehicle-providers', require('./Routes/adminVehicleProviderRoutes'));
app.use('/api/admin/vehicle-requests', require('./Routes/vehicleRequestRoutes'));

// Serve React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});



