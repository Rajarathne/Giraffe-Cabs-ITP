const TourPackage = require('../Models/TourPackage');
const TourBooking = require('../Models/TourBooking');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

// ✅ Get all tour packages
const getAllTourPackages = async (req, res) => {
  try {
    const packages = await TourPackage.find();
    res.json(packages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get single package by ID
const getTourPackageById = async (req, res) => {
  try {
    const pkg = await TourPackage.findById(req.params.id);
    if (!pkg) return res.status(404).json({ message: 'Package not found' });
    res.json(pkg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const Notification = require('../Models/Notification');
const User = require('../Models/User');

// ✅ Create new tour package
const createTourPackage = async (req, res) => {
  try {
    // Validate non-zero pricing and distance
    const pricePerPerson = Number(req.body?.pricePerPerson);
    const fullDistance = Number(req.body?.fullDistance);
    if (!Number.isFinite(pricePerPerson) || pricePerPerson <= 0) {
      return res.status(400).json({ message: 'Price per person must be greater than 0' });
    }
    if (!Number.isFinite(fullDistance) || fullDistance <= 0) {
      return res.status(400).json({ message: 'Total distance must be greater than 0' });
    }

    const packageData = {
      ...req.body,
      createdBy: req.user._id
    };
    const newPkg = new TourPackage(packageData);
    const savedPkg = await newPkg.save();

    // Notify all active customers about the new tour package (non-blocking)
    try {
      const customers = await User.find({ role: 'customer', isActive: true }).select('_id');
      if (customers.length > 0) {
        const notifications = customers.map(u => ({
          user: u._id,
          type: 'system',
          title: 'New Tour Package Available',
          message: `${savedPkg.packageName || 'A new package'} to ${savedPkg.destination || 'a destination'} is now available.`,
          data: { tourPackageId: savedPkg._id }
        }));
        await Notification.insertMany(notifications, { ordered: false });
      }
    } catch (notifyErr) {
      console.warn('Failed to create notifications for new tour package:', notifyErr?.message || notifyErr);
    }

    res.status(201).json(savedPkg);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ✅ Update tour package
const updateTourPackage = async (req, res) => {
  try {
    const updated = await TourPackage.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Package not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ✅ Delete tour package
const deleteTourPackage = async (req, res) => {
  try {
    const deleted = await TourPackage.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Package not found' });
    res.json({ message: 'Package deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Stats: total packages + total bookings
const getTourPackageStats = async (req, res) => {
  try {
    const totalPackages = await TourPackage.countDocuments();
    const totalBookings = await TourBooking.countDocuments();
    res.json({ totalPackages, totalBookings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get available tour packages (public endpoint)
const getAvailableTourPackages = async (req, res) => {
  try {
    const { passengerCount } = req.query;
    
    // Base query for available packages
    let query = {
      status: 'active',
      isAvailable: true
    };
    
    // If passenger count is specified, filter by passenger limits
    if (passengerCount) {
      query.minPassengers = { $lte: parseInt(passengerCount) };
      query.maxPassengers = { $gte: parseInt(passengerCount) };
    }
    
    const packages = await TourPackage.find(query).sort({ createdAt: -1 });
    res.json(packages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Calculate price based on passengers & days
const calculateTourPrice = async (req, res) => {
  try {
    const { id } = req.params;
    const { passengers, days } = req.body;

    const pkg = await TourPackage.findById(id);
    if (!pkg) return res.status(404).json({ message: 'Package not found' });

    const total = passengers * pkg.pricePerPassenger * days;
    res.json({ totalPrice: total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Generate Tour Package Analytics Report (PDF)
const generateTourPackageAnalyticsReport = async (req, res) => {
  try {
    const packages = await TourPackage.find();
    const bookings = await TourBooking.find().populate('tourPackage user');
    
    const doc = new PDFDocument({ 
      margin: 50,
      size: 'A4',
      layout: 'portrait'
    });
    
    const filename = `Tour_Package_Analytics_Report_${new Date().toISOString().split('T')[0]}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    doc.pipe(res);

    // Header with company branding
    doc.rect(50, 50, 500, 80)
       .fill('#235784');
    
    doc.rect(50, 50, 500, 20)
       .fill('#F7AA00');
    
    doc.rect(50, 130, 500, 20)
       .fill('#40A8C4');
    
    doc.rect(70, 70, 200, 50)
       .fill('#FFFFFF');
    
    doc.fillColor('#235784')
       .fontSize(28)
       .font('Helvetica-Bold')
       .text('🦒 GIRAFFE CABS', 80, 75);
    
    doc.fillColor('#F7AA00')
       .fontSize(20)
       .font('Helvetica-Bold')
       .text('TOUR PACKAGE ANALYTICS', 80, 100);
    
    doc.fillColor('white')
       .fontSize(14)
       .font('Helvetica')
       .text('Tour Package Performance Report', 300, 85);
    
    doc.fontSize(12)
       .text(`Generated: ${new Date().toLocaleDateString()}`, 300, 105);
    
    // Summary Statistics
    doc.fillColor('#333333')
       .fontSize(16)
       .font('Helvetica-Bold')
       .text('SUMMARY STATISTICS', 60, 180);
    
    const totalPackages = packages.length;
    const totalBookings = bookings.length;
    const totalRevenue = bookings.reduce((sum, booking) => sum + (booking.pricing?.finalPrice || 0), 0);
    const activePackages = packages.filter(pkg => pkg.status === 'active').length;
    
    doc.fontSize(12)
       .font('Helvetica')
       .text(`Total Tour Packages: ${totalPackages}`, 60, 210)
       .text(`Active Packages: ${activePackages}`, 60, 230)
       .text(`Total Bookings: ${totalBookings}`, 60, 250)
       .text(`Total Revenue: LKR ${totalRevenue.toLocaleString()}`, 60, 270);
    
    // Package Performance
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .text('PACKAGE PERFORMANCE', 60, 320);
    
    let yPos = 350;
    packages.slice(0, 10).forEach((pkg, index) => {
      const packageBookings = bookings.filter(booking => 
        booking.tourPackage && booking.tourPackage._id.toString() === pkg._id.toString()
      );
      const packageRevenue = packageBookings.reduce((sum, booking) => 
        sum + (booking.pricing?.finalPrice || 0), 0
      );
      
      doc.fontSize(10)
         .font('Helvetica')
         .text(`${index + 1}. ${pkg.packageName}`, 60, yPos)
         .text(`   Destination: ${pkg.destination}`, 60, yPos + 15)
         .text(`   Bookings: ${packageBookings.length}`, 60, yPos + 30)
         .text(`   Revenue: LKR ${packageRevenue.toLocaleString()}`, 60, yPos + 45)
         .text(`   Status: ${pkg.status.toUpperCase()}`, 60, yPos + 60);
      
      yPos += 85;
    });
    
    doc.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Generate Tour Package Revenue Report (Excel)
const generateTourPackageRevenueReport = async (req, res) => {
  try {
    const packages = await TourPackage.find();
    const bookings = await TourBooking.find().populate('tourPackage user');
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Tour Package Revenue Report');
    
    // Add company header
    worksheet.mergeCells('A1:F3');
    const headerCell = worksheet.getCell('A1');
    headerCell.value = '🦒 GIRAFFE CABS\nTOUR PACKAGE REVENUE REPORT';
    headerCell.font = { size: 16, bold: true, color: { argb: 'FF235784' } };
    headerCell.alignment = { horizontal: 'center', vertical: 'middle' };
    headerCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF7AA00' }
    };
    
    // Add headers
    const headers = ['Package Name', 'Destination', 'Duration (Days)', 'Base Price', 'Total Bookings', 'Total Revenue'];
    worksheet.addRow(headers);
    
    // Style headers
    const headerRow = worksheet.getRow(4);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF235784' }
    };
    
    // Add data
    packages.forEach(pkg => {
      const packageBookings = bookings.filter(booking => 
        booking.tourPackage && booking.tourPackage._id.toString() === pkg._id.toString()
      );
      const totalRevenue = packageBookings.reduce((sum, booking) => 
        sum + (booking.pricing?.finalPrice || 0), 0
      );
      
      worksheet.addRow([
        pkg.packageName,
        pkg.destination,
        pkg.tourDays,
        pkg.basePrice,
        packageBookings.length,
        totalRevenue
      ]);
    });
    
    // Auto-fit columns
    worksheet.columns.forEach(column => {
      column.width = 20;
    });
    
    // Add summary
    const totalRevenue = bookings.reduce((sum, booking) => sum + (booking.pricing?.finalPrice || 0), 0);
    worksheet.addRow([]);
    worksheet.addRow(['TOTAL REVENUE', '', '', '', '', totalRevenue]);
    
    const summaryRow = worksheet.getRow(worksheet.rowCount);
    summaryRow.font = { bold: true, color: { argb: 'FF235784' } };
    summaryRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF7AA00' }
    };
    
    const filename = `Tour_Package_Revenue_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Generate Popular Destinations Report (CSV)
const generatePopularDestinationsReport = async (req, res) => {
  try {
    const packages = await TourPackage.find();
    const bookings = await TourBooking.find().populate('tourPackage');
    
    // Group by destination
    const destinationStats = {};
    
    packages.forEach(pkg => {
      if (!destinationStats[pkg.destination]) {
        destinationStats[pkg.destination] = {
          destination: pkg.destination,
          packages: 0,
          bookings: 0,
          revenue: 0
        };
      }
      destinationStats[pkg.destination].packages++;
    });
    
    bookings.forEach(booking => {
      if (booking.tourPackage && destinationStats[booking.tourPackage.destination]) {
        destinationStats[booking.tourPackage.destination].bookings++;
        destinationStats[booking.tourPackage.destination].revenue += 
          booking.pricing?.finalPrice || 0;
      }
    });
    
    // Convert to CSV
    let csvContent = 'Destination,Packages,Bookings,Revenue\n';
    Object.values(destinationStats).forEach(stat => {
      csvContent += `${stat.destination},${stat.packages},${stat.bookings},${stat.revenue}\n`;
    });
    
    const filename = `Popular_Destinations_Report_${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    res.send(csvContent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllTourPackages,
  getTourPackageById,
  createTourPackage,
  updateTourPackage,
  deleteTourPackage,
  getTourPackageStats,
  getAvailableTourPackages,
  calculateTourPrice,
  generateTourPackageAnalyticsReport,
  generateTourPackageRevenueReport,
  generatePopularDestinationsReport
};







