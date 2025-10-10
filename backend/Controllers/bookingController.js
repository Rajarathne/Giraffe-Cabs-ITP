const Booking = require('../Models/Booking');
const User = require('../Models/User');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { sendBookingConfirmationEmail } = require('../utils/emailService');
const Notification = require('../Models/Notification');

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
    // Validate passengers >= 1
    const passengersNum = Number(req.body?.passengers);
    if (!Number.isFinite(passengersNum) || passengersNum < 1) {
      return res.status(400).json({ message: 'Passengers must be at least 1' });
    }

    const bookingData = {
      ...req.body,
      user: req.user._id,
      // Set default payment status based on payment method
      paymentStatus: req.body.paymentMethod === 'cash' ? 'pending' : 'pending'
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
    // Notify user on confirmation
    if (status === 'confirmed' && updatedBooking.user?.email) {
      try {
        await sendBookingConfirmationEmail({
          toEmail: updatedBooking.user.email,
          userName: `${updatedBooking.user.firstName} ${updatedBooking.user.lastName}`.trim(),
          bookingId: updatedBooking._id,
          serviceType: updatedBooking.serviceType,
          pickupLocation: updatedBooking.pickupLocation,
          dropoffLocation: updatedBooking.dropoffLocation,
          pickupDate: new Date(updatedBooking.pickupDate).toLocaleDateString(),
          pickupTime: updatedBooking.pickupTime,
          totalPrice: updatedBooking.totalPrice
        });
        // Create in-app notification
        await Notification.create({
          user: updatedBooking.user._id,
          type: 'booking',
          title: 'Booking Confirmed',
          message: `Your ${updatedBooking.serviceType} ride on ${new Date(updatedBooking.pickupDate).toLocaleDateString()} at ${updatedBooking.pickupTime} is confirmed.`,
          data: { bookingId: updatedBooking._id }
        });
      } catch (notifyErr) {
        console.error('Failed to send confirmation email:', notifyErr);
      }
    }

    res.json(updatedBooking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Booking Pricing (Admin only)
const updateBookingPricing = async (req, res) => {
  try {
    console.log('=== PRICING UPDATE REQUEST ===');
    console.log('Request URL:', req.url);
    console.log('Request Method:', req.method);
    console.log('Request Params:', req.params);
    console.log('Request Body:', req.body);
    console.log('User:', req.user);
    console.log('================================');
    
    if (req.user.role !== 'admin') {
      console.log('Access denied - user role:', req.user?.role);
      return res.status(403).json({ message: 'Access denied' });
    }

    const { adminCalculatedDistance, pricePerKm, adminSetPrice, isPriceConfirmed, weddingDays } = req.body;
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Handle wedding service pricing
    if (booking.serviceType === 'wedding' && weddingDays !== undefined) {
      booking.serviceDetails = {
        ...booking.serviceDetails,
        days: weddingDays
      };
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
    
  // Validate passengers if provided
  if (req.body.hasOwnProperty('passengers')) {
    const passengersNum = Number(req.body.passengers);
    if (!Number.isFinite(passengersNum) || passengersNum < 1) {
      return res.status(400).json({ message: 'Passengers must be at least 1' });
    }
  }

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

// Update Booking (Admin only - edit core fields)
const updateBookingByAdmin = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const editableFields = [
      'pickupLocation',
      'dropoffLocation',
      'pickupDate',
      'pickupTime',
      'returnDate',
      'returnTime',
      'passengers',
      'additionalNotes',
      'paymentStatus',
      'paymentMethod',
      'serviceDetails'
    ];

    editableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
      // Validate passengers if admin attempts to set it
      if (field === 'passengers') {
        const passengersNum = Number(req.body.passengers);
        if (!Number.isFinite(passengersNum) || passengersNum < 1) {
          return res.status(400).json({ message: 'Passengers must be at least 1' });
        }
      }
        booking[field] = req.body[field];
      }
    });

    booking.updatedAt = new Date();
    const updated = await booking.save();
    await updated.populate('user', 'firstName lastName email phone');
    res.json(updated);
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

// Get bookings happening tomorrow (admin reminder)
const getUpcomingBookings = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const tomorrowStart = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowEnd = new Date(tomorrowStart.getTime() + 24 * 60 * 60 * 1000 - 1);

    const bookings = await Booking.find({
      pickupDate: { $gte: tomorrowStart, $lte: tomorrowEnd },
      status: { $in: ['pending', 'confirmed'] }
    })
      .populate('user', 'firstName lastName email phone')
      .lean();

    res.json({ date: tomorrowStart.toISOString().split('T')[0], count: bookings.length, bookings });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch upcoming bookings', error: error.message });
  }
};

// Get bookings happening today (admin reminder)
const getTodayBookings = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000 - 1);

    const bookings = await Booking.find({
      pickupDate: { $gte: todayStart, $lte: todayEnd },
      status: { $in: ['pending', 'confirmed'] }
    })
      .populate('user', 'firstName lastName email phone')
      .lean();

    res.json({ date: todayStart.toISOString().split('T')[0], count: bookings.length, bookings });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch today\'s bookings', error: error.message });
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
      margin: 30,
      size: 'A4',
      layout: 'portrait'
    });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Giraffe_Cabs_Invoice_${booking._id}.pdf"`);
    
    doc.pipe(res);

    // ===== ATTRACTIVE HEADER DESIGN =====
    
    // Main header background with gradient effect
    doc.rect(30, 30, 540, 100)
       .fill('#235784'); // Blue background
    
    // Decorative top stripe
    doc.rect(30, 30, 540, 12)
       .fill('#F7AA00'); // Gold stripe
    
    // Decorative bottom stripe
    doc.rect(30, 118, 540, 12)
       .fill('#40A8C4'); // Light blue stripe
    
    // Company logo area with white background
    doc.rect(50, 50, 200, 60)
       .fill('#FFFFFF'); // White background for logo area
    
    // Company logo text with attractive styling
    doc.fillColor('#235784')
       .fontSize(28)
       .font('Helvetica-Bold')
       .text('GIRAFFE', 60, 55);
    
    doc.fillColor('#F7AA00')
       .fontSize(20)
       .font('Helvetica-Bold')
       .text('CABS', 60, 75);
    
    // Company tagline
    doc.fillColor('#235784')
       .fontSize(9)
       .font('Helvetica')
       .text('Your Trusted Travel Partner', 60, 95);
    
    // Invoice title with attractive styling
    doc.rect(400, 50, 160, 60)
       .fill('#F7AA00'); // Gold background
    
    doc.fillColor('#235784')
       .fontSize(16)
       .font('Helvetica-Bold')
       .text('BOOKING', 420, 65)
       .text('INVOICE', 420, 80);
    
    doc.fillColor('#235784')
       .fontSize(9)
       .font('Helvetica')
       .text(`#${booking._id.toString().slice(-8)}`, 420, 95);
    
    // Invoice details section
    doc.fillColor('#235784')
       .fontSize(14)
       .font('Helvetica-Bold')
       .text('Invoice Details', 30, 150);
    
    // Invoice details table
    doc.fillColor('#333333')
       .fontSize(11)
       .font('Helvetica');
    
    const invoiceDetails = [
      ['Invoice Number:', `GC-${booking._id.toString().slice(-8)}`],
      ['Issue Date:', new Date(booking.createdAt).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })],
      ['Booking Status:', booking.status.toUpperCase()],
      ['Payment Method:', booking.paymentMethod ? booking.paymentMethod.toUpperCase() : 'CASH']
    ];
    
    let detailY = 170;
    invoiceDetails.forEach(([label, value]) => {
      doc.fillColor('#666666')
         .text(label, 30, detailY);
      doc.fillColor('#235784')
         .text(value, 150, detailY);
      detailY += 15;
    });

    // ===== CUSTOMER INFORMATION SECTION =====
    
    doc.fillColor('#235784')
       .fontSize(16)
       .font('Helvetica-Bold')
       .text('Customer Information', 30, 250);
    
    // Customer info background
    doc.rect(30, 270, 540, 70)
       .fill('#f8f9fa'); // Light gray background
    
    doc.fillColor('#333333')
       .fontSize(12)
       .font('Helvetica-Bold')
       .text(`${booking.user.firstName} ${booking.user.lastName}`, 50, 290);
    
    doc.fillColor('#666666')
       .fontSize(11)
       .font('Helvetica')
       .text(`Email: ${booking.user.email}`, 50, 310)
       .text(`Phone: ${booking.user.phone}`, 50, 325);
    
    if (booking.user.address) {
      doc.text(`Address: ${booking.user.address}`, 50, 340);
    }

    // ===== BOOKING DETAILS SECTION =====
    
    doc.fillColor('#235784')
       .fontSize(16)
       .font('Helvetica-Bold')
       .text('Booking Details', 30, 360);
    
    // Booking details background
    doc.rect(30, 380, 540, 100)
       .fill('#ffffff'); // White background
    
    // Booking details table
    const bookingDetails = [
      ['Service Type:', booking.serviceType.charAt(0).toUpperCase() + booking.serviceType.slice(1)],
      ['Pickup Location:', booking.pickupLocation],
      ['Dropoff Location:', booking.dropoffLocation],
      ['Pickup Date:', new Date(booking.pickupDate).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })],
      ['Pickup Time:', booking.pickupTime]
    ];
    
    // Add optional fields
    if (booking.passengers) {
      bookingDetails.push(['Passengers:', booking.passengers]);
    }
    if (booking.returnDate) {
      bookingDetails.push(['Return Date:', new Date(booking.returnDate).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })]);
    }
    if (booking.returnTime) {
      bookingDetails.push(['Return Time:', booking.returnTime]);
    }
    if (booking.distance > 0) {
      bookingDetails.push(['Distance:', `${booking.distance} km`]);
    }
    
    let bookingY = 400;
    bookingDetails.forEach(([label, value]) => {
      doc.fillColor('#666666')
         .fontSize(11)
         .text(label, 50, bookingY);
      doc.fillColor('#235784')
         .fontSize(11)
         .font('Helvetica-Bold')
         .text(value, 200, bookingY);
      bookingY += 15;
    });

    // ===== SERVICE DETAILS SECTION =====
    
    if (booking.serviceDetails && Object.keys(booking.serviceDetails).length > 0) {
      doc.fillColor('#235784')
         .fontSize(16)
         .font('Helvetica-Bold')
         .text('Service Details', 30, bookingY + 20);
      
      doc.fillColor('#333333')
         .fontSize(11)
         .font('Helvetica');
      
      let serviceY = bookingY + 40;
      Object.entries(booking.serviceDetails).forEach(([key, value]) => {
        if (value) {
          doc.fillColor('#666666')
             .text(`${key.charAt(0).toUpperCase() + key.slice(1)}:`, 50, serviceY);
          doc.fillColor('#235784')
             .text(value, 200, serviceY);
          serviceY += 15;
        }
      });
    }
    
    if (booking.additionalNotes) {
      doc.fillColor('#235784')
         .fontSize(14)
         .font('Helvetica-Bold')
         .text('Additional Notes', 30, bookingY + 60);
      
      doc.fillColor('#333333')
         .fontSize(11)
         .font('Helvetica')
         .text(booking.additionalNotes, 50, bookingY + 80, { width: 500 });
    }

    // ===== PRICING SECTION =====
    
    // Pricing background
    doc.rect(30, 600, 540, 50)
       .fill('#235784'); // Blue background
    
    doc.fillColor('#FFFFFF')
       .fontSize(16)
       .font('Helvetica-Bold')
       .text('Total Amount', 50, 620);
    
    doc.fillColor('#F7AA00')
       .fontSize(20)
       .font('Helvetica-Bold')
       .text(`LKR ${booking.totalPrice.toLocaleString()}`, 400, 620);

    // ===== FOOTER SECTION =====
    
    doc.fillColor('#666666')
       .fontSize(10)
       .font('Helvetica')
       .text('Thank you for choosing Giraffe Cabs!', 30, 670)
       .text('For any queries, contact us at: info@giraffecabs.com', 30, 685)
       .text(`Invoice generated on: ${new Date().toLocaleDateString('en-US', { 
         year: 'numeric', 
         month: 'long', 
         day: 'numeric',
         hour: '2-digit',
         minute: '2-digit'
       })}`, 30, 700);

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
  generateBookingInvoice,
  getUpcomingBookings,
  getTodayBookings,
  updateBookingByAdmin
};