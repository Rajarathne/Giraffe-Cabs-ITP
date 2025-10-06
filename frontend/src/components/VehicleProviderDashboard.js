import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './VehicleProviderDashboard.css';

const VehicleProviderDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [vehicleProvider, setVehicleProvider] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showVehicleRequestModal, setShowVehicleRequestModal] = useState(false);
  const [vehicleRequestData, setVehicleRequestData] = useState({
    vehicleNumber: '',
    vehicleType: '',
    brand: '',
    model: '',
    year: '',
    color: '',
    capacity: '',
    fuelType: '',
    transmission: '',
    dailyRate: '',
    monthlyRate: '',
    description: '',
    features: []
  });
  const [vehicleRequests, setVehicleRequests] = useState([]);
  const [companyRates] = useState({
    van: { daily: 8000, monthly: 200000 },
    bus: { daily: 12000, monthly: 300000 },
    car: { daily: 5000, monthly: 120000 },
    wedding_car: { daily: 15000, monthly: 400000 },
    goods_vehicle: { daily: 10000, monthly: 250000 },
    bike: { daily: 2000, monthly: 50000 },
    lorry: { daily: 15000, monthly: 400000 }
  });

  const navigate = useNavigate();

  useEffect(() => {
    loadVehicleProviderProfile();
    loadVehicleRequests();
  }, []);

  const loadVehicleProviderProfile = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('vehicleProviderToken');
      const response = await axios.get('/api/vehicle-provider/auth/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVehicleProvider(response.data);
    } catch (error) {
      console.error('Error loading profile:', error);
      alert('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const loadVehicleRequests = async () => {
    try {
      const token = localStorage.getItem('vehicleProviderToken');
      const response = await axios.get('/api/vehicle-provider/vehicle-requests/my-requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVehicleRequests(response.data);
    } catch (error) {
      console.error('Error loading vehicle requests:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('vehicleProviderToken');
    localStorage.removeItem('currentVehicleProvider');
    navigate('/');
  };

  const handleVehicleRequestSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('vehicleProviderToken');
      await axios.post('/api/vehicle-provider/vehicle-requests', vehicleRequestData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Vehicle rental request submitted successfully!');
      setShowVehicleRequestModal(false);
      setVehicleRequestData({
        vehicleNumber: '',
        vehicleType: '',
        brand: '',
        model: '',
        year: '',
        color: '',
        capacity: '',
        fuelType: '',
        transmission: '',
        dailyRate: '',
        monthlyRate: '',
        description: '',
        features: []
      });
      loadVehicleRequests(); // Reload vehicle requests
    } catch (error) {
      console.error('Error submitting vehicle request:', error);
      alert('Failed to submit vehicle request');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      pending: 'status-pending',
      approved: 'status-approved',
      suspended: 'status-suspended',
      rejected: 'status-rejected'
    };
    return <span className={`status-badge ${statusClasses[status]}`}>{status}</span>;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading && !vehicleProvider) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="vehicle-provider-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="logo-section">
            <i className="fas fa-taxi"></i>
            <h1>Giraffe Cabs</h1>
            <span className="provider-badge">Vehicle Provider Portal</span>
          </div>
          <div className="user-section">
            <div className="user-info">
              <span className="welcome-text">Welcome, {vehicleProvider?.firstName}</span>
              {getStatusBadge(vehicleProvider?.status)}
            </div>
            <button className="logout-btn" onClick={handleLogout}>
              <i className="fas fa-sign-out-alt"></i>
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="dashboard-nav">
        <button 
          className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <i className="fas fa-tachometer-alt"></i>
          Dashboard
        </button>
        <button 
          className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <i className="fas fa-user"></i>
          My Profile
        </button>
        <button 
          className={`nav-item ${activeTab === 'contract' ? 'active' : ''}`}
          onClick={() => setActiveTab('contract')}
        >
          <i className="fas fa-file-contract"></i>
          Contract Details
        </button>
        <button 
          className={`nav-item ${activeTab === 'rates' ? 'active' : ''}`}
          onClick={() => setActiveTab('rates')}
        >
          <i className="fas fa-dollar-sign"></i>
          Company Rates
        </button>
        <button 
          className={`nav-item ${activeTab === 'vehicles' ? 'active' : ''}`}
          onClick={() => setActiveTab('vehicles')}
        >
          <i className="fas fa-car"></i>
          My Vehicles
        </button>
      </nav>

      {/* Main Content */}
      <main className="dashboard-content">
        {activeTab === 'dashboard' && (
          <div className="dashboard-overview">
            <div className="welcome-section">
              <h2>Welcome to Your Dashboard</h2>
              <p>Manage your vehicle rental business with Giraffe Cabs</p>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">
                  <i className="fas fa-car"></i>
                </div>
                <div className="stat-content">
                  <h3>{vehicleProvider?.totalVehicles || 0}</h3>
                  <p>Total Vehicles</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <i className="fas fa-handshake"></i>
                </div>
                <div className="stat-content">
                  <h3>{vehicleProvider?.activeContracts || 0}</h3>
                  <p>Active Contracts</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <i className="fas fa-dollar-sign"></i>
                </div>
                <div className="stat-content">
                  <h3>Rs. {vehicleProvider?.totalEarnings?.toLocaleString() || 0}</h3>
                  <p>Total Earnings</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <i className="fas fa-calendar"></i>
                </div>
                <div className="stat-content">
                  <h3>{formatDate(vehicleProvider?.joinedAt)}</h3>
                  <p>Member Since</p>
                </div>
              </div>
            </div>

            <div className="quick-actions">
              <h3>Quick Actions</h3>
              <div className="action-buttons">
                <button 
                  className="action-btn primary"
                  onClick={() => setShowVehicleRequestModal(true)}
                >
                  <i className="fas fa-plus"></i>
                  Add Vehicle Request
                </button>
                <button 
                  className="action-btn secondary"
                  onClick={() => setActiveTab('profile')}
                >
                  <i className="fas fa-edit"></i>
                  Update Profile
                </button>
                <button 
                  className="action-btn secondary"
                  onClick={() => setActiveTab('contract')}
                >
                  <i className="fas fa-file-contract"></i>
                  View Contract
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="profile-section">
            <div className="section-header">
              <h2>My Profile</h2>
              <button 
                className="btn btn-primary"
                onClick={() => {/* Profile modal functionality removed */}}
              >
                <i className="fas fa-edit"></i>
                Edit Profile
              </button>
            </div>

            <div className="profile-content">
              <div className="profile-info">
                <div className="info-section">
                  <h3>Personal Information</h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <label>Full Name:</label>
                      <span>{vehicleProvider?.firstName} {vehicleProvider?.lastName}</span>
                    </div>
                    <div className="info-item">
                      <label>Email:</label>
                      <span>{vehicleProvider?.email}</span>
                    </div>
                    <div className="info-item">
                      <label>Phone:</label>
                      <span>{vehicleProvider?.phone}</span>
                    </div>
                    <div className="info-item">
                      <label>Address:</label>
                      <span>{vehicleProvider?.fullAddress}</span>
                    </div>
                  </div>
                </div>

                <div className="info-section">
                  <h3>Business Information</h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <label>Business Name:</label>
                      <span>{vehicleProvider?.businessName}</span>
                    </div>
                    <div className="info-item">
                      <label>Business Type:</label>
                      <span>{vehicleProvider?.businessType}</span>
                    </div>
                    <div className="info-item">
                      <label>Registration Number:</label>
                      <span>{vehicleProvider?.businessRegistrationNumber}</span>
                    </div>
                    <div className="info-item">
                      <label>Status:</label>
                      {getStatusBadge(vehicleProvider?.status)}
                    </div>
                  </div>
                </div>

                <div className="info-section">
                  <h3>Banking Information</h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <label>Bank Name:</label>
                      <span>{vehicleProvider?.bankDetails?.bankName}</span>
                    </div>
                    <div className="info-item">
                      <label>Account Number:</label>
                      <span>{vehicleProvider?.bankDetails?.accountNumber}</span>
                    </div>
                    <div className="info-item">
                      <label>Account Holder:</label>
                      <span>{vehicleProvider?.bankDetails?.accountHolderName}</span>
                    </div>
                    <div className="info-item">
                      <label>Branch:</label>
                      <span>{vehicleProvider?.bankDetails?.branch}</span>
                    </div>
                  </div>
                </div>

                {vehicleProvider?.bio && (
                  <div className="info-section">
                    <h3>Bio</h3>
                    <p>{vehicleProvider.bio}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'contract' && (
          <div className="contract-section">
            <div className="section-header">
              <h2>Contract Details</h2>
            </div>

            <div className="contract-content">
              <div className="contract-info">
                <h3>Vehicle Provider Agreement</h3>
                <div className="contract-terms">
                  <div className="term-item">
                    <h4>1. Agreement Period</h4>
                    <p>This agreement is valid for 12 months from the date of approval and can be renewed annually.</p>
                  </div>
                  <div className="term-item">
                    <h4>2. Monthly Commission</h4>
                    <p>Giraffe Cabs will deduct a 15% commission from all bookings made through our platform.</p>
                  </div>
                  <div className="term-item">
                    <h4>3. Payment Terms</h4>
                    <p>Payments will be processed monthly on the 15th of each month for the previous month's earnings.</p>
                  </div>
                  <div className="term-item">
                    <h4>4. Vehicle Requirements</h4>
                    <p>All vehicles must be properly insured, registered, and maintained according to government standards.</p>
                  </div>
                  <div className="term-item">
                    <h4>5. Service Standards</h4>
                    <p>Vehicle providers must maintain high service standards and respond to booking requests promptly.</p>
                  </div>
                </div>

                <div className="contract-status">
                  <h4>Your Contract Status</h4>
                  <div className="status-info">
                    <p><strong>Status:</strong> {getStatusBadge(vehicleProvider?.status)}</p>
                    <p><strong>Joined:</strong> {formatDate(vehicleProvider?.joinedAt)}</p>
                    <p><strong>Last Login:</strong> {vehicleProvider?.lastLogin ? formatDate(vehicleProvider.lastLogin) : 'Never'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'rates' && (
          <div className="rates-section">
            <div className="section-header">
              <h2>Company Rates</h2>
              <p>Current rates offered by Giraffe Cabs for different vehicle types</p>
            </div>

            <div className="rates-content">
              <div className="rates-grid">
                {Object.entries(companyRates).map(([vehicleType, rates]) => (
                  <div key={vehicleType} className="rate-card">
                    <div className="rate-header">
                      <i className="fas fa-car"></i>
                      <h3>{vehicleType.replace('_', ' ').toUpperCase()}</h3>
                    </div>
                    <div className="rate-details">
                      <div className="rate-item">
                        <span className="rate-label">Daily Rate:</span>
                        <span className="rate-value">Rs. {rates.daily.toLocaleString()}</span>
                      </div>
                      <div className="rate-item">
                        <span className="rate-label">Monthly Rate:</span>
                        <span className="rate-value">Rs. {rates.monthly.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rates-info">
                <h3>Rate Information</h3>
                <ul>
                  <li>Rates are subject to change based on market conditions</li>
                  <li>Special rates may apply for long-term contracts</li>
                  <li>Additional charges may apply for special services</li>
                  <li>All rates are exclusive of taxes and fees</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'vehicles' && (
          <div className="vehicles-section">
            <div className="section-header">
              <h2>My Vehicle Requests</h2>
              <button 
                className="btn btn-primary"
                onClick={() => setShowVehicleRequestModal(true)}
              >
                <i className="fas fa-plus"></i>
                Add Vehicle Request
              </button>
            </div>

            <div className="vehicles-content">
              <div className="vehicles-list">
                {vehicleRequests.length === 0 ? (
                  <div className="empty-state">
                    <i className="fas fa-car"></i>
                    <h3>No Vehicle Requests Yet</h3>
                    <p>Submit a vehicle request to start earning with Giraffe Cabs</p>
                    <button 
                      className="btn btn-primary"
                      onClick={() => setShowVehicleRequestModal(true)}
                    >
                      Add Your First Vehicle
                    </button>
                  </div>
                ) : (
                  <div className="requests-grid">
                    {vehicleRequests.map((request) => (
                      <div key={request._id} className="request-card">
                        <div className="request-header">
                          <h3>{request.fullVehicleName}</h3>
                          <span className={`status-badge ${request.statusClass}`}>
                            {request.status}
                          </span>
                        </div>
                        <div className="request-details">
                          <div className="detail-row">
                            <span className="label">Vehicle Number:</span>
                            <span className="value">{request.vehicleNumber}</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">Type:</span>
                            <span className="value">{request.vehicleType.replace('_', ' ').toUpperCase()}</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">Color:</span>
                            <span className="value">{request.color}</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">Capacity:</span>
                            <span className="value">{request.capacity} passengers</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">Daily Rate:</span>
                            <span className="value">Rs. {request.dailyRate.toLocaleString()}</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">Monthly Rate:</span>
                            <span className="value">Rs. {request.monthlyRate.toLocaleString()}</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">Submitted:</span>
                            <span className="value">{formatDate(request.createdAt)}</span>
                          </div>
                        </div>
                        {request.adminNotes && (
                          <div className="admin-notes">
                            <h4>Admin Notes:</h4>
                            <p>{request.adminNotes}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Vehicle Request Modal */}
      {showVehicleRequestModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Add Vehicle Request</h3>
              <button className="close-btn" onClick={() => setShowVehicleRequestModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <form onSubmit={handleVehicleRequestSubmit} className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label>Vehicle Number *</label>
                  <input
                    type="text"
                    value={vehicleRequestData.vehicleNumber}
                    onChange={(e) => setVehicleRequestData({...vehicleRequestData, vehicleNumber: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Vehicle Type *</label>
                  <select
                    value={vehicleRequestData.vehicleType}
                    onChange={(e) => setVehicleRequestData({...vehicleRequestData, vehicleType: e.target.value})}
                    required
                  >
                    <option value="">Select Type</option>
                    <option value="van">Van</option>
                    <option value="bus">Bus</option>
                    <option value="car">Car</option>
                    <option value="wedding_car">Wedding Car</option>
                    <option value="goods_vehicle">Goods Vehicle</option>
                    <option value="bike">Bike</option>
                    <option value="lorry">Lorry</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Brand *</label>
                  <input
                    type="text"
                    value={vehicleRequestData.brand}
                    onChange={(e) => setVehicleRequestData({...vehicleRequestData, brand: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Model *</label>
                  <input
                    type="text"
                    value={vehicleRequestData.model}
                    onChange={(e) => setVehicleRequestData({...vehicleRequestData, model: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Year *</label>
                  <input
                    type="number"
                    value={vehicleRequestData.year}
                    onChange={(e) => setVehicleRequestData({...vehicleRequestData, year: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Color *</label>
                  <input
                    type="text"
                    value={vehicleRequestData.color}
                    onChange={(e) => setVehicleRequestData({...vehicleRequestData, color: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Capacity *</label>
                  <input
                    type="number"
                    value={vehicleRequestData.capacity}
                    onChange={(e) => setVehicleRequestData({...vehicleRequestData, capacity: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Fuel Type *</label>
                  <select
                    value={vehicleRequestData.fuelType}
                    onChange={(e) => setVehicleRequestData({...vehicleRequestData, fuelType: e.target.value})}
                    required
                  >
                    <option value="">Select Fuel Type</option>
                    <option value="petrol">Petrol</option>
                    <option value="diesel">Diesel</option>
                    <option value="electric">Electric</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Transmission *</label>
                  <select
                    value={vehicleRequestData.transmission}
                    onChange={(e) => setVehicleRequestData({...vehicleRequestData, transmission: e.target.value})}
                    required
                  >
                    <option value="">Select Transmission</option>
                    <option value="manual">Manual</option>
                    <option value="automatic">Automatic</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Daily Rate (Rs.) *</label>
                  <input
                    type="number"
                    value={vehicleRequestData.dailyRate}
                    onChange={(e) => setVehicleRequestData({...vehicleRequestData, dailyRate: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Monthly Rate (Rs.) *</label>
                <input
                  type="number"
                  value={vehicleRequestData.monthlyRate}
                  onChange={(e) => setVehicleRequestData({...vehicleRequestData, monthlyRate: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={vehicleRequestData.description}
                  onChange={(e) => setVehicleRequestData({...vehicleRequestData, description: e.target.value})}
                  rows="3"
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowVehicleRequestModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleProviderDashboard;