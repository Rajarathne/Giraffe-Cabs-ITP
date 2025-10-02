const VehicleRequest = require('../Models/VehicleRequest');
const VehicleProvider = require('../Models/VehicleProvider');

// Create Vehicle Request
const createVehicleRequest = async (req, res) => {
  try {
    const {
      vehicleNumber,
      vehicleType,
      brand,
      model,
      year,
      color,
      capacity,
      fuelType,
      transmission,
      dailyRate,
      monthlyRate,
      description,
      features
    } = req.body;

    // Check if vehicle number already exists
    const existingRequest = await VehicleRequest.findOne({ vehicleNumber });
    if (existingRequest) {
      return res.status(400).json({
        message: 'Vehicle with this number already exists'
      });
    }

    // Create new vehicle request
    const vehicleRequest = new VehicleRequest({
      vehicleProvider: req.vehicleProvider._id,
      vehicleNumber,
      vehicleType,
      brand,
      model,
      year,
      color,
      capacity,
      fuelType,
      transmission,
      dailyRate,
      monthlyRate,
      description,
      features: features || [],
      status: 'pending'
    });

    await vehicleRequest.save();

    res.status(201).json({
      message: 'Vehicle request submitted successfully',
      vehicleRequest
    });

  } catch (error) {
    console.error('Create vehicle request error:', error);
    res.status(500).json({
      message: 'Failed to create vehicle request',
      error: error.message
    });
  }
};

// Get Vehicle Requests by Provider
const getVehicleRequestsByProvider = async (req, res) => {
  try {
    const vehicleRequests = await VehicleRequest.find({
      vehicleProvider: req.vehicleProvider._id
    }).sort({ createdAt: -1 });

    res.json(vehicleRequests);

  } catch (error) {
    console.error('Get vehicle requests error:', error);
    res.status(500).json({
      message: 'Failed to fetch vehicle requests',
      error: error.message
    });
  }
};

// Get All Vehicle Requests (Admin)
const getAllVehicleRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 10, search } = req.query;
    
    // Build filter object
    const filter = {};
    if (status) {
      filter.status = status;
    }
    if (search) {
      filter.$or = [
        { vehicleNumber: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Get vehicle requests with pagination and populate provider info
    const vehicleRequests = await VehicleRequest.find(filter)
      .populate('vehicleProvider', 'firstName lastName email businessName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await VehicleRequest.countDocuments(filter);

    res.json({
      vehicleRequests,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get all vehicle requests error:', error);
    res.status(500).json({
      message: 'Failed to fetch vehicle requests',
      error: error.message
    });
  }
};

// Get Vehicle Request by ID
const getVehicleRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const vehicleRequest = await VehicleRequest.findById(id)
      .populate('vehicleProvider', 'firstName lastName email businessName phone address bankDetails');
    
    if (!vehicleRequest) {
      return res.status(404).json({
        message: 'Vehicle request not found'
      });
    }

    res.json(vehicleRequest);

  } catch (error) {
    console.error('Get vehicle request by ID error:', error);
    res.status(500).json({
      message: 'Failed to fetch vehicle request',
      error: error.message
    });
  }
};

// Update Vehicle Request Status (Admin)
const updateVehicleRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    // Validate status
    const validStatuses = ['pending', 'approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: 'Invalid status. Must be one of: pending, approved, rejected'
      });
    }

    const vehicleRequest = await VehicleRequest.findById(id)
      .populate('vehicleProvider');
    
    if (!vehicleRequest) {
      return res.status(404).json({
        message: 'Vehicle request not found'
      });
    }

    // Update status
    vehicleRequest.status = status;
    if (adminNotes) {
      vehicleRequest.adminNotes = adminNotes;
    }

    await vehicleRequest.save();

    res.json({
      message: `Vehicle request ${status} successfully`,
      vehicleRequest
    });

  } catch (error) {
    console.error('Update vehicle request status error:', error);
    res.status(500).json({
      message: 'Failed to update vehicle request status',
      error: error.message
    });
  }
};

// Update Vehicle Request Details (Admin)
const updateVehicleRequestDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { dailyRate, monthlyRate, description } = req.body;

    const vehicleRequest = await VehicleRequest.findById(id)
      .populate('vehicleProvider');
    
    if (!vehicleRequest) {
      return res.status(404).json({
        message: 'Vehicle request not found'
      });
    }

    // Update fields
    if (dailyRate !== undefined) vehicleRequest.dailyRate = dailyRate;
    if (monthlyRate !== undefined) vehicleRequest.monthlyRate = monthlyRate;
    if (description !== undefined) vehicleRequest.description = description;

    await vehicleRequest.save();

    res.json({
      message: 'Vehicle request updated successfully',
      vehicleRequest
    });

  } catch (error) {
    console.error('Update vehicle request details error:', error);
    res.status(500).json({
      message: 'Failed to update vehicle request details',
      error: error.message
    });
  }
};

// Delete Vehicle Request
const deleteVehicleRequest = async (req, res) => {
  try {
    const { id } = req.params;
    
    const vehicleRequest = await VehicleRequest.findById(id);
    
    if (!vehicleRequest) {
      return res.status(404).json({
        message: 'Vehicle request not found'
      });
    }

    // Check if user owns this request or is admin
    if (vehicleRequest.vehicleProvider.toString() !== req.vehicleProvider._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'Access denied'
      });
    }

    await VehicleRequest.findByIdAndDelete(id);

    res.json({
      message: 'Vehicle request deleted successfully'
    });

  } catch (error) {
    console.error('Delete vehicle request error:', error);
    res.status(500).json({
      message: 'Failed to delete vehicle request',
      error: error.message
    });
  }
};

// Get Vehicle Request Statistics (Admin)
const getVehicleRequestStats = async (req, res) => {
  try {
    const stats = await VehicleRequest.aggregate([
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
      rejected: 0
    };

    stats.forEach(stat => {
      formattedStats[stat._id] = stat.count;
      formattedStats.total += stat.count;
    });

    // Get recent requests (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentRequests = await VehicleRequest.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    res.json({
      statusCounts: formattedStats,
      recentRequests,
      period: '30 days'
    });

  } catch (error) {
    console.error('Get vehicle request stats error:', error);
    res.status(500).json({
      message: 'Failed to fetch vehicle request statistics',
      error: error.message
    });
  }
};

module.exports = {
  createVehicleRequest,
  getVehicleRequestsByProvider,
  getAllVehicleRequests,
  getVehicleRequestById,
  updateVehicleRequestStatus,
  updateVehicleRequestDetails,
  deleteVehicleRequest,
  getVehicleRequestStats
};

