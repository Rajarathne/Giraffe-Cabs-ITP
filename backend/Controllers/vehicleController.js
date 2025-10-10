const Vehicle = require('../Models/Vehicle');
const path = require('path');
const fs = require('fs');
const jsPDF = require('jspdf').jsPDF;
const autoTable = require('jspdf-autotable');
const XLSX = require('xlsx');

// Get All Vehicles
const getAllVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ isActive: true });
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Vehicle by ID
const getVehicleById = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (vehicle) {
      res.json(vehicle);
    } else {
      res.status(404).json({ message: 'Vehicle not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create New Vehicle (Admin only)
const createVehicle = async (req, res) => {
  try {
    console.log('Create Vehicle Request:', {
      bodyKeys: Object.keys(req.body),
      photosCount: req.body.photos ? req.body.photos.length : 0,
      user: req.user,
      files: req.files ? req.files.length : 0
    });

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Process uploaded files (both multer files and base64 data)
    const photos = [];
    
    // Handle multer file uploads
    if (req.files && req.files.length > 0) {
      req.files.forEach((file, index) => {
        photos.push({
          url: `/uploads/vehicles/${file.filename}`,
          caption: req.body[`photoCaption${index}`] || '',
          isPrimary: index === 0 // First photo is primary
        });
      });
    }
    
    // Handle base64 photo data from frontend
    if (req.body.photos && Array.isArray(req.body.photos) && req.body.photos.length > 0) {
      req.body.photos.forEach((photoData, index) => {
        if (photoData && photoData.trim() !== '') {
          // Check if it's base64 data (starts with data:image)
          if (photoData.startsWith('data:image/')) {
          photos.push({
            url: photoData, // Store base64 data directly
            caption: req.body[`photoCaption${index}`] || '',
            isPrimary: index === 0 && photos.length === 0 // First photo is primary
          });
          } else {
            // Handle regular URL strings
            photos.push({
              url: photoData,
              caption: req.body[`photoCaption${index}`] || '',
              isPrimary: index === 0 && photos.length === 0
            });
          }
        }
      });
    }

    // Prepare vehicle data
    const vehicleData = {
      ...req.body,
      photos: photos,
      // Ensure rideTypes is an array
      rideTypes: Array.isArray(req.body.rideTypes) ? req.body.rideTypes : 
                 req.body.rideTypes ? [req.body.rideTypes] : [],
      // Parse numeric fields
      year: parseInt(req.body.year) || 0,
      capacity: parseInt(req.body.capacity) || 0,
      dailyRate: parseInt(req.body.dailyRate) || 0,
      monthlyRate: parseInt(req.body.monthlyRate) || 0,
      weddingRate: req.body.weddingRate ? parseInt(req.body.weddingRate) : 50000,
      airportRate: req.body.airportRate ? parseInt(req.body.airportRate) : null,
      cargoRate: req.body.cargoRate ? parseInt(req.body.cargoRate) : null
    };

    console.log('Creating vehicle with data:', JSON.stringify(vehicleData, null, 2));
    
    // Validate required fields before creating
    const requiredFields = ['vehicleNumber', 'vehicleType', 'brand', 'model', 'year', 'color', 'capacity', 'fuelType', 'transmission', 'dailyRate', 'monthlyRate'];
    const missingFields = requiredFields.filter(field => !vehicleData[field] && vehicleData[field] !== 0);
    
    if (missingFields.length > 0) {
      console.log('Missing required fields:', missingFields);
      return res.status(400).json({ 
        message: 'Missing required fields', 
        missingFields: missingFields 
      });
    }
    
    console.log('All validations passed, creating vehicle...');
    const vehicle = new Vehicle(vehicleData);
    const savedVehicle = await vehicle.save();
    console.log('Vehicle created successfully:', savedVehicle._id);
    res.status(201).json(savedVehicle);
  } catch (error) {
    console.error('Vehicle creation error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = {};
      Object.keys(error.errors).forEach(key => {
        validationErrors[key] = error.errors[key].message;
      });
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: validationErrors 
      });
    }
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Vehicle number already exists' 
      });
    }
    
    res.status(500).json({ message: error.message });
  }
};

// Update Vehicle (Admin only)
const updateVehicle = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    // Process uploaded files (both multer files and base64 data)
    const photos = [];
    
    // Handle multer file uploads
    if (req.files && req.files.length > 0) {
      req.files.forEach((file, index) => {
        photos.push({
          url: `/uploads/vehicles/${file.filename}`,
          caption: req.body[`photoCaption${index}`] || '',
          isPrimary: index === 0
        });
      });
    }
    
    // Handle base64 photo data from frontend
    if (req.body.photos && Array.isArray(req.body.photos) && req.body.photos.length > 0) {
      req.body.photos.forEach((photoData, index) => {
        if (photoData && photoData.trim() !== '') {
          // Check if it's base64 data (starts with data:image)
          if (photoData.startsWith('data:image/')) {
          photos.push({
            url: photoData, // Store base64 data directly
            caption: req.body[`photoCaption${index}`] || '',
            isPrimary: index === 0 && photos.length === 0
          });
          } else {
            // Handle regular URL strings
            photos.push({
              url: photoData,
              caption: req.body[`photoCaption${index}`] || '',
              isPrimary: index === 0 && photos.length === 0
            });
          }
        }
      });
    }

    // Prepare update data
    const updateData = {
      ...req.body,
      // Parse numeric fields
      year: req.body.year ? parseInt(req.body.year) : vehicle.year,
      capacity: req.body.capacity ? parseInt(req.body.capacity) : vehicle.capacity,
      dailyRate: req.body.dailyRate ? parseInt(req.body.dailyRate) : vehicle.dailyRate,
      monthlyRate: req.body.monthlyRate ? parseInt(req.body.monthlyRate) : vehicle.monthlyRate,
      weddingRate: req.body.weddingRate ? parseInt(req.body.weddingRate) : (vehicle.weddingRate || 50000),
      airportRate: req.body.airportRate ? parseInt(req.body.airportRate) : vehicle.airportRate,
      cargoRate: req.body.cargoRate ? parseInt(req.body.cargoRate) : vehicle.cargoRate,
      // Handle ride types
      rideTypes: Array.isArray(req.body.rideTypes) ? req.body.rideTypes : 
                 req.body.rideTypes ? [req.body.rideTypes] : vehicle.rideTypes || [],
      // Handle photos - merge with existing if no new photos uploaded
      photos: photos.length > 0 ? photos : (vehicle.photos || [])
    };

    // Update vehicle
    Object.assign(vehicle, updateData);
    const updatedVehicle = await vehicle.save();
    res.json(updatedVehicle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete Vehicle (Admin only)
const deleteVehicle = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const vehicle = await Vehicle.findById(req.params.id);
    if (vehicle) {
      vehicle.isActive = false;
      await vehicle.save();
      res.json({ message: 'Vehicle deleted successfully' });
    } else {
      res.status(404).json({ message: 'Vehicle not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Vehicles by Type
const getVehiclesByType = async (req, res) => {
  try {
    const { type } = req.params;
    const vehicles = await Vehicle.find({ 
      vehicleType: type, 
      isActive: true 
    });
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Vehicle Statistics (Admin only)
const getVehicleStats = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const totalVehicles = await Vehicle.countDocuments({ isActive: true });
    const availableVehicles = await Vehicle.countDocuments({ 
      isActive: true, 
      isAvailable: true 
    });
    const vehiclesByType = await Vehicle.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$vehicleType', count: { $sum: 1 } } }
    ]);

    res.json({
      total: totalVehicles,
      available: availableVehicles,
      vehiclesByType
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Vehicle Report Generation Functions
const generateVehicleInventoryReport = async (req, res) => {
  try {
    console.log('Starting vehicle inventory report generation...');
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const vehicles = await Vehicle.find({ isActive: true });
    console.log(`Found ${vehicles.length} vehicles`);
    
    // Generate PDF report
    const doc = new jsPDF();
    console.log('PDF document created');
    
    // Add title
    doc.setFontSize(20);
    doc.text('Vehicle Inventory Report', 20, 20);
    
    // Add generation date
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);
    doc.text(`Total Vehicles: ${vehicles.length}`, 20, 35);
    
    // Prepare table data
    const tableData = vehicles.map(vehicle => [
      vehicle.vehicleNumber,
      vehicle.vehicleType,
      vehicle.brand,
      vehicle.model,
      vehicle.year,
      vehicle.capacity,
      `LKR ${vehicle.dailyRate?.toLocaleString()}`,
      vehicle.isAvailable ? 'Yes' : 'No'
    ]);
    
    // Add table data as simple text (fallback approach)
    doc.setFontSize(8);
    let yPosition = 50;
    
    // Add header
    doc.setFontSize(10);
    doc.text('Vehicle Number | Type | Brand | Model | Year | Capacity | Daily Rate | Available', 20, yPosition);
    yPosition += 10;
    
    // Add data rows
    doc.setFontSize(8);
    tableData.forEach(row => {
      if (yPosition > 280) { // Start new page if needed
        doc.addPage();
        yPosition = 20;
      }
      doc.text(row.join(' | '), 20, yPosition);
      yPosition += 5;
    });
    
    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Vehicle_Inventory_${new Date().toISOString().split('T')[0]}.pdf"`);
    
    // Send PDF as buffer
    console.log('Generating PDF buffer...');
    const pdfBuffer = doc.output('arraybuffer');
    console.log('PDF buffer generated, size:', pdfBuffer.byteLength);
    res.send(Buffer.from(pdfBuffer));
    console.log('PDF sent to client');
  } catch (error) {
    console.error('Error generating vehicle inventory report:', error);
    res.status(500).json({ message: error.message });
  }
};

const generateVehicleAnalyticsReport = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const vehicles = await Vehicle.find({ isActive: true });
    
    // Generate analytics data
    const vehiclesByType = {};
    let totalRate = 0;
    let totalCapacity = 0;
    
    vehicles.forEach(vehicle => {
      vehiclesByType[vehicle.vehicleType] = (vehiclesByType[vehicle.vehicleType] || 0) + 1;
      totalRate += vehicle.dailyRate;
      totalCapacity += vehicle.capacity;
    });

    const averageDailyRate = vehicles.length > 0 ? Math.round(totalRate / vehicles.length) : 0;

    // Create Excel workbook
    const wb = XLSX.utils.book_new();
    
    // Summary sheet
    const summaryData = [
      ['Metric', 'Value'],
      ['Total Vehicles', vehicles.length],
      ['Average Daily Rate', `LKR ${averageDailyRate.toLocaleString()}`],
      ['Total Capacity', totalCapacity],
      ['Generated Date', new Date().toLocaleDateString()]
    ];
    
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
    
    // Vehicle types breakdown
    const typeData = [['Vehicle Type', 'Count']];
    Object.entries(vehiclesByType).forEach(([type, count]) => {
      typeData.push([type, count]);
    });
    
    const typeWs = XLSX.utils.aoa_to_sheet(typeData);
    XLSX.utils.book_append_sheet(wb, typeWs, 'Vehicle Types');
    
    // Detailed vehicle data
    const vehicleData = [
      ['Vehicle Number', 'Type', 'Brand', 'Model', 'Year', 'Capacity', 'Daily Rate', 'Monthly Rate', 'Available']
    ];
    
    vehicles.forEach(vehicle => {
      vehicleData.push([
        vehicle.vehicleNumber,
        vehicle.vehicleType,
        vehicle.brand,
        vehicle.model,
        vehicle.year,
        vehicle.capacity,
        vehicle.dailyRate,
        vehicle.monthlyRate || 0,
        vehicle.isAvailable ? 'Yes' : 'No'
      ]);
    });
    
    const vehicleWs = XLSX.utils.aoa_to_sheet(vehicleData);
    XLSX.utils.book_append_sheet(wb, vehicleWs, 'Vehicle Details');
    
    // Set response headers for Excel download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="Vehicle_Analytics_${new Date().toISOString().split('T')[0]}.xlsx"`);
    
    const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.send(excelBuffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const generateVehicleDetailsReport = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const vehicles = await Vehicle.find({ isActive: true });
    
    // Create Excel workbook
    const wb = XLSX.utils.book_new();
    
    // Detailed vehicle data
    const vehicleData = [
      ['Vehicle Number', 'Type', 'Brand', 'Model', 'Year', 'Color', 'Capacity', 'Fuel Type', 'Transmission', 'Daily Rate', 'Monthly Rate', 'Wedding Rate', 'Airport Rate', 'Cargo Rate', 'Available', 'Description']
    ];
    
    vehicles.forEach(vehicle => {
      vehicleData.push([
        vehicle.vehicleNumber,
        vehicle.vehicleType,
        vehicle.brand,
        vehicle.model,
        vehicle.year,
        vehicle.color,
        vehicle.capacity,
        vehicle.fuelType,
        vehicle.transmission,
        vehicle.dailyRate,
        vehicle.monthlyRate || 0,
        vehicle.pricing?.weddingRate || 0,
        vehicle.pricing?.airportRate || 0,
        vehicle.pricing?.cargoRate || 0,
        vehicle.isAvailable ? 'Yes' : 'No',
        vehicle.description || ''
      ]);
    });
    
    const vehicleWs = XLSX.utils.aoa_to_sheet(vehicleData);
    XLSX.utils.book_append_sheet(wb, vehicleWs, 'Vehicle Details');
    
    // Set response headers for Excel download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="Vehicle_Details_${new Date().toISOString().split('T')[0]}.xlsx"`);
    
    const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.send(excelBuffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const generateVehicleUtilizationReport = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const vehicles = await Vehicle.find({ isActive: true });
    const availableVehicles = vehicles.filter(v => v.isAvailable).length;
    const utilizationRate = vehicles.length > 0 ? 
      Math.round(((vehicles.length - availableVehicles) / vehicles.length) * 100) : 0;
    
    // Generate PDF report
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text('Vehicle Utilization Report', 20, 20);
    
    // Add generation date and stats
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);
    doc.text(`Total Vehicles: ${vehicles.length}`, 20, 35);
    doc.text(`Available Vehicles: ${availableVehicles}`, 20, 40);
    doc.text(`Utilization Rate: ${utilizationRate}%`, 20, 45);
    
    // Prepare table data
    const tableData = vehicles.map(vehicle => [
      vehicle.vehicleNumber,
      vehicle.vehicleType,
      vehicle.isAvailable ? 'Available' : 'In Use',
      `LKR ${vehicle.dailyRate?.toLocaleString()}`
    ]);
    
    // Add table data as simple text
    doc.setFontSize(8);
    let yPosition = 55;
    
    // Add header
    doc.setFontSize(10);
    doc.text('Vehicle Number | Type | Status | Daily Rate', 20, yPosition);
    yPosition += 10;
    
    // Add data rows
    doc.setFontSize(8);
    tableData.forEach(row => {
      if (yPosition > 280) { // Start new page if needed
        doc.addPage();
        yPosition = 20;
      }
      doc.text(row.join(' | '), 20, yPosition);
      yPosition += 5;
    });
    
    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Vehicle_Utilization_${new Date().toISOString().split('T')[0]}.pdf"`);
    
    // Send PDF as buffer
    const pdfBuffer = doc.output('arraybuffer');
    res.send(Buffer.from(pdfBuffer));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const generateVehicleMaintenanceReport = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const vehicles = await Vehicle.find({ isActive: true });
    
    // Create Excel workbook
    const wb = XLSX.utils.book_new();
    
    // Maintenance data
    const maintenanceData = [
      ['Vehicle Number', 'Type', 'Brand', 'Model', 'Year', 'Last Service', 'Next Service', 'Service Status', 'Notes']
    ];
    
    vehicles.forEach(vehicle => {
      maintenanceData.push([
        vehicle.vehicleNumber,
        vehicle.vehicleType,
        vehicle.brand,
        vehicle.model,
        vehicle.year,
        'N/A', // This would come from service records
        'N/A', // This would come from service records
        'Pending', // This would be calculated from service records
        'No maintenance records available'
      ]);
    });
    
    const maintenanceWs = XLSX.utils.aoa_to_sheet(maintenanceData);
    XLSX.utils.book_append_sheet(wb, maintenanceWs, 'Maintenance Records');
    
    // Summary sheet
    const summaryData = [
      ['Metric', 'Value'],
      ['Total Vehicles', vehicles.length],
      ['Vehicles Requiring Service', vehicles.length], // This would be calculated from service records
      ['Generated Date', new Date().toLocaleDateString()]
    ];
    
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
    
    // Set response headers for Excel download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="Vehicle_Maintenance_${new Date().toISOString().split('T')[0]}.xlsx"`);
    
    const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.send(excelBuffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const generateVehicleRevenueReport = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const vehicles = await Vehicle.find({ isActive: true });
    const totalDailyRevenue = vehicles.reduce((sum, v) => sum + v.dailyRate, 0);
    const totalMonthlyRevenue = vehicles.reduce((sum, v) => sum + (v.monthlyRate || 0), 0);
    
    // Generate PDF report
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text('Vehicle Revenue Report', 20, 20);
    
    // Add generation date and stats
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);
    doc.text(`Total Vehicles: ${vehicles.length}`, 20, 35);
    doc.text(`Total Daily Revenue Potential: LKR ${totalDailyRevenue.toLocaleString()}`, 20, 40);
    doc.text(`Total Monthly Revenue Potential: LKR ${totalMonthlyRevenue.toLocaleString()}`, 20, 45);
    
    // Prepare table data
    const tableData = vehicles.map(vehicle => [
      vehicle.vehicleNumber,
      vehicle.vehicleType,
      `LKR ${vehicle.dailyRate?.toLocaleString()}`,
      `LKR ${(vehicle.monthlyRate || 0).toLocaleString()}`,
      `LKR ${(vehicle.pricing?.weddingRate || 0).toLocaleString()}`,
      `LKR ${(vehicle.pricing?.airportRate || 0).toLocaleString()}`,
      `LKR ${(vehicle.pricing?.cargoRate || 0).toLocaleString()}`
    ]);
    
    // Add table data as simple text
    doc.setFontSize(7);
    let yPosition = 55;
    
    // Add header
    doc.setFontSize(9);
    doc.text('Vehicle Number | Type | Daily Rate | Monthly Rate | Wedding Rate | Airport Rate | Cargo Rate', 20, yPosition);
    yPosition += 10;
    
    // Add data rows
    doc.setFontSize(7);
    tableData.forEach(row => {
      if (yPosition > 280) { // Start new page if needed
        doc.addPage();
        yPosition = 20;
      }
      doc.text(row.join(' | '), 20, yPosition);
      yPosition += 5;
    });
    
    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Vehicle_Revenue_${new Date().toISOString().split('T')[0]}.pdf"`);
    
    // Send PDF as buffer
    const pdfBuffer = doc.output('arraybuffer');
    res.send(Buffer.from(pdfBuffer));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Test PDF generation endpoint
const testPDFGeneration = async (req, res) => {
  try {
    console.log('Testing PDF generation...');
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Test PDF Report', 20, 20);
    doc.text('This is a test PDF to verify generation works.', 20, 40);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="test.pdf"');
    
    const pdfBuffer = doc.output('arraybuffer');
    res.send(Buffer.from(pdfBuffer));
    console.log('Test PDF sent successfully');
  } catch (error) {
    console.error('Error in test PDF generation:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getVehiclesByType,
  getVehicleStats,
  generateVehicleInventoryReport,
  generateVehicleAnalyticsReport,
  generateVehicleDetailsReport,
  generateVehicleUtilizationReport,
  generateVehicleMaintenanceReport,
  generateVehicleRevenueReport,
  testPDFGeneration
};

