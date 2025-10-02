const VehicleProvider = require('../Models/VehicleProvider');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id, type: 'vehicle_provider' }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: '30d',
  });
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/vehicle-providers/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and documents are allowed'));
    }
  }
});

// Register Vehicle Provider
const registerVehicleProvider = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      address,
      businessName,
      businessRegistrationNumber,
      businessType,
      bankDetails,
      bio
    } = req.body;

    // Check if vehicle provider already exists
    const existingProvider = await VehicleProvider.findOne({
      $or: [
        { email: email },
        { businessRegistrationNumber: businessRegistrationNumber }
      ]
    });

    if (existingProvider) {
      return res.status(400).json({
        message: existingProvider.email === email 
          ? 'Email already registered' 
          : 'Business registration number already exists'
      });
    }

    // Create new vehicle provider
    const vehicleProvider = new VehicleProvider({
      firstName,
      lastName,
      email,
      phone,
      password,
      address: {
        street: address.street,
        city: address.city,
        district: address.district,
        postalCode: address.postalCode
      },
      businessName,
      businessRegistrationNumber,
      businessType,
      bankDetails: {
        bankName: bankDetails.bankName,
        accountNumber: bankDetails.accountNumber,
        accountHolderName: bankDetails.accountHolderName,
        branch: bankDetails.branch
      },
      bio,
      status: 'approved', // Auto-approve vehicle providers
      isVerified: true
    });

    // Save vehicle provider
    await vehicleProvider.save();

    // Generate token
    const token = generateToken(vehicleProvider._id);

    res.status(201).json({
      message: 'Vehicle Provider registered successfully',
      token,
      vehicleProvider: {
        _id: vehicleProvider._id,
        firstName: vehicleProvider.firstName,
        lastName: vehicleProvider.lastName,
        email: vehicleProvider.email,
        phone: vehicleProvider.phone,
        businessName: vehicleProvider.businessName,
        status: vehicleProvider.status,
        joinedAt: vehicleProvider.joinedAt
      }
    });

  } catch (error) {
    console.error('Vehicle Provider registration error:', error);
    res.status(500).json({
      message: 'Registration failed',
      error: error.message
    });
  }
};

// Login Vehicle Provider
const loginVehicleProvider = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if vehicle provider exists
    const vehicleProvider = await VehicleProvider.findOne({ email });

    if (!vehicleProvider) {
      return res.status(400).json({
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordValid = await vehicleProvider.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(400).json({
        message: 'Invalid email or password'
      });
    }

    // Check if account is suspended
    if (vehicleProvider.status === 'suspended') {
      return res.status(400).json({
        message: 'Your account has been suspended. Please contact support.'
      });
    }

    // Update last login
    vehicleProvider.lastLogin = new Date();
    await vehicleProvider.save();

    // Generate token
    const token = generateToken(vehicleProvider._id);

    res.json({
      message: 'Login successful',
      token,
      vehicleProvider: {
        _id: vehicleProvider._id,
        firstName: vehicleProvider.firstName,
        lastName: vehicleProvider.lastName,
        email: vehicleProvider.email,
        phone: vehicleProvider.phone,
        businessName: vehicleProvider.businessName,
        status: vehicleProvider.status,
        isVerified: vehicleProvider.isVerified,
        totalEarnings: vehicleProvider.totalEarnings,
        totalVehicles: vehicleProvider.totalVehicles,
        activeContracts: vehicleProvider.activeContracts,
        lastLogin: vehicleProvider.lastLogin
      }
    });

  } catch (error) {
    console.error('Vehicle Provider login error:', error);
    res.status(500).json({
      message: 'Login failed',
      error: error.message
    });
  }
};

// Get Vehicle Provider Profile
const getVehicleProviderProfile = async (req, res) => {
  try {
    const vehicleProvider = await VehicleProvider.findById(req.vehicleProvider._id);

    if (!vehicleProvider) {
      return res.status(404).json({
        message: 'Vehicle Provider not found'
      });
    }

    res.json(vehicleProvider);

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      message: 'Failed to get profile',
      error: error.message
    });
  }
};

// Update Vehicle Provider Profile
const updateVehicleProviderProfile = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      phone,
      address,
      businessName,
      businessType,
      bankDetails,
      bio
    } = req.body;

    const vehicleProvider = await VehicleProvider.findById(req.vehicleProvider._id);

    if (!vehicleProvider) {
      return res.status(404).json({
        message: 'Vehicle Provider not found'
      });
    }

    // Update fields
    if (firstName) vehicleProvider.firstName = firstName;
    if (lastName) vehicleProvider.lastName = lastName;
    if (phone) vehicleProvider.phone = phone;
    if (address) {
      if (address.street) vehicleProvider.address.street = address.street;
      if (address.city) vehicleProvider.address.city = address.city;
      if (address.district) vehicleProvider.address.district = address.district;
      if (address.postalCode) vehicleProvider.address.postalCode = address.postalCode;
    }
    if (businessName) vehicleProvider.businessName = businessName;
    if (businessType) vehicleProvider.businessType = businessType;
    if (bankDetails) {
      if (bankDetails.bankName) vehicleProvider.bankDetails.bankName = bankDetails.bankName;
      if (bankDetails.accountNumber) vehicleProvider.bankDetails.accountNumber = bankDetails.accountNumber;
      if (bankDetails.accountHolderName) vehicleProvider.bankDetails.accountHolderName = bankDetails.accountHolderName;
      if (bankDetails.branch) vehicleProvider.bankDetails.branch = bankDetails.branch;
    }
    if (bio !== undefined) vehicleProvider.bio = bio;

    await vehicleProvider.save();

    res.json({
      message: 'Profile updated successfully',
      vehicleProvider
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      message: 'Failed to update profile',
      error: error.message
    });
  }
};

// Upload Profile Image
const uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: 'No file uploaded'
      });
    }

    const vehicleProvider = await VehicleProvider.findById(req.vehicleProvider._id);

    if (!vehicleProvider) {
      return res.status(404).json({
        message: 'Vehicle Provider not found'
      });
    }

    vehicleProvider.profileImage = req.file.path;
    await vehicleProvider.save();

    res.json({
      message: 'Profile image uploaded successfully',
      profileImage: vehicleProvider.profileImage
    });

  } catch (error) {
    console.error('Upload profile image error:', error);
    res.status(500).json({
      message: 'Failed to upload profile image',
      error: error.message
    });
  }
};

// Upload Verification Documents
const uploadVerificationDocuments = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        message: 'No files uploaded'
      });
    }

    const vehicleProvider = await VehicleProvider.findById(req.vehicleProvider._id);

    if (!vehicleProvider) {
      return res.status(404).json({
        message: 'Vehicle Provider not found'
      });
    }

    const documents = req.files.map(file => ({
      documentType: req.body.documentType || 'Other',
      documentUrl: file.path,
      uploadedAt: new Date()
    }));

    vehicleProvider.verificationDocuments.push(...documents);
    await vehicleProvider.save();

    res.json({
      message: 'Verification documents uploaded successfully',
      documents: vehicleProvider.verificationDocuments
    });

  } catch (error) {
    console.error('Upload verification documents error:', error);
    res.status(500).json({
      message: 'Failed to upload verification documents',
      error: error.message
    });
  }
};

// Change Password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const vehicleProvider = await VehicleProvider.findById(req.vehicleProvider._id);

    if (!vehicleProvider) {
      return res.status(404).json({
        message: 'Vehicle Provider not found'
      });
    }

    // Check current password
    const isCurrentPasswordValid = await vehicleProvider.comparePassword(currentPassword);

    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        message: 'Current password is incorrect'
      });
    }

    // Update password
    vehicleProvider.password = newPassword;
    await vehicleProvider.save();

    res.json({
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      message: 'Failed to change password',
      error: error.message
    });
  }
};

module.exports = {
  registerVehicleProvider,
  loginVehicleProvider,
  getVehicleProviderProfile,
  updateVehicleProviderProfile,
  uploadProfileImage,
  uploadVerificationDocuments,
  changePassword,
  upload
};



