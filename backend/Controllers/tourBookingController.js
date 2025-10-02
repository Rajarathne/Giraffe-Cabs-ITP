const TourBooking = require('../Models/TourBooking');
const TourPackage = require('../Models/TourPackage');
const PDFDocument = require('pdfkit');

// ✅ Create a booking
const createTourBooking = async (req, res) => {
  try {
    const { tourPackageId, bookingDate, numberOfPassengers, passengers, contactPerson, paymentMethod, specialRequests } = req.body;

    const pkg = await TourPackage.findById(tourPackageId);
    if (!pkg) return res.status(404).json({ message: 'Package not found' });

    // Calculate base price
    const basePrice = numberOfPassengers * pkg.pricePerPerson * pkg.tourDays;
    const totalPrice = basePrice; // Admin can adjust this later

    const newBooking = new TourBooking({
      user: req.user._id,
      tourPackage: tourPackageId,
      bookingDate: new Date(bookingDate),
      numberOfPassengers,
      passengers: passengers.slice(0, numberOfPassengers),
      contactPerson,
      pricing: {
        basePrice,
        totalPrice,
        finalPrice: totalPrice,
        isPriceConfirmed: false
      },
      payment: {
        method: paymentMethod,
        status: 'pending'
      },
      status: 'pending',
      specialRequests
    });

    const saved = await newBooking.save();
    await saved.populate('tourPackage');
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ✅ Get all bookings
const getAllTourBookings = async (req, res) => {
  try {
    const bookings = await TourBooking.find().populate('tourPackage user');
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get bookings for one user
const getUserTourBookings = async (req, res) => {
  try {
    const bookings = await TourBooking.find({ user: req.user._id }).populate('tourPackage');
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get booking by ID
const getTourBookingById = async (req, res) => {
  try {
    const booking = await TourBooking.findById(req.params.id).populate('tourPackage user');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    
    // Check if user can access this booking (either the user who made it or admin)
    if (req.user.role !== 'admin' && booking.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Update booking status
const updateTourBookingStatus = async (req, res) => {
  try {
    const { status, adminNotes, finalPrice } = req.body;
    
    const updateData = { status };
    
    if (adminNotes) {
      updateData.adminNotes = adminNotes;
    }
    
    if (finalPrice !== undefined) {
      updateData['pricing.finalPrice'] = finalPrice;
      updateData['pricing.isPriceConfirmed'] = true;
    }
    
    // Add admin action
    updateData.$push = {
      adminActions: {
        action: status === 'confirmed' ? 'confirmed' : status === 'rejected' ? 'rejected' : 'status_updated',
        note: adminNotes || `Status updated to ${status}`,
        adminId: req.user._id
      }
    };
    
    const updated = await TourBooking.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('tourPackage user');
    
    if (!updated) return res.status(404).json({ message: 'Booking not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ✅ Generate booking invoice (PDF stream) - Fixed version
const generateTourBookingInvoice = async (req, res) => {
  try {
    const booking = await TourBooking.findById(req.params.id).populate('tourPackage user');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

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
    res.setHeader('Content-Disposition', `inline; filename="Giraffe_Cabs_Tour_Invoice_${booking._id}.pdf"`);
    
    doc.pipe(res);
    
    // Colorful header with company branding
    // Main header background with gradient effect
    doc.rect(50, 50, 500, 100)
       .fill('#235784'); // Blue background
    
    // Decorative elements
    doc.rect(50, 50, 500, 20)
       .fill('#F7AA00'); // Gold top stripe
    
    doc.rect(50, 130, 500, 20)
       .fill('#40A8C4'); // Light blue bottom stripe
    
    // Company logo area with colorful background
    doc.rect(70, 70, 200, 50)
       .fill('#FFFFFF'); // White background for logo area
    
    doc.fillColor('#235784')
       .fontSize(32)
       .font('Helvetica-Bold')
       .text('🦒 GIRAFFE', 80, 75);
    
    doc.fillColor('#F7AA00')
       .fontSize(24)
       .font('Helvetica-Bold')
       .text('CABS', 80, 100);
    
    // Company tagline with colorful styling
    doc.fillColor('white')
       .fontSize(14)
       .font('Helvetica')
       .text('Tour & Travel Services', 300, 85);
    
    doc.fontSize(12)
       .text('Your Trusted Travel Partner', 300, 105);
    
    // Invoice title with colorful background
    doc.rect(400, 70, 140, 50)
       .fill('#F7AA00'); // Gold background
    
    doc.fillColor('#235784')
       .fontSize(14)
       .font('Helvetica-Bold')
       .text('TOUR BOOKING', 420, 85);
    
    doc.fontSize(14)
       .text('INVOICE', 420, 105);
    
    // Invoice Details with colorful styling
    doc.rect(50, 160, 500, 30)
       .fill('#F8F9FA'); // Light gray background
    
    doc.fillColor('#235784')
       .fontSize(12)
       .font('Helvetica-Bold')
       .text('INVOICE DETAILS', 60, 170);
    
    doc.fillColor('#333333')
       .fontSize(10)
       .font('Helvetica')
       .text(`Invoice #: ${booking._id}`, 60, 185)
       .text(`Date: ${booking.createdAt.toLocaleDateString()}`, 60, 200)
       .text(`Status: ${booking.status.toUpperCase()}`, 60, 215);
    
    // Status badge with color
    const statusColor = booking.status === 'confirmed' ? '#28A745' : 
                       booking.status === 'pending' ? '#FFC107' : '#DC3545';
    doc.rect(400, 185, 100, 20)
       .fill(statusColor);
    
    doc.fillColor('white')
       .fontSize(10)
       .font('Helvetica-Bold')
       .text(booking.status.toUpperCase(), 430, 195);
    
    // Customer Information with colorful styled box
    doc.rect(50, 230, 240, 30)
       .fill('#F7AA00'); // Gold background
    
    doc.rect(50, 230, 240, 5)
       .fill('#235784'); // Blue top stripe
    
    doc.fillColor('white')
       .fontSize(14)
       .font('Helvetica-Bold')
       .text('👤 CUSTOMER INFORMATION', 60, 245);
    
    doc.rect(50, 260, 240, 80)
       .fill('#F8F9FA'); // Light background
    
    doc.fillColor('#235784')
       .fontSize(11)
       .font('Helvetica-Bold')
       .text(`Name: ${booking.contactPerson.name}`, 60, 280)
       .text(`Email: ${booking.contactPerson.email}`, 60, 300)
       .text(`Phone: ${booking.contactPerson.phone}`, 60, 320);
    
    // Tour Package Details with colorful styled box
    doc.rect(310, 230, 240, 30)
       .fill('#40A8C4'); // Light blue background
    
    doc.rect(310, 230, 240, 5)
       .fill('#235784'); // Blue top stripe
    
    doc.fillColor('white')
       .fontSize(14)
       .font('Helvetica-Bold')
       .text('🗺️ TOUR PACKAGE DETAILS', 320, 245);
    
    doc.rect(310, 260, 240, 80)
       .fill('#E3F2FD'); // Very light blue background
    
    doc.fillColor('#235784')
       .fontSize(11)
       .font('Helvetica-Bold')
       .text(`Package: ${booking.tourPackage.packageName}`, 320, 280)
       .text(`Destination: ${booking.tourPackage.destination}`, 320, 300)
       .text(`Duration: ${booking.tourPackage.tourDays} days`, 320, 320)
       .text(`Booking Date: ${booking.bookingDate.toLocaleDateString()}`, 320, 340)
       .text(`Passengers: ${booking.numberOfPassengers}`, 320, 360);
    
    // Pricing with colorful styled box
    doc.rect(50, 360, 500, 50)
       .fill('#235784'); // Blue background
    
    doc.rect(50, 360, 500, 8)
       .fill('#F7AA00'); // Gold top stripe
    
    doc.fillColor('white')
       .fontSize(18)
       .font('Helvetica-Bold')
       .text('💰 PRICING DETAILS', 60, 380);
    
    doc.rect(50, 410, 500, 60)
       .fill('#F8F9FA'); // Light background
    
    doc.fillColor('#235784')
       .fontSize(12)
       .font('Helvetica-Bold')
       .text(`Base Price: LKR ${(booking.pricing?.basePrice || booking.numberOfPassengers * booking.tourPackage.pricePerPerson * booking.tourPackage.tourDays).toLocaleString()}`, 60, 430);
    
    if (booking.pricing?.discountApplied > 0) {
      doc.text(`Discount: -LKR ${(booking.pricing?.discountApplied || 0).toLocaleString()}`, 60, 450);
    }
    
    doc.rect(400, 420, 140, 30)
       .fill('#F7AA00'); // Gold background for final price
    
    doc.fillColor('#235784')
       .fontSize(16)
       .font('Helvetica-Bold')
       .text(`Final Price: LKR ${(booking.pricing?.finalPrice || booking.pricing?.totalPrice || booking.numberOfPassengers * booking.tourPackage.pricePerPerson * booking.tourPackage.tourDays).toLocaleString()}`, 420, 435);
    
    doc.pipe(res);
    doc.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Download booking invoice (PDF file)
const downloadTourBookingInvoice = async (req, res) => {
  try {
    const booking = await TourBooking.findById(req.params.id).populate('tourPackage user');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // Check if user can access this booking
    if (req.user.role !== 'admin' && booking.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const doc = new PDFDocument({ 
      margin: 50,
      size: 'A4',
      layout: 'portrait'
    });
    const fileName = `Giraffe_Cabs_Tour_Invoice_${booking._id}.pdf`;
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    res.setHeader('Content-Type', 'application/pdf');

    // Same colorful styled content as generateTourBookingInvoice but with attachment disposition
    // Colorful header with company branding
    // Main header background with gradient effect
    doc.rect(50, 50, 500, 100)
       .fill('#235784'); // Blue background
    
    // Decorative elements
    doc.rect(50, 50, 500, 20)
       .fill('#F7AA00'); // Gold top stripe
    
    doc.rect(50, 130, 500, 20)
       .fill('#40A8C4'); // Light blue bottom stripe
    
    // Company logo area with colorful background
    doc.rect(70, 70, 200, 50)
       .fill('#FFFFFF'); // White background for logo area
    
    doc.fillColor('#235784')
       .fontSize(32)
       .font('Helvetica-Bold')
       .text('🦒 GIRAFFE', 80, 75);
    
    doc.fillColor('#F7AA00')
       .fontSize(24)
       .font('Helvetica-Bold')
       .text('CABS', 80, 100);
    
    // Company tagline with colorful styling
    doc.fillColor('white')
       .fontSize(14)
       .font('Helvetica')
       .text('Tour & Travel Services', 300, 85);
    
    doc.fontSize(12)
       .text('Your Trusted Travel Partner', 300, 105);
    
    // Invoice title with colorful background
    doc.rect(400, 70, 140, 50)
       .fill('#F7AA00'); // Gold background
    
    doc.fillColor('#235784')
       .fontSize(14)
       .font('Helvetica-Bold')
       .text('TOUR BOOKING', 420, 85);
    
    doc.fontSize(14)
       .text('INVOICE', 420, 105);
    
    // Invoice Details with colorful styling
    doc.rect(50, 160, 500, 30)
       .fill('#F8F9FA'); // Light gray background
    
    doc.fillColor('#235784')
       .fontSize(12)
       .font('Helvetica-Bold')
       .text('INVOICE DETAILS', 60, 170);
    
    doc.fillColor('#333333')
       .fontSize(10)
       .font('Helvetica')
       .text(`Invoice #: ${booking._id}`, 60, 185)
       .text(`Date: ${booking.createdAt.toLocaleDateString()}`, 60, 200)
       .text(`Status: ${booking.status.toUpperCase()}`, 60, 215);
    
    // Status badge with color
    const statusColor = booking.status === 'confirmed' ? '#28A745' : 
                       booking.status === 'pending' ? '#FFC107' : '#DC3545';
    doc.rect(400, 185, 100, 20)
       .fill(statusColor);
    
    doc.fillColor('white')
       .fontSize(10)
       .font('Helvetica-Bold')
       .text(booking.status.toUpperCase(), 430, 195);
    
    // Customer Information with colorful styled box
    doc.rect(50, 230, 240, 30)
       .fill('#F7AA00'); // Gold background
    
    doc.rect(50, 230, 240, 5)
       .fill('#235784'); // Blue top stripe
    
    doc.fillColor('white')
       .fontSize(14)
       .font('Helvetica-Bold')
       .text('👤 CUSTOMER INFORMATION', 60, 245);
    
    doc.rect(50, 260, 240, 80)
       .fill('#F8F9FA'); // Light background
    
    doc.fillColor('#235784')
       .fontSize(11)
       .font('Helvetica-Bold')
       .text(`Name: ${booking.contactPerson.name}`, 60, 280)
       .text(`Email: ${booking.contactPerson.email}`, 60, 300)
       .text(`Phone: ${booking.contactPerson.phone}`, 60, 320);
    
    // Tour Package Details with colorful styled box
    doc.rect(310, 230, 240, 30)
       .fill('#40A8C4'); // Light blue background
    
    doc.rect(310, 230, 240, 5)
       .fill('#235784'); // Blue top stripe
    
    doc.fillColor('white')
       .fontSize(14)
       .font('Helvetica-Bold')
       .text('🗺️ TOUR PACKAGE DETAILS', 320, 245);
    
    doc.rect(310, 260, 240, 80)
       .fill('#E3F2FD'); // Very light blue background
    
    doc.fillColor('#235784')
       .fontSize(11)
       .font('Helvetica-Bold')
       .text(`Package: ${booking.tourPackage.packageName}`, 320, 280)
       .text(`Destination: ${booking.tourPackage.destination}`, 320, 300)
       .text(`Duration: ${booking.tourPackage.tourDays} days`, 320, 320)
       .text(`Booking Date: ${booking.bookingDate.toLocaleDateString()}`, 320, 340)
       .text(`Passengers: ${booking.numberOfPassengers}`, 320, 360);
    
    // Pricing with colorful styled box
    doc.rect(50, 360, 500, 50)
       .fill('#235784'); // Blue background
    
    doc.rect(50, 360, 500, 8)
       .fill('#F7AA00'); // Gold top stripe
    
    doc.fillColor('white')
       .fontSize(18)
       .font('Helvetica-Bold')
       .text('💰 PRICING DETAILS', 60, 380);
    
    doc.rect(50, 410, 500, 60)
       .fill('#F8F9FA'); // Light background
    
    doc.fillColor('#235784')
       .fontSize(12)
       .font('Helvetica-Bold')
       .text(`Base Price: LKR ${(booking.pricing?.basePrice || booking.numberOfPassengers * booking.tourPackage.pricePerPerson * booking.tourPackage.tourDays).toLocaleString()}`, 60, 430);
    
    if (booking.pricing?.discountApplied > 0) {
      doc.text(`Discount: -LKR ${(booking.pricing?.discountApplied || 0).toLocaleString()}`, 60, 450);
    }
    
    doc.rect(400, 420, 140, 30)
       .fill('#F7AA00'); // Gold background for final price
    
    doc.fillColor('#235784')
       .fontSize(16)
       .font('Helvetica-Bold')
       .text(`Final Price: LKR ${(booking.pricing?.finalPrice || booking.pricing?.totalPrice || booking.numberOfPassengers * booking.tourPackage.pricePerPerson * booking.tourPackage.tourDays).toLocaleString()}`, 420, 435);
    
    doc.pipe(res);
    doc.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Booking statistics
const getTourBookingStats = async (req, res) => {
  try {
    const totalBookings = await TourBooking.countDocuments();
    const pending = await TourBooking.countDocuments({ status: 'pending' });
    const confirmed = await TourBooking.countDocuments({ status: 'confirmed' });
    const cancelled = await TourBooking.countDocuments({ status: 'cancelled' });

    res.json({ totalBookings, pending, confirmed, cancelled });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createTourBooking,
  getAllTourBookings,
  getUserTourBookings,
  getTourBookingById,
  updateTourBookingStatus,
  generateTourBookingInvoice,
  downloadTourBookingInvoice,
  getTourBookingStats
};








