const Booking = require('../Models/Booking');
const User = require('../Models/User');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Get All Bookings (Admin only)
const getAllBookings = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const bookings = await Booking.find()
      .populate('user', 'firstName lastName email phone')
      .sort({ createdAt: -1 });
    
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get User's Bookings
const getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .sort({ createdAt: -1 });
    
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Booking by ID
const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'firstName lastName email phone');
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user can access this booking
    if (req.user.role !== 'admin' && booking.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create New Booking
const createBooking = async (req, res) => {
  try {
    const bookingData = {
      ...req.body,
      user: req.user._id
    };

    const booking = new Booking(bookingData);
    const savedBooking = await booking.save();
    
    // Populate user data for response
    await savedBooking.populate('user', 'firstName lastName email phone');
    
    res.status(201).json(savedBooking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Booking Status (Admin only)
const updateBookingStatus = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { status, paymentStatus, paymentMethod } = req.body;
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (status) booking.status = status;
    if (paymentStatus) booking.paymentStatus = paymentStatus;
    if (paymentMethod) booking.paymentMethod = paymentMethod;
    
    const updatedBooking = await booking.save();
    
    await updatedBooking.populate('user', 'firstName lastName email phone');
    
    res.json(updatedBooking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Booking Pricing (Admin only)
const updateBookingPricing = async (req, res) => {
  try {
    console.log('updateBookingPricing called with:', req.params.id, req.body);
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { adminCalculatedDistance, pricePerKm, adminSetPrice, isPriceConfirmed } = req.body;
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (adminCalculatedDistance !== undefined) booking.adminCalculatedDistance = adminCalculatedDistance;
    if (pricePerKm !== undefined) booking.pricePerKm = pricePerKm;
    if (adminSetPrice !== undefined) booking.adminSetPrice = adminSetPrice;
    if (isPriceConfirmed !== undefined) booking.isPriceConfirmed = isPriceConfirmed;
    
    // Update total price if admin set price is provided
    if (adminSetPrice > 0) {
      booking.totalPrice = adminSetPrice;
    }
    
    const updatedBooking = await booking.save();
    console.log('Booking saved successfully:', updatedBooking._id);
    
    await updatedBooking.populate('user', 'firstName lastName email phone');
    console.log('Booking populated with user data');
    
    console.log('Sending response:', {
      id: updatedBooking._id,
      totalPrice: updatedBooking.totalPrice,
      isPriceConfirmed: updatedBooking.isPriceConfirmed
    });
    
    res.json(updatedBooking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update User Booking (User can only update pending bookings)
const updateUserBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user owns this booking
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Only allow updates for pending bookings
    if (booking.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending bookings can be updated' });
    }

    const allowedUpdates = ['pickupLocation', 'dropoffLocation', 'pickupDate', 'pickupTime', 'passengers', 'additionalNotes', 'paymentStatus', 'paymentMethod'];
    const updates = {};
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const updatedBooking = await Booking.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );
    
    await updatedBooking.populate('user', 'firstName lastName email phone');
    
    res.json(updatedBooking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete User Booking (User can only delete pending bookings)
const deleteUserBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user owns this booking
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Only allow deletion of pending bookings
    if (booking.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending bookings can be deleted' });
    }

    await Booking.findByIdAndDelete(req.params.id);
    res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete Booking (Admin only)
const deleteBooking = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    await Booking.findByIdAndDelete(req.params.id);
    res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Booking Statistics (Admin only)
const getBookingStats = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const totalBookings = await Booking.countDocuments();
    const pendingBookings = await Booking.countDocuments({ status: 'pending' });
    const confirmedBookings = await Booking.countDocuments({ status: 'confirmed' });
    const completedBookings = await Booking.countDocuments({ status: 'completed' });
    
    const bookingsByService = await Booking.aggregate([
      { $group: { _id: '$serviceType', count: { $sum: 1 } } }
    ]);

    const totalRevenue = await Booking.aggregate([
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);

    res.json({
      total: totalBookings,
      pending: pendingBookings,
      confirmed: confirmedBookings,
      completed: completedBookings,
      bookingsByService,
      totalRevenue: totalRevenue[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Generate Daily Booking Report (PDF)
const generateDailyBookingReport = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const bookings = await Booking.find({
      createdAt: { $gte: today, $lt: tomorrow }
    }).populate('user', 'firstName lastName email phone');

    const doc = new PDFDocument({ 
      margin: 50,
      size: 'A4',
      layout: 'portrait'
    });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Daily_Bookings_${today.toISOString().split('T')[0]}.pdf"`);
    
    doc.pipe(res);

    // Colorful header with company branding
    // Main header background with gradient effect
    doc.rect(50, 50, 500, 80)
       .fill('#235784'); // Blue background
    
    // Decorative elements
    doc.rect(50, 50, 500, 15)
       .fill('#F7AA00'); // Gold top stripe
    
    doc.rect(50, 115, 500, 15)
       .fill('#40A8C4'); // Light blue bottom stripe
    
    // Company logo area with colorful background
    doc.rect(70, 65, 180, 40)
       .fill('#FFFFFF'); // White background for logo area
    
    doc.fillColor('#235784')
       .fontSize(28)
       .font('Helvetica-Bold')
       .text('🦒 GIRAFFE', 80, 70);
    
    doc.fillColor('#F7AA00')
       .fontSize(20)
       .font('Helvetica-Bold')
       .text('CABS', 80, 90);
    
    // Report title
    doc.fillColor('white')
       .fontSize(18)
       .font('Helvetica-Bold')
       .text('Daily Booking Report', 300, 75);
    
    doc.fontSize(12)
       .font('Helvetica')
       .text(`Date: ${today.toLocaleDateString()}`, 300, 95);
    
    doc.moveDown(3);

    // Summary with styled box
    doc.rect(50, 180, 500, 40)
       .fill('#F8F9FA'); // Light background
    
    doc.rect(50, 180, 500, 5)
       .fill('#235784'); // Blue top stripe
    
    doc.fillColor('#235784')
       .fontSize(16)
       .font('Helvetica-Bold')
       .text('📊 SUMMARY', 60, 195);
    
    doc.fillColor('#333333')
       .fontSize(14)
       .font('Helvetica-Bold')
       .text(`Total Bookings: ${bookings.length}`, 60, 210);
    
    doc.moveDown(2);

    // Bookings Details
    if (bookings.length > 0) {
      doc.fillColor('#235784')
         .fontSize(16)
         .font('Helvetica-Bold')
         .text('📋 BOOKING DETAILS', 50, 250);
      
      doc.moveDown(1);

      let yPosition = 280;
      bookings.forEach((booking, index) => {
        if (yPosition > 700) {
          doc.addPage();
          yPosition = 50;
        }
        
        // Booking card background
        doc.rect(50, yPosition, 500, 80)
           .fill('#F8F9FA');
        
        doc.rect(50, yPosition, 500, 3)
           .fill('#F7AA00');
        
        doc.fillColor('#235784')
           .fontSize(12)
           .font('Helvetica-Bold')
           .text(`${index + 1}. ${booking.user.firstName} ${booking.user.lastName}`, 60, yPosition + 10);
        
        doc.fillColor('#333333')
           .fontSize(10)
           .font('Helvetica')
           .text(`📧 Email: ${booking.user.email}`, 60, yPosition + 25)
           .text(`📞 Phone: ${booking.user.phone}`, 60, yPosition + 40)
           .text(`📍 Pickup: ${booking.pickupLocation}`, 60, yPosition + 55)
           .text(`🎯 Dropoff: ${booking.dropoffLocation}`, 300, yPosition + 25)
           .text(`📅 Date: ${new Date(booking.pickupDate).toLocaleDateString()}`, 300, yPosition + 40)
           .text(`⏰ Time: ${booking.pickupTime}`, 300, yPosition + 55);
        
        // Status badge
        const statusColor = booking.status === 'completed' ? '#28A745' : 
                           booking.status === 'pending' ? '#FFC107' : '#DC3545';
        doc.rect(450, yPosition + 10, 80, 20)
           .fill(statusColor);
        
        doc.fillColor('white')
           .fontSize(9)
           .font('Helvetica-Bold')
           .text(booking.status.toUpperCase(), 470, yPosition + 18);
        
        yPosition += 90;
      });
    } else {
      doc.fillColor('#666666')
         .fontSize(14)
         .font('Helvetica')
         .text('No bookings found for today.', 50, 250);
    }

    // Professional footer
    doc.rect(50, doc.page.height - 60, 500, 50)
       .fill('#F8F9FA');
    
    doc.rect(50, doc.page.height - 60, 500, 5)
       .fill('#F7AA00');
    
    doc.fillColor('#235784')
       .fontSize(12)
       .font('Helvetica-Bold')
       .text('🦒 Giraffe Cabs - Your Trusted Travel Partner', 300, doc.page.height - 45, { align: 'center' });
    
    doc.fillColor('#666666')
       .fontSize(10)
       .font('Helvetica')
       .text('Generated on: ' + new Date().toLocaleDateString(), 300, doc.page.height - 30, { align: 'center' })
       .text('📧 info@giraffecabs.lk | 📞 +94 11 234 5678', 300, doc.page.height - 20, { align: 'center' });

    doc.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Generate Monthly Booking Report (Excel-like CSV)
const generateMonthlyBookingReport = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const bookings = await Booking.find({
      createdAt: { $gte: startOfMonth, $lte: endOfMonth }
    }).populate('user', 'firstName lastName email phone');

    let csvContent = 'Customer Name,Email,Phone,Pickup Location,Dropoff Location,Pickup Date,Pickup Time,Passengers,Status,Created At\n';
    
    bookings.forEach(booking => {
      csvContent += `"${booking.user.firstName} ${booking.user.lastName}","${booking.user.email}","${booking.user.phone}","${booking.pickupLocation}","${booking.dropoffLocation}","${new Date(booking.pickupDate).toLocaleDateString()}","${booking.pickupTime}","${booking.passengers}","${booking.status}","${new Date(booking.createdAt).toLocaleString()}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="Monthly_Bookings_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}.csv"`);
    res.send(csvContent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Generate Booking Analytics Report (CSV)
const generateBookingAnalyticsReport = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const bookings = await Booking.find().populate('user', 'firstName lastName email phone');
    
    // Calculate analytics
    const totalBookings = bookings.length;
    const statusCounts = bookings.reduce((acc, booking) => {
      acc[booking.status] = (acc[booking.status] || 0) + 1;
      return acc;
    }, {});

    let csvContent = 'Metric,Value\n';
    csvContent += `Total Bookings,${totalBookings}\n`;
    csvContent += `Pending Bookings,${statusCounts.pending || 0}\n`;
    csvContent += `Confirmed Bookings,${statusCounts.confirmed || 0}\n`;
    csvContent += `Completed Bookings,${statusCounts.completed || 0}\n`;
    csvContent += `Cancelled Bookings,${statusCounts.cancelled || 0}\n`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="Booking_Analytics_${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvContent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Generate Revenue Report (PDF)
const generateRevenueReport = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const bookings = await Booking.find({ status: 'completed' }).populate('user', 'firstName lastName email phone');
    
    const totalRevenue = bookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);

    const doc = new PDFDocument({ margin: 50 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Revenue_Report_${new Date().toISOString().split('T')[0]}.pdf"`);
    
    doc.pipe(res);

    // Header
    doc.fontSize(20).text('Revenue Report', { align: 'center' });
    doc.fontSize(12).text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(2);

    // Summary
    doc.fontSize(16).text('Revenue Summary', { underline: true });
    doc.fontSize(14).text(`Total Revenue: LKR ${totalRevenue.toLocaleString()}`);
    doc.fontSize(12).text(`Completed Bookings: ${bookings.length}`);
    doc.moveDown(2);

    // Revenue Details
    if (bookings.length > 0) {
      doc.fontSize(14).text('Revenue Details', { underline: true });
      doc.moveDown(0.5);

      bookings.forEach((booking, index) => {
        doc.fontSize(10)
          .text(`${index + 1}. ${booking.user.firstName} ${booking.user.lastName}`)
          .text(`   Amount: LKR ${(booking.totalAmount || 0).toLocaleString()}`)
          .text(`   Date: ${new Date(booking.pickupDate).toLocaleDateString()}`)
          .moveDown(0.5);
      });
    }

    doc.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Generate Customer Report (CSV)
const generateCustomerReport = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const bookings = await Booking.find().populate('user', 'firstName lastName email phone');
    
    // Group by customer
    const customerBookings = bookings.reduce((acc, booking) => {
      const customerId = booking.user._id.toString();
      if (!acc[customerId]) {
        acc[customerId] = {
          customer: booking.user,
          bookings: [],
          totalBookings: 0,
          totalSpent: 0
        };
      }
      acc[customerId].bookings.push(booking);
      acc[customerId].totalBookings++;
      acc[customerId].totalSpent += booking.totalAmount || 0;
      return acc;
    }, {});

    let csvContent = 'Customer Name,Email,Phone,Total Bookings,Total Spent,Last Booking Date\n';
    
    Object.values(customerBookings).forEach(customerData => {
      const lastBooking = customerData.bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
      csvContent += `"${customerData.customer.firstName} ${customerData.customer.lastName}","${customerData.customer.email}","${customerData.customer.phone}","${customerData.totalBookings}","LKR ${customerData.totalSpent.toLocaleString()}","${new Date(lastBooking.createdAt).toLocaleDateString()}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="Customer_Bookings_${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvContent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Generate Vehicle Utilization Report (Excel-like CSV)
const generateVehicleUtilizationReport = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const bookings = await Booking.find().populate('user', 'firstName lastName email phone');
    
    // Group by vehicle (assuming vehicle info is in booking)
    const vehicleUtilization = bookings.reduce((acc, booking) => {
      const vehicleId = booking.vehicleType || 'Unknown';
      if (!acc[vehicleId]) {
        acc[vehicleId] = {
          vehicleType: vehicleId,
          totalBookings: 0,
          totalRevenue: 0,
          completedBookings: 0
        };
      }
      acc[vehicleId].totalBookings++;
      acc[vehicleId].totalRevenue += booking.totalAmount || 0;
      if (booking.status === 'completed') {
        acc[vehicleId].completedBookings++;
      }
      return acc;
    }, {});

    let csvContent = 'Vehicle Type,Total Bookings,Completed Bookings,Total Revenue,Utilization Rate\n';
    
    Object.values(vehicleUtilization).forEach(vehicle => {
      const utilizationRate = vehicle.totalBookings > 0 ? ((vehicle.completedBookings / vehicle.totalBookings) * 100).toFixed(2) : 0;
      csvContent += `"${vehicle.vehicleType}","${vehicle.totalBookings}","${vehicle.completedBookings}","LKR ${vehicle.totalRevenue.toLocaleString()}","${utilizationRate}%"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="Vehicle_Utilization_${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvContent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Generate Booking Invoice PDF
const generateBookingInvoice = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'firstName lastName email phone address');
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user can access this booking
    if (req.user.role !== 'admin' && booking.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const doc = new PDFDocument({ 
      margin: 50,
      size: 'A4',
      layout: 'portrait'
    });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Giraffe_Cabs_Invoice_${booking._id}.pdf"`);
    
    doc.pipe(res);

    // Simple header with company branding
    doc.fillColor('#235784')
       .fontSize(24)
       .font('Helvetica-Bold')
       .text('🦒 Giraffe Cabs', 50, 50);
    
    doc.fillColor('#666666')
       .fontSize(12)
       .font('Helvetica')
       .text('Your Trusted Travel Partner', 50, 75);
    
    // Simple invoice title
    doc.fillColor('#333333')
       .fontSize(20)
       .font('Helvetica-Bold')
       .text('BOOKING INVOICE', 400, 50);
    
    // Simple invoice details
    doc.fillColor('#333333')
       .fontSize(12)
       .font('Helvetica')
       .text(`Invoice #: ${booking._id}`, 50, 100)
       .text(`Date: ${new Date(booking.createdAt).toLocaleDateString()}`, 50, 115)
       .text(`Status: ${booking.status.toUpperCase()}`, 400, 100);
    
    doc.moveDown(2);

    // Simple customer information
    doc.fillColor('#235784')
       .fontSize(14)
       .font('Helvetica-Bold')
       .text('Customer Information', 50, 150);
    
    doc.fillColor('#333333')
       .fontSize(12)
       .font('Helvetica')
       .text(`Name: ${booking.user.firstName} ${booking.user.lastName}`, 50, 170)
       .text(`Email: ${booking.user.email}`, 50, 185)
       .text(`Phone: ${booking.user.phone}`, 50, 200);
    
    if (booking.user.address) {
      doc.text(`Address: ${booking.user.address}`, 50, 215);
    }
    
    // Simple booking details
    doc.fillColor('#235784')
       .fontSize(14)
       .font('Helvetica-Bold')
       .text('Booking Details', 50, 240);
    
    doc.fillColor('#333333')
       .fontSize(12)
       .font('Helvetica')
       .text(`Service Type: ${booking.serviceType.charAt(0).toUpperCase() + booking.serviceType.slice(1)}`, 50, 260)
       .text(`Pickup Location: ${booking.pickupLocation}`, 50, 275)
       .text(`Dropoff Location: ${booking.dropoffLocation}`, 50, 290)
       .text(`Pickup Date: ${new Date(booking.pickupDate).toLocaleDateString()}`, 50, 305)
       .text(`Pickup Time: ${booking.pickupTime}`, 50, 320);
    
    if (booking.passengers) {
      doc.text(`Passengers: ${booking.passengers}`, 50, 335);
    }
    
    if (booking.returnDate) {
      doc.text(`Return Date: ${new Date(booking.returnDate).toLocaleDateString()}`, 50, 350);
    }
    
    if (booking.returnTime) {
      doc.text(`Return Time: ${booking.returnTime}`, 50, 365);
    }
    
    if (booking.distance > 0) {
      doc.text(`Distance: ${booking.distance} km`, 50, 380);
    }
    
    // Simple service details
    if (booking.serviceDetails && Object.keys(booking.serviceDetails).length > 0) {
      doc.fillColor('#235784')
         .fontSize(14)
         .font('Helvetica-Bold')
         .text('Service Details', 50, 400);
      
      doc.fillColor('#333333')
         .fontSize(12)
         .font('Helvetica');
      
      let detailY = 420;
      Object.entries(booking.serviceDetails).forEach(([key, value]) => {
        if (value) {
          doc.text(`${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`, 50, detailY);
          detailY += 15;
        }
      });
    }
    
    if (booking.additionalNotes) {
      doc.text(`Additional Notes: ${booking.additionalNotes}`, 50, 500);
    }
    
    // Simple pricing
    doc.fillColor('#235784')
       .fontSize(16)
       .font('Helvetica-Bold')
       .text('Total Amount', 50, 550);
    
    doc.fillColor('#333333')
       .fontSize(18)
       .font('Helvetica-Bold')
       .text(`LKR ${booking.totalPrice.toLocaleString()}`, 50, 570);

    // Simple footer
    doc.fillColor('#666666')
       .fontSize(10)
       .font('Helvetica')
       .text('Thank you for choosing Giraffe Cabs!', 50, 600)
       .text('Generated on: ' + new Date().toLocaleDateString(), 50, 615);

    doc.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllBookings,
  getUserBookings,
  getBookingById,
  createBooking,
  updateBookingStatus,
  updateBookingPricing,
  updateUserBooking,
  deleteUserBooking,
  deleteBooking,
  getBookingStats,
  generateDailyBookingReport,
  generateMonthlyBookingReport,
  generateBookingAnalyticsReport,
  generateRevenueReport,
  generateCustomerReport,
  generateVehicleUtilizationReport,
  generateBookingInvoice
};