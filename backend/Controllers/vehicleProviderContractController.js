const VehicleProviderContract = require('../Models/VehicleProviderContract');
const VehicleProvider = require('../Models/VehicleProvider');
const User = require('../Models/User');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

// Create Vehicle Provider Contract Request
const createContractRequest = async (req, res) => {
  try {
    const {
      vehicle,
      contractTerms,
      specialConditions,
      notes
    } = req.body;

    // Validate required fields
    if (!vehicle || !contractTerms) {
      return res.status(400).json({
        message: 'Vehicle details and contract terms are required'
      });
    }

    // Create new contract request
    const contract = new VehicleProviderContract({
      vehicleProvider: req.vehicleProvider._id,
      vehicle: {
        vehicleNumber: vehicle.vehicleNumber,
        brand: vehicle.brand,
        model: vehicle.model,
        year: vehicle.year,
        color: vehicle.color,
        vehicleType: vehicle.vehicleType,
        fuelType: vehicle.fuelType,
        transmission: vehicle.transmission,
        seatingCapacity: vehicle.seatingCapacity,
        engineCapacity: vehicle.engineCapacity,
        mileage: vehicle.mileage,
        features: vehicle.features || [],
        condition: vehicle.condition,
        insuranceDetails: vehicle.insuranceDetails,
        registrationDetails: vehicle.registrationDetails,
        vehicleImages: vehicle.vehicleImages || []
      },
      contractTerms: {
        startDate: contractTerms.startDate,
        endDate: contractTerms.endDate,
        duration: contractTerms.duration,
        monthlyFee: contractTerms.monthlyFee,
        paymentTerms: contractTerms.paymentTerms,
        paymentMethod: contractTerms.paymentMethod,
        latePaymentPenalty: contractTerms.latePaymentPenalty || 0,
        securityDeposit: contractTerms.securityDeposit || 0
      },
      specialConditions: specialConditions || [],
      notes: notes || '',
      status: 'pending'
    });

    // Add initial admin action
    contract.adminActions.push({
      action: 'created',
      adminId: req.vehicleProvider._id, // Will be updated when admin reviews
      notes: 'Contract request created by vehicle provider',
      timestamp: new Date()
    });

    await contract.save();

    // Populate the contract with vehicle provider details
    await contract.populate('vehicleProvider', 'firstName lastName email businessName');

    res.status(201).json({
      message: 'Contract request submitted successfully',
      contract
    });

  } catch (error) {
    console.error('Create contract request error:', error);
    res.status(500).json({
      message: 'Failed to create contract request',
      error: error.message
    });
  }
};

// Get Vehicle Provider's Contracts
const getVehicleProviderContracts = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    let query = { vehicleProvider: req.vehicleProvider._id };

    if (status && status !== 'all') {
      query.status = status;
    }

    const contracts = await VehicleProviderContract.find(query)
      .populate('admin', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await VehicleProviderContract.countDocuments(query);

    res.json({
      contracts,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });

  } catch (error) {
    console.error('Get contracts error:', error);
    res.status(500).json({
      message: 'Failed to get contracts',
      error: error.message
    });
  }
};

// Get Single Contract
const getContractById = async (req, res) => {
  try {
    const contract = await VehicleProviderContract.findById(req.params.id)
      .populate('vehicleProvider', 'firstName lastName email businessName phone address bankDetails')
      .populate('admin', 'firstName lastName email');

    if (!contract) {
      return res.status(404).json({
        message: 'Contract not found'
      });
    }

    // Check if vehicle provider owns this contract
    if (contract.vehicleProvider._id.toString() !== req.vehicleProvider._id.toString()) {
      return res.status(403).json({
        message: 'Not authorized to view this contract'
      });
    }

    res.json(contract);

  } catch (error) {
    console.error('Get contract error:', error);
    res.status(500).json({
      message: 'Failed to get contract',
      error: error.message
    });
  }
};

// Update Contract (Vehicle Provider can only update certain fields)
const updateContract = async (req, res) => {
  try {
    const contract = await VehicleProviderContract.findById(req.params.id);

    if (!contract) {
      return res.status(404).json({
        message: 'Contract not found'
      });
    }

    // Check if vehicle provider owns this contract
    if (contract.vehicleProvider.toString() !== req.vehicleProvider._id.toString()) {
      return res.status(403).json({
        message: 'Not authorized to update this contract'
      });
    }

    // Only allow updates if contract is pending or under review
    if (!['pending', 'under_review'].includes(contract.status)) {
      return res.status(400).json({
        message: 'Contract cannot be updated in current status'
      });
    }

    const {
      vehicle,
      contractTerms,
      specialConditions,
      notes
    } = req.body;

    // Update allowed fields
    if (vehicle) {
      Object.keys(vehicle).forEach(key => {
        if (vehicle[key] !== undefined) {
          contract.vehicle[key] = vehicle[key];
        }
      });
    }

    if (contractTerms) {
      Object.keys(contractTerms).forEach(key => {
        if (contractTerms[key] !== undefined) {
          contract.contractTerms[key] = contractTerms[key];
        }
      });
    }

    if (specialConditions) {
      contract.specialConditions = specialConditions;
    }

    if (notes !== undefined) {
      contract.notes = notes;
    }

    // Add admin action
    contract.adminActions.push({
      action: 'modified',
      adminId: req.vehicleProvider._id,
      notes: 'Contract updated by vehicle provider',
      timestamp: new Date()
    });

    await contract.save();

    res.json({
      message: 'Contract updated successfully',
      contract
    });

  } catch (error) {
    console.error('Update contract error:', error);
    res.status(500).json({
      message: 'Failed to update contract',
      error: error.message
    });
  }
};

// Delete Contract
const deleteContract = async (req, res) => {
  try {
    const contract = await VehicleProviderContract.findById(req.params.id);

    if (!contract) {
      return res.status(404).json({
        message: 'Contract not found'
      });
    }

    // Check if vehicle provider owns this contract
    if (contract.vehicleProvider.toString() !== req.vehicleProvider._id.toString()) {
      return res.status(403).json({
        message: 'Not authorized to delete this contract'
      });
    }

    // Only allow deletion if contract is pending
    if (contract.status !== 'pending') {
      return res.status(400).json({
        message: 'Only pending contracts can be deleted'
      });
    }

    await VehicleProviderContract.findByIdAndDelete(req.params.id);

    res.json({
      message: 'Contract deleted successfully'
    });

  } catch (error) {
    console.error('Delete contract error:', error);
    res.status(500).json({
      message: 'Failed to delete contract',
      error: error.message
    });
  }
};

// Generate Contract PDF
const generateContractPDF = async (req, res) => {
  try {
    const contract = await VehicleProviderContract.findById(req.params.id)
      .populate('vehicleProvider', 'firstName lastName email businessName phone address bankDetails')
      .populate('admin', 'firstName lastName email');

    if (!contract) {
      return res.status(404).json({
        message: 'Contract not found'
      });
    }

    // Check if vehicle provider owns this contract
    if (contract.vehicleProvider._id.toString() !== req.vehicleProvider._id.toString()) {
      return res.status(403).json({
        message: 'Not authorized to view this contract'
      });
    }

    const doc = new PDFDocument({ margin: 50 });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Vehicle_Provider_Contract_${contract.contractId}.pdf"`);
    
    doc.pipe(res);

    // Header
    doc.fontSize(20)
       .fillColor('#235784')
       .text('Giraffe Cabs - Vehicle Provider Contract', 50, 50, { align: 'center' });
    
    doc.fontSize(12)
       .fillColor('#666')
       .text(`Contract ID: ${contract.contractId}`, 50, 80, { align: 'center' });
    
    doc.fontSize(10)
       .text(`Generated on: ${new Date().toLocaleDateString()}`, 50, 100, { align: 'center' });

    let yPosition = 140;

    // Contract Status
    doc.fontSize(14)
       .fillColor('#235784')
       .text('Contract Status', 50, yPosition);
    
    yPosition += 25;
    
    doc.fontSize(12)
       .fillColor('#333')
       .text(`Status: ${contract.status.toUpperCase()}`, 50, yPosition)
       .text(`Created: ${contract.createdAt.toLocaleDateString()}`, 50, yPosition + 20);

    yPosition += 50;

    // Vehicle Provider Information
    doc.fontSize(14)
       .fillColor('#235784')
       .text('Vehicle Provider Information', 50, yPosition);
    
    yPosition += 25;
    
    doc.fontSize(10)
       .fillColor('#333')
       .text(`Name: ${contract.vehicleProvider.firstName} ${contract.vehicleProvider.lastName}`, 50, yPosition)
       .text(`Business: ${contract.vehicleProvider.businessName}`, 50, yPosition + 15)
       .text(`Email: ${contract.vehicleProvider.email}`, 50, yPosition + 30)
       .text(`Phone: ${contract.vehicleProvider.phone}`, 50, yPosition + 45)
       .text(`Address: ${contract.vehicleProvider.address.street}, ${contract.vehicleProvider.address.city}`, 50, yPosition + 60);

    yPosition += 90;

    // Vehicle Information
    doc.fontSize(14)
       .fillColor('#235784')
       .text('Vehicle Information', 50, yPosition);
    
    yPosition += 25;
    
    doc.fontSize(10)
       .fillColor('#333')
       .text(`Vehicle Number: ${contract.vehicle.vehicleNumber}`, 50, yPosition)
       .text(`Brand & Model: ${contract.vehicle.brand} ${contract.vehicle.model}`, 50, yPosition + 15)
       .text(`Year: ${contract.vehicle.year}`, 50, yPosition + 30)
       .text(`Color: ${contract.vehicle.color}`, 50, yPosition + 45)
       .text(`Type: ${contract.vehicle.vehicleType}`, 50, yPosition + 60)
       .text(`Fuel Type: ${contract.vehicle.fuelType}`, 50, yPosition + 75)
       .text(`Transmission: ${contract.vehicle.transmission}`, 50, yPosition + 90)
       .text(`Seating Capacity: ${contract.vehicle.seatingCapacity}`, 50, yPosition + 105)
       .text(`Engine Capacity: ${contract.vehicle.engineCapacity}`, 50, yPosition + 120)
       .text(`Mileage: ${contract.vehicle.mileage} km`, 50, yPosition + 135)
       .text(`Condition: ${contract.vehicle.condition}`, 50, yPosition + 150);

    yPosition += 180;

    // Contract Terms
    doc.fontSize(14)
       .fillColor('#235784')
       .text('Contract Terms', 50, yPosition);
    
    yPosition += 25;
    
    doc.fontSize(10)
       .fillColor('#333')
       .text(`Start Date: ${new Date(contract.contractTerms.startDate).toLocaleDateString()}`, 50, yPosition)
       .text(`End Date: ${new Date(contract.contractTerms.endDate).toLocaleDateString()}`, 50, yPosition + 15)
       .text(`Duration: ${contract.contractTerms.duration} months`, 50, yPosition + 30)
       .text(`Monthly Fee: LKR ${contract.contractTerms.monthlyFee.toLocaleString()}`, 50, yPosition + 45)
       .text(`Payment Terms: ${contract.contractTerms.paymentTerms}`, 50, yPosition + 60)
       .text(`Payment Method: ${contract.contractTerms.paymentMethod}`, 50, yPosition + 75)
       .text(`Security Deposit: LKR ${contract.contractTerms.securityDeposit.toLocaleString()}`, 50, yPosition + 90);

    yPosition += 120;

    // Payment History
    if (contract.paymentHistory && contract.paymentHistory.length > 0) {
      doc.fontSize(14)
         .fillColor('#235784')
         .text('Payment History', 50, yPosition);
      
      yPosition += 25;
      
      contract.paymentHistory.forEach((payment, index) => {
        if (yPosition > 700) {
          doc.addPage();
          yPosition = 50;
        }
        
        doc.fontSize(10)
           .fillColor('#333')
           .text(`${index + 1}. Payment ID: ${payment.paymentId}`, 50, yPosition)
           .text(`   Amount: LKR ${payment.amount.toLocaleString()}`, 50, yPosition + 15)
           .text(`   Date: ${new Date(payment.paymentDate).toLocaleDateString()}`, 50, yPosition + 30)
           .text(`   Method: ${payment.paymentMethod}`, 50, yPosition + 45)
           .text(`   Status: ${payment.status}`, 50, yPosition + 60);
        
        yPosition += 80;
      });
    }

    // Footer
    doc.fontSize(10)
       .fillColor('#666')
       .text('This contract is generated by Giraffe Cabs Management System', 50, doc.page.height - 50, { align: 'center' })
       .text('For any queries, contact us at info@giraffecabs.lk', 50, doc.page.height - 35, { align: 'center' });

    doc.end();

  } catch (error) {
    console.error('Generate contract PDF error:', error);
    res.status(500).json({
      message: 'Failed to generate contract PDF',
      error: error.message
    });
  }
};

// Get Contract Statistics
const getContractStatistics = async (req, res) => {
  try {
    const vehicleProviderId = req.vehicleProvider._id;

    const stats = await VehicleProviderContract.aggregate([
      { $match: { vehicleProvider: vehicleProviderId } },
      {
        $group: {
          _id: null,
          totalContracts: { $sum: 1 },
          totalEarnings: { $sum: '$contractTerms.monthlyFee' },
          activeContracts: {
            $sum: {
              $cond: [{ $eq: ['$status', 'active'] }, 1, 0]
            }
          },
          pendingContracts: {
            $sum: {
              $cond: [{ $eq: ['$status', 'pending'] }, 1, 0]
            }
          },
          approvedContracts: {
            $sum: {
              $cond: [{ $eq: ['$status', 'approved'] }, 1, 0]
            }
          }
        }
      }
    ]);

    const paymentStats = await VehicleProviderContract.aggregate([
      { $match: { vehicleProvider: vehicleProviderId } },
      { $unwind: '$paymentHistory' },
      {
        $group: {
          _id: null,
          totalPayments: { $sum: 1 },
          completedPayments: {
            $sum: {
              $cond: [{ $eq: ['$paymentHistory.status', 'completed'] }, 1, 0]
            }
          },
          totalPaid: {
            $sum: {
              $cond: [{ $eq: ['$paymentHistory.status', 'completed'] }, '$paymentHistory.amount', 0]
            }
          }
        }
      }
    ]);

    res.json({
      contractStats: stats[0] || {
        totalContracts: 0,
        totalEarnings: 0,
        activeContracts: 0,
        pendingContracts: 0,
        approvedContracts: 0
      },
      paymentStats: paymentStats[0] || {
        totalPayments: 0,
        completedPayments: 0,
        totalPaid: 0
      }
    });

  } catch (error) {
    console.error('Get contract statistics error:', error);
    res.status(500).json({
      message: 'Failed to get contract statistics',
      error: error.message
    });
  }
};

module.exports = {
  createContractRequest,
  getVehicleProviderContracts,
  getContractById,
  updateContract,
  deleteContract,
  generateContractPDF,
  getContractStatistics
};


















