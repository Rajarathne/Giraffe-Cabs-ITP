const Rental = require('../Models/Rental');
const Vehicle = require('../Models/Vehicle');
const User = require('../Models/User');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');

// Create Rental Request
const createRentalRequest = async (req, res) => {
  try {
    const { vehicleId, rentalType, startDate, endDate, purpose, specialRequirements } = req.body;
    
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    let totalAmount = 0;
    if (rentalType === 'daily') {
      totalAmount = vehicle.dailyRate * duration;
    } else if (rentalType === 'monthly') {
      totalAmount = vehicle.monthlyRate * Math.ceil(duration / 30);
    }

    const rental = new Rental({
      user: req.user._id,
      vehicle: vehicleId,
      rentalType,
      startDate: start,
      endDate: end,
      duration,
      totalAmount,
      purpose,
      specialRequirements,
      vehicleDetails: {
        vehicleNumber: vehicle.vehicleNumber,
        brand: vehicle.brand,
        model: vehicle.model,
        year: vehicle.year
      },
      userDetails: {
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        email: req.user.email,
        phone: req.user.phone,
        address: req.user.address
      }
    });

    const savedRental = await rental.save();
    res.status(201).json(savedRental);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get User's Rental Requests
const getUserRentals = async (req, res) => {
  try {
    const rentals = await Rental.find({ user: req.user._id })
      .populate('vehicle', 'vehicleNumber brand model year images')
      .sort({ createdAt: -1 });
    res.json(rentals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get All Rental Requests (Admin only)
const getAllRentals = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const rentals = await Rental.find({})
      .populate('user', 'firstName lastName email phone')
      .populate('vehicle', 'vehicleNumber brand model year')
      .sort({ createdAt: -1 });
    res.json(rentals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Available Vehicles for Rental
const getAvailableVehicles = async (req, res) => {
  try {
    const availableVehicles = await Vehicle.find({ 
      isAvailable: true, 
      isActive: true 
    }).select('_id vehicleNumber brand model year vehicleType dailyRate monthlyRate');
    
    res.json(availableVehicles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Rental Status (Admin only)
const updateRentalStatus = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { status, monthlyFee, dailyFee, conditions, adminNotes } = req.body;
    
    const rental = await Rental.findById(req.params.id);
    if (!rental) {
      return res.status(404).json({ message: 'Rental not found' });
    }

    const oldStatus = rental.status;
    rental.status = status;
    if (monthlyFee) rental.monthlyFee = monthlyFee;
    if (dailyFee) rental.dailyFee = dailyFee;
    if (conditions) rental.conditions = conditions;
    if (adminNotes) rental.adminNotes = adminNotes;
    
    if (status === 'approved') {
      rental.approvedBy = req.user._id;
      rental.approvedAt = new Date();
    }

    // Update vehicle availability based on rental status
    const vehicle = await Vehicle.findById(rental.vehicle);
    if (vehicle) {
      if (status === 'approved' || status === 'active') {
        // Make vehicle unavailable when rental is approved or activated
        vehicle.isAvailable = false;
        vehicle.rentalStartDate = rental.startDate;
        vehicle.rentalEndDate = rental.endDate;
        vehicle.currentRentalId = rental._id;
      } else if (status === 'completed' || status === 'cancelled' || status === 'rejected') {
        // Make vehicle available again when rental is completed, cancelled, or rejected
        vehicle.isAvailable = true;
        vehicle.rentalStartDate = undefined;
        vehicle.rentalEndDate = undefined;
        vehicle.currentRentalId = undefined;
      }
      await vehicle.save();
    }

    const updatedRental = await rental.save();
    res.json(updatedRental);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Rental (Admin only)
const updateRental = async (req, res) => {
  try {
    console.log('Update rental endpoint called:', req.params.id, req.body);
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { 
      vehicleId, 
      rentalType, 
      startDate, 
      endDate, 
      duration, 
      purpose, 
      specialRequirements, 
      monthlyFee, 
      dailyFee,
      totalAmount, 
      conditions, 
      status,
      contractTerms,
      adminGuidelines
    } = req.body;
    
    const rental = await Rental.findById(req.params.id);
    if (!rental) {
      return res.status(404).json({ message: 'Rental not found' });
    }

    // Update fields
    if (vehicleId) {
      const vehicle = await Vehicle.findById(vehicleId);
      if (!vehicle) {
        return res.status(404).json({ message: 'Vehicle not found' });
      }
      rental.vehicle = vehicleId;
      rental.vehicleDetails = {
        vehicleNumber: vehicle.vehicleNumber,
        brand: vehicle.brand,
        model: vehicle.model,
        year: vehicle.year
      };
    }
    
    if (rentalType) rental.rentalType = rentalType;
    if (startDate) rental.startDate = new Date(startDate);
    if (endDate) rental.endDate = new Date(endDate);
    if (duration) rental.duration = duration;
    if (purpose) rental.purpose = purpose;
    if (specialRequirements) rental.specialRequirements = specialRequirements;
    if (monthlyFee) rental.monthlyFee = monthlyFee;
    if (dailyFee) rental.dailyFee = dailyFee;
    if (totalAmount) rental.totalAmount = totalAmount;
    if (conditions) rental.conditions = conditions;
    if (contractTerms) rental.contractTerms = contractTerms;
    if (adminGuidelines) rental.adminGuidelines = adminGuidelines;
    
    if (status) {
      rental.status = status;
      if (status === 'approved') {
        rental.approvedBy = req.user._id;
        rental.approvedAt = new Date();
        // Generate contract ID when approved
        if (!rental.contractId) {
          rental.contractId = `CONTRACT-${Date.now()}-${rental._id.toString().slice(-6)}`;
          rental.contractCreatedAt = new Date();
        }
      } else if (status === 'active') {
        rental.contractActivatedAt = new Date();
      } else if (status === 'completed') {
        rental.contractCompletedAt = new Date();
      }
    }

    const updatedRental = await rental.save();
    res.json(updatedRental);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete Rental Request (Admin only)
const deleteRental = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const rental = await Rental.findById(req.params.id);
    if (!rental) {
      return res.status(404).json({ message: 'Rental not found' });
    }

    await Rental.findByIdAndDelete(req.params.id);
    res.json({ message: 'Rental request deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Rental Statistics (Admin only)
const getRentalStats = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const totalRentals = await Rental.countDocuments();
    const pendingRentals = await Rental.countDocuments({ status: 'pending' });
    const approvedRentals = await Rental.countDocuments({ status: 'approved' });
    const activeRentals = await Rental.countDocuments({ status: 'active' });

    const monthlyRevenue = await Rental.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    res.json({
      total: totalRentals,
      pending: pendingRentals,
      approved: approvedRentals,
      active: activeRentals,
      monthlyRevenue: monthlyRevenue[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Generate Rental Contract PDF
const generateRentalContractPDF = async (req, res) => {
  try {
    const rental = await Rental.findById(req.params.id)
      .populate('user', 'firstName lastName email phone address')
      .populate('vehicle', 'vehicleNumber brand model year color capacity fuelType transmission')
      .populate('approvedBy', 'firstName lastName');

    if (!rental) {
      return res.status(404).json({ message: 'Rental not found' });
    }

    // Check if user has access to this rental
    if (req.user.role !== 'admin' && rental.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Create PDF document
    const doc = new PDFDocument({ margin: 50 });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Rental_Contract_${rental.contractId || rental._id}.pdf"`);
    
    // Pipe PDF to response
    doc.pipe(res);

    // Header
    doc.fontSize(24)
       .fillColor('#667eea')
       .text('GIRAFFE CABS', 50, 50, { align: 'center' });
    
    doc.fontSize(16)
       .fillColor('#333')
       .text('Vehicle Rental Contract', 50, 90, { align: 'center' });

    // Contract ID and Date
    doc.fontSize(12)
       .fillColor('#666')
       .text(`Contract ID: ${rental.contractId || 'N/A'}`, 50, 130)
       .text(`Generated: ${new Date().toLocaleDateString()}`, 400, 130);

    // Line separator
    doc.moveTo(50, 160)
       .lineTo(550, 160)
       .stroke('#667eea', 2);

    let yPosition = 180;

    // Contract Details Section
    doc.fontSize(16)
       .fillColor('#333')
       .text('CONTRACT DETAILS', 50, yPosition);
    
    yPosition += 30;

    // Customer Information
    doc.fontSize(12)
       .fillColor('#333')
       .text('CUSTOMER INFORMATION:', 50, yPosition, { underline: true });
    
    yPosition += 25;
    
    doc.text(`Name: ${rental.user.firstName} ${rental.user.lastName}`, 70, yPosition);
    yPosition += 20;
    doc.text(`Email: ${rental.user.email}`, 70, yPosition);
    yPosition += 20;
    doc.text(`Phone: ${rental.user.phone || 'Not provided'}`, 70, yPosition);
    yPosition += 20;
    doc.text(`Address: ${rental.user.address || 'Not provided'}`, 70, yPosition);
    yPosition += 30;

    // Vehicle Information
    doc.text('VEHICLE INFORMATION:', 50, yPosition, { underline: true });
    yPosition += 25;
    
    doc.text(`Vehicle Number: ${rental.vehicleDetails?.vehicleNumber || rental.vehicle?.vehicleNumber || 'N/A'}`, 70, yPosition);
    yPosition += 20;
    doc.text(`Make & Model: ${rental.vehicleDetails?.brand || rental.vehicle?.brand || 'N/A'} ${rental.vehicleDetails?.model || rental.vehicle?.model || 'N/A'}`, 70, yPosition);
    yPosition += 20;
    doc.text(`Year: ${rental.vehicleDetails?.year || rental.vehicle?.year || 'N/A'}`, 70, yPosition);
    yPosition += 20;
    doc.text(`Color: ${rental.vehicle?.color || 'N/A'}`, 70, yPosition);
    yPosition += 20;
    doc.text(`Capacity: ${rental.vehicle?.capacity || 'N/A'} passengers`, 70, yPosition);
    yPosition += 20;
    doc.text(`Fuel Type: ${rental.vehicle?.fuelType || 'N/A'}`, 70, yPosition);
    yPosition += 20;
    doc.text(`Transmission: ${rental.vehicle?.transmission || 'N/A'}`, 70, yPosition);
    yPosition += 30;

    // Rental Terms
    doc.text('RENTAL TERMS:', 50, yPosition, { underline: true });
    yPosition += 25;
    
    doc.text(`Rental Type: ${rental.rentalType.toUpperCase()}`, 70, yPosition);
    yPosition += 20;
    doc.text(`Start Date: ${new Date(rental.startDate).toLocaleDateString()}`, 70, yPosition);
    yPosition += 20;
    doc.text(`End Date: ${new Date(rental.endDate).toLocaleDateString()}`, 70, yPosition);
    yPosition += 20;
    doc.text(`Duration: ${rental.duration} days`, 70, yPosition);
    yPosition += 20;
    doc.text(`Purpose: ${rental.purpose}`, 70, yPosition);
    yPosition += 30;

    // Pricing Information
    doc.text('PRICING INFORMATION:', 50, yPosition, { underline: true });
    yPosition += 25;
    
    if (rental.monthlyFee > 0) {
      doc.text(`Monthly Fee: LKR ${rental.monthlyFee.toLocaleString()}`, 70, yPosition);
      yPosition += 20;
    }
    doc.text(`Total Amount: LKR ${rental.totalAmount.toLocaleString()}`, 70, yPosition);
    yPosition += 30;

    // Special Requirements
    if (rental.specialRequirements) {
      doc.text('SPECIAL REQUIREMENTS:', 50, yPosition, { underline: true });
      yPosition += 25;
      doc.text(rental.specialRequirements, 70, yPosition, { width: 480 });
      yPosition += 40;
    }

    // Contract Terms
    if (rental.contractTerms) {
      doc.text('CONTRACT TERMS & CONDITIONS:', 50, yPosition, { underline: true });
      yPosition += 25;
      doc.text(rental.contractTerms, 70, yPosition, { width: 480 });
      yPosition += 60;
    }

    // Admin Guidelines
    if (rental.adminGuidelines) {
      doc.text('ADMIN GUIDELINES:', 50, yPosition, { underline: true });
      yPosition += 25;
      doc.text(rental.adminGuidelines, 70, yPosition, { width: 480 });
      yPosition += 60;
    }

    // Status and Dates
    doc.text('CONTRACT STATUS:', 50, yPosition, { underline: true });
    yPosition += 25;
    
    doc.text(`Status: ${rental.status.toUpperCase()}`, 70, yPosition);
    yPosition += 20;
    
    if (rental.contractCreatedAt) {
      doc.text(`Contract Created: ${new Date(rental.contractCreatedAt).toLocaleDateString()}`, 70, yPosition);
      yPosition += 20;
    }
    
    if (rental.contractActivatedAt) {
      doc.text(`Contract Activated: ${new Date(rental.contractActivatedAt).toLocaleDateString()}`, 70, yPosition);
      yPosition += 20;
    }
    
    if (rental.approvedBy) {
      doc.text(`Approved By: ${rental.approvedBy.firstName} ${rental.approvedBy.lastName}`, 70, yPosition);
      yPosition += 20;
    }

    // Footer
    yPosition += 40;
    doc.moveTo(50, yPosition)
       .lineTo(550, yPosition)
       .stroke('#667eea', 1);
    
    yPosition += 20;
    doc.fontSize(10)
       .fillColor('#666')
       .text('This contract is generated by Giraffe Cabs Management System', 50, yPosition, { align: 'center' })
       .text('For any queries, contact us at info@giraffecabs.lk', 50, yPosition + 15, { align: 'center' });

    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ message: 'Error generating PDF' });
  }
};

// Generate Excel Report for All Rental Contracts
const generateRentalExcelReport = async (req, res) => {
  try {
    const rentals = await Rental.find()
      .populate('user', 'firstName lastName email phone address')
      .populate('vehicle', 'vehicleNumber brand model year')
      .sort({ createdAt: -1 });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Rental Contracts Report');

    // Define columns
    worksheet.columns = [
      { header: 'Contract ID', key: 'contractId', width: 15 },
      { header: 'Vehicle Number', key: 'vehicleNumber', width: 15 },
      { header: 'Vehicle Details', key: 'vehicleDetails', width: 25 },
      { header: 'Customer Name', key: 'customerName', width: 20 },
      { header: 'Customer Email', key: 'customerEmail', width: 25 },
      { header: 'Customer Phone', key: 'customerPhone', width: 15 },
      { header: 'Rental Type', key: 'rentalType', width: 12 },
      { header: 'Start Date', key: 'startDate', width: 12 },
      { header: 'End Date', key: 'endDate', width: 12 },
      { header: 'Duration (Days)', key: 'duration', width: 15 },
      { header: 'Purpose', key: 'purpose', width: 20 },
      { header: 'Monthly Fee (LKR)', key: 'monthlyFee', width: 18 },
      { header: 'Daily Fee (LKR)', key: 'dailyFee', width: 18 },
      { header: 'Total Amount (LKR)', key: 'totalAmount', width: 20 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Created Date', key: 'createdAt', width: 15 }
    ];

    // Style the header row
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '235784' }
    };

    // Add data rows
    rentals.forEach(rental => {
      worksheet.addRow({
        contractId: rental.contractId || 'N/A',
        vehicleNumber: rental.vehicle?.vehicleNumber || 'N/A',
        vehicleDetails: rental.vehicle ? `${rental.vehicle.brand} ${rental.vehicle.model} (${rental.vehicle.year})` : 'N/A',
        customerName: rental.user ? `${rental.user.firstName} ${rental.user.lastName}` : 'N/A',
        customerEmail: rental.user?.email || 'N/A',
        customerPhone: rental.user?.phone || 'N/A',
        rentalType: rental.rentalType || 'N/A',
        startDate: rental.startDate ? new Date(rental.startDate).toLocaleDateString() : 'N/A',
        endDate: rental.endDate ? new Date(rental.endDate).toLocaleDateString() : 'N/A',
        duration: rental.duration || 0,
        purpose: rental.purpose || 'N/A',
        monthlyFee: rental.monthlyFee || 0,
        dailyFee: rental.dailyFee || 0,
        totalAmount: rental.totalAmount || 0,
        status: rental.status || 'N/A',
        createdAt: rental.createdAt ? new Date(rental.createdAt).toLocaleDateString() : 'N/A'
      });
    });

    // Style the data rows
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.eachCell((cell, colNumber) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      }
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="Rental_Contracts_Report_${new Date().toISOString().split('T')[0]}.xlsx"`);

    // Write the workbook to response
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Error generating Excel report:', error);
    res.status(500).json({ message: 'Error generating Excel report' });
  }
};

// Generate PDF Report for All Rental Contracts
const generateRentalPDFReport = async (req, res) => {
  try {
    const rentals = await Rental.find()
      .populate('user', 'firstName lastName email phone address')
      .populate('vehicle', 'vehicleNumber brand model year')
      .sort({ createdAt: -1 });

    const doc = new PDFDocument({ margin: 50 });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Rental_Contracts_Report_${new Date().toISOString().split('T')[0]}.pdf"`);
    
    doc.pipe(res);

    // Header
    doc.fontSize(20)
       .fillColor('#235784')
       .text('Giraffe Cabs - Rental Contracts Report', 50, 50, { align: 'center' });
    
    doc.fontSize(12)
       .fillColor('#666')
       .text(`Generated on: ${new Date().toLocaleDateString()}`, 50, 80, { align: 'center' });
    
    doc.fontSize(10)
       .text(`Total Contracts: ${rentals.length}`, 50, 100, { align: 'center' });

    let yPosition = 140;

    // Summary statistics
    const stats = {
      total: rentals.length,
      pending: rentals.filter(r => r.status === 'pending').length,
      approved: rentals.filter(r => r.status === 'approved').length,
      active: rentals.filter(r => r.status === 'active').length,
      completed: rentals.filter(r => r.status === 'completed').length,
      totalRevenue: rentals.reduce((sum, r) => sum + (r.totalAmount || 0), 0)
    };

    doc.fontSize(14)
       .fillColor('#235784')
       .text('Summary Statistics', 50, yPosition);
    
    yPosition += 30;
    
    doc.fontSize(10)
       .fillColor('#333')
       .text(`Total Contracts: ${stats.total}`, 50, yPosition)
       .text(`Pending: ${stats.pending}`, 200, yPosition)
       .text(`Approved: ${stats.approved}`, 300, yPosition)
       .text(`Active: ${stats.active}`, 400, yPosition)
       .text(`Completed: ${stats.completed}`, 500, yPosition);
    
    yPosition += 20;
    doc.text(`Total Revenue: LKR ${stats.totalRevenue.toLocaleString()}`, 50, yPosition);
    
    yPosition += 40;

    // Contract details
    doc.fontSize(14)
       .fillColor('#235784')
       .text('Contract Details', 50, yPosition);
    
    yPosition += 30;

    rentals.forEach((rental, index) => {
      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
      }

      doc.fontSize(12)
         .fillColor('#333')
         .text(`${index + 1}. Contract ID: ${rental.contractId || 'N/A'}`, 50, yPosition);
      
      yPosition += 20;
      
      doc.fontSize(10)
         .text(`Vehicle: ${rental.vehicle?.vehicleNumber || 'N/A'} - ${rental.vehicle ? `${rental.vehicle.brand} ${rental.vehicle.model}` : 'N/A'}`, 70, yPosition)
         .text(`Customer: ${rental.user ? `${rental.user.firstName} ${rental.user.lastName}` : 'N/A'}`, 70, yPosition + 15)
         .text(`Email: ${rental.user?.email || 'N/A'}`, 70, yPosition + 30)
         .text(`Phone: ${rental.user?.phone || 'N/A'}`, 70, yPosition + 45)
         .text(`Type: ${rental.rentalType || 'N/A'}`, 70, yPosition + 60)
         .text(`Duration: ${rental.duration || 0} days`, 70, yPosition + 75)
         .text(`Amount: LKR ${(rental.totalAmount || 0).toLocaleString()}`, 70, yPosition + 90)
         .text(`Status: ${rental.status || 'N/A'}`, 70, yPosition + 105);
      
      yPosition += 130;
    });

    // Footer
    doc.fontSize(10)
       .fillColor('#666')
       .text('This report is generated by Giraffe Cabs Management System', 50, doc.page.height - 50, { align: 'center' })
       .text('For any queries, contact us at info@giraffecabs.lk', 50, doc.page.height - 35, { align: 'center' });

    doc.end();

  } catch (error) {
    console.error('Error generating PDF report:', error);
    res.status(500).json({ message: 'Error generating PDF report' });
  }
};

module.exports = {
  createRentalRequest,
  getUserRentals,
  getAllRentals,
  getAvailableVehicles,
  updateRentalStatus,
  updateRental,
  deleteRental,
  getRentalStats,
  generateRentalContractPDF,
  generateRentalExcelReport,
  generateRentalPDFReport
};





