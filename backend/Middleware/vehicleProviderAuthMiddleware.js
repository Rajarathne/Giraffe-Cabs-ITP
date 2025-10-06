const jwt = require('jsonwebtoken');
const VehicleProvider = require('../Models/VehicleProvider');

// Protect routes - verify Vehicle Provider token
const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check for token in cookies
    if (!token && req.cookies.token) {
      token = req.cookies.token;
    }

    // Make sure token exists
    if (!token) {
      return res.status(401).json({
        message: 'Not authorized to access this route'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');

      // Check if token is for vehicle provider
      if (decoded.type !== 'vehicle_provider') {
        return res.status(401).json({
          message: 'Invalid token type'
        });
      }

      // Get vehicle provider from token
      const vehicleProvider = await VehicleProvider.findById(decoded.id);

      if (!vehicleProvider) {
        return res.status(401).json({
          message: 'No vehicle provider found with this token'
        });
      }

      // Check if account is active
      if (vehicleProvider.status === 'suspended') {
        return res.status(401).json({
          message: 'Account has been suspended'
        });
      }

      if (vehicleProvider.status === 'rejected') {
        return res.status(401).json({
          message: 'Account has been rejected'
        });
      }

      req.vehicleProvider = vehicleProvider;
      next();

    } catch (error) {
      return res.status(401).json({
        message: 'Not authorized to access this route'
      });
    }

  } catch (error) {
    console.error('Protect middleware error:', error);
    return res.status(500).json({
      message: 'Server error in authentication'
    });
  }
};

// Grant access to specific roles (for admin access to vehicle provider data)
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: 'Not authorized to access this route'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }

    next();
  };
};

// Check if vehicle provider is verified
const requireVerification = async (req, res, next) => {
  try {
    if (!req.vehicleProvider) {
      return res.status(401).json({
        message: 'Not authorized to access this route'
      });
    }

    if (!req.vehicleProvider.isVerified) {
      return res.status(403).json({
        message: 'Account verification required to access this feature'
      });
    }

    next();

  } catch (error) {
    console.error('Verification middleware error:', error);
    return res.status(500).json({
      message: 'Server error in verification check'
    });
  }
};

// Check if vehicle provider is approved
const requireApproval = async (req, res, next) => {
  try {
    if (!req.vehicleProvider) {
      return res.status(401).json({
        message: 'Not authorized to access this route'
      });
    }

    if (req.vehicleProvider.status !== 'approved') {
      return res.status(403).json({
        message: 'Account approval required to access this feature'
      });
    }

    next();

  } catch (error) {
    console.error('Approval middleware error:', error);
    return res.status(500).json({
      message: 'Server error in approval check'
    });
  }
};

module.exports = {
  protect,
  authorize,
  requireVerification,
  requireApproval
};


































