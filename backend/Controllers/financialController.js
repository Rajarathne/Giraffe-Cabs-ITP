const FinancialEntry = require('../Models/FinancialEntry');
const Booking = require('../Models/Booking');
const ServiceRecord = require('../Models/ServiceRecord');
const Payment = require('../Models/Payment');
const PDFDocument = require('pdfkit');

// Get all financial entries
const getAllFinancialEntries = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { type, category, startDate, endDate } = req.query;
    let query = {};

    if (type) query.type = type;
    if (category) query.category = category;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const entries = await FinancialEntry.find(query)
      .populate('createdBy', 'firstName lastName')
      .sort({ date: -1 });

    res.json(entries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new financial entry
const createFinancialEntry = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const financialEntry = new FinancialEntry({
      ...req.body,
      createdBy: req.user._id
    });

    const savedEntry = await financialEntry.save();
    const populatedEntry = await FinancialEntry.findById(savedEntry._id)
      .populate('createdBy', 'firstName lastName');

    res.status(201).json(populatedEntry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update financial entry
const updateFinancialEntry = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const entry = await FinancialEntry.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ message: 'Financial entry not found' });
    }

    const updatedEntry = await FinancialEntry.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('createdBy', 'firstName lastName');

    res.json(updatedEntry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete financial entry
const deleteFinancialEntry = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const entry = await FinancialEntry.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ message: 'Financial entry not found' });
    }

    await FinancialEntry.findByIdAndDelete(req.params.id);
    res.json({ message: 'Financial entry deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get financial summary
const getFinancialSummary = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get all financial entries
    const allEntries = await FinancialEntry.find();
    
    // Calculate income and expenses from financial entries
    const manualIncome = allEntries
      .filter(entry => entry.type === 'income')
      .reduce((sum, entry) => sum + entry.amount, 0);

    const manualExpenses = allEntries
      .filter(entry => entry.type === 'expense')
      .reduce((sum, entry) => sum + entry.amount, 0);

    // Get payment income (completed payments)
    const paymentIncome = await Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Get service expenses
    const serviceExpenses = await ServiceRecord.aggregate([
      { $group: { _id: null, total: { $sum: '$cost' } } }
    ]);

    // Calculate totals
    const bookingIncome = paymentIncome[0]?.total || 0;
    const serviceExpensesTotal = serviceExpenses[0]?.total || 0;
    
    const totalIncome = manualIncome + bookingIncome;
    const totalExpenses = manualExpenses + serviceExpensesTotal;
    const netProfit = totalIncome - totalExpenses;

    // Get monthly data for charts
    const monthlyIncome = await FinancialEntry.aggregate([
      { $match: { type: 'income' } },
      {
        $group: {
          _id: { $month: '$date' },
          total: { $sum: '$amount' }
        }
      }
    ]);

    const monthlyExpenses = await FinancialEntry.aggregate([
      { $match: { type: 'expense' } },
      {
        $group: {
          _id: { $month: '$date' },
          total: { $sum: '$amount' }
        }
      }
    ]);

    res.json({
      totalIncome,
      totalExpenses,
      netProfit,
      bookingIncome,
      serviceExpenses: serviceExpensesTotal,
      manualIncome,
      manualExpenses,
      monthlyIncome,
      monthlyExpenses
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Generate monthly financial report
const generateMonthlyReport = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { month, year } = req.query;
    const targetMonth = month ? parseInt(month) : new Date().getMonth() + 1;
    const targetYear = year ? parseInt(year) : new Date().getFullYear();

    // Get financial entries for the specified month
    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    const entries = await FinancialEntry.find({
      date: { $gte: startDate, $lte: endDate }
    }).populate('createdBy', 'firstName lastName').sort({ date: -1 });

    // Get booking income for the month
    const bookingIncome = await Booking.aggregate([
      { 
        $match: { 
          status: 'completed',
          createdAt: { $gte: startDate, $lte: endDate }
        } 
      },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    // Get service expenses for the month
    const serviceExpenses = await ServiceRecord.aggregate([
      { 
        $match: { 
          date: { $gte: startDate, $lte: endDate }
        } 
      },
      { $group: { _id: null, total: { $sum: '$cost' } } }
    ]);

    // Calculate totals
    const manualIncome = entries
      .filter(entry => entry.type === 'income')
      .reduce((sum, entry) => sum + entry.amount, 0);

    const manualExpenses = entries
      .filter(entry => entry.type === 'expense')
      .reduce((sum, entry) => sum + entry.amount, 0);

    const totalIncome = (bookingIncome[0]?.total || 0) + manualIncome;
    const totalExpenses = (serviceExpenses[0]?.total || 0) + manualExpenses;
    const netProfit = totalIncome - totalExpenses;

    // Generate PDF
    const doc = new PDFDocument({ margin: 50 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Monthly_Financial_Report_${targetMonth}_${targetYear}.pdf"`);
    
    doc.pipe(res);

    // Header
    doc.fontSize(24).text('Giraffe Cabs', { align: 'center' });
    doc.fontSize(16).text('Monthly Financial Report', { align: 'center' });
    doc.fontSize(12).text(`${new Date(targetYear, targetMonth - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`, { align: 'center' });
    doc.moveDown(2);

    // Summary
    doc.fontSize(14).text('Financial Summary', { underline: true });
    doc.fontSize(12)
      .text(`Total Income: LKR ${totalIncome.toLocaleString()}`, { align: 'right' })
      .text(`Total Expenses: LKR ${totalExpenses.toLocaleString()}`, { align: 'right' })
      .text(`Net Profit: LKR ${netProfit.toLocaleString()}`, { align: 'right' });
    
    doc.moveDown(2);

    // Income Breakdown
    doc.fontSize(14).text('Income Breakdown', { underline: true });
    doc.fontSize(12)
      .text(`Booking Income: LKR ${(bookingIncome[0]?.total || 0).toLocaleString()}`)
      .text(`Manual Income: LKR ${manualIncome.toLocaleString()}`);
    
    doc.moveDown(1);

    // Expense Breakdown
    doc.fontSize(14).text('Expense Breakdown', { underline: true });
    doc.fontSize(12)
      .text(`Service Expenses: LKR ${(serviceExpenses[0]?.total || 0).toLocaleString()}`)
      .text(`Manual Expenses: LKR ${manualExpenses.toLocaleString()}`);
    
    doc.moveDown(2);

    // Detailed Entries
    if (entries.length > 0) {
      doc.fontSize(14).text('Detailed Financial Entries', { underline: true });
      doc.moveDown(0.5);
      
      entries.forEach(entry => {
        doc.fontSize(10)
          .text(`${new Date(entry.date).toLocaleDateString()} - ${entry.type.toUpperCase()} - ${entry.category.replace('_', ' ')} - LKR ${entry.amount.toLocaleString()}`, { indent: 20 })
          .text(`Description: ${entry.description}`, { indent: 40 });
        
        if (entry.reference) {
          doc.text(`Reference: ${entry.reference}`, { indent: 40 });
        }
        
        doc.text(`Created by: ${entry.createdBy?.firstName} ${entry.createdBy?.lastName}`, { indent: 40 });
        doc.moveDown(0.3);
      });
    }

    doc.moveDown(2);

    // Footer
    doc.fontSize(10)
      .text('Generated on: ' + new Date().toLocaleDateString(), { align: 'center' })
      .text('Giraffe Cabs Management System', { align: 'center' });

    doc.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Generate expense report
const generateExpenseReport = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { startDate, endDate, category } = req.query;
    let query = { type: 'expense' };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    if (category) query.category = category;

    const expenses = await FinancialEntry.find(query)
      .populate('createdBy', 'firstName lastName')
      .sort({ date: -1 });

    // Get service expenses
    let serviceExpenses = [];
    if (!category || category === 'service') {
      const serviceQuery = {};
      if (startDate || endDate) {
        serviceQuery.date = {};
        if (startDate) serviceQuery.date.$gte = new Date(startDate);
        if (endDate) serviceQuery.date.$lte = new Date(endDate);
      }

      serviceExpenses = await ServiceRecord.find(serviceQuery)
        .populate('vehicle', 'brand model licensePlate')
        .sort({ date: -1 });
    }

    // Generate CSV
    const csvHeader = 'Date,Type,Category,Description,Amount,Reference,Created By\n';
    let csvContent = csvHeader;

    // Add manual expenses
    expenses.forEach(expense => {
      csvContent += `${new Date(expense.date).toLocaleDateString()},Manual,${expense.category.replace('_', ' ')},${expense.description},${expense.amount},${expense.reference || ''},${expense.createdBy?.firstName} ${expense.createdBy?.lastName}\n`;
    });

    // Add service expenses
    serviceExpenses.forEach(service => {
      csvContent += `${new Date(service.date).toLocaleDateString()},Service,Maintenance,${service.description},${service.cost},${service.vehicle?.brand} ${service.vehicle?.model} (${service.vehicle?.licensePlate}),System\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="expense_report.csv"');
    res.send(csvContent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Generate income report
const generateIncomeReport = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { startDate, endDate, category } = req.query;
    let query = { type: 'income' };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    if (category) query.category = category;

    const incomes = await FinancialEntry.find(query)
      .populate('createdBy', 'firstName lastName')
      .sort({ date: -1 });

    // Get booking income
    let bookingIncome = [];
    if (!category || category === 'booking') {
      const bookingQuery = { status: 'completed' };
      if (startDate || endDate) {
        bookingQuery.createdAt = {};
        if (startDate) bookingQuery.createdAt.$gte = new Date(startDate);
        if (endDate) bookingQuery.createdAt.$lte = new Date(endDate);
      }

      bookingIncome = await Booking.find(bookingQuery)
        .populate('user', 'firstName lastName')
        .sort({ createdAt: -1 });
    }

    // Generate CSV
    const csvHeader = 'Date,Type,Category,Description,Amount,Reference,Created By\n';
    let csvContent = csvHeader;

    // Add manual income
    incomes.forEach(income => {
      csvContent += `${new Date(income.date).toLocaleDateString()},Manual,${income.category.replace('_', ' ')},${income.description},${income.amount},${income.reference || ''},${income.createdBy?.firstName} ${income.createdBy?.lastName}\n`;
    });

    // Add booking income
    bookingIncome.forEach(booking => {
      csvContent += `${new Date(booking.createdAt).toLocaleDateString()},Booking,${booking.serviceType},${booking.pickupLocation} to ${booking.dropoffLocation},${booking.totalAmount},Booking #${booking._id},${booking.user?.firstName} ${booking.user?.lastName}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="income_report.csv"');
    res.send(csvContent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllFinancialEntries,
  createFinancialEntry,
  updateFinancialEntry,
  deleteFinancialEntry,
  getFinancialSummary,
  generateMonthlyReport,
  generateExpenseReport,
  generateIncomeReport
};







