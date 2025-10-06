import React, { useState } from 'react';
import './ServiceManagement.css';

const ServiceManagement = ({ 
  serviceRecords, 
  vehicles,
  serviceData, 
  setServiceData,
  showServiceModal, 
  setShowServiceModal, 
  editingService, 
  setEditingService,
  loading,
  onServiceSubmit,
  onDeleteService,
  onGenerateServiceReport
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [serviceTypeFilter, setServiceTypeFilter] = useState('all');
  const [vehicleFilter, setVehicleFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [costFilter, setCostFilter] = useState('all');

  // Validation function
  const validateServiceData = (data) => {
    const errors = {};
    const today = new Date().toISOString().split('T')[0];

    // Validate service date (cannot be in the future)
    if (data.serviceDate > today) {
      errors.serviceDate = 'Service date cannot be in the future';
    }

    // Validate cost (must be greater than 0)
    if (!data.cost || data.cost <= 0) {
      errors.cost = 'Cost must be greater than 0';
    }

    // Validate mileage (must be greater than 0)
    if (!data.mileage || data.mileage <= 0) {
      errors.mileage = 'Mileage must be greater than 0';
    }

    // Validate next service date (cannot be in the past)
    if (data.nextServiceDue && data.nextServiceDue < today) {
      errors.nextServiceDue = 'Next service date cannot be in the past';
    }

    // Validate next service mileage (must be greater than current mileage)
    if (data.nextServiceMileage && data.mileage && data.nextServiceMileage <= data.mileage) {
      errors.nextServiceMileage = 'Next service mileage must be greater than current mileage';
    }

    return errors;
  };

  // Custom form submit handler with validation
  const handleServiceSubmit = (e) => {
    e.preventDefault();
    
    // Clear previous validation errors
    setValidationErrors({});
    
    // Validate the form data
    const errors = validateServiceData(serviceData);
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    // If validation passes, call the original submit handler
    onServiceSubmit(e);
  };

  // Filter service records based on search term and filters
  const filteredServiceRecords = serviceRecords.filter(record => {
    const searchLower = searchTerm.toLowerCase();
    
    // Apply search filter
    const matchesSearch = !searchTerm || (
      record.vehicle?.vehicleNumber?.toLowerCase().includes(searchLower) ||
      record.vehicle?.brand?.toLowerCase().includes(searchLower) ||
      record.vehicle?.model?.toLowerCase().includes(searchLower) ||
      record.serviceType?.toLowerCase().includes(searchLower) ||
      record.description?.toLowerCase().includes(searchLower) ||
      record.serviceProvider?.toLowerCase().includes(searchLower) ||
      record.technician?.toLowerCase().includes(searchLower) ||
      record.notes?.toLowerCase().includes(searchLower) ||
      record.cost?.toString().includes(searchTerm) ||
      record.mileage?.toString().includes(searchTerm)
    );

    // Apply service type filter
    const matchesServiceType = serviceTypeFilter === 'all' || record.serviceType === serviceTypeFilter;

    // Apply vehicle filter
    const matchesVehicle = vehicleFilter === 'all' || record.vehicle?._id === vehicleFilter;

    // Apply date filter
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const today = new Date();
      const recordDate = new Date(record.serviceDate);
      
      switch (dateFilter) {
        case 'today':
          matchesDate = recordDate.toDateString() === today.toDateString();
          break;
        case 'week':
          const weekAgo = new Date();
          weekAgo.setDate(today.getDate() - 7);
          matchesDate = recordDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date();
          monthAgo.setMonth(today.getMonth() - 1);
          matchesDate = recordDate >= monthAgo;
          break;
        case 'year':
          const yearAgo = new Date();
          yearAgo.setFullYear(today.getFullYear() - 1);
          matchesDate = recordDate >= yearAgo;
          break;
        default:
          break;
      }
    }

    // Apply cost filter
    let matchesCost = true;
    if (costFilter !== 'all' && record.cost) {
      switch (costFilter) {
        case 'low':
          matchesCost = record.cost < 10000;
          break;
        case 'medium':
          matchesCost = record.cost >= 10000 && record.cost < 50000;
          break;
        case 'high':
          matchesCost = record.cost >= 50000;
          break;
        default:
          break;
      }
    }

    return matchesSearch && matchesServiceType && matchesVehicle && matchesDate && matchesCost;
  });

  return (
    <div className="services-content">
      <div className="content-header">
        <h2>Service Record Management</h2>
        <button className="btn btn-primary" onClick={() => {
          const today = new Date().toISOString().split('T')[0];
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          const tomorrowStr = tomorrow.toISOString().split('T')[0];
          
          setServiceData({
            vehicle: '', serviceDate: today, serviceType: '', description: '',
            mileage: '', cost: '', serviceProvider: '', technician: '', notes: '',
            nextServiceDue: tomorrowStr, nextServiceMileage: ''
          });
          setShowServiceModal(true);
        }}>
          <i className="fas fa-plus"></i> Add New Record
        </button>
      </div>

      {/* Compact Search and Filter Bar */}
      <div className="compact-search-filter">
        <div className="search-input-wrapper">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search service records..."
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
            value={serviceTypeFilter}
            onChange={(e) => setServiceTypeFilter(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="routine">Routine</option>
            <option value="repair">Repair</option>
            <option value="maintenance">Maintenance</option>
            <option value="inspection">Inspection</option>
            <option value="emergency">Emergency</option>
          </select>
          
          <select
            value={vehicleFilter}
            onChange={(e) => setVehicleFilter(e.target.value)}
          >
            <option value="all">All Vehicles</option>
            {vehicles.map(vehicle => (
              <option key={vehicle._id} value={vehicle._id}>
                {vehicle.vehicleNumber} - {vehicle.brand} {vehicle.model}
              </option>
            ))}
          </select>
          
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">7 Days</option>
            <option value="month">30 Days</option>
            <option value="year">1 Year</option>
          </select>
          
          <select
            value={costFilter}
            onChange={(e) => setCostFilter(e.target.value)}
          >
            <option value="all">All Costs</option>
            <option value="low">Under 10K</option>
            <option value="medium">10K-50K</option>
            <option value="high">Over 50K</option>
          </select>
        </div>
        
        <div className="results-info">
          {filteredServiceRecords.length} record{filteredServiceRecords.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Service Records Grid */}
      <div className="service-records-grid">
        {filteredServiceRecords.length === 0 ? (
          <div className="no-records">
            <i className="fas fa-tools"></i>
            <h3>{serviceRecords.length === 0 ? 'No Service Records Found' : 'No Matching Records Found'}</h3>
            <p>{serviceRecords.length === 0 ? 'Start by adding your first service record' : 'Try adjusting your search terms'}</p>
            <button className="btn btn-primary" onClick={() => {
              const today = new Date().toISOString().split('T')[0];
              const tomorrow = new Date();
              tomorrow.setDate(tomorrow.getDate() + 1);
              const tomorrowStr = tomorrow.toISOString().split('T')[0];
              
              setServiceData({
                vehicle: '', serviceDate: today, serviceType: '', description: '',
                mileage: '', cost: '', serviceProvider: '', technician: '', notes: '',
                nextServiceDue: tomorrowStr, nextServiceMileage: ''
              });
              setShowServiceModal(true);
            }}>
              <i className="fas fa-plus"></i> Add First Record
            </button>
          </div>
        ) : (
          filteredServiceRecords.map(record => (
            <div key={record._id} className="service-record-card">
              <div className="card-header">
                <div className="vehicle-info">
                  <h4>{record.vehicle?.vehicleNumber}</h4>
                  <p>{record.vehicle?.brand} {record.vehicle?.model} ({record.vehicle?.year})</p>
                </div>
                <div className="service-type">
                  <span className={`status-badge status-${record.serviceType}`}>
                    {record.serviceType}
                  </span>
                </div>
              </div>
              
              <div className="card-body">
                <div className="service-details">
                  <div className="detail-row">
                    <span className="label">Service Date:</span>
                    <span className="value">{new Date(record.serviceDate).toLocaleDateString()}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Description:</span>
                    <span className="value description">{record.description}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Mileage:</span>
                    <span className="value">{record.mileage?.toLocaleString()} km</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Cost:</span>
                    <span className="value cost">LKR {record.cost?.toLocaleString()}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Provider:</span>
                    <span className="value">{record.serviceProvider}</span>
                  </div>
                  {record.technician && (
                    <div className="detail-row">
                      <span className="label">Technician:</span>
                      <span className="value">{record.technician}</span>
                    </div>
                  )}
                </div>
                
                <div className="next-service">
                  <h5>Next Service</h5>
                  <div className="next-service-details">
                    <div className="detail-row">
                      <span className="label">Date:</span>
                      <span className="value">
                        {record.nextServiceDue ? new Date(record.nextServiceDue).toLocaleDateString() : 'Not set'}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Mileage:</span>
                      <span className="value">
                        {record.nextServiceMileage ? `${record.nextServiceMileage.toLocaleString()} km` : 'Not set'}
                      </span>
                    </div>
                  </div>
                </div>
                
                {record.notes && (
                  <div className="notes-section">
                    <h5>Notes</h5>
                    <p className="notes-text">{record.notes}</p>
                  </div>
                )}
                
                {record.partsReplaced && record.partsReplaced.length > 0 && (
                  <div className="parts-section">
                    <h5>Parts Replaced</h5>
                    <div className="parts-list">
                      {record.partsReplaced.map((part, index) => (
                        <div key={index} className="part-item">
                          <span className="part-name">{part.partName}</span>
                          {part.cost && <span className="part-cost">LKR {part.cost.toLocaleString()}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="card-footer">
                <div className="created-info">
                  <small>Created by {record.createdBy?.firstName} {record.createdBy?.lastName}</small>
                  <small>{new Date(record.createdAt).toLocaleDateString()}</small>
                </div>
                <div className="action-buttons">
                  <button 
                    className="btn btn-sm btn-outline"
                    onClick={() => {
                      setEditingService(record);
                      setServiceData({
                        vehicle: record.vehicle._id,
                        serviceDate: new Date(record.serviceDate).toISOString().split('T')[0],
                        serviceType: record.serviceType,
                        description: record.description,
                        mileage: record.mileage,
                        cost: record.cost,
                        serviceProvider: record.serviceProvider,
                        technician: record.technician,
                        notes: record.notes,
                        nextServiceDue: record.nextServiceDue ? new Date(record.nextServiceDue).toISOString().split('T')[0] : '',
                        nextServiceMileage: record.nextServiceMileage
                      });
                      setShowServiceModal(true);
                    }}
                    title="Edit Record"
                  >
                    <i className="fas fa-edit"></i> Edit
                  </button>
                  <button 
                    className="btn btn-sm btn-danger"
                    onClick={() => onDeleteService(record._id)}
                    title="Delete Record"
                  >
                    <i className="fas fa-trash"></i> Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Service Reports Section */}
      <div className="service-reports">
        <h3><i className="fas fa-chart-bar"></i> Service Reports</h3>
        <div className="reports-grid">
          <div className="report-card">
            <i className="fas fa-file-excel"></i>
            <h4>Service Records Report</h4>
            <p>Export detailed service records in Excel format</p>
            <button 
              className="btn btn-primary" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Service records report button clicked');
                if (onGenerateServiceReport) {
                  onGenerateServiceReport('records');
                } else {
                  console.error('onGenerateServiceReport function is not defined');
                }
              }}
              disabled={loading}
            >
              {loading ? 'Generating...' : 'Export Excel'}
            </button>
          </div>
          <div className="report-card">
            <i className="fas fa-file-excel"></i>
            <h4>Service Analytics Report</h4>
            <p>Export service analytics and trends in Excel format</p>
            <button 
              className="btn btn-secondary" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Service analytics report button clicked');
                if (onGenerateServiceReport) {
                  onGenerateServiceReport('analytics');
                } else {
                  console.error('onGenerateServiceReport function is not defined');
                }
              }}
              disabled={loading}
            >
              {loading ? 'Generating...' : 'Export Excel'}
            </button>
          </div>
        </div>
      </div>

      {/* Service Modal */}
      {showServiceModal && (
        <div className="modal-overlay" onClick={() => setShowServiceModal(false)}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingService ? 'Edit Service Record' : 'Add New Service Record'}</h2>
              <button className="modal-close" onClick={() => {
                setShowServiceModal(false);
                setValidationErrors({});
              }}>&times;</button>
            </div>
            <form onSubmit={handleServiceSubmit} className="service-form">
              {/* Vehicle Selection */}
              <div className="form-section">
                <h3>Vehicle Information</h3>
                <div className="form-group">
                  <label htmlFor="serviceVehicle">Vehicle <span className="required">*</span></label>
                  <select
                    id="serviceVehicle"
                    value={serviceData.vehicle}
                    onChange={(e) => setServiceData({...serviceData, vehicle: e.target.value})}
                    required
                  >
                    <option value="">Select Vehicle</option>
                    {vehicles.map(vehicle => (
                      <option key={vehicle._id} value={vehicle._id}>
                        {vehicle.vehicleNumber} - {vehicle.brand} {vehicle.model} ({vehicle.year})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Service Details */}
              <div className="form-section">
                <h3>Service Details</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="serviceDate">Service Date <span className="required">*</span></label>
                    <input
                      type="date"
                      id="serviceDate"
                      value={serviceData.serviceDate}
                      onChange={(e) => setServiceData({...serviceData, serviceDate: e.target.value})}
                      max={new Date().toISOString().split('T')[0]}
                      className={validationErrors.serviceDate ? 'error' : ''}
                      required
                    />
                    {validationErrors.serviceDate && (
                      <div className="error-message">{validationErrors.serviceDate}</div>
                    )}
                  </div>
                  <div className="form-group">
                    <label htmlFor="serviceType">Service Type <span className="required">*</span></label>
                    <select
                      id="serviceType"
                      value={serviceData.serviceType}
                      onChange={(e) => setServiceData({...serviceData, serviceType: e.target.value})}
                      required
                    >
                      <option value="">Select Type</option>
                      <option value="routine">Routine</option>
                      <option value="repair">Repair</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="inspection">Inspection</option>
                      <option value="emergency">Emergency</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="description">Description <span className="required">*</span></label>
                  <textarea
                    id="description"
                    rows="3"
                    value={serviceData.description}
                    onChange={(e) => setServiceData({...serviceData, description: e.target.value})}
                    placeholder="Describe the service performed..."
                    required
                  ></textarea>
                </div>
              </div>

              {/* Cost & Mileage */}
              <div className="form-section">
                <h3>Cost & Mileage</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="mileage">Mileage (km) <span className="required">*</span></label>
                    <input
                      type="number"
                      id="mileage"
                      value={serviceData.mileage}
                      onChange={(e) => setServiceData({...serviceData, mileage: parseInt(e.target.value)})}
                      placeholder="Enter current mileage"
                      min="1"
                      className={validationErrors.mileage ? 'error' : ''}
                      required
                    />
                    {validationErrors.mileage && (
                      <div className="error-message">{validationErrors.mileage}</div>
                    )}
                  </div>
                  <div className="form-group">
                    <label htmlFor="cost">Cost (LKR) <span className="required">*</span></label>
                    <input
                      type="number"
                      id="cost"
                      value={serviceData.cost}
                      onChange={(e) => setServiceData({...serviceData, cost: parseInt(e.target.value)})}
                      placeholder="Enter service cost"
                      min="1"
                      className={validationErrors.cost ? 'error' : ''}
                      required
                    />
                    {validationErrors.cost && (
                      <div className="error-message">{validationErrors.cost}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Service Provider */}
              <div className="form-section">
                <h3>Service Provider</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="serviceProvider">Service Provider <span className="required">*</span></label>
                    <input
                      type="text"
                      id="serviceProvider"
                      value={serviceData.serviceProvider}
                      onChange={(e) => setServiceData({...serviceData, serviceProvider: e.target.value})}
                      placeholder="Enter service provider name"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="technician">Technician</label>
                    <input
                      type="text"
                      id="technician"
                      value={serviceData.technician}
                      onChange={(e) => setServiceData({...serviceData, technician: e.target.value})}
                      placeholder="Enter technician name (optional)"
                    />
                  </div>
                </div>
              </div>

              {/* Next Service */}
              <div className="form-section">
                <h3>Next Service Schedule</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="nextServiceDue">Next Service Date</label>
                    <input
                      type="date"
                      id="nextServiceDue"
                      value={serviceData.nextServiceDue}
                      onChange={(e) => setServiceData({...serviceData, nextServiceDue: e.target.value})}
                      min={new Date().toISOString().split('T')[0]}
                      className={validationErrors.nextServiceDue ? 'error' : ''}
                    />
                    {validationErrors.nextServiceDue && (
                      <div className="error-message">{validationErrors.nextServiceDue}</div>
                    )}
                  </div>
                  <div className="form-group">
                    <label htmlFor="nextServiceMileage">Next Service Mileage (km)</label>
                    <input
                      type="number"
                      id="nextServiceMileage"
                      value={serviceData.nextServiceMileage}
                      onChange={(e) => setServiceData({...serviceData, nextServiceMileage: parseInt(e.target.value)})}
                      placeholder="Enter next service mileage"
                      min={serviceData.mileage ? serviceData.mileage + 1 : 1}
                      className={validationErrors.nextServiceMileage ? 'error' : ''}
                    />
                    {validationErrors.nextServiceMileage && (
                      <div className="error-message">{validationErrors.nextServiceMileage}</div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Additional Notes */}
              <div className="form-section">
                <h3>Additional Information</h3>
                <div className="form-group">
                  <label htmlFor="notes">Notes</label>
                  <textarea
                    id="notes"
                    rows="3"
                    value={serviceData.notes}
                    onChange={(e) => setServiceData({...serviceData, notes: e.target.value})}
                    placeholder="Add any additional notes or comments..."
                  ></textarea>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-outline" onClick={() => {
                  setShowServiceModal(false);
                  setValidationErrors({});
                }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : (editingService ? 'Update Record' : 'Add Record')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceManagement;
