const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend/build')));

// Database connection - Try multiple connection strings
const connectionStrings = [
  // MongoDB Atlas with retryWrites
  'mongodb+srv://Rahal:rTbIif5S6AUYyIcr@cluster0.wrmom9e.mongodb.net/giraffe-cabs?retryWrites=true&w=majority',
  // MongoDB Atlas without retryWrites
  'mongodb+srv://Rahal:rTbIif5S6AUYyIcr@cluster0.wrmom9e.mongodb.net/giraffe-cabs',
  // Local MongoDB (if you have it installed)
  'mongodb://localhost:27017/giraffe-cabs'
];

let connected = false;

const tryConnection = async (uri, index = 0) => {
  if (connected) return;
  
  try {
    console.log(`Trying connection ${index + 1}: ${uri.includes('localhost') ? 'Local MongoDB' : 'MongoDB Atlas'}`);
    
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4
    });
    
    console.log('✅ MongoDB connected successfully!');
    connected = true;
  } catch (error) {
    console.log(`❌ Connection ${index + 1} failed:`, error.message);
    
    if (index < connectionStrings.length - 1) {
      console.log('Trying next connection...');
      setTimeout(() => tryConnection(connectionStrings[index + 1], index + 1), 1000);
    } else {
      console.log('🚨 All connection attempts failed!');
      console.log('Please check:');
      console.log('1. Your internet connection');
      console.log('2. MongoDB Atlas cluster status');
      console.log('3. IP whitelist settings in MongoDB Atlas');
      console.log('4. Database user permissions');
    }
  }
};

// Try the first connection
tryConnection(connectionStrings[0]);

// Routes
app.use('/api/auth', require('./Routes/authRoutes'));
app.use('/api/vehicles', require('./Routes/vehicleRoutes'));
app.use('/api/rentals', require('./Routes/rentalRoutes'));
app.use('/api/services', require('./Routes/serviceRoutes'));
app.use('/api/bookings', require('./Routes/bookingRoutes'));

// Serve React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Frontend will be available at: http://localhost:${PORT}`);
  console.log(`🔗 API endpoints available at: http://localhost:${PORT}/api`);
});





























































