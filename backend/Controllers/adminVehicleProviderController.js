const VehicleProvider = require('../Models/VehicleProvider');
const jwt = require('jsonwebtoken');

// Get all vehicle providers (Admin only)
const getAllVehicleProviders = async (req, res) => {
  try {
    const { status, page = 1, limit = 10, search } = req.query;
    
    // Build filter object
    const filter = {};
    if (status) {
      filter.status = status;
    }
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { businessName: { $regex: search, $options: 'i' } },
        { businessRegistrationNumber: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Get vehicle providers with pagination
    const vehicleProviders = await VehicleProvider.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await VehicleProvider.countDocuments(filter);

    res.json({
      vehicleProviders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get all vehicle providers error:', error);
    res.status(500).json({
      message: 'Failed to fetch vehicle providers',
      error: error.message
    });
  }
};

// Get vehicle provider by ID (Admin only)
const getVehicleProviderById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const vehicleProvider = await VehicleProvider.findById(id).select('-password');
    
    if (!vehicleProvider) {
      return res.status(404).json({
        message: 'Vehicle Provider not found'
      });
    }

    res.json(vehicleProvider);

  } catch (error) {
    console.error('Get vehicle provider by ID error:', error);
    res.status(500).json({
      message: 'Failed to fetch vehicle provider',
      error: error.message
    });
  }
};

// Update vehicle provider status (Admin only)
const updateVehicleProviderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    // Validate status
    const validStatuses = ['pending', 'approved', 'suspended', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: 'Invalid status. Must be one of: pending, approved, suspended, rejected'
      });
    }

    const vehicleProvider = await VehicleProvider.findById(id);
    
    if (!vehicleProvider) {
      return res.status(404).json({
        message: 'Vehicle Provider not found'
      });
    }

    // Update status
    vehicleProvider.status = status;
    
    // Add rejection reason if status is rejected
    if (status === 'rejected' && rejectionReason) {
      vehicleProvider.rejectionReason = rejectionReason;
    }

    // Set verification status based on approval
    if (status === 'approved') {
      vehicleProvider.isVerified = true;
    }

    await vehicleProvider.save();

    res.json({
      message: `Vehicle Provider status updated to ${status}`,
      vehicleProvider: {
        _id: vehicleProvider._id,
        firstName: vehicleProvider.firstName,
        lastName: vehicleProvider.lastName,
        email: vehicleProvider.email,
        businessName: vehicleProvider.businessName,
        status: vehicleProvider.status,
        isVerified: vehicleProvider.isVerified,
        rejectionReason: vehicleProvider.rejectionReason
      }
    });

  } catch (error) {
    console.error('Update vehicle provider status error:', error);
    res.status(500).json({
      message: 'Failed to update vehicle provider status',
      error: error.message
    });
  }
};

// Get vehicle provider statistics (Admin only)
const getVehicleProviderStats = async (req, res) => {
  try {
    const stats = await VehicleProvider.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Format stats
    const formattedStats = {
      total: 0,
      pending: 0,
      approved: 0,
      suspended: 0,
      rejected: 0
    };

    stats.forEach(stat => {
      formattedStats[stat._id] = stat.count;
      formattedStats.total += stat.count;
    });

    // Get recent registrations (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentRegistrations = await VehicleProvider.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    res.json({
      statusCounts: formattedStats,
      recentRegistrations,
      period: '30 days'
    });

  } catch (error) {
    console.error('Get vehicle provider stats error:', error);
    res.status(500).json({
      message: 'Failed to fetch vehicle provider statistics',
      error: error.message
    });
  }
};

// Delete vehicle provider (Admin only)
const deleteVehicleProvider = async (req, res) => {
  try {
    const { id } = req.params;
    
    const vehicleProvider = await VehicleProvider.findById(id);
    
    if (!vehicleProvider) {
      return res.status(404).json({
        message: 'Vehicle Provider not found'
      });
    }

    await VehicleProvider.findByIdAndDelete(id);

    res.json({
      message: 'Vehicle Provider deleted successfully'
    });

  } catch (error) {
    console.error('Delete vehicle provider error:', error);
    res.status(500).json({
      message: 'Failed to delete vehicle provider',
      error: error.message
    });
  }
};

// Bulk update vehicle provider status (Admin only)
const bulkUpdateVehicleProviderStatus = async (req, res) => {
  try {
    const { ids, status, rejectionReason } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        message: 'IDs array is required and must not be empty'
      });
    }

    // Validate status
    const validStatuses = ['pending', 'approved', 'suspended', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: 'Invalid status. Must be one of: pending, approved, suspended, rejected'
      });
    }

    // Update multiple vehicle providers
    const updateData = { status };
    if (status === 'approved') {
      updateData.isVerified = true;
    }
    if (status === 'rejected' && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }

    const result = await VehicleProvider.updateMany(
      { _id: { $in: ids } },
      updateData
    );

    res.json({
      message: `Updated ${result.modifiedCount} vehicle providers to ${status}`,
      modifiedCount: result.modifiedCount
    });

  } catch (error) {
    console.error('Bulk update vehicle provider status error:', error);
    res.status(500).json({
      message: 'Failed to bulk update vehicle provider status',
      error: error.message
    });
  }
};

module.exports = {
  getAllVehicleProviders,
  getVehicleProviderById,
  updateVehicleProviderStatus,
  getVehicleProviderStats,
  deleteVehicleProvider,
  bulkUpdateVehicleProviderStatus
};
















