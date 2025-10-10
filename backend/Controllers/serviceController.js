const ServiceRecord = require('../Models/ServiceRecord');
const Vehicle = require('../Models/Vehicle');
const XLSX = require('xlsx');

// Get All Service Records
const getAllServiceRecords = async (req, res) => {
  try {
    const serviceRecords = await ServiceRecord.find({})
      .populate('vehicle', 'vehicleNumber brand model year')
      .populate('createdBy', 'firstName lastName')
      .sort({ serviceDate: -1 });
    res.json(serviceRecords);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Service Records by Vehicle
const getServiceRecordsByVehicle = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const serviceRecords = await ServiceRecord.find({ vehicle: vehicleId })
      .populate('createdBy', 'firstName lastName')
      .sort({ serviceDate: -1 });
    res.json(serviceRecords);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create Service Record
const createServiceRecord = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Basic numeric validations
    const mileageNum = Number(req.body?.mileage);
    const costNum = Number(req.body?.cost);
    if (!Number.isFinite(mileageNum) || mileageNum <= 0) {
      return res.status(400).json({ message: 'Mileage must be greater than 0' });
    }
    if (!Number.isFinite(costNum) || costNum <= 0) {
      return res.status(400).json({ message: 'Cost must be greater than 0' });
    }
    // If nextServiceMileage provided, it must be > current mileage and > 0
    if (req.body.hasOwnProperty('nextServiceMileage')) {
      const nextMileageNum = Number(req.body.nextServiceMileage);
      if (!Number.isFinite(nextMileageNum) || nextMileageNum <= 0) {
        return res.status(400).json({ message: 'Next service mileage must be greater than 0' });
      }
      if (nextMileageNum <= mileageNum) {
        return res.status(400).json({ message: 'Next service mileage must be greater than current mileage' });
      }
    }

    // Auto-populate next service date if not provided
    let serviceData = { ...req.body };
    
    // If no nextServiceDue is provided, set it to tomorrow
    if (!serviceData.nextServiceDue) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      serviceData.nextServiceDue = tomorrow;
    }

    const serviceRecord = new ServiceRecord({
      ...serviceData,
      createdBy: req.user._id
    });

    const savedRecord = await serviceRecord.save();
    const populatedRecord = await ServiceRecord.findById(savedRecord._id)
      .populate('vehicle', 'vehicleNumber brand model year')
      .populate('createdBy', 'firstName lastName');

    res.status(201).json(populatedRecord);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Service Record
const updateServiceRecord = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const serviceRecord = await ServiceRecord.findById(req.params.id);
    if (!serviceRecord) {
      return res.status(404).json({ message: 'Service record not found' });
    }

    // Validate updates if mileage/cost provided
    if (req.body.hasOwnProperty('mileage')) {
      const mileageNum = Number(req.body.mileage);
      if (!Number.isFinite(mileageNum) || mileageNum <= 0) {
        return res.status(400).json({ message: 'Mileage must be greater than 0' });
      }
    }
    if (req.body.hasOwnProperty('cost')) {
      const costNum = Number(req.body.cost);
      if (!Number.isFinite(costNum) || costNum <= 0) {
        return res.status(400).json({ message: 'Cost must be greater than 0' });
      }
    }
    // Validate nextServiceMileage if provided
    if (req.body.hasOwnProperty('nextServiceMileage')) {
      const nextMileageNum = Number(req.body.nextServiceMileage);
      if (!Number.isFinite(nextMileageNum) || nextMileageNum <= 0) {
        return res.status(400).json({ message: 'Next service mileage must be greater than 0' });
      }
      // Determine baseline mileage (incoming update or existing)
      const baselineMileage = req.body.hasOwnProperty('mileage')
        ? Number(req.body.mileage)
        : Number(serviceRecord.mileage);
      if (Number.isFinite(baselineMileage) && nextMileageNum <= baselineMileage) {
        return res.status(400).json({ message: 'Next service mileage must be greater than current mileage' });
      }
    }

    Object.assign(serviceRecord, req.body);
    const updatedRecord = await serviceRecord.save();
    
    const populatedRecord = await ServiceRecord.findById(updatedRecord._id)
      .populate('vehicle', 'vehicleNumber brand model year')
      .populate('createdBy', 'firstName lastName');

    res.json(populatedRecord);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete Service Record
const deleteServiceRecord = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const serviceRecord = await ServiceRecord.findById(req.params.id);
    if (!serviceRecord) {
      return res.status(404).json({ message: 'Service record not found' });
    }

    await ServiceRecord.findByIdAndDelete(req.params.id);
    res.json({ message: 'Service record deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Service Statistics
const getServiceStats = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const totalServices = await ServiceRecord.countDocuments();
    const totalCost = await ServiceRecord.aggregate([
      { $group: { _id: null, total: { $sum: '$cost' } } }
    ]);

    const servicesByType = await ServiceRecord.aggregate([
      { $group: { _id: '$serviceType', count: { $sum: 1 }, totalCost: { $sum: '$cost' } } }
    ]);

    const recentServices = await ServiceRecord.find({})
      .populate('vehicle', 'vehicleNumber brand model')
      .sort({ serviceDate: -1 })
      .limit(5);

    res.json({
      total: totalServices,
      totalCost: totalCost[0]?.total || 0,
      servicesByType,
      recentServices
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Upcoming Services
const getUpcomingServices = async (req, res) => {
  try {
    const upcomingServices = await ServiceRecord.find({
      nextServiceDue: { $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } // Next 30 days
    })
      .populate('vehicle', 'vehicleNumber brand model year')
      .sort({ nextServiceDue: 1 });

    res.json(upcomingServices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Service Reminders (for today and tomorrow)
const getServiceReminders = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Set time to start of day for accurate comparison
    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);

    // Create end of tomorrow for range query
    const endOfTomorrow = new Date(tomorrow);
    endOfTomorrow.setHours(23, 59, 59, 999);

    // Find services due today or tomorrow
    const serviceReminders = await ServiceRecord.find({
      nextServiceDue: {
        $gte: today,
        $lte: endOfTomorrow
      }
    })
      .populate('vehicle', 'vehicleNumber brand model year')
      .populate('createdBy', 'firstName lastName')
      .sort({ nextServiceDue: 1 });

    // Categorize reminders
    const todayServices = serviceReminders.filter(service => {
      const serviceDate = new Date(service.nextServiceDue);
      serviceDate.setHours(0, 0, 0, 0);
      return serviceDate.getTime() === today.getTime();
    });

    const tomorrowServices = serviceReminders.filter(service => {
      const serviceDate = new Date(service.nextServiceDue);
      serviceDate.setHours(0, 0, 0, 0);
      return serviceDate.getTime() === tomorrow.getTime();
    });

    res.json({
      today: todayServices,
      tomorrow: tomorrowServices,
      total: serviceReminders.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Service Report Generation Functions
const generateServiceRecordsReport = async (req, res) => {
  try {
    console.log('Starting service records report generation...');
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const serviceRecords = await ServiceRecord.find({})
      .populate('vehicle', 'vehicleNumber brand model year')
      .populate('createdBy', 'firstName lastName')
      .sort({ serviceDate: -1 });
    
    console.log(`Found ${serviceRecords.length} service records`);
    
    // Create Excel workbook
    const wb = XLSX.utils.book_new();
    
    // Summary sheet
    const totalCost = serviceRecords.reduce((sum, record) => sum + (record.cost || 0), 0);
    const servicesByType = {};
    serviceRecords.forEach(record => {
      servicesByType[record.serviceType] = (servicesByType[record.serviceType] || 0) + 1;
    });
    
    const summaryData = [
      ['Metric', 'Value'],
      ['Total Service Records', serviceRecords.length],
      ['Total Cost', `LKR ${totalCost.toLocaleString()}`],
      ['Average Cost per Service', `LKR ${serviceRecords.length > 0 ? Math.round(totalCost / serviceRecords.length).toLocaleString() : 0}`],
      ['Generated Date', new Date().toLocaleDateString()]
    ];
    
    // Add service type breakdown
    Object.entries(servicesByType).forEach(([type, count]) => {
      summaryData.push([`${type} Services`, count]);
    });
    
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
    
    // Detailed service records
    const serviceData = [
      ['Vehicle Number', 'Brand', 'Model', 'Year', 'Service Date', 'Service Type', 'Description', 'Mileage (km)', 'Cost (LKR)', 'Service Provider', 'Technician', 'Next Service Date', 'Next Service Mileage', 'Warranty', 'Notes', 'Created By', 'Created Date']
    ];
    
    serviceRecords.forEach(record => {
      serviceData.push([
        record.vehicle?.vehicleNumber || 'N/A',
        record.vehicle?.brand || 'N/A',
        record.vehicle?.model || 'N/A',
        record.vehicle?.year || 'N/A',
        new Date(record.serviceDate).toLocaleDateString(),
        record.serviceType,
        record.description || '',
        record.mileage || 0,
        record.cost || 0,
        record.serviceProvider || '',
        record.technician || '',
        record.nextServiceDue ? new Date(record.nextServiceDue).toLocaleDateString() : '',
        record.nextServiceMileage || '',
        record.isWarranty ? 'Yes' : 'No',
        record.notes || '',
        record.createdBy ? `${record.createdBy.firstName} ${record.createdBy.lastName}` : 'N/A',
        new Date(record.createdAt).toLocaleDateString()
      ]);
    });
    
    const serviceWs = XLSX.utils.aoa_to_sheet(serviceData);
    XLSX.utils.book_append_sheet(wb, serviceWs, 'Service Records');
    
    // Service type analysis
    const typeAnalysisData = [
      ['Service Type', 'Count', 'Total Cost (LKR)', 'Average Cost (LKR)']
    ];
    
    Object.entries(servicesByType).forEach(([type, count]) => {
      const typeRecords = serviceRecords.filter(record => record.serviceType === type);
      const typeTotalCost = typeRecords.reduce((sum, record) => sum + (record.cost || 0), 0);
      const typeAvgCost = count > 0 ? Math.round(typeTotalCost / count) : 0;
      
      typeAnalysisData.push([
        type,
        count,
        typeTotalCost,
        typeAvgCost
      ]);
    });
    
    const typeWs = XLSX.utils.aoa_to_sheet(typeAnalysisData);
    XLSX.utils.book_append_sheet(wb, typeWs, 'Service Type Analysis');
    
    // Set response headers for Excel download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="Service_Records_${new Date().toISOString().split('T')[0]}.xlsx"`);
    
    const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.send(excelBuffer);
    console.log('Service records report sent successfully');
  } catch (error) {
    console.error('Error generating service records report:', error);
    res.status(500).json({ message: error.message });
  }
};

const generateServiceAnalyticsReport = async (req, res) => {
  try {
    console.log('Starting service analytics report generation...');
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const serviceRecords = await ServiceRecord.find({})
      .populate('vehicle', 'vehicleNumber brand model year vehicleType')
      .sort({ serviceDate: -1 });
    
    console.log(`Found ${serviceRecords.length} service records for analytics`);
    
    // Create Excel workbook
    const wb = XLSX.utils.book_new();
    
    // Calculate analytics
    const totalCost = serviceRecords.reduce((sum, record) => sum + (record.cost || 0), 0);
    const servicesByType = {};
    const servicesByVehicle = {};
    const monthlyData = {};
    
    serviceRecords.forEach(record => {
      // By type
      servicesByType[record.serviceType] = (servicesByType[record.serviceType] || 0) + 1;
      
      // By vehicle
      const vehicleKey = record.vehicle?.vehicleNumber || 'Unknown';
      if (!servicesByVehicle[vehicleKey]) {
        servicesByVehicle[vehicleKey] = {
          count: 0,
          totalCost: 0,
          brand: record.vehicle?.brand || 'N/A',
          model: record.vehicle?.model || 'N/A',
          type: record.vehicle?.vehicleType || 'N/A'
        };
      }
      servicesByVehicle[vehicleKey].count++;
      servicesByVehicle[vehicleKey].totalCost += record.cost || 0;
      
      // Monthly data
      const month = new Date(record.serviceDate).toISOString().substring(0, 7); // YYYY-MM
      if (!monthlyData[month]) {
        monthlyData[month] = { count: 0, totalCost: 0 };
      }
      monthlyData[month].count++;
      monthlyData[month].totalCost += record.cost || 0;
    });
    
    // Summary sheet
    const summaryData = [
      ['Analytics Metric', 'Value'],
      ['Total Service Records', serviceRecords.length],
      ['Total Service Cost', `LKR ${totalCost.toLocaleString()}`],
      ['Average Cost per Service', `LKR ${serviceRecords.length > 0 ? Math.round(totalCost / serviceRecords.length).toLocaleString() : 0}`],
      ['Most Common Service Type', Object.entries(servicesByType).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'],
      ['Generated Date', new Date().toLocaleDateString()]
    ];
    
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
    
    // Service type breakdown
    const typeData = [
      ['Service Type', 'Count', 'Percentage', 'Total Cost (LKR)', 'Average Cost (LKR)']
    ];
    
    Object.entries(servicesByType)
      .sort((a, b) => b[1] - a[1])
      .forEach(([type, count]) => {
        const typeRecords = serviceRecords.filter(record => record.serviceType === type);
        const typeTotalCost = typeRecords.reduce((sum, record) => sum + (record.cost || 0), 0);
        const typeAvgCost = count > 0 ? Math.round(typeTotalCost / count) : 0;
        const percentage = serviceRecords.length > 0 ? Math.round((count / serviceRecords.length) * 100) : 0;
        
        typeData.push([
          type,
          count,
          `${percentage}%`,
          typeTotalCost,
          typeAvgCost
        ]);
      });
    
    const typeWs = XLSX.utils.aoa_to_sheet(typeData);
    XLSX.utils.book_append_sheet(wb, typeWs, 'Service Type Analysis');
    
    // Vehicle analysis
    const vehicleData = [
      ['Vehicle Number', 'Brand', 'Model', 'Type', 'Service Count', 'Total Cost (LKR)', 'Average Cost (LKR)']
    ];
    
    Object.entries(servicesByVehicle)
      .sort((a, b) => b[1].count - a[1].count)
      .forEach(([vehicleNumber, data]) => {
        const avgCost = data.count > 0 ? Math.round(data.totalCost / data.count) : 0;
        vehicleData.push([
          vehicleNumber,
          data.brand,
          data.model,
          data.type,
          data.count,
          data.totalCost,
          avgCost
        ]);
      });
    
    const vehicleWs = XLSX.utils.aoa_to_sheet(vehicleData);
    XLSX.utils.book_append_sheet(wb, vehicleWs, 'Vehicle Analysis');
    
    // Monthly trends
    const monthlyDataArray = [
      ['Month', 'Service Count', 'Total Cost (LKR)', 'Average Cost (LKR)']
    ];
    
    Object.entries(monthlyData)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .forEach(([month, data]) => {
        const avgCost = data.count > 0 ? Math.round(data.totalCost / data.count) : 0;
        monthlyDataArray.push([
          month,
          data.count,
          data.totalCost,
          avgCost
        ]);
      });
    
    const monthlyWs = XLSX.utils.aoa_to_sheet(monthlyDataArray);
    XLSX.utils.book_append_sheet(wb, monthlyWs, 'Monthly Trends');
    
    // Set response headers for Excel download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="Service_Analytics_${new Date().toISOString().split('T')[0]}.xlsx"`);
    
    const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.send(excelBuffer);
    console.log('Service analytics report sent successfully');
  } catch (error) {
    console.error('Error generating service analytics report:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllServiceRecords,
  getServiceRecordsByVehicle,
  createServiceRecord,
  updateServiceRecord,
  deleteServiceRecord,
  getServiceStats,
  getUpcomingServices,
  getServiceReminders,
  generateServiceRecordsReport,
  generateServiceAnalyticsReport
};







