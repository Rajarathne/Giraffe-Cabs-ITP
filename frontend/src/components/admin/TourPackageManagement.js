import React, { useState } from 'react';
import axios from 'axios';
import './TourPackageManagement.css';
import './AdminFormStyles.css';

const TourPackageManagement = ({ 
  tourPackages, 
  loading,
  onTourPackageSubmit,
  onDeleteTourPackage,
  onRefreshData
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [uploadedImages, setUploadedImages] = useState([]);
  const [, setUploadStatus] = useState({ loading: false, message: '' });
  const [reportFilters, setReportFilters] = useState({
    dateFrom: '',
    dateTo: '',
    category: '',
    status: '',
    tourType: ''
  });
  const [reportData, setReportData] = useState(null);
  const [generatingReport, setGeneratingReport] = useState(false);

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [tourTypeFilter, setTourTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [packageData, setPackageData] = useState({
    packageName: '',
    description: '',
    destination: '',
    visitLocations: [{ location: '', description: '', duration: '' }],
    tourDays: 1,
    fullDistance: 0,
    minPassengers: 10,
    maxPassengers: 20,
    pricePerPerson: 0,
    totalPackagePrice: 0,
    tourCategory: 'Nature',
    tourType: 'One-day',
    discountOptions: {
      earlyBooking: { percentage: 0, daysBefore: 0 },
      groupDiscount: { percentage: 0, minGroupSize: 0 }
    },
    includedServices: [{ service: '', description: '' }],
    excludedServices: [{ service: '', description: '' }],
    paymentType: 'full_upfront',
    vehicleTypes: [],
    accommodationDetails: {
      type: 'none',
      name: '',
      rating: 3,
      location: '',
      amenities: []
    },
    mealPlan: {
      breakfast: false,
      lunch: false,
      dinner: false,
      description: ''
    },
    tourGuide: {
      available: false,
      guideName: '',
      guideExperience: '',
      languages: []
    },
    safetyInfo: {
      insurance: false,
      emergencyContact: '',
      medicalSupport: false,
      safetyGuidelines: []
    },
    images: [],
    status: 'active',
    isAvailable: true,
    seasonalInfo: {
      startDate: '',
      endDate: '',
      bestTimeToVisit: ''
    },
    specialRequirements: [],
    cancellationPolicy: '',
    termsAndConditions: ''
  });

  // Enhanced validation function
  const validateTourPackageData = (data) => {
    const errors = {};

    // Package Name Validation - Only characters, spaces, and common punctuation
    if (!data.packageName || data.packageName.trim() === '') {
      errors.packageName = 'Package name is required';
    } else if (!/^[a-zA-Z\s\-&.,()]+$/.test(data.packageName.trim())) {
      errors.packageName = 'Package name can only contain letters, spaces, hyphens, ampersands, commas, periods, and parentheses';
    } else if (data.packageName.trim().length < 3) {
      errors.packageName = 'Package name must be at least 3 characters long';
    } else if (data.packageName.trim().length > 100) {
      errors.packageName = 'Package name cannot exceed 100 characters';
    }

    // Destination Validation - Only characters, spaces, and common punctuation
    if (!data.destination || data.destination.trim() === '') {
      errors.destination = 'Destination is required';
    } else if (!/^[a-zA-Z\s\-&.,()]+$/.test(data.destination.trim())) {
      errors.destination = 'Destination can only contain letters, spaces, hyphens, ampersands, commas, periods, and parentheses';
    } else if (data.destination.trim().length < 2) {
      errors.destination = 'Destination must be at least 2 characters long';
    } else if (data.destination.trim().length > 50) {
      errors.destination = 'Destination cannot exceed 50 characters';
    }

    // Description Validation
    if (!data.description || data.description.trim() === '') {
      errors.description = 'Description is required';
    } else if (data.description.trim().length < 10) {
      errors.description = 'Description must be at least 10 characters long';
    } else if (data.description.trim().length > 500) {
      errors.description = 'Description cannot exceed 500 characters';
    }

    // Tour Days Validation
    if (!data.tourDays || data.tourDays < 1) {
      errors.tourDays = 'Tour days must be at least 1';
    } else if (data.tourDays > 30) {
      errors.tourDays = 'Tour days cannot exceed 30';
    }

    // Distance Validation
    if (!data.fullDistance || data.fullDistance <= 0) {
      errors.fullDistance = 'Total distance must be greater than 0';
    } else if (data.fullDistance > 10000) {
      errors.fullDistance = 'Total distance cannot exceed 10,000 km';
    }

    // Price Validation
    if (!data.pricePerPerson || data.pricePerPerson <= 0) {
      errors.pricePerPerson = 'Price per person must be greater than 0';
    } else if (data.pricePerPerson > 1000000) {
      errors.pricePerPerson = 'Price per person cannot exceed LKR 1,000,000';
    }

    // Total Package Price Validation
    if (data.totalPackagePrice && data.totalPackagePrice < 0) {
      errors.totalPackagePrice = 'Total package price cannot be negative';
    } else if (data.totalPackagePrice && data.totalPackagePrice > 10000000) {
      errors.totalPackagePrice = 'Total package price cannot exceed LKR 10,000,000';
    }

    // Passenger Limits Validation
    if (!data.minPassengers || data.minPassengers < 1) {
      errors.minPassengers = 'Minimum passengers must be at least 1';
    } else if (data.minPassengers > 100) {
      errors.minPassengers = 'Minimum passengers cannot exceed 100';
    }

    if (!data.maxPassengers || data.maxPassengers < 1) {
      errors.maxPassengers = 'Maximum passengers must be at least 1';
    } else if (data.maxPassengers > 100) {
      errors.maxPassengers = 'Maximum passengers cannot exceed 100';
    }

    if (data.minPassengers && data.maxPassengers && data.minPassengers > data.maxPassengers) {
      errors.maxPassengers = 'Maximum passengers must be greater than or equal to minimum passengers';
    }

    // Visit Locations Validation
    if (!data.visitLocations || data.visitLocations.length === 0) {
      errors.visitLocations = 'At least one visit location is required';
    } else {
      data.visitLocations.forEach((location, index) => {
        if (!location.location || location.location.trim() === '') {
          errors[`visitLocations_${index}_location`] = 'Location name is required';
        } else if (!/^[a-zA-Z\s\-&.,()]+$/.test(location.location.trim())) {
          errors[`visitLocations_${index}_location`] = 'Location name can only contain letters, spaces, hyphens, ampersands, commas, periods, and parentheses';
        } else if (location.location.trim().length > 50) {
          errors[`visitLocations_${index}_location`] = 'Location name cannot exceed 50 characters';
        }
      });
    }

    // Vehicle Types Validation
    if (!data.vehicleTypes || data.vehicleTypes.length === 0) {
      errors.vehicleTypes = 'At least one vehicle type must be selected';
    }

    // Included Services Validation
    if (!data.includedServices || data.includedServices.length === 0) {
      errors.includedServices = 'At least one included service is required';
    } else {
      data.includedServices.forEach((service, index) => {
        if (!service.service || service.service.trim() === '') {
          errors[`includedServices_${index}_service`] = 'Service name is required';
        } else if (service.service.trim().length > 100) {
          errors[`includedServices_${index}_service`] = 'Service name cannot exceed 100 characters';
        }
      });
    }

    // Accommodation Details Validation
    if (data.accommodationDetails && data.accommodationDetails.type !== 'none') {
      if (!data.accommodationDetails.name || data.accommodationDetails.name.trim() === '') {
        errors.accommodationName = 'Accommodation name is required when accommodation type is selected';
      } else if (!/^[a-zA-Z\s\-&.,()]+$/.test(data.accommodationDetails.name.trim())) {
        errors.accommodationName = 'Accommodation name can only contain letters, spaces, hyphens, ampersands, commas, periods, and parentheses';
      }
      
      if (data.accommodationDetails.rating && (data.accommodationDetails.rating < 1 || data.accommodationDetails.rating > 5)) {
        errors.accommodationRating = 'Accommodation rating must be between 1 and 5';
      }
    }

    // Tour Guide Validation
    if (data.tourGuide && data.tourGuide.available) {
      if (!data.tourGuide.guideName || data.tourGuide.guideName.trim() === '') {
        errors.guideName = 'Guide name is required when tour guide is available';
      } else if (!/^[a-zA-Z\s\-&.,()]+$/.test(data.tourGuide.guideName.trim())) {
        errors.guideName = 'Guide name can only contain letters, spaces, hyphens, ampersands, commas, periods, and parentheses';
      }
    }

    // Seasonal Info Validation
    if (data.seasonalInfo) {
      if (data.seasonalInfo.startDate && data.seasonalInfo.endDate) {
        const startDate = new Date(data.seasonalInfo.startDate);
        const endDate = new Date(data.seasonalInfo.endDate);
        if (startDate >= endDate) {
          errors.seasonalEndDate = 'End date must be after start date';
        }
      }
    }

    return errors;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Clear validation error for this field when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setPackageData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setPackageData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleArrayInputChange = (arrayName, index, field, value) => {
    setPackageData(prev => ({
      ...prev,
      [arrayName]: prev[arrayName].map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const addArrayItem = (arrayName, defaultItem) => {
    setPackageData(prev => ({
      ...prev,
      [arrayName]: [...prev[arrayName], defaultItem]
    }));
  };

  const removeArrayItem = (arrayName, index) => {
    setPackageData(prev => ({
      ...prev,
      [arrayName]: prev[arrayName].filter((_, i) => i !== index)
    }));
  };

  const handleVehicleTypeChange = (vehicleType, checked) => {
    setPackageData(prev => ({
      ...prev,
      vehicleTypes: checked 
        ? [...prev.vehicleTypes, vehicleType]
        : prev.vehicleTypes.filter(type => type !== vehicleType)
    }));
  };

  // Filter tour packages based on search term and filters
  const filteredTourPackages = tourPackages.filter(pkg => {
    const searchLower = searchTerm.toLowerCase();
    
    // Apply search filter
    const matchesSearch = !searchTerm || (
      pkg.packageName?.toLowerCase().includes(searchLower) ||
      pkg.destination?.toLowerCase().includes(searchLower) ||
      pkg.description?.toLowerCase().includes(searchLower) ||
      pkg.tourCategory?.toLowerCase().includes(searchLower) ||
      pkg.tourType?.toLowerCase().includes(searchLower) ||
      pkg.pricePerPerson?.toString().includes(searchTerm) ||
      pkg.tourDays?.toString().includes(searchTerm) ||
      pkg.minPassengers?.toString().includes(searchTerm) ||
      pkg.maxPassengers?.toString().includes(searchTerm)
    );

    // Apply category filter
    const matchesCategory = categoryFilter === 'all' || pkg.tourCategory === categoryFilter;

    // Apply tour type filter
    const matchesTourType = tourTypeFilter === 'all' || pkg.tourType === tourTypeFilter;

    // Apply status filter
    const matchesStatus = statusFilter === 'all' || pkg.status === statusFilter;

    // Apply price filter
    let matchesPrice = true;
    if (priceFilter !== 'all' && pkg.pricePerPerson) {
      switch (priceFilter) {
        case 'low':
          matchesPrice = pkg.pricePerPerson < 10000;
          break;
        case 'medium':
          matchesPrice = pkg.pricePerPerson >= 10000 && pkg.pricePerPerson < 50000;
          break;
        case 'high':
          matchesPrice = pkg.pricePerPerson >= 50000;
          break;
        default:
          break;
      }
    }

    return matchesSearch && matchesCategory && matchesTourType && matchesStatus && matchesPrice;
  });


  const handleImageSubmit = async () => {
    if (uploadedImages.length === 0) {
      return [];
    }

    setUploadStatus({ loading: true, message: 'Uploading images...' });

    const formData = new FormData();
    uploadedImages.forEach((imageData, index) => {
      formData.append('images', imageData.file);
    });

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/upload/tour-package-images', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        setPackageData(prev => ({
          ...prev,
          images: [...prev.images, ...result.images]
        }));
        setUploadedImages([]);
        setUploadStatus({ loading: false, message: 'Images uploaded successfully!' });
        setTimeout(() => setUploadStatus({ loading: false, message: '' }), 3000);
        return result.images;
      } else {
        console.warn('Image upload failed, continuing without images');
        setUploadedImages([]);
        setUploadStatus({ loading: false, message: 'Image upload failed, but package will be created without images.' });
        setTimeout(() => setUploadStatus({ loading: false, message: '' }), 5000);
        return [];
      }
    } catch (error) {
      console.warn('Image upload error, continuing without images:', error);
      setUploadedImages([]);
      setUploadStatus({ loading: false, message: 'Image upload failed, but package will be created without images.' });
      setTimeout(() => setUploadStatus({ loading: false, message: '' }), 5000);
      return [];
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous validation errors
    setValidationErrors({});
    
    // Validate the form data
    const errors = validateTourPackageData(packageData);
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    try {
      // Upload images first if there are any (optional - won't fail the form)
      if (uploadedImages.length > 0) {
        try {
          await handleImageSubmit();
        } catch (uploadError) {
          console.warn('Image upload failed, but continuing with package creation:', uploadError);
        }
      }
      
      await onTourPackageSubmit(packageData, editingPackage);
      setShowModal(false);
      setEditingPackage(null);
      setValidationErrors({});
      setUploadedImages([]);
      setUploadStatus({ loading: false, message: '' });
      resetForm();
    } catch (error) {
      console.error('Error submitting tour package:', error);
    }
  };

  const resetForm = () => {
    setValidationErrors({});
    setUploadedImages([]);
    setUploadStatus({ loading: false, message: '' });
    setPackageData({
      packageName: '',
      description: '',
      destination: '',
      visitLocations: [{ location: '', description: '', duration: '' }],
      tourDays: 1,
      fullDistance: 0,
      minPassengers: 10,
      maxPassengers: 20,
      pricePerPerson: 0,
      totalPackagePrice: 0,
      tourCategory: 'Nature',
      tourType: 'One-day',
      discountOptions: {
        earlyBooking: { percentage: 0, daysBefore: 0 },
        groupDiscount: { percentage: 0, minGroupSize: 0 }
      },
      includedServices: [{ service: '', description: '' }],
      excludedServices: [{ service: '', description: '' }],
      paymentType: 'full_upfront',
      vehicleTypes: [],
      accommodationDetails: {
        type: 'none',
        name: '',
        rating: 3,
        location: '',
        amenities: []
      },
      mealPlan: {
        breakfast: false,
        lunch: false,
        dinner: false,
        description: ''
      },
      tourGuide: {
        available: false,
        guideName: '',
        guideExperience: '',
        languages: []
      },
      safetyInfo: {
        insurance: false,
        emergencyContact: '',
        medicalSupport: false,
        safetyGuidelines: []
      },
      images: [],
      status: 'active',
      isAvailable: true,
      seasonalInfo: {
        startDate: '',
        endDate: '',
        bestTimeToVisit: ''
      },
      specialRequirements: [],
      cancellationPolicy: '',
      termsAndConditions: ''
    });
  };

  const handleEdit = (tourPackage) => {
    setEditingPackage(tourPackage);
    setPackageData(tourPackage);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this tour package?')) {
      await onDeleteTourPackage(id);
    }
  };

  // Report Generation Functions
  const generateReport = async (reportType) => {
    setGeneratingReport(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      const headers = { Authorization: `Bearer ${token}` };
      let endpoint = '';
      let filename = '';
      let responseType = 'blob';
      
      switch (reportType) {
        case 'package-analytics':
          endpoint = '/api/tour-packages/reports/analytics';
          filename = `Tour_Package_Analytics_Report_${new Date().toISOString().split('T')[0]}.pdf`;
          responseType = 'blob';
          break;
        case 'booking-revenue':
          endpoint = '/api/tour-packages/reports/revenue';
          filename = `Tour_Package_Revenue_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
          responseType = 'blob';
          break;
        case 'popular-destinations':
          endpoint = '/api/tour-packages/reports/destinations';
          filename = `Popular_Destinations_Report_${new Date().toISOString().split('T')[0]}.csv`;
          responseType = 'blob';
          break;
        default:
          throw new Error('Invalid report type');
      }
      
      const response = await axios.get(endpoint, {
        headers,
        responseType
      });

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
      setGeneratingReport(false);
    }
  };

  // Note: exportReport function removed as reports are now directly downloaded from backend

  // Note: CSV generation functions removed as reports are now generated on backend


  const renderReportContent = (reportData) => {
    const { type, data } = reportData;

    switch (type) {
      case 'package-analytics':
        return (
          <div className="analytics-report">
            <div className="summary-stats">
              <div className="stat-card">
                <h4>Total Packages</h4>
                <span className="stat-value">{data.totalPackages || 0}</span>
              </div>
              <div className="stat-card">
                <h4>Total Bookings</h4>
                <span className="stat-value">{data.totalBookings || 0}</span>
              </div>
              <div className="stat-card">
                <h4>Total Revenue</h4>
                <span className="stat-value">LKR {data.totalRevenue?.toLocaleString() || 0}</span>
              </div>
              <div className="stat-card">
                <h4>Average Price</h4>
                <span className="stat-value">LKR {data.averagePrice?.toLocaleString() || 0}</span>
              </div>
            </div>
            
            {data.packages && (
              <div className="packages-table">
                <h4>Package Performance</h4>
                <table>
                  <thead>
                    <tr>
                      <th>Package Name</th>
                      <th>Category</th>
                      <th>Bookings</th>
                      <th>Revenue</th>
                      <th>Avg Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.packages.map((pkg, index) => (
                      <tr key={index}>
                        <td>{pkg.packageName}</td>
                        <td>{pkg.category}</td>
                        <td>{pkg.bookings}</td>
                        <td>LKR {pkg.revenue?.toLocaleString()}</td>
                        <td>{pkg.rating || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );

      case 'booking-revenue':
        return (
          <div className="revenue-report">
            <div className="summary-stats">
              <div className="stat-card">
                <h4>Total Revenue</h4>
                <span className="stat-value">LKR {data.totalRevenue?.toLocaleString() || 0}</span>
              </div>
              <div className="stat-card">
                <h4>Total Bookings</h4>
                <span className="stat-value">{data.totalBookings || 0}</span>
              </div>
              <div className="stat-card">
                <h4>Average Revenue</h4>
                <span className="stat-value">LKR {data.averageRevenue?.toLocaleString() || 0}</span>
              </div>
            </div>
            
            {data.dailyRevenue && (
              <div className="revenue-chart">
                <h4>Daily Revenue Trend</h4>
                <div className="chart-placeholder">
                  <p>Revenue chart would be displayed here</p>
                  <p>Data points: {data.dailyRevenue.length}</p>
                </div>
              </div>
            )}
          </div>
        );

      case 'popular-destinations':
        return (
          <div className="destinations-report">
            <div className="destinations-list">
              {data.destinations?.map((dest, index) => (
                <div key={index} className="destination-card">
                  <h4>{dest.destination}</h4>
                  <div className="destination-stats">
                    <span>Bookings: {dest.bookings}</span>
                    <span>Revenue: LKR {dest.revenue?.toLocaleString()}</span>
                    <span>Popularity: {dest.popularity}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'category-performance':
        return (
          <div className="category-report">
            <div className="categories-grid">
              {data.categories?.map((category, index) => (
                <div key={index} className="category-card">
                  <h4>{category.name}</h4>
                  <div className="category-stats">
                    <div className="stat">
                      <span className="label">Packages:</span>
                      <span className="value">{category.packages}</span>
                    </div>
                    <div className="stat">
                      <span className="label">Bookings:</span>
                      <span className="value">{category.bookings}</span>
                    </div>
                    <div className="stat">
                      <span className="label">Revenue:</span>
                      <span className="value">LKR {category.revenue?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <div className="default-report">
            <p>Report data is being processed...</p>
            <pre>{JSON.stringify(data, null, 2)}</pre>
          </div>
        );
    }
  };

  return (
    <div className="tour-package-management">
      <div className="content-header">
        <h2>Tour Package Management</h2>
        <div className="header-actions">
          <button 
            className="btn btn-info"
            onClick={() => setShowReportsModal(true)}
          >
            <i className="fas fa-chart-bar"></i> Generate Reports
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => {
              resetForm();
              setEditingPackage(null);
              setShowModal(true);
            }}
          >
            <i className="fas fa-plus"></i> Add Tour Package
          </button>
        </div>
      </div>

      {/* Compact Search and Filter Bar */}
      <div className="compact-search-filter">
        <div className="search-input-wrapper">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search tour packages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="clear-btn">
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
        
        <div className="filter-dropdowns">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="Adventure">Adventure</option>
            <option value="Pilgrimage">Pilgrimage</option>
            <option value="Nature">Nature</option>
            <option value="Cultural">Cultural</option>
            <option value="Family">Family</option>
            <option value="Corporate">Corporate</option>
          </select>
          
          <select
            value={tourTypeFilter}
            onChange={(e) => setTourTypeFilter(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="One-day">One-day</option>
            <option value="Multi-day">Multi-day</option>
            <option value="Seasonal">Seasonal</option>
          </select>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="seasonal">Seasonal</option>
          </select>
          
          <select
            value={priceFilter}
            onChange={(e) => setPriceFilter(e.target.value)}
          >
            <option value="all">All Prices</option>
            <option value="low">Under 10K</option>
            <option value="medium">10K-50K</option>
            <option value="high">Over 50K</option>
          </select>
        </div>
        
        <div className="results-info">
          {filteredTourPackages.length} package{filteredTourPackages.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="tour-packages-table">
        <table>
          <thead>
            <tr>
              <th>Package Name</th>
              <th>Destination</th>
              <th>Category</th>
              <th>Type</th>
              <th>Days</th>
              <th>Price/Person</th>
              <th>Passengers</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTourPackages.map(pkg => (
              <tr key={pkg._id}>
                <td title={pkg.packageName}>{pkg.packageName}</td>
                <td>{pkg.destination}</td>
                <td>
                  <span className={`category-badge category-${pkg.tourCategory.toLowerCase()}`}>
                    {pkg.tourCategory}
                  </span>
                </td>
                <td>{pkg.tourType}</td>
                <td>{pkg.tourDays}</td>
                <td>LKR {pkg.pricePerPerson?.toLocaleString()}</td>
                <td>{pkg.minPassengers}-{pkg.maxPassengers}</td>
                <td>
                  <span className={`status status-${pkg.status}`}>
                    {pkg.status}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button 
                      className="btn btn-sm btn-primary"
                      onClick={() => handleEdit(pkg)}
                      title="Edit Package"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button 
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(pkg._id)}
                      title="Delete Package"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tour Package Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => {
          setShowModal(false);
          setValidationErrors({});
          setUploadStatus({ loading: false, message: '' });
        }}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => {
              setShowModal(false);
              setValidationErrors({});
              setUploadStatus({ loading: false, message: '' });
            }}>&times;</button>
            <h2>{editingPackage ? 'Edit Tour Package' : 'Add New Tour Package'}</h2>
            
            <form onSubmit={handleSubmit} className="tour-package-form">
              {/* Basic Information */}
              <div className="form-section">
                <h3>Basic Information</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="packageName">Package Name</label>
                    <input
                      type="text"
                      id="packageName"
                      name="packageName"
                      value={packageData.packageName}
                      onChange={handleInputChange}
                      required
                      pattern="[a-zA-Z\s\-&.,()]+"
                      title="Package name can only contain letters, spaces, hyphens, ampersands, commas, periods, and parentheses"
                      minLength="3"
                      maxLength="100"
                      className={validationErrors.packageName ? 'error' : ''}
                    />
                    {validationErrors.packageName && (
                      <div className="error-message">{validationErrors.packageName}</div>
                    )}
                  </div>
                  <div className="form-group">
                    <label htmlFor="destination">Destination</label>
                    <input
                      type="text"
                      id="destination"
                      name="destination"
                      value={packageData.destination}
                      onChange={handleInputChange}
                      required
                      pattern="[a-zA-Z\s\-&.,()]+"
                      title="Destination can only contain letters, spaces, hyphens, ampersands, commas, periods, and parentheses"
                      minLength="2"
                      maxLength="50"
                      className={validationErrors.destination ? 'error' : ''}
                    />
                    {validationErrors.destination && (
                      <div className="error-message">{validationErrors.destination}</div>
                    )}
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    value={packageData.description}
                    onChange={handleInputChange}
                    rows="4"
                    required
                    minLength="10"
                    maxLength="500"
                    className={validationErrors.description ? 'error' : ''}
                  />
                  {validationErrors.description && (
                    <div className="error-message">{validationErrors.description}</div>
                  )}
                </div>
              </div>

              {/* Duration and Distance */}
              <div className="form-section">
                <h3>Duration & Distance</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="tourDays">Tour Days</label>
                    <input
                      type="number"
                      id="tourDays"
                      name="tourDays"
                      value={packageData.tourDays}
                      onChange={handleInputChange}
                      min="1"
                      max="30"
                      required
                      className={validationErrors.tourDays ? 'error' : ''}
                    />
                    {validationErrors.tourDays && (
                      <div className="error-message">{validationErrors.tourDays}</div>
                    )}
                  </div>
                  <div className="form-group">
                    <label htmlFor="fullDistance">Total Distance (km)</label>
                    <input
                      type="number"
                      id="fullDistance"
                      name="fullDistance"
                      value={packageData.fullDistance}
                      onChange={handleInputChange}
                      min="1"
                      max="10000"
                      step="0.1"
                      required
                      className={validationErrors.fullDistance ? 'error' : ''}
                    />
                    {validationErrors.fullDistance && (
                      <div className="error-message">{validationErrors.fullDistance}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div className="form-section">
                <h3>Pricing</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="pricePerPerson">Price per Person (LKR)</label>
                    <input
                      type="number"
                      id="pricePerPerson"
                      name="pricePerPerson"
                      value={packageData.pricePerPerson}
                      onChange={handleInputChange}
                      min="1"
                      max="1000000"
                      step="0.01"
                      required
                      className={validationErrors.pricePerPerson ? 'error' : ''}
                    />
                    {validationErrors.pricePerPerson && (
                      <div className="error-message">{validationErrors.pricePerPerson}</div>
                    )}
                  </div>
                  <div className="form-group">
                    <label htmlFor="totalPackagePrice">Total Package Price (LKR)</label>
                    <input
                      type="number"
                      id="totalPackagePrice"
                      name="totalPackagePrice"
                      value={packageData.totalPackagePrice}
                      onChange={handleInputChange}
                      min="0"
                      max="10000000"
                      step="0.01"
                      className={validationErrors.totalPackagePrice ? 'error' : ''}
                    />
                    {validationErrors.totalPackagePrice && (
                      <div className="error-message">{validationErrors.totalPackagePrice}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Category and Type */}
              <div className="form-section">
                <h3>Category & Type</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="tourCategory">Tour Category</label>
                    <select
                      id="tourCategory"
                      name="tourCategory"
                      value={packageData.tourCategory}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="Adventure">Adventure</option>
                      <option value="Pilgrimage">Pilgrimage</option>
                      <option value="Nature">Nature</option>
                      <option value="Cultural">Cultural</option>
                      <option value="Family">Family</option>
                      <option value="Corporate">Corporate</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="tourType">Tour Type</label>
                    <select
                      id="tourType"
                      name="tourType"
                      value={packageData.tourType}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="One-day">One-day</option>
                      <option value="Multi-day">Multi-day</option>
                      <option value="Seasonal">Seasonal</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Passenger Limits */}
              <div className="form-section">
                <h3>Passenger Limits</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="minPassengers">Minimum Passengers</label>
                    <input
                      type="number"
                      id="minPassengers"
                      name="minPassengers"
                      value={packageData.minPassengers}
                      onChange={handleInputChange}
                      min="1"
                      max="100"
                      required
                      className={validationErrors.minPassengers ? 'error' : ''}
                    />
                    {validationErrors.minPassengers && (
                      <div className="error-message">{validationErrors.minPassengers}</div>
                    )}
                  </div>
                  <div className="form-group">
                    <label htmlFor="maxPassengers">Maximum Passengers</label>
                    <input
                      type="number"
                      id="maxPassengers"
                      name="maxPassengers"
                      value={packageData.maxPassengers}
                      onChange={handleInputChange}
                      min="1"
                      max="100"
                      required
                      className={validationErrors.maxPassengers ? 'error' : ''}
                    />
                    {validationErrors.maxPassengers && (
                      <div className="error-message">{validationErrors.maxPassengers}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Visit Locations */}
              <div className="form-section">
                <h3>Visit Locations</h3>
                {validationErrors.visitLocations && (
                  <div className="error-message">{validationErrors.visitLocations}</div>
                )}
                {packageData.visitLocations.map((location, index) => (
                  <div key={index} className="location-item">
                    <div className="form-row">
                      <div className="form-group">
                        <label>Location</label>
                        <input
                          type="text"
                          value={location.location}
                          onChange={(e) => handleArrayInputChange('visitLocations', index, 'location', e.target.value)}
                          required
                          pattern="[a-zA-Z\s\-&.,()]+"
                          title="Location name can only contain letters, spaces, hyphens, ampersands, commas, periods, and parentheses"
                          maxLength="50"
                          className={validationErrors[`visitLocations_${index}_location`] ? 'error' : ''}
                        />
                        {validationErrors[`visitLocations_${index}_location`] && (
                          <div className="error-message">{validationErrors[`visitLocations_${index}_location`]}</div>
                        )}
                      </div>
                      <div className="form-group">
                        <label>Duration</label>
                        <input
                          type="text"
                          value={location.duration}
                          onChange={(e) => handleArrayInputChange('visitLocations', index, 'duration', e.target.value)}
                          placeholder="e.g., 2 hours, Half day"
                        />
                      </div>
                      <div className="form-group">
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => removeArrayItem('visitLocations', index)}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Description</label>
                      <textarea
                        value={location.description}
                        onChange={(e) => handleArrayInputChange('visitLocations', index, 'description', e.target.value)}
                        rows="2"
                      />
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => addArrayItem('visitLocations', { location: '', description: '', duration: '' })}
                >
                  <i className="fas fa-plus"></i> Add Location
                </button>
              </div>

              {/* Vehicle Types */}
              <div className="form-section">
                <h3>Vehicle Types</h3>
                {validationErrors.vehicleTypes && (
                  <div className="error-message">{validationErrors.vehicleTypes}</div>
                )}
                <div className="checkbox-group">
                  {['van', 'bus', 'car', 'jeep'].map(vehicleType => (
                    <label key={vehicleType} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={packageData.vehicleTypes.includes(vehicleType)}
                        onChange={(e) => handleVehicleTypeChange(vehicleType, e.target.checked)}
                      />
                      {vehicleType.charAt(0).toUpperCase() + vehicleType.slice(1)}
                    </label>
                  ))}
                </div>
              </div>

              {/* Included Services */}
              <div className="form-section">
                <h3>Included Services</h3>
                {validationErrors.includedServices && (
                  <div className="error-message">{validationErrors.includedServices}</div>
                )}
                {packageData.includedServices.map((service, index) => (
                  <div key={index} className="service-item">
                    <div className="form-row">
                      <div className="form-group">
                        <label>Service</label>
                        <input
                          type="text"
                          value={service.service}
                          onChange={(e) => handleArrayInputChange('includedServices', index, 'service', e.target.value)}
                          required
                          placeholder="e.g., Transportation, Guide"
                          maxLength="100"
                          className={validationErrors[`includedServices_${index}_service`] ? 'error' : ''}
                        />
                        {validationErrors[`includedServices_${index}_service`] && (
                          <div className="error-message">{validationErrors[`includedServices_${index}_service`]}</div>
                        )}
                      </div>
                      <div className="form-group">
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => removeArrayItem('includedServices', index)}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Description</label>
                      <textarea
                        value={service.description}
                        onChange={(e) => handleArrayInputChange('includedServices', index, 'description', e.target.value)}
                        rows="2"
                        placeholder="Optional description"
                      />
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => addArrayItem('includedServices', { service: '', description: '' })}
                >
                  <i className="fas fa-plus"></i> Add Included Service
                </button>
              </div>

              {/* Excluded Services */}
              <div className="form-section">
                <h3>Excluded Services</h3>
                {packageData.excludedServices.map((service, index) => (
                  <div key={index} className="service-item">
                    <div className="form-row">
                      <div className="form-group">
                        <label>Service</label>
                        <input
                          type="text"
                          value={service.service}
                          onChange={(e) => handleArrayInputChange('excludedServices', index, 'service', e.target.value)}
                          required
                          placeholder="e.g., Meals, Accommodation"
                        />
                      </div>
                      <div className="form-group">
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => removeArrayItem('excludedServices', index)}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Description</label>
                      <textarea
                        value={service.description}
                        onChange={(e) => handleArrayInputChange('excludedServices', index, 'description', e.target.value)}
                        rows="2"
                        placeholder="Optional description"
                      />
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => addArrayItem('excludedServices', { service: '', description: '' })}
                >
                  <i className="fas fa-plus"></i> Add Excluded Service
                </button>
              </div>

              {/* Status */}
              <div className="form-section">
                <h3>Status</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="status">Status</label>
                    <select
                      id="status"
                      name="status"
                      value={packageData.status}
                      onChange={handleInputChange}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="seasonal">Seasonal</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="isAvailable"
                        checked={packageData.isAvailable}
                        onChange={handleInputChange}
                      />
                      Available for Booking
                    </label>
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setShowModal(false);
                  setValidationErrors({});
                  setUploadStatus({ loading: false, message: '' });
                }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : (editingPackage ? 'Update Package' : 'Create Package')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reports Modal */}
      {showReportsModal && (
        <div className="modal-overlay" onClick={() => setShowReportsModal(false)}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowReportsModal(false)}>&times;</button>
            <h2>Tour Package Reports</h2>
            
            {!reportData ? (
              <div className="reports-selection">
                <div className="form-section">
                  <h3>Report Filters</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="dateFrom">From Date</label>
                      <input
                        type="date"
                        id="dateFrom"
                        value={reportFilters.dateFrom}
                        onChange={(e) => setReportFilters({...reportFilters, dateFrom: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="dateTo">To Date</label>
                      <input
                        type="date"
                        id="dateTo"
                        value={reportFilters.dateTo}
                        onChange={(e) => setReportFilters({...reportFilters, dateTo: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="category">Category</label>
                      <select
                        id="category"
                        value={reportFilters.category}
                        onChange={(e) => setReportFilters({...reportFilters, category: e.target.value})}
                      >
                        <option value="">All Categories</option>
                        <option value="Adventure">Adventure</option>
                        <option value="Pilgrimage">Pilgrimage</option>
                        <option value="Nature">Nature</option>
                        <option value="Cultural">Cultural</option>
                        <option value="Family">Family</option>
                        <option value="Corporate">Corporate</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="tourType">Tour Type</label>
                      <select
                        id="tourType"
                        value={reportFilters.tourType}
                        onChange={(e) => setReportFilters({...reportFilters, tourType: e.target.value})}
                      >
                        <option value="">All Types</option>
                        <option value="One-day">One-day</option>
                        <option value="Multi-day">Multi-day</option>
                        <option value="Seasonal">Seasonal</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="reports-grid">
                  <div className="report-card" onClick={() => generateReport('package-analytics')}>
                    <div className="report-icon">
                      <i className="fas fa-chart-line"></i>
                    </div>
                    <h4>Package Analytics</h4>
                    <p>Comprehensive analysis of tour package performance, bookings, and revenue</p>
                  </div>

                  <div className="report-card" onClick={() => generateReport('booking-revenue')}>
                    <div className="report-icon">
                      <i className="fas fa-money-bill-wave"></i>
                    </div>
                    <h4>Booking Revenue</h4>
                    <p>Revenue analysis by date, package, and customer segments</p>
                  </div>

                  <div className="report-card" onClick={() => generateReport('popular-destinations')}>
                    <div className="report-icon">
                      <i className="fas fa-map-marker-alt"></i>
                    </div>
                    <h4>Popular Destinations</h4>
                    <p>Analysis of most popular destinations and their performance metrics</p>
                  </div>

                  <div className="report-card" onClick={() => generateReport('category-performance')}>
                    <div className="report-icon">
                      <i className="fas fa-tags"></i>
                    </div>
                    <h4>Category Performance</h4>
                    <p>Performance comparison across different tour categories</p>
                  </div>

                  <div className="report-card" onClick={() => generateReport('seasonal-analysis')}>
                    <div className="report-icon">
                      <i className="fas fa-calendar-alt"></i>
                    </div>
                    <h4>Seasonal Analysis</h4>
                    <p>Seasonal trends and patterns in tour package bookings</p>
                  </div>

                  <div className="report-card" onClick={() => generateReport('customer-preferences')}>
                    <div className="report-icon">
                      <i className="fas fa-users"></i>
                    </div>
                    <h4>Customer Preferences</h4>
                    <p>Analysis of customer preferences and booking patterns</p>
                  </div>

                  <div className="report-card" onClick={() => generateReport('pricing-analysis')}>
                    <div className="report-icon">
                      <i className="fas fa-dollar-sign"></i>
                    </div>
                    <h4>Pricing Analysis</h4>
                    <p>Price sensitivity analysis and optimal pricing strategies</p>
                  </div>

                  <div className="report-card" onClick={() => generateReport('capacity-utilization')}>
                    <div className="report-icon">
                      <i className="fas fa-bus"></i>
                    </div>
                    <h4>Capacity Utilization</h4>
                    <p>Analysis of vehicle and accommodation capacity utilization rates</p>
                  </div>
                </div>

                {generatingReport && (
                  <div className="loading-overlay">
                    <div className="loading-spinner">
                      <i className="fas fa-spinner fa-spin"></i>
                      <p>Generating report...</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="report-results">
                <div className="report-header">
                  <h3>Report: {reportData.type.replace('-', ' ').toUpperCase()}</h3>
                  <div className="report-meta">
                    <span>Generated: {new Date(reportData.generatedAt).toLocaleString()}</span>
                  </div>
                </div>

                <div className="report-filters-display">
                  <h4>Applied Filters:</h4>
                  <div className="filters-list">
                    {reportFilters.dateFrom && <span>From: {reportFilters.dateFrom}</span>}
                    {reportFilters.dateTo && <span>To: {reportFilters.dateTo}</span>}
                    {reportFilters.category && <span>Category: {reportFilters.category}</span>}
                    {reportFilters.tourType && <span>Type: {reportFilters.tourType}</span>}
                  </div>
                </div>

                <div className="report-content">
                  {renderReportContent(reportData)}
                </div>

                <div className="report-actions">
                  <button className="btn btn-secondary" onClick={() => setReportData(null)}>
                    <i className="fas fa-arrow-left"></i> Back to Reports
                  </button>
                  <div className="export-buttons">
                    <button className="btn btn-success" onClick={() => generateReport('popular-destinations')}>
                      <i className="fas fa-file-csv"></i> Download CSV
                    </button>
                    <button className="btn btn-warning" onClick={() => generateReport('booking-revenue')}>
                      <i className="fas fa-file-excel"></i> Download Excel
                    </button>
                    <button className="btn btn-danger" onClick={() => generateReport('package-analytics')}>
                      <i className="fas fa-file-pdf"></i> Download PDF
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TourPackageManagement;













