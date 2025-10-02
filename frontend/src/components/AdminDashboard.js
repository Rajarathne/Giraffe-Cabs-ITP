import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import './AdminDashboard.css';
import './FinancialStyles.css';

// Import separate components
import DashboardStats from './admin/DashboardStats';
import ServiceRemindersModal from './admin/ServiceRemindersModal';
import VehicleManagement from './admin/VehicleManagement';
import ServiceManagement from './admin/ServiceManagement';
import RentalManagement from './admin/RentalManagement';
import BookingManagement from './admin/BookingManagement';
import PaymentManagement from './admin/PaymentManagement';
import DashboardCharts from './admin/DashboardCharts';
import FinancialManagement from './admin/FinancialManagement';
import TourPackageManagement from './admin/TourPackageManagement';
import TourBookingManagement from './admin/TourBookingManagement';
import AdminProfile from './admin/AdminProfile';
import VehicleProviderManagement from './admin/VehicleProviderManagement';
import VehicleRequestManagement from './admin/VehicleRequestManagement';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState('light');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Dashboard stats
  const [stats, setStats] = useState({
    vehicles: { total: 0, available: 0 },
    rentals: { total: 0, pending: 0, approved: 0, active: 0 },
    bookings: { total: 0, pending: 0, confirmed: 0, completed: 0 },
    services: { total: 0, totalCost: 0 }
  });

  // Chart data
  const [chartData] = useState({
    vehicleTypes: [],
    monthlyRegistrations: []
  });

  // Data arrays
  const [vehicles, setVehicles] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [serviceRecords, setServiceRecords] = useState([]);
  const [serviceReminders, setServiceReminders] = useState({
    today: [],
    tomorrow: [],
    total: 0
  });
  const [tourPackages, setTourPackages] = useState([]);
  const [tourBookings, setTourBookings] = useState([]);
  
  // Financial data
  const [financialData, setFinancialData] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    netProfit: 0,
    bookingIncome: 0,
    serviceExpenses: 0,
    manualIncome: 0,
    manualExpenses: 0,
    monthlyIncome: [],
    monthlyExpenses: []
  });
  const [financialEntries, setFinancialEntries] = useState([]);

  // Form states
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showRentalModal, setShowRentalModal] = useState(false);
  const [showRemindersModal, setShowRemindersModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [editingService, setEditingService] = useState(null);
  const [editingRental, setEditingRental] = useState(null);

  const [vehicleData, setVehicleData] = useState({
    vehicleNumber: '', vehicleType: '', brand: '', model: '', year: '',
    color: '', capacity: '', fuelType: '', transmission: '', 
    dailyRate: '', monthlyRate: '', weddingRate: '50000', 
    airportRate: '', cargoRate: '', description: '', features: [],
    rideTypes: []
  });
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [photoCaptions, setPhotoCaptions] = useState({});
  const [currentTime, setCurrentTime] = useState(new Date());

  const [serviceData, setServiceData] = useState({
    vehicle: '', serviceDate: '', serviceType: '', description: '',
    mileage: '', cost: '', serviceProvider: '', technician: '', notes: '',
    nextServiceDue: '', nextServiceMileage: ''
  });

  const [rentalData, setRentalData] = useState({
    vehicleId: '', rentalType: '', startDate: '', endDate: '',
    duration: '', purpose: '', specialRequirements: '', monthlyFee: '', dailyFee: '',
    totalAmount: '', conditions: '', contractTerms: '', adminGuidelines: ''
  });

  // Load dashboard data and theme
  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser || currentUser.role !== 'admin') {
      window.location.href = '/';
      return;
    }
    setUser(currentUser);
    
    // Load saved theme preference
    const savedTheme = localStorage.getItem('adminTheme') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    loadDashboardData();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Handle window resize for mobile responsiveness
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const headers = { Authorization: `Bearer ${token}` };

      // Load all data in parallel
      const [vehiclesRes, rentalsRes, bookingsRes, paymentsRes, servicesRes, serviceRemindersRes, vehicleStatsRes, rentalStatsRes, bookingStatsRes, , serviceStatsRes, financialSummaryRes, financialEntriesRes, tourPackagesRes, tourBookingsRes] = await Promise.all([
        axios.get('/api/vehicles', { headers }),
        axios.get('/api/rentals/all', { headers }),
        axios.get('/api/bookings', { headers }),
        axios.get('/api/payments', { headers }),
        axios.get('/api/services', { headers }),
        axios.get('/api/services/reminders', { headers }),
        axios.get('/api/vehicles/stats/overview', { headers }),
        axios.get('/api/rentals/stats/overview', { headers }),
        axios.get('/api/bookings/stats/overview', { headers }),
        axios.get('/api/payments/stats/overview', { headers }),
        axios.get('/api/services/stats/overview', { headers }),
        axios.get('/api/financial/summary', { headers }),
        axios.get('/api/financial', { headers }),
        axios.get('/api/tour-packages', { headers }),
        axios.get('/api/tour-bookings', { headers })
      ]);

      console.log('✅ Loaded vehicles data:', vehiclesRes.data?.length || 0, 'vehicles');
      setVehicles(vehiclesRes.data);
      setRentals(rentalsRes.data);
      setBookings(bookingsRes.data);
      setPayments(paymentsRes.data);
      setServiceRecords(servicesRes.data);
      setServiceReminders(serviceRemindersRes.data);
      setTourPackages(tourPackagesRes.data);
      setTourBookings(tourBookingsRes.data);
      
      // Debug financial data
      console.log('📊 Financial Summary Data:', financialSummaryRes.data);
      console.log('📋 Financial Entries Data:', financialEntriesRes.data);
      
      // Use the financial data from the backend API (which correctly calculates from financial entries)
      setFinancialData(financialSummaryRes.data);
      setFinancialEntries(financialEntriesRes.data);

      setStats({
        vehicles: vehicleStatsRes.data,
        rentals: rentalStatsRes.data,
        bookings: bookingStatsRes.data,
        services: serviceStatsRes.data
      });

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      alert('Error loading dashboard data: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // Vehicle handlers
  const handleVehicleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const headers = { Authorization: `Bearer ${token}` };

      // Include photos in the vehicle data
      const vehicleDataWithPhotos = {
        ...vehicleData,
        photos: selectedPhotos
      };

      console.log('Submitting vehicle data:', {
        ...vehicleDataWithPhotos,
        photosCount: selectedPhotos.length,
        firstPhotoPreview: selectedPhotos[0] ? selectedPhotos[0].substring(0, 100) + '...' : 'No photos'
      });
      
      if (editingVehicle) {
        const response = await axios.put(`/api/vehicles/${editingVehicle._id}`, vehicleDataWithPhotos, { 
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          }
        });
        console.log('Vehicle update response:', response.data);
        alert('Vehicle updated successfully!');
      } else {
        const response = await axios.post('/api/vehicles', vehicleDataWithPhotos, { 
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          }
        });
        console.log('Vehicle creation response:', response.data);
        alert('Vehicle added successfully!');
      }

      setShowVehicleModal(false);
      setEditingVehicle(null);
      setVehicleData({
        vehicleNumber: '', vehicleType: '', brand: '', model: '', year: '',
        color: '', capacity: '', fuelType: '', transmission: '', 
        dailyRate: '', monthlyRate: '', weddingRate: '50000', 
        airportRate: '', cargoRate: '', description: '', features: [],
        rideTypes: []
      });
      setSelectedPhotos([]);
      setPhotoCaptions({});
      loadDashboardData();
    } catch (error) {
      alert(error.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVehicle = async (id) => {
    if (!window.confirm('Are you sure you want to delete this vehicle?')) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const headers = { Authorization: `Bearer ${token}` };
      await axios.delete(`/api/vehicles/${id}`, { headers });
      alert('Vehicle deleted successfully!');
      loadDashboardData();
    } catch (error) {
      alert(error.response?.data?.message || 'Delete failed');
    } finally {
      setLoading(false);
    }
  };

  // Service handlers
  const handleServiceSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const headers = { Authorization: `Bearer ${token}` };

      if (editingService) {
        await axios.put(`/api/services/${editingService._id}`, serviceData, { headers });
        alert('Service record updated successfully!');
      } else {
        await axios.post('/api/services', serviceData, { headers });
        alert('Service record added successfully!');
      }

      setShowServiceModal(false);
      setEditingService(null);
      setServiceData({
        vehicle: '', serviceDate: '', serviceType: '', description: '',
        mileage: '', cost: '', serviceProvider: '', technician: '', notes: '',
        nextServiceDue: '', nextServiceMileage: ''
      });
      loadDashboardData();
    } catch (error) {
      alert(error.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteService = async (id) => {
    if (!window.confirm('Are you sure you want to delete this service record?')) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const headers = { Authorization: `Bearer ${token}` };
      await axios.delete(`/api/services/${id}`, { headers });
      alert('Service record deleted successfully!');
      loadDashboardData();
    } catch (error) {
      alert(error.response?.data?.message || 'Delete failed');
    } finally {
      setLoading(false);
    }
  };

  // Rental handlers
  const handleRentalSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const headers = { Authorization: `Bearer ${token}` };

      if (editingRental) {
        await axios.put(`/api/rentals/${editingRental._id}`, rentalData, { headers });
        alert('Rental contract updated successfully!');
      } else {
        const response = await axios.post('/api/rentals', rentalData, { headers });
        if (response.data.status === 'approved') {
          alert('Rental contract created and approved successfully!');
        } else {
          alert('Rental contract created successfully!');
        }
      }

      setShowRentalModal(false);
      setEditingRental(null);
      setRentalData({
        vehicleId: '', rentalType: '', startDate: '', endDate: '',
        duration: '', purpose: '', specialRequirements: '', monthlyFee: '', dailyFee: '',
        totalAmount: '', conditions: '', contractTerms: '', adminGuidelines: ''
      });
      loadDashboardData();
    } catch (error) {
      alert(error.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRentalStatus = async (rentalId, status) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      
      let monthlyFee = '';
      let dailyFee = '';
      let conditions = '';
      
      if (status === 'approved') {
        // Find the rental to get its type
        const rental = rentals.find(r => r._id === rentalId);
        if (rental) {
          if (rental.rentalType === 'daily') {
            dailyFee = prompt('Enter daily fee (LKR):');
            if (!dailyFee) {
              setLoading(false);
              return;
            }
          } else if (rental.rentalType === 'monthly') {
            monthlyFee = prompt('Enter monthly fee (LKR):');
            if (!monthlyFee) {
              setLoading(false);
              return;
            }
          }
        }
        conditions = prompt('Enter rental conditions:');
        if (!conditions) {
          setLoading(false);
          return;
        }
      }
      
      await axios.put(`/api/rentals/${rentalId}/status`, {
        status, monthlyFee, dailyFee, conditions
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      alert('Rental status updated successfully!');
      loadDashboardData();
    } catch (error) {
      alert(error.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRental = async (id) => {
    if (!window.confirm('Are you sure you want to delete this rental?')) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const headers = { Authorization: `Bearer ${token}` };
      await axios.delete(`/api/rentals/${id}`, { headers });
      alert('Rental deleted successfully!');
      loadDashboardData();
    } catch (error) {
      alert(error.response?.data?.message || 'Delete failed');
    } finally {
      setLoading(false);
    }
  };

  // Booking handlers
  const handleUpdateBookingStatus = async (bookingId, status) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      await axios.put(`/api/bookings/${bookingId}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('Booking status updated successfully!');
      loadDashboardData();
    } catch (error) {
      alert(error.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBooking = async (id) => {
    if (!window.confirm('Are you sure you want to delete this booking?')) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const headers = { Authorization: `Bearer ${token}` };
      await axios.delete(`/api/bookings/${id}`, { headers });
      alert('Booking deleted successfully!');
      loadDashboardData();
    } catch (error) {
      alert(error.response?.data?.message || 'Delete failed');
    } finally {
      setLoading(false);
    }
  };

  // Payment handlers
  const handleUpdatePaymentStatus = async (paymentId, status) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      await axios.put(`/api/payments/${paymentId}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('Payment status updated successfully!');
      loadDashboardData();
    } catch (error) {
      alert(error.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePayment = async (id) => {
    if (!window.confirm('Are you sure you want to delete this payment?')) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const headers = { Authorization: `Bearer ${token}` };
      await axios.delete(`/api/payments/${id}`, { headers });
      alert('Payment deleted successfully!');
      loadDashboardData();
    } catch (error) {
      alert(error.response?.data?.message || 'Delete failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEditPayment = async (paymentId) => {
    // Find the payment to edit
    const payment = payments.find(p => p._id === paymentId);
    if (!payment) return;

    // Create a simple edit form using prompt (you can replace this with a modal later)
    const newAmount = prompt('Enter new amount:', payment.amount);
    if (newAmount === null) return; // User cancelled

    const newMethod = prompt('Enter payment method (cash/card):', payment.paymentMethod);
    if (newMethod === null) return; // User cancelled

    if (!['cash', 'card'].includes(newMethod.toLowerCase())) {
      alert('Payment method must be either "cash" or "card"');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      await axios.put(`/api/payments/${paymentId}`, {
        amount: parseFloat(newAmount),
        paymentMethod: newMethod.toLowerCase()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('Payment updated successfully!');
      loadDashboardData();
    } catch (error) {
      alert(error.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  // Chart data functions
  const getMonthlyRegistrationChartData = () => {
    // Calculate vehicle registrations by month
    const monthlyData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; // 12 months
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    vehicles.forEach(vehicle => {
      const createdAt = new Date(vehicle.createdAt);
      const month = createdAt.getMonth();
      monthlyData[month]++;
    });

    const primaryColor = theme === 'dark' ? '#60a5fa' : '#1E93AB';
    const backgroundColor = theme === 'dark' ? 'rgba(96, 165, 250, 0.1)' : 'rgba(30, 147, 171, 0.1)';

    return {
      labels: monthNames,
      datasets: [{
        label: 'Vehicle Registrations',
        data: monthlyData,
        borderColor: primaryColor,
        backgroundColor: backgroundColor,
        tension: 0.4
      }]
    };
  };

  const getVehicleTypeChartData = () => {
    // Calculate vehicle types distribution
    const vehicleTypeCounts = {};
    vehicles.forEach(vehicle => {
      const type = vehicle.vehicleType || 'Unknown';
      vehicleTypeCounts[type] = (vehicleTypeCounts[type] || 0) + 1;
    });

    const labels = Object.keys(vehicleTypeCounts);
    const data = Object.values(vehicleTypeCounts);
    const colors = theme === 'dark' ? [
      '#60a5fa',
      '#34d399',
      '#fbbf24',
      '#f87171',
      '#a78bfa',
      '#fb7185',
      '#fbbf24',
      '#34d399'
    ] : [
      '#1E93AB',
      '#40A8C4',
      '#10b981',
      '#fbbf24',
      '#ef4444',
      '#8b5cf6',
      '#f59e0b',
      '#34d399'
    ];

    return {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors.slice(0, labels.length)
      }]
    };
  };

  const getBookingTypeChartData = () => {
    // Calculate booking types distribution
    const bookingTypeCounts = {};
    bookings.forEach(booking => {
      const type = booking.serviceType || 'Unknown';
      bookingTypeCounts[type] = (bookingTypeCounts[type] || 0) + 1;
    });

    const labels = Object.keys(bookingTypeCounts);
    const data = Object.values(bookingTypeCounts);
    const primaryColor = theme === 'dark' ? '#34d399' : '#10b981';
    const backgroundColor = theme === 'dark' ? 'rgba(52, 211, 153, 0.1)' : 'rgba(16, 185, 129, 0.1)';

    return {
      labels: labels,
      datasets: [{
        label: 'Bookings',
        data: data,
        borderColor: primaryColor,
        backgroundColor: backgroundColor,
        tension: 0.4
      }]
    };
  };

  const getMonthlyBookingChartData = () => {
    // Calculate monthly booking trends
    const monthlyData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; // 12 months
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    bookings.forEach(booking => {
      const createdAt = new Date(booking.createdAt);
      const month = createdAt.getMonth();
      monthlyData[month]++;
    });

    const primaryColor = theme === 'dark' ? '#60a5fa' : '#40A8C4';
    const backgroundColor = theme === 'dark' ? 'rgba(96, 165, 250, 0.1)' : 'rgba(64, 168, 196, 0.1)';

    return {
      labels: monthNames,
      datasets: [{
        label: 'Monthly Bookings',
        data: monthlyData,
        borderColor: primaryColor,
        backgroundColor: backgroundColor,
        tension: 0.4
      }]
    };
  };

  const getRentalStatusChartData = () => {
    // Calculate rental status distribution
    const rentalStatusCounts = {};
    rentals.forEach(rental => {
      const status = rental.status || 'Unknown';
      rentalStatusCounts[status] = (rentalStatusCounts[status] || 0) + 1;
    });

    const labels = Object.keys(rentalStatusCounts);
    const data = Object.values(rentalStatusCounts);
    const colors = theme === 'dark' ? [
      '#fbbf24', // pending
      '#34d399', // approved
      '#60a5fa', // active
      '#f87171', // completed
      '#9ca3af'  // cancelled
    ] : [
      '#fbbf24', // pending
      '#10b981', // approved
      '#3b82f6', // active
      '#ef4444', // completed
      '#6b7280'  // cancelled
    ];

    return {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors.slice(0, labels.length)
      }]
    };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: theme === 'dark' ? '#f9fafb' : '#1f2937'
        }
      },
    },
    scales: {
      x: {
        ticks: {
          color: theme === 'dark' ? '#d1d5db' : '#6b7280'
        },
        grid: {
          color: theme === 'dark' ? '#374151' : '#e5e7eb'
        }
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: theme === 'dark' ? '#d1d5db' : '#6b7280'
        },
        grid: {
          color: theme === 'dark' ? '#374151' : '#e5e7eb'
        }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: theme === 'dark' ? '#f9fafb' : '#1f2937'
        }
      },
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
      window.location.href = '/';
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('adminTheme', newTheme);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const toggleMobileSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const generateBookingReport = async (reportType) => {
    try {
      console.log('generateBookingReport called with type:', reportType);
      setLoading(true);
      
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }
      
      const headers = { Authorization: `Bearer ${token}` };

      let endpoint = '';
      let filename = '';
      let responseType = 'blob';

      switch (reportType) {
        case 'daily':
          endpoint = '/api/bookings/reports/daily';
          filename = `Daily_Bookings_${new Date().toISOString().split('T')[0]}.pdf`;
          break;
        case 'monthly':
          endpoint = '/api/bookings/reports/monthly';
          filename = `Monthly_Bookings_${new Date().toISOString().slice(0, 7)}.xlsx`;
          break;
        case 'analytics':
          endpoint = '/api/bookings/reports/analytics';
          filename = `Booking_Analytics_${new Date().toISOString().split('T')[0]}.csv`;
          break;
        case 'revenue':
          endpoint = '/api/bookings/reports/revenue';
          filename = `Revenue_Report_${new Date().toISOString().split('T')[0]}.pdf`;
          break;
        case 'customers':
          endpoint = '/api/bookings/reports/customers';
          filename = `Customer_Bookings_${new Date().toISOString().split('T')[0]}.csv`;
          break;
        case 'vehicles':
          endpoint = '/api/bookings/reports/vehicles';
          filename = `Vehicle_Utilization_${new Date().toISOString().split('T')[0]}.xlsx`;
          break;
        default:
          throw new Error('Invalid report type');
      }

      console.log(`Making request to: ${endpoint}`);
      const response = await axios.get(endpoint, { 
        headers, 
        responseType 
      });

      console.log('Response received:', response.status);

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      alert(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} report generated successfully!`);
    } catch (error) {
      console.error('Error generating report:', error);
      let errorMessage = 'Error generating report: ';
      
      if (error.response) {
        // Server responded with error status
        errorMessage += error.response.data?.message || `Server error (${error.response.status})`;
      } else if (error.request) {
        // Request was made but no response received
        errorMessage += 'Network error - please check your connection';
      } else {
        // Something else happened
        errorMessage += error.message;
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const generateServiceReport = async (reportType) => {
    try {
      console.log('generateServiceReport called with type:', reportType);
      setLoading(true);
      
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }
      
      const headers = { Authorization: `Bearer ${token}` };

      let endpoint = '';
      let filename = '';

      switch (reportType) {
        case 'records':
          endpoint = '/api/services/reports/records';
          filename = `Service_Records_${new Date().toISOString().split('T')[0]}.xlsx`;
          break;
        case 'analytics':
          endpoint = '/api/services/reports/analytics';
          filename = `Service_Analytics_${new Date().toISOString().split('T')[0]}.xlsx`;
          break;
        default:
          throw new Error('Invalid report type');
      }

      console.log(`Making request to: ${endpoint}`);
      const response = await axios.get(endpoint, { 
        headers,
        responseType: 'blob' // Important for binary data
      });

      console.log('Response received:', response.status);

      // Create and download file
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      alert(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} report generated successfully!`);
    } catch (error) {
      console.error('Error generating service report:', error);
      let errorMessage = 'Error generating report: ';
      
      if (error.response) {
        // Server responded with error status
        console.error('Server error response:', error.response);
        if (error.response.data && typeof error.response.data === 'string') {
          errorMessage += error.response.data;
        } else {
          errorMessage += error.response.data?.message || `Server error (${error.response.status})`;
        }
      } else if (error.request) {
        // Request was made but no response received
        console.error('Network error:', error.request);
        errorMessage += 'Network error - please check your connection';
      } else {
        // Something else happened
        console.error('Other error:', error.message);
        errorMessage += error.message;
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const generateVehicleReport = async (reportType) => {
    try {
      console.log('generateVehicleReport called with type:', reportType);
      setLoading(true);
      
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }
      
      const headers = { Authorization: `Bearer ${token}` };

      let endpoint = '';
      let filename = '';

      switch (reportType) {
        case 'inventory':
          endpoint = '/api/vehicles/reports/inventory';
          filename = `Vehicle_Inventory_${new Date().toISOString().split('T')[0]}.pdf`;
          break;
        case 'analytics':
          endpoint = '/api/vehicles/reports/analytics';
          filename = `Vehicle_Analytics_${new Date().toISOString().split('T')[0]}.xlsx`;
          break;
        case 'details':
          endpoint = '/api/vehicles/reports/details';
          filename = `Vehicle_Details_${new Date().toISOString().split('T')[0]}.xlsx`;
          break;
        case 'utilization':
          endpoint = '/api/vehicles/reports/utilization';
          filename = `Vehicle_Utilization_${new Date().toISOString().split('T')[0]}.pdf`;
          break;
        case 'maintenance':
          endpoint = '/api/vehicles/reports/maintenance';
          filename = `Vehicle_Maintenance_${new Date().toISOString().split('T')[0]}.xlsx`;
          break;
        case 'revenue':
          endpoint = '/api/vehicles/reports/revenue';
          filename = `Vehicle_Revenue_${new Date().toISOString().split('T')[0]}.pdf`;
          break;
        default:
          throw new Error('Invalid report type');
      }

      console.log(`Making request to: ${endpoint}`);
      const response = await axios.get(endpoint, { 
        headers,
        responseType: 'blob' // Important for binary data
      });

      console.log('Response received:', response.status);

      // Create and download file
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      alert(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} report generated successfully!`);
    } catch (error) {
      console.error('Error generating vehicle report:', error);
      let errorMessage = 'Error generating report: ';
      
      if (error.response) {
        // Server responded with error status
        console.error('Server error response:', error.response);
        if (error.response.data && typeof error.response.data === 'string') {
          errorMessage += error.response.data;
        } else {
          errorMessage += error.response.data?.message || `Server error (${error.response.status})`;
        }
      } else if (error.request) {
        // Request was made but no response received
        console.error('Network error:', error.request);
        errorMessage += 'Network error - please check your connection';
      } else {
        // Something else happened
        console.error('Other error:', error.message);
        errorMessage += error.message;
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFinancialEntry = async (financialFormData) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const headers = { Authorization: `Bearer ${token}` };

      const response = await axios.post('/api/financial', financialFormData, { headers });
      console.log('✅ Financial entry added:', response.data);
      
      alert('Financial entry added successfully!');
      
      // Add a small delay to ensure backend processing is complete
      setTimeout(() => {
        console.log('🔄 Refreshing financial data...');
        loadDashboardData();
      }, 500);
      
    } catch (error) {
      console.error('❌ Error adding financial entry:', error);
      alert('Error adding financial entry: ' + (error.response?.data?.message || error.message));
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFinancialEntry = async (id, financialFormData) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const headers = { Authorization: `Bearer ${token}` };

      const response = await axios.put(`/api/financial/${id}`, financialFormData, { headers });
      console.log('✅ Financial entry updated:', response.data);
      
      alert('Financial entry updated successfully!');
      loadDashboardData();
    } catch (error) {
      console.error('Error updating financial entry:', error);
      alert('Failed to update financial entry: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFinancialEntry = async (id) => {
    if (!window.confirm('Are you sure you want to delete this financial entry?')) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const headers = { Authorization: `Bearer ${token}` };
      await axios.delete(`/api/financial/${id}`, { headers });
      alert('Financial entry deleted successfully!');
      loadDashboardData();
    } catch (error) {
      alert('Error deleting financial entry: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // Tour Package handlers
  const handleTourPackageSubmit = async (packageData, editingPackage) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const headers = { Authorization: `Bearer ${token}` };

      if (editingPackage) {
        await axios.put(`/api/tour-packages/${editingPackage._id}`, packageData, { headers });
        alert('Tour package updated successfully!');
      } else {
        await axios.post('/api/tour-packages', packageData, { headers });
        alert('Tour package created successfully!');
      }

      loadDashboardData();
    } catch (error) {
      alert(error.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTourPackage = async (id) => {
    if (!window.confirm('Are you sure you want to delete this tour package?')) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const headers = { Authorization: `Bearer ${token}` };
      await axios.delete(`/api/tour-packages/${id}`, { headers });
      alert('Tour package deleted successfully!');
      loadDashboardData();
    } catch (error) {
      alert(error.response?.data?.message || 'Delete failed');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (profileData) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const headers = { Authorization: `Bearer ${token}` };
      
      const response = await axios.put('/api/auth/profile', profileData, { headers });
      
      // Update user state
      setUser(response.data.user);
      
      // Update localStorage
      localStorage.setItem('currentUser', JSON.stringify(response.data.user));
      
      alert('Profile updated successfully!');
      return response.data;
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile: ' + (error.response?.data?.message || error.message));
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Render functions
  const renderDashboard = () => (
    <div className="dashboard-content">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <div className="current-time">
          <i className="fas fa-clock"></i>
          {currentTime.toLocaleString()}
        </div>
      </div>

      <DashboardStats 
        stats={stats}
        serviceReminders={serviceReminders}
        onRemindersClick={() => setShowRemindersModal(true)}
      />

      <DashboardCharts 
        chartData={chartData}
        getMonthlyRegistrationChartData={getMonthlyRegistrationChartData}
        getVehicleTypeChartData={getVehicleTypeChartData}
        getBookingTypeChartData={getBookingTypeChartData}
        getMonthlyBookingChartData={getMonthlyBookingChartData}
        getRentalStatusChartData={getRentalStatusChartData}
        chartOptions={chartOptions}
        doughnutOptions={doughnutOptions}
      />
    </div>
  );

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Mobile Sidebar Toggle */}
      <button 
        className="sidebar-toggle"
        onClick={toggleMobileSidebar}
        style={{ display: window.innerWidth <= 768 ? 'block' : 'none' }}
      >
        <i className="fas fa-bars"></i>
      </button>

      {/* Mobile Backdrop */}
      {sidebarOpen && window.innerWidth <= 768 && (
        <div 
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999
          }}
        />
      )}

      {/* Sidebar Navigation */}
      <div className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <span>Admin Panel</span>
          </div>
          <button 
            className="sidebar-toggle"
            onClick={toggleSidebar}
            style={{ display: window.innerWidth > 768 ? 'block' : 'none' }}
          >
            <i className="fas fa-bars"></i>
          </button>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('dashboard');
              setSidebarOpen(false);
            }}
          >
            <i className="fas fa-tachometer-alt"></i>
            <span>Dashboard</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'vehicles' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('vehicles');
              setSidebarOpen(false);
            }}
          >
            <i className="fas fa-car"></i>
            <span>Vehicles</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'services' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('services');
              setSidebarOpen(false);
            }}
          >
            <i className="fas fa-tools"></i>
            <span>Services</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'rentals' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('rentals');
              setSidebarOpen(false);
            }}
          >
            <i className="fas fa-handshake"></i>
            <span>Rentals</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'bookings' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('bookings');
              setSidebarOpen(false);
            }}
          >
            <i className="fas fa-calendar-check"></i>
            <span>Bookings</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'payments' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('payments');
              setSidebarOpen(false);
            }}
          >
            <i className="fas fa-credit-card"></i>
            <span>Payments</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'financial' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('financial');
              setSidebarOpen(false);
            }}
          >
            <i className="fas fa-chart-line"></i>
            <span>Financial</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'tour-packages' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('tour-packages');
              setSidebarOpen(false);
            }}
          >
            <i className="fas fa-map-marked-alt"></i>
            <span>Tours</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'tour-bookings' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('tour-bookings');
              setSidebarOpen(false);
            }}
          >
            <i className="fas fa-calendar-check"></i>
            <span>Tour Bookings</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'vehicle-providers' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('vehicle-providers');
              setSidebarOpen(false);
            }}
          >
            <i className="fas fa-handshake"></i>
            <span>Providers</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'vehicle-requests' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('vehicle-requests');
              setSidebarOpen(false);
            }}
          >
            <i className="fas fa-car-side"></i>
            <span>Requests</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('profile');
              setSidebarOpen(false);
            }}
          >
            <i className="fas fa-user-circle"></i>
            <span>Profile</span>
          </button>
        </nav>

        <div className="sidebar-user">
          <button 
            className="theme-toggle"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
          >
            <i className={`fas ${theme === 'light' ? 'fa-moon' : 'fa-sun'}`}></i>
            <span>{theme === 'light' ? 'Dark' : 'Light'}</span>
          </button>
          <div className="user-info">
            <i className="fas fa-user-circle"></i>
            <span>{user?.name || 'Admin User'}</span>
          </div>
          <button 
            className="logout-btn"
            onClick={handleLogout}
          >
            <i className="fas fa-sign-out-alt"></i>
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'vehicles' && (
          <VehicleManagement
            vehicles={vehicles}
            vehicleData={vehicleData}
            setVehicleData={setVehicleData}
            selectedPhotos={selectedPhotos}
            setSelectedPhotos={setSelectedPhotos}
            photoCaptions={photoCaptions}
            setPhotoCaptions={setPhotoCaptions}
            showVehicleModal={showVehicleModal}
            setShowVehicleModal={setShowVehicleModal}
            editingVehicle={editingVehicle}
            setEditingVehicle={setEditingVehicle}
            loading={loading}
            onVehicleSubmit={handleVehicleSubmit}
            onDeleteVehicle={handleDeleteVehicle}
            onGenerateVehicleReport={generateVehicleReport}
          />
        )}
        {activeTab === 'services' && (
          <ServiceManagement
            serviceRecords={serviceRecords}
            vehicles={vehicles}
            serviceData={serviceData}
            setServiceData={setServiceData}
            showServiceModal={showServiceModal}
            setShowServiceModal={setShowServiceModal}
            editingService={editingService}
            setEditingService={setEditingService}
            loading={loading}
            onServiceSubmit={handleServiceSubmit}
            onDeleteService={handleDeleteService}
            onGenerateServiceReport={generateServiceReport}
          />
        )}
        {activeTab === 'rentals' && (
          <RentalManagement
            rentals={rentals}
            vehicles={vehicles}
            rentalData={rentalData}
            setRentalData={setRentalData}
            showRentalModal={showRentalModal}
            setShowRentalModal={setShowRentalModal}
            editingRental={editingRental}
            setEditingRental={setEditingRental}
            loading={loading}
            onRentalSubmit={handleRentalSubmit}
            onDeleteRental={handleDeleteRental}
            onUpdateRentalStatus={handleUpdateRentalStatus}
          />
        )}
        {activeTab === 'bookings' && (
          <BookingManagement
            bookings={bookings}
            loading={loading}
            onUpdateBookingStatus={handleUpdateBookingStatus}
            onDeleteBooking={handleDeleteBooking}
            onGenerateBookingReport={generateBookingReport}
          />
        )}
        {activeTab === 'payments' && (
          <PaymentManagement
            payments={payments}
            loading={loading}
            onUpdatePaymentStatus={handleUpdatePaymentStatus}
            onDeletePayment={handleDeletePayment}
            onEditPayment={handleEditPayment}
          />
        )}
        {activeTab === 'financial' && (
          <FinancialManagement
            financialData={financialData}
            financialEntries={financialEntries}
            loading={loading}
            onRefreshData={loadDashboardData}
            onAddFinancialEntry={handleAddFinancialEntry}
            onUpdateFinancialEntry={handleUpdateFinancialEntry}
            onDeleteFinancialEntry={handleDeleteFinancialEntry}
          />
        )}
        {activeTab === 'tour-packages' && (
          <TourPackageManagement
            tourPackages={tourPackages}
            loading={loading}
            onTourPackageSubmit={handleTourPackageSubmit}
            onDeleteTourPackage={handleDeleteTourPackage}
            onRefreshData={loadDashboardData}
          />
        )}
        {activeTab === 'tour-bookings' && (
          <TourBookingManagement
            tourBookings={tourBookings}
            loading={loading}
            onRefreshData={loadDashboardData}
          />
        )}
        {activeTab === 'vehicle-providers' && (
          <VehicleProviderManagement />
        )}
        {activeTab === 'vehicle-requests' && (
          <VehicleRequestManagement />
        )}
        {activeTab === 'profile' && (
          <AdminProfile
            user={user}
            onUpdateProfile={handleUpdateProfile}
          />
        )}
      </div>

      {/* Service Reminders Modal */}
      <ServiceRemindersModal
        showModal={showRemindersModal}
        onClose={() => setShowRemindersModal(false)}
        serviceReminders={serviceReminders}
      />

    </div>
  );
};

export default AdminDashboard;







