import React, { useState, useEffect, useCallback } from 'react';
import './VehicleManagement.css';
import './AdminFormStyles.css';

const VehicleManagement = ({ 
  vehicles, 
  vehicleData, 
  setVehicleData, 
  selectedPhotos, 
  setSelectedPhotos, 
  photoCaptions, 
  setPhotoCaptions,
  showVehicleModal, 
  setShowVehicleModal, 
  editingVehicle, 
  setEditingVehicle,
  loading,
  onVehicleSubmit,
  onDeleteVehicle,
  onGenerateVehicleReport
}) => {
  // Validation state
  const [validationErrors, setValidationErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState('all');
  const [fuelTypeFilter, setFuelTypeFilter] = useState('all');
  const [transmissionFilter, setTransmissionFilter] = useState('all');
  const [rateFilter, setRateFilter] = useState('all');

  // Validation functions
  const validateVehicleNumber = useCallback((value) => {
    if (!value || value.trim() === '') {
      return 'Vehicle number is required';
    }
    if (value.length < 3) {
      return 'Vehicle number must be at least 3 characters';
    }
    if (value.length > 20) {
      return 'Vehicle number must be less than 20 characters';
    }
    // Check for duplicate vehicle numbers (excluding current vehicle if editing)
    const existingVehicle = vehicles.find(v => 
      v.vehicleNumber.toLowerCase() === value.toLowerCase() && 
      (!editingVehicle || v._id !== editingVehicle._id)
    );
    if (existingVehicle) {
      return 'Vehicle number already exists';
    }
    return '';
  }, [vehicles, editingVehicle]);

  const validateYear = (value) => {
    if (!value) {
      return 'Year is required';
    }
    const year = parseInt(value);
    if (isNaN(year)) {
      return 'Year must be a valid number';
    }
    const currentYear = new Date().getFullYear();
    if (year < 1900) {
      return 'Year must be after 1900';
    }
    if (year > currentYear + 1) {
      return `Year cannot be more than ${currentYear + 1}`;
    }
    return '';
  };

  const validateCapacity = (value) => {
    if (!value) {
      return 'Capacity is required';
    }
    const capacity = parseInt(value);
    if (isNaN(capacity)) {
      return 'Capacity must be a valid number';
    }
    if (capacity < 1) {
      return 'Capacity must be at least 1';
    }
    if (capacity > 50) {
      return 'Capacity cannot exceed 50 passengers';
    }
    return '';
  };

  const validateRate = (value, fieldName) => {
    if (!value && value !== 0) {
      return `${fieldName} is required`;
    }
    const rate = parseInt(value);
    if (isNaN(rate)) {
      return `${fieldName} must be a valid number`;
    }
    if (rate < 0) {
      return `${fieldName} cannot be negative`;
    }
    if (rate > 1000000) {
      return `${fieldName} cannot exceed 1,000,000 LKR`;
    }
    return '';
  };

  const validateText = (value, fieldName, minLength = 1, maxLength = 100) => {
    if (!value || value.trim() === '') {
      return `${fieldName} is required`;
    }
    if (value.trim().length < minLength) {
      return `${fieldName} must be at least ${minLength} characters`;
    }
    if (value.trim().length > maxLength) {
      return `${fieldName} must be less than ${maxLength} characters`;
    }
    return '';
  };

  const validatePhotos = useCallback((photos) => {
    // Photos are now optional - no validation required
    if (photos && photos.length > 5) {
      return 'Maximum 5 photos allowed';
    }
    return '';
  }, []);

  // Validate individual field
  const validateField = useCallback((fieldName, value) => {
    switch (fieldName) {
      case 'vehicleNumber':
        return validateVehicleNumber(value);
      case 'vehicleType':
        return !value ? 'Vehicle type is required' : '';
      case 'brand':
        return validateText(value, 'Brand', 2, 50);
      case 'model':
        return validateText(value, 'Model', 2, 50);
      case 'year':
        return validateYear(value);
      case 'color':
        return validateText(value, 'Color', 2, 30);
      case 'capacity':
        return validateCapacity(value);
      case 'fuelType':
        return !value ? 'Fuel type is required' : '';
      case 'transmission':
        return !value ? 'Transmission is required' : '';
      case 'dailyRate':
        return validateRate(value, 'Daily rate');
      case 'monthlyRate':
        return value ? validateRate(value, 'Monthly rate') : '';
      case 'weddingRate':
        return value ? validateRate(value, 'Wedding rate') : '';
      case 'airportRate':
        return value ? validateRate(value, 'Airport rate') : '';
      case 'cargoRate':
        return value ? validateRate(value, 'Cargo rate') : '';
      case 'description':
        return value && value.length > 500 ? 'Description must be less than 500 characters' : '';
      default:
        return '';
    }
  }, [validateVehicleNumber]);

  // Validate entire form
  const validateForm = useCallback(() => {
    const errors = {};
    const fieldsToValidate = [
      'vehicleNumber', 'vehicleType', 'brand', 'model', 'year', 
      'color', 'capacity', 'fuelType', 'transmission', 'dailyRate', 'monthlyRate'
    ];

    fieldsToValidate.forEach(field => {
      const error = validateField(field, vehicleData[field]);
      if (error) {
        errors[field] = error;
      }
    });

    // Validate optional fields if they have values
    const optionalFields = ['weddingRate', 'airportRate', 'cargoRate'];
    optionalFields.forEach(field => {
      if (vehicleData[field]) {
        const error = validateField(field, vehicleData[field]);
        if (error) {
          errors[field] = error;
        }
      }
    });

    // Validate description
    if (vehicleData.description) {
      const error = validateField('description', vehicleData.description);
      if (error) {
        errors.description = error;
      }
    }

    // Validate photos (optional)
    const photoError = validatePhotos(selectedPhotos);
    if (photoError) {
      errors.photos = photoError;
    }

    setValidationErrors(errors);
    setIsFormValid(Object.keys(errors).length === 0);
    return Object.keys(errors).length === 0;
  }, [vehicleData, selectedPhotos, validateField, validatePhotos]);

  // Handle field change with validation
  const handleFieldChange = (fieldName, value) => {
    setVehicleData(prev => ({ ...prev, [fieldName]: value }));
    
    // Mark field as touched
    setTouchedFields(prev => ({ ...prev, [fieldName]: true }));
    
    // Validate field
    const error = validateField(fieldName, value);
    setValidationErrors(prev => ({
      ...prev,
      [fieldName]: error
    }));
  };

  // Handle form submission with validation
  const handleFormSubmit = (e) => {
    e.preventDefault();
    console.log('Form submit triggered in VehicleManagement');
    
    // Mark all fields as touched
    const allFields = [
      'vehicleNumber', 'vehicleType', 'brand', 'model', 'year', 
      'color', 'capacity', 'fuelType', 'transmission', 'dailyRate',
      'monthlyRate', 'weddingRate', 'airportRate', 'cargoRate', 'description'
    ];
    const touched = {};
    allFields.forEach(field => {
      touched[field] = true;
    });
    setTouchedFields(touched);

    // Validate form
    const isValid = validateForm();
    console.log('Form validation result:', { isValid, validationErrors, vehicleData });
    
    if (isValid) {
      console.log('Calling onVehicleSubmit');
      // Prepare data for submission
      const submitData = {
        ...vehicleData,
        year: parseInt(vehicleData.year) || 0,
        capacity: parseInt(vehicleData.capacity) || 0,
        dailyRate: parseInt(vehicleData.dailyRate) || 0,
        monthlyRate: parseInt(vehicleData.monthlyRate) || 0,
        weddingRate: vehicleData.weddingRate ? parseInt(vehicleData.weddingRate) : 50000,
        airportRate: vehicleData.airportRate ? parseInt(vehicleData.airportRate) : null,
        cargoRate: vehicleData.cargoRate ? parseInt(vehicleData.cargoRate) : null,
        photos: selectedPhotos,
        rideTypes: vehicleData.rideTypes || []
      };
      
      console.log('Submitting vehicle data:', submitData);
      onVehicleSubmit(e, submitData);
    } else {
      console.log('Form validation failed:', validationErrors);
    }
  };

  // Clear validation when modal closes
  useEffect(() => {
    if (!showVehicleModal) {
      setValidationErrors({});
      setTouchedFields({});
      setIsFormValid(false);
    }
  }, [showVehicleModal]);

  // Validate form whenever vehicleData changes
  useEffect(() => {
    if (showVehicleModal) {
      validateForm();
    }
  }, [vehicleData, selectedPhotos, showVehicleModal, validateForm]);

  // Helper function to get field validation class
  const getFieldValidationClass = (fieldName) => {
    if (!touchedFields[fieldName]) return '';
    return validationErrors[fieldName] ? 'error' : 'success';
  };

  // Helper function to show field error
  const showFieldError = (fieldName) => {
    return touchedFields[fieldName] && validationErrors[fieldName];
  };

  // Filter vehicles based on search term and filters
  const filteredVehicles = vehicles.filter(vehicle => {
    const searchLower = searchTerm.toLowerCase();
    
    // Apply search filter
    const matchesSearch = !searchTerm || (
      vehicle.vehicleNumber?.toLowerCase().includes(searchLower) ||
      vehicle.brand?.toLowerCase().includes(searchLower) ||
      vehicle.model?.toLowerCase().includes(searchLower) ||
      vehicle.color?.toLowerCase().includes(searchLower) ||
      vehicle.description?.toLowerCase().includes(searchLower) ||
      vehicle.dailyRate?.toString().includes(searchTerm) ||
      vehicle.capacity?.toString().includes(searchTerm) ||
      vehicle.year?.toString().includes(searchTerm)
    );

    // Apply vehicle type filter
    const matchesVehicleType = vehicleTypeFilter === 'all' || vehicle.vehicleType === vehicleTypeFilter;

    // Apply fuel type filter
    const matchesFuelType = fuelTypeFilter === 'all' || vehicle.fuelType === fuelTypeFilter;

    // Apply transmission filter
    const matchesTransmission = transmissionFilter === 'all' || vehicle.transmission === transmissionFilter;

    // Apply rate filter
    let matchesRate = true;
    if (rateFilter !== 'all' && vehicle.dailyRate) {
      switch (rateFilter) {
        case 'low':
          matchesRate = vehicle.dailyRate < 5000;
          break;
        case 'medium':
          matchesRate = vehicle.dailyRate >= 5000 && vehicle.dailyRate < 15000;
          break;
        case 'high':
          matchesRate = vehicle.dailyRate >= 15000;
          break;
        default:
          break;
      }
    }

    return matchesSearch && matchesVehicleType && matchesFuelType && matchesTransmission && matchesRate;
  });
  
  return (
    <div className="vehicles-content">
      <div className="content-header">
        <h2>Vehicle Management</h2>
        <button className="btn btn-primary" onClick={() => {
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
          setShowVehicleModal(true);
        }}>
          <i className="fas fa-plus"></i> Add New Vehicle
        </button>
      </div>

      {/* Compact Search and Filter Bar */}
      <div className="compact-search-filter">
        <div className="search-input-wrapper">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search vehicles..."
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
            value={vehicleTypeFilter}
            onChange={(e) => setVehicleTypeFilter(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="bus">Bus</option>
            <option value="van">Van</option>
            <option value="car">Car</option>
            <option value="bike">Bike</option>
            <option value="lorry">Lorry</option>
          </select>
          
          <select
            value={fuelTypeFilter}
            onChange={(e) => setFuelTypeFilter(e.target.value)}
          >
            <option value="all">All Fuel</option>
            <option value="petrol">Petrol</option>
            <option value="diesel">Diesel</option>
            <option value="hybrid">Hybrid</option>
            <option value="electric">Electric</option>
          </select>
          
          <select
            value={transmissionFilter}
            onChange={(e) => setTransmissionFilter(e.target.value)}
          >
            <option value="all">All Trans</option>
            <option value="manual">Manual</option>
            <option value="automatic">Auto</option>
          </select>
          
          <select
            value={rateFilter}
            onChange={(e) => setRateFilter(e.target.value)}
          >
            <option value="all">All Rates</option>
            <option value="low">Under 5K</option>
            <option value="medium">5K-15K</option>
            <option value="high">Over 15K</option>
          </select>
        </div>
        
        <div className="results-info">
          {filteredVehicles.length} vehicle{filteredVehicles.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="vehicles-grid">
        {filteredVehicles && filteredVehicles.length > 0 ? filteredVehicles.map(vehicle => (
          <div key={vehicle._id} className="vehicle-card">
            <div className="vehicle-image">
              {(() => {
                const firstPhoto = vehicle.photos && vehicle.photos.length > 0 ? vehicle.photos[0] : null;
                
                // Handle different photo data formats
                let photoUrl = null;
                if (firstPhoto) {
                  if (typeof firstPhoto === 'string') {
                    photoUrl = firstPhoto.trim() !== '' && firstPhoto !== 'undefined' ? firstPhoto : null;
                  } else if (typeof firstPhoto === 'object' && firstPhoto.url) {
                    photoUrl = firstPhoto.url;
                  } else if (typeof firstPhoto === 'object' && firstPhoto.data) {
                    photoUrl = firstPhoto.data;
                  }
                }
                
                const hasValidPhoto = !!photoUrl;
                
                console.log(`Vehicle ${vehicle.vehicleNumber} photo check:`, {
                  hasPhotos: !!vehicle.photos,
                  photosLength: vehicle.photos?.length || 0,
                  firstPhoto: firstPhoto,
                  photoUrl: photoUrl,
                  hasValidPhoto
                });
                
                return hasValidPhoto ? (
                  <img 
                    src={photoUrl} 
                    alt={vehicle.vehicleNumber}
                    onLoad={(e) => {
                      console.log('✅ Vehicle image loaded successfully:', vehicle.vehicleNumber);
                      e.target.style.display = 'block';
                      const placeholder = e.target.nextElementSibling;
                      if (placeholder) placeholder.style.display = 'none';
                    }}
                    onError={(e) => {
                      console.error('❌ Vehicle image failed to load:', {
                        vehicleNumber: vehicle.vehicleNumber,
                        photoUrl: photoUrl,
                        error: e
                      });
                      e.target.style.display = 'none';
                      const placeholder = e.target.nextElementSibling;
                      if (placeholder) placeholder.style.display = 'flex';
                    }}
                  />
                ) : null;
              })()}
              <div className="vehicle-placeholder">
                <i className="fas fa-car"></i>
                <span>No Image</span>
              </div>
            </div>
            <div className="vehicle-info">
              <h3>{vehicle.vehicleNumber}</h3>
              <p><strong>{vehicle.brand} {vehicle.model}</strong></p>
              <p>Year: {vehicle.year}</p>
              <p>Type: {vehicle.vehicleType}</p>
              <p>Capacity: {vehicle.capacity} passengers</p>
              <p>Fuel: {vehicle.fuelType}</p>
              <p>Daily Rate: LKR {vehicle.dailyRate?.toLocaleString()}</p>
              <div className="vehicle-actions">
                <button 
                  className="btn btn-sm btn-outline"
                  onClick={() => {
                    setEditingVehicle(vehicle);
                    setVehicleData({
                      vehicleNumber: vehicle.vehicleNumber,
                      vehicleType: vehicle.vehicleType,
                      brand: vehicle.brand,
                      model: vehicle.model,
                      year: vehicle.year,
                      color: vehicle.color,
                      capacity: vehicle.capacity,
                      fuelType: vehicle.fuelType,
                      transmission: vehicle.transmission,
                      dailyRate: vehicle.dailyRate,
                      monthlyRate: vehicle.monthlyRate,
                      weddingRate: vehicle.weddingRate,
                      airportRate: vehicle.airportRate,
                      cargoRate: vehicle.cargoRate,
                      description: vehicle.description,
                      features: vehicle.features || [],
                      rideTypes: vehicle.rideTypes || []
                    });
                    // Handle existing photos - extract URLs from photo objects
                    const existingPhotos = vehicle.photos ? 
                      vehicle.photos.map(photo => 
                        typeof photo === 'string' ? photo : photo.url || photo.data || photo
                      ).filter(photo => photo && photo.trim() !== '') : [];
                    setSelectedPhotos(existingPhotos);
                    setPhotoCaptions(vehicle.photoCaptions || {});
                    setShowVehicleModal(true);
                  }}
                >
                  <i className="fas fa-edit"></i> Edit
                </button>
                <button 
                  className="btn btn-sm btn-danger"
                  onClick={() => onDeleteVehicle(vehicle._id)}
                >
                  <i className="fas fa-trash"></i> Delete
                </button>
              </div>
            </div>
          </div>
        )) : (
          <div className="no-vehicles-message">
            <i className="fas fa-car"></i>
            <h3>{vehicles.length === 0 ? 'No vehicles found' : 'No matching vehicles found'}</h3>
            <p>{vehicles.length === 0 ? 'Click "Add New Vehicle" to add your first vehicle.' : 'Try adjusting your search terms or filters.'}</p>
          </div>
        )}
      </div>

      {/* Vehicle Reports Section */}
      <div className="vehicle-reports">
        <h3><i className="fas fa-chart-bar"></i> Vehicle Reports</h3>
        <div className="reports-grid">
          <div className="report-card">
            <i className="fas fa-file-pdf"></i>
            <h4>Vehicle Inventory Report</h4>
            <p>Generate comprehensive vehicle inventory report in PDF format</p>
            <button 
              className="btn btn-primary" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Vehicle inventory report button clicked');
                if (onGenerateVehicleReport) {
                  onGenerateVehicleReport('inventory');
                } else {
                  console.error('onGenerateVehicleReport function is not defined');
                }
              }}
              disabled={loading}
            >
              {loading ? 'Generating...' : 'Generate PDF'}
            </button>
          </div>
          <div className="report-card">
            <i className="fas fa-file-excel"></i>
            <h4>Vehicle Analytics Report</h4>
            <p>Export vehicle performance analytics in Excel format</p>
            <button 
              className="btn btn-secondary" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Vehicle analytics report button clicked');
                if (onGenerateVehicleReport) {
                  onGenerateVehicleReport('analytics');
                } else {
                  console.error('onGenerateVehicleReport function is not defined');
                }
              }}
              disabled={loading}
            >
              {loading ? 'Generating...' : 'Export Excel'}
            </button>
          </div>
          <div className="report-card">
            <i className="fas fa-file-pdf"></i>
            <h4>Vehicle Utilization Report</h4>
            <p>Generate vehicle utilization statistics in PDF format</p>
            <button 
              className="btn btn-warning" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Vehicle utilization report button clicked');
                if (onGenerateVehicleReport) {
                  onGenerateVehicleReport('utilization');
                } else {
                  console.error('onGenerateVehicleReport function is not defined');
                }
              }}
              disabled={loading}
            >
              {loading ? 'Generating...' : 'Generate PDF'}
            </button>
          </div>
          <div className="report-card">
            <i className="fas fa-file-excel"></i>
            <h4>Maintenance Report</h4>
            <p>Export vehicle maintenance records in Excel format</p>
            <button 
              className="btn btn-info" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Vehicle maintenance report button clicked');
                if (onGenerateVehicleReport) {
                  onGenerateVehicleReport('maintenance');
                } else {
                  console.error('onGenerateVehicleReport function is not defined');
                }
              }}
              disabled={loading}
            >
              {loading ? 'Generating...' : 'Export Excel'}
            </button>
          </div>
          <div className="report-card">
            <i className="fas fa-file-pdf"></i>
            <h4>Revenue Report</h4>
            <p>Generate vehicle revenue analysis in PDF format</p>
            <button 
              className="btn btn-dark" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Vehicle revenue report button clicked');
                if (onGenerateVehicleReport) {
                  onGenerateVehicleReport('revenue');
                } else {
                  console.error('onGenerateVehicleReport function is not defined');
                }
              }}
              disabled={loading}
            >
              {loading ? 'Generating...' : 'Generate PDF'}
            </button>
          </div>
          <div className="report-card">
            <i className="fas fa-file-excel"></i>
            <h4>Vehicle Details Report</h4>
            <p>Export detailed vehicle information in Excel format</p>
            <button 
              className="btn btn-success" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Vehicle details report button clicked');
                if (onGenerateVehicleReport) {
                  onGenerateVehicleReport('details');
                } else {
                  console.error('onGenerateVehicleReport function is not defined');
                }
              }}
              disabled={loading}
            >
              {loading ? 'Generating...' : 'Export Excel'}
            </button>
          </div>
        </div>
      </div>

      {/* Vehicle Modal */}
      {showVehicleModal && (
        <div className="modal-overlay" onClick={() => setShowVehicleModal(false)}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowVehicleModal(false)}>&times;</button>
            <h2>{editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}</h2>
            <form onSubmit={handleFormSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="vehicleNumber">Vehicle Number *</label>
                  <input
                    type="text"
                    id="vehicleNumber"
                    value={vehicleData.vehicleNumber}
                    onChange={(e) => handleFieldChange('vehicleNumber', e.target.value)}
                    onBlur={() => setTouchedFields(prev => ({ ...prev, vehicleNumber: true }))}
                    placeholder="e.g., ABC-1234"
                    className={getFieldValidationClass('vehicleNumber')}
                    required
                  />
                  {showFieldError('vehicleNumber') && (
                    <span className="error-message">{validationErrors.vehicleNumber}</span>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="vehicleType">Vehicle Type *</label>
                  <select
                    id="vehicleType"
                    value={vehicleData.vehicleType}
                    onChange={(e) => handleFieldChange('vehicleType', e.target.value)}
                    onBlur={() => setTouchedFields(prev => ({ ...prev, vehicleType: true }))}
                    className={getFieldValidationClass('vehicleType')}
                    required
                  >
                    <option value="">Select Vehicle Type</option>
                    <option value="bus">Bus</option>
                    <option value="van">Van</option>
                    <option value="car">Car</option>
                    <option value="bike">Bike</option>
                    <option value="lorry">Lorry</option>
                  </select>
                  {showFieldError('vehicleType') && (
                    <span className="error-message">{validationErrors.vehicleType}</span>
                  )}
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="brand">Brand *</label>
                  <input
                    type="text"
                    id="brand"
                    value={vehicleData.brand}
                    onChange={(e) => handleFieldChange('brand', e.target.value)}
                    onBlur={() => setTouchedFields(prev => ({ ...prev, brand: true }))}
                    placeholder="e.g., Toyota"
                    className={getFieldValidationClass('brand')}
                    required
                  />
                  {showFieldError('brand') && (
                    <span className="error-message">{validationErrors.brand}</span>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="model">Model *</label>
                  <input
                    type="text"
                    id="model"
                    value={vehicleData.model}
                    onChange={(e) => handleFieldChange('model', e.target.value)}
                    onBlur={() => setTouchedFields(prev => ({ ...prev, model: true }))}
                    placeholder="e.g., Camry"
                    className={getFieldValidationClass('model')}
                    required
                  />
                  {showFieldError('model') && (
                    <span className="error-message">{validationErrors.model}</span>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="year">Year *</label>
                  <input
                    type="number"
                    id="year"
                    value={vehicleData.year}
                    onChange={(e) => handleFieldChange('year', e.target.value)}
                    onBlur={() => setTouchedFields(prev => ({ ...prev, year: true }))}
                    placeholder="e.g., 2023"
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    className={getFieldValidationClass('year')}
                    required
                  />
                  {showFieldError('year') && (
                    <span className="error-message">{validationErrors.year}</span>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="color">Color *</label>
                  <input
                    type="text"
                    id="color"
                    value={vehicleData.color}
                    onChange={(e) => handleFieldChange('color', e.target.value)}
                    onBlur={() => setTouchedFields(prev => ({ ...prev, color: true }))}
                    placeholder="e.g., White"
                    className={getFieldValidationClass('color')}
                    required
                  />
                  {showFieldError('color') && (
                    <span className="error-message">{validationErrors.color}</span>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="capacity">Capacity *</label>
                  <input
                    type="number"
                    id="capacity"
                    value={vehicleData.capacity}
                    onChange={(e) => handleFieldChange('capacity', e.target.value)}
                    onBlur={() => setTouchedFields(prev => ({ ...prev, capacity: true }))}
                    placeholder="e.g., 4"
                    min="1"
                    max="50"
                    className={getFieldValidationClass('capacity')}
                    required
                  />
                  {showFieldError('capacity') && (
                    <span className="error-message">{validationErrors.capacity}</span>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="fuelType">Fuel Type *</label>
                  <select
                    id="fuelType"
                    value={vehicleData.fuelType}
                    onChange={(e) => handleFieldChange('fuelType', e.target.value)}
                    onBlur={() => setTouchedFields(prev => ({ ...prev, fuelType: true }))}
                    className={getFieldValidationClass('fuelType')}
                    required
                  >
                    <option value="">Select Fuel Type</option>
                    <option value="petrol">Petrol</option>
                    <option value="diesel">Diesel</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="electric">Electric</option>
                  </select>
                  {showFieldError('fuelType') && (
                    <span className="error-message">{validationErrors.fuelType}</span>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="transmission">Transmission *</label>
                  <select
                    id="transmission"
                    value={vehicleData.transmission}
                    onChange={(e) => handleFieldChange('transmission', e.target.value)}
                    onBlur={() => setTouchedFields(prev => ({ ...prev, transmission: true }))}
                    className={getFieldValidationClass('transmission')}
                    required
                  >
                    <option value="">Select Transmission</option>
                    <option value="manual">Manual</option>
                    <option value="automatic">Automatic</option>
                  </select>
                  {showFieldError('transmission') && (
                    <span className="error-message">{validationErrors.transmission}</span>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="dailyRate">Daily Rate (LKR) *</label>
                  <input
                    type="number"
                    id="dailyRate"
                    value={vehicleData.dailyRate}
                    onChange={(e) => handleFieldChange('dailyRate', e.target.value)}
                    onBlur={() => setTouchedFields(prev => ({ ...prev, dailyRate: true }))}
                    placeholder="e.g., 5000"
                    min="0"
                    step="100"
                    className={getFieldValidationClass('dailyRate')}
                    required
                  />
                  {showFieldError('dailyRate') && (
                    <span className="error-message">{validationErrors.dailyRate}</span>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="monthlyRate">Monthly Rate (LKR) *</label>
                  <input
                    type="number"
                    id="monthlyRate"
                    value={vehicleData.monthlyRate}
                    onChange={(e) => handleFieldChange('monthlyRate', e.target.value)}
                    onBlur={() => setTouchedFields(prev => ({ ...prev, monthlyRate: true }))}
                    placeholder="e.g., 120000"
                    min="0"
                    step="1000"
                    className={getFieldValidationClass('monthlyRate')}
                    required
                  />
                  {showFieldError('monthlyRate') && (
                    <span className="error-message">{validationErrors.monthlyRate}</span>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="weddingRate">Wedding Rate (LKR)</label>
                  <input
                    type="number"
                    id="weddingRate"
                    value={vehicleData.weddingRate}
                    onChange={(e) => handleFieldChange('weddingRate', e.target.value)}
                    onBlur={() => setTouchedFields(prev => ({ ...prev, weddingRate: true }))}
                    placeholder="e.g., 50000"
                    min="0"
                    step="1000"
                    className={getFieldValidationClass('weddingRate')}
                  />
                  {showFieldError('weddingRate') && (
                    <span className="error-message">{validationErrors.weddingRate}</span>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="airportRate">Airport Rate (LKR/km)</label>
                  <input
                    type="number"
                    id="airportRate"
                    value={vehicleData.airportRate}
                    onChange={(e) => handleFieldChange('airportRate', e.target.value)}
                    onBlur={() => setTouchedFields(prev => ({ ...prev, airportRate: true }))}
                    placeholder="e.g., 150"
                    min="0"
                    step="10"
                    className={getFieldValidationClass('airportRate')}
                  />
                  {showFieldError('airportRate') && (
                    <span className="error-message">{validationErrors.airportRate}</span>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="cargoRate">Cargo Rate (LKR/km)</label>
                  <input
                    type="number"
                    id="cargoRate"
                    value={vehicleData.cargoRate}
                    onChange={(e) => handleFieldChange('cargoRate', e.target.value)}
                    onBlur={() => setTouchedFields(prev => ({ ...prev, cargoRate: true }))}
                    placeholder="e.g., 200"
                    min="0"
                    step="10"
                    className={getFieldValidationClass('cargoRate')}
                  />
                  {showFieldError('cargoRate') && (
                    <span className="error-message">{validationErrors.cargoRate}</span>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  rows="3"
                  value={vehicleData.description}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  onBlur={() => setTouchedFields(prev => ({ ...prev, description: true }))}
                  placeholder="Brief vehicle description..."
                  className={getFieldValidationClass('description')}
                  maxLength="500"
                ></textarea>
                <div className="character-count">
                  {vehicleData.description?.length || 0}/500 characters
                </div>
                {showFieldError('description') && (
                  <span className="error-message">{validationErrors.description}</span>
                )}
              </div>

              {/* Vehicle Picture Upload */}
              <div className="form-group">
                <label htmlFor="vehiclePicture">Vehicle Picture</label>
                <div className="file-upload-container">
                  <input
                    type="file"
                    id="vehiclePicture"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        // Validate file size (max 5MB)
                        if (file.size > 5 * 1024 * 1024) {
                          setValidationErrors(prev => ({
                            ...prev,
                            photos: 'File size too large. Please select an image smaller than 5MB.'
                          }));
                          return;
                        }
                        
                        // Validate file type
                        if (!file.type.startsWith('image/')) {
                          setValidationErrors(prev => ({
                            ...prev,
                            photos: 'Please select a valid image file.'
                          }));
                          return;
                        }
                        
                        // Clear previous photo errors
                        setValidationErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.photos;
                          return newErrors;
                        });
                        
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const base64Data = event.target.result;
                          console.log('File read successfully, base64 length:', base64Data.length);
                          
                          // Compress image to reduce payload size
                          const img = new Image();
                          img.onload = () => {
                            const canvas = document.createElement('canvas');
                            const ctx = canvas.getContext('2d');
                            
                            // Calculate new dimensions (max 800px width/height)
                            let { width, height } = img;
                            const maxSize = 800;
                            if (width > maxSize || height > maxSize) {
                              if (width > height) {
                                height = (height * maxSize) / width;
                                width = maxSize;
                              } else {
                                width = (width * maxSize) / height;
                                height = maxSize;
                              }
                            }
                            
                            canvas.width = width;
                            canvas.height = height;
                            
                            // Draw and compress
                            ctx.drawImage(img, 0, 0, width, height);
                            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
                            console.log('Compressed base64 length:', compressedBase64.length);
                            
                            if (editingVehicle) {
                              // When editing, add to existing photos or replace if none
                              setSelectedPhotos(prev => prev.length > 0 ? [...prev, compressedBase64] : [compressedBase64]);
                            } else {
                              // When creating new, replace existing
                              setSelectedPhotos([compressedBase64]);
                            }
                          };
                          img.src = base64Data;
                        };
                        reader.onerror = (error) => {
                          console.error('Error reading file:', error);
                          setValidationErrors(prev => ({
                            ...prev,
                            photos: 'Error reading file. Please try again.'
                          }));
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className={`file-input ${getFieldValidationClass('photos')}`}
                    required={false}
                  />
                  <label htmlFor="vehiclePicture" className="file-upload-label">
                    <i className="fas fa-cloud-upload-alt"></i>
                    <span>{editingVehicle ? 'Add Another Picture' : 'Choose Vehicle Picture (Optional)'} (Max 5MB)</span>
                  </label>
                  {selectedPhotos.length > 0 && (
                    <div className="photos-preview">
                      {selectedPhotos.map((photo, index) => (
                        <div key={index} className="image-preview">
                          <img src={photo} alt={`Vehicle Preview ${index + 1}`} />
                          <button 
                            type="button" 
                            className="remove-image-btn"
                            onClick={() => {
                              const newPhotos = selectedPhotos.filter((_, i) => i !== index);
                              setSelectedPhotos(newPhotos);
                              if (newPhotos.length === 0) {
                                document.getElementById('vehiclePicture').value = '';
                              }
                            }}
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {showFieldError('photos') && (
                    <span className="error-message">{validationErrors.photos}</span>
                  )}
                </div>
              </div>
              {/* Form Validation Summary */}
              {Object.keys(validationErrors).length > 0 && (
                <div className="validation-summary">
                  <h4><i className="fas fa-exclamation-triangle"></i> Please fix the following errors:</h4>
                  <ul>
                    {Object.entries(validationErrors).map(([field, error]) => (
                      <li key={field}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <button 
                type="submit" 
                className={`btn btn-primary btn-full ${!isFormValid ? 'btn-disabled' : ''}`} 
                disabled={loading || !isFormValid}
                title={!isFormValid ? 'Please fix all validation errors before submitting' : ''}
              >
                {loading ? 'Saving...' : (editingVehicle ? 'Update Vehicle' : 'Add Vehicle')}
                {!isFormValid && !loading && (
                  <i className="fas fa-exclamation-circle" style={{ marginLeft: '8px' }}></i>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleManagement;
