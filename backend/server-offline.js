const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend/build')));

// Mock data for testing without database
const mockUsers = [
  {
    _id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    role: 'customer',
    phone: '1234567890',
    address: '123 Main St'
  },
  {
    _id: '2',
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@example.com',
    role: 'admin',
    phone: '0987654321',
    address: '456 Admin Ave'
  }
];

const mockVehicles = [
  {
    _id: '1',
    vehicleNumber: 'ABC-1234',
    vehicleType: 'car',
    brand: 'Toyota',
    model: 'Camry',
    year: 2022,
    color: 'White',
    capacity: 5,
    fuelType: 'petrol',
    transmission: 'automatic',
    dailyRate: 5000,
    monthlyRate: 120000,
    isAvailable: true,
    description: 'Comfortable sedan for city travel'
  },
  {
    _id: '2',
    vehicleNumber: 'XYZ-5678',
    vehicleType: 'van',
    brand: 'Toyota',
    model: 'Hiace',
    year: 2021,
    color: 'Blue',
    capacity: 12,
    fuelType: 'diesel',
    transmission: 'manual',
    dailyRate: 8000,
    monthlyRate: 200000,
    isAvailable: true,
    description: 'Spacious van for group travel'
  }
];

// Simple authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  // Simple token validation (in real app, use JWT)
  if (token === 'mock-token-customer') {
    req.user = mockUsers[0];
  } else if (token === 'mock-token-admin') {
    req.user = mockUsers[1];
  } else {
    return res.status(403).json({ message: 'Invalid token' });
  }

  next();
};

// Mock API Routes
app.post('/api/auth/register', (req, res) => {
  const { firstName, lastName, email, password, phone, address, role } = req.body;
  
  const newUser = {
    _id: Date.now().toString(),
    firstName,
    lastName,
    email,
    role: role || 'customer',
    phone,
    address
  };
  
  mockUsers.push(newUser);
  
  res.status(201).json({
    ...newUser,
    token: role === 'admin' ? 'mock-token-admin' : 'mock-token-customer'
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  const user = mockUsers.find(u => u.email === email);
  
  if (!user) {
    return res.status(400).json({ message: 'User not found' });
  }
  
  res.json({
    ...user,
    token: user.role === 'admin' ? 'mock-token-admin' : 'mock-token-customer'
  });
});

app.get('/api/auth/profile', authenticateToken, (req, res) => {
  res.json(req.user);
});

app.put('/api/auth/profile', authenticateToken, (req, res) => {
  const userIndex = mockUsers.findIndex(u => u._id === req.user._id);
  if (userIndex !== -1) {
    mockUsers[userIndex] = { ...mockUsers[userIndex], ...req.body };
    res.json(mockUsers[userIndex]);
  } else {
    res.status(404).json({ message: 'User not found' });
  }
});

// Vehicle routes
app.get('/api/vehicles', (req, res) => {
  res.json(mockVehicles);
});

app.get('/api/vehicles/:id', (req, res) => {
  const vehicle = mockVehicles.find(v => v._id === req.params.id);
  if (vehicle) {
    res.json(vehicle);
  } else {
    res.status(404).json({ message: 'Vehicle not found' });
  }
});

app.post('/api/vehicles', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  
  const newVehicle = {
    _id: Date.now().toString(),
    ...req.body,
    isAvailable: true
  };
  
  mockVehicles.push(newVehicle);
  res.status(201).json(newVehicle);
});

// Rental routes
app.post('/api/rentals', authenticateToken, (req, res) => {
  const rental = {
    _id: Date.now().toString(),
    user: req.user._id,
    ...req.body,
    status: 'pending',
    createdAt: new Date()
  };
  
  res.status(201).json(rental);
});

app.get('/api/rentals/my-rentals', authenticateToken, (req, res) => {
  res.json([]); // Empty array for now
});

app.get('/api/rentals/all', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  res.json([]); // Empty array for now
});

// Booking routes
app.post('/api/bookings', authenticateToken, (req, res) => {
  const booking = {
    _id: Date.now().toString(),
    user: req.user._id,
    ...req.body,
    status: 'pending',
    createdAt: new Date()
  };
  
  res.status(201).json(booking);
});

app.get('/api/bookings/my-bookings', authenticateToken, (req, res) => {
  res.json([]); // Empty array for now
});

// Service routes
app.get('/api/services', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  res.json([]); // Empty array for now
});

app.post('/api/services', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  
  const service = {
    _id: Date.now().toString(),
    ...req.body,
    createdAt: new Date()
  };
  
  res.status(201).json(service);
});

// Stats routes
app.get('/api/vehicles/stats/overview', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  
  res.json({
    totalVehicles: mockVehicles.length,
    availableVehicles: mockVehicles.filter(v => v.isAvailable).length,
    vehiclesByType: [
      { _id: 'car', count: 1 },
      { _id: 'van', count: 1 }
    ]
  });
});

app.get('/api/rentals/stats/overview', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  
  res.json({
    totalRentals: 0,
    pendingRentals: 0,
    approvedRentals: 0,
    activeRentals: 0,
    monthlyRevenue: 0
  });
});

app.get('/api/bookings/stats/overview', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  
  res.json({
    totalBookings: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    completedBookings: 0,
    monthlyRevenue: 0,
    bookingsByType: []
  });
});

app.get('/api/services/stats/overview', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  
  res.json({
    totalServices: 0,
    totalCost: 0,
    servicesByType: [],
    recentServices: []
  });
});

// Serve React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

app.listen(PORT, () => {
  console.log('🚀 Server running in OFFLINE MODE');
  console.log(`📱 Frontend: http://localhost:${PORT}`);
  console.log(`🔗 API: http://localhost:${PORT}/api`);
  console.log('');
  console.log('📋 Test Credentials:');
  console.log('   Customer: john@example.com / any password');
  console.log('   Admin: admin@example.com / any password');
  console.log('');
  console.log('⚠️  Note: This is a mock server for testing without database');
  console.log('   All data is stored in memory and will be lost on restart');
});












































