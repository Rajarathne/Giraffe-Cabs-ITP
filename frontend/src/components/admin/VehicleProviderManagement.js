import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './VehicleProviderManagement.css';
import VehicleProviderRegistration from './VehicleProviderRegistration';

const VehicleProviderManagement = () => {
  const [activeTab, setActiveTab] = useState('list');
  const [vehicleProviders, setVehicleProviders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    suspended: 0,
    rejected: 0
  });
  const [selectedProviders, setSelectedProviders] = useState([]);
  const [filters, setFilters] = useState({
    status: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });
  const [showModal, setShowModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [actionType, setActionType] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    loadVehicleProviders();
    loadStats();
  }, [filters, pagination.currentPage]);

  const loadVehicleProviders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const params = new URLSearchParams({
        page: pagination.currentPage,
        limit: pagination.itemsPerPage,
        ...filters
      });

      const response = await axios.get(`/api/admin/vehicle-providers?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setVehicleProviders(response.data.vehicleProviders);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error loading vehicle providers:', error);
      alert('Failed to load vehicle providers');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get('/api/admin/vehicle-providers/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setStats(response.data.statusCounts);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleStatusUpdate = async (providerId, status, reason = '') => {
    try {
      const token = localStorage.getItem('authToken');
      await axios.put(`/api/admin/vehicle-providers/${providerId}/status`, {
        status,
        rejectionReason: reason
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert(`Vehicle provider status updated to ${status}`);
      loadVehicleProviders();
      loadStats();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const handleBulkStatusUpdate = async (status, reason = '') => {
    if (selectedProviders.length === 0) {
      alert('Please select vehicle providers to update');
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      await axios.put('/api/admin/vehicle-providers/bulk/status', {
        ids: selectedProviders,
        status,
        rejectionReason: reason
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert(`Updated ${selectedProviders.length} vehicle providers to ${status}`);
      setSelectedProviders([]);
      loadVehicleProviders();
      loadStats();
    } catch (error) {
      console.error('Error bulk updating status:', error);
      alert('Failed to update status');
    }
  };

  const handleSelectProvider = (providerId) => {
    setSelectedProviders(prev => 
      prev.includes(providerId) 
        ? prev.filter(id => id !== providerId)
        : [...prev, providerId]
    );
  };

  const handleSelectAll = () => {
    if (selectedProviders.length === vehicleProviders.length) {
      setSelectedProviders([]);
    } else {
      setSelectedProviders(vehicleProviders.map(p => p._id));
    }
  };

  const openModal = (provider, action) => {
    setSelectedProvider(provider);
    setActionType(action);
    setRejectionReason('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedProvider(null);
    setActionType('');
    setRejectionReason('');
  };

  const confirmAction = () => {
    if (actionType === 'reject' && !rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    if (selectedProvider) {
      handleStatusUpdate(selectedProvider._id, actionType, rejectionReason);
    } else {
      handleBulkStatusUpdate(actionType, rejectionReason);
    }
    closeModal();
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
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="vehicle-provider-management">
      <div className="page-header">
        <h1>Vehicle Provider Management</h1>
        <p>Manage vehicle provider registrations and approvals</p>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => setActiveTab('list')}
        >
          <i className="fas fa-list"></i>
          Provider List
        </button>
        <button 
          className={`tab-btn ${activeTab === 'register' ? 'active' : ''}`}
          onClick={() => setActiveTab('register')}
        >
          <i className="fas fa-user-plus"></i>
          Register Provider
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'register' && <VehicleProviderRegistration />}
      
      {activeTab === 'list' && (
        <>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon total">
            <i className="fas fa-users"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.total}</h3>
            <p>Total Providers</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon pending">
            <i className="fas fa-clock"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.pending}</h3>
            <p>Pending Approval</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon approved">
            <i className="fas fa-check-circle"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.approved}</h3>
            <p>Approved</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon rejected">
            <i className="fas fa-times-circle"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.rejected}</h3>
            <p>Rejected</p>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="filters-section">
        <div className="filters">
          <div className="filter-group">
            <label>Status:</label>
            <select 
              value={filters.status} 
              onChange={(e) => setFilters({...filters, status: e.target.value})}
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="suspended">Suspended</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Search:</label>
            <input
              type="text"
              placeholder="Search by name, email, or business..."
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
            />
          </div>
        </div>

        {selectedProviders.length > 0 && (
          <div className="bulk-actions">
            <span>{selectedProviders.length} selected</span>
            <button 
              className="btn btn-success"
              onClick={() => openModal(null, 'approved')}
            >
              <i className="fas fa-check"></i> Approve All
            </button>
            <button 
              className="btn btn-danger"
              onClick={() => openModal(null, 'rejected')}
            >
              <i className="fas fa-times"></i> Reject All
            </button>
          </div>
        )}
      </div>

      {/* Vehicle Providers Table */}
      <div className="table-container">
        <table className="providers-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selectedProviders.length === vehicleProviders.length && vehicleProviders.length > 0}
                  onChange={handleSelectAll}
                />
              </th>
              <th>Name</th>
              <th>Email</th>
              <th>Business</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="loading-cell">
                  <i className="fas fa-spinner fa-spin"></i> Loading...
                </td>
              </tr>
            ) : vehicleProviders.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty-cell">
                  No vehicle providers found
                </td>
              </tr>
            ) : (
              vehicleProviders.map((provider) => (
                <tr key={provider._id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedProviders.includes(provider._id)}
                      onChange={() => handleSelectProvider(provider._id)}
                    />
                  </td>
                  <td>
                    <div className="provider-info">
                      <strong>{provider.firstName} {provider.lastName}</strong>
                      <small>{provider.phone}</small>
                    </div>
                  </td>
                  <td>{provider.email}</td>
                  <td>
                    <div className="business-info">
                      <strong>{provider.businessName}</strong>
                      <small>{provider.businessType}</small>
                    </div>
                  </td>
                  <td>{getStatusBadge(provider.status)}</td>
                  <td>{formatDate(provider.createdAt)}</td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn btn-sm btn-info"
                        onClick={() => openModal(provider, 'view')}
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                      {provider.status === 'pending' && (
                        <>
                          <button 
                            className="btn btn-sm btn-success"
                            onClick={() => openModal(provider, 'approved')}
                          >
                            <i className="fas fa-check"></i>
                          </button>
                          <button 
                            className="btn btn-sm btn-danger"
                            onClick={() => openModal(provider, 'rejected')}
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </>
                      )}
                      {provider.status === 'approved' && (
                        <button 
                          className="btn btn-sm btn-warning"
                          onClick={() => openModal(provider, 'suspended')}
                        >
                          <i className="fas fa-pause"></i>
                        </button>
                      )}
                      {provider.status === 'suspended' && (
                        <button 
                          className="btn btn-sm btn-success"
                          onClick={() => openModal(provider, 'approved')}
                        >
                          <i className="fas fa-play"></i>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="pagination">
          <button 
            disabled={pagination.currentPage === 1}
            onClick={() => setPagination({...pagination, currentPage: pagination.currentPage - 1})}
          >
            <i className="fas fa-chevron-left"></i> Previous
          </button>
          <span>
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <button 
            disabled={pagination.currentPage === pagination.totalPages}
            onClick={() => setPagination({...pagination, currentPage: pagination.currentPage + 1})}
          >
            Next <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>
                {actionType === 'view' ? 'View Vehicle Provider' : 
                 actionType === 'approved' ? 'Approve Vehicle Provider' :
                 actionType === 'rejected' ? 'Reject Vehicle Provider' :
                 actionType === 'suspended' ? 'Suspend Vehicle Provider' : 'Action'}
              </h3>
              <button className="close-btn" onClick={closeModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-body">
              {actionType === 'view' && selectedProvider && (
                <div className="provider-details">
                  <div className="detail-section">
                    <h4>Personal Information</h4>
                    <p><strong>Name:</strong> {selectedProvider.firstName} {selectedProvider.lastName}</p>
                    <p><strong>Email:</strong> {selectedProvider.email}</p>
                    <p><strong>Phone:</strong> {selectedProvider.phone}</p>
                    <p><strong>Address:</strong> {selectedProvider.fullAddress}</p>
                  </div>
                  
                  <div className="detail-section">
                    <h4>Business Information</h4>
                    <p><strong>Business Name:</strong> {selectedProvider.businessName}</p>
                    <p><strong>Business Type:</strong> {selectedProvider.businessType}</p>
                    <p><strong>Registration Number:</strong> {selectedProvider.businessRegistrationNumber}</p>
                  </div>
                  
                  <div className="detail-section">
                    <h4>Banking Information</h4>
                    <p><strong>Bank:</strong> {selectedProvider.bankDetails.bankName}</p>
                    <p><strong>Account Number:</strong> {selectedProvider.bankDetails.accountNumber}</p>
                    <p><strong>Account Holder:</strong> {selectedProvider.bankDetails.accountHolderName}</p>
                    <p><strong>Branch:</strong> {selectedProvider.bankDetails.branch}</p>
                  </div>
                  
                  {selectedProvider.bio && (
                    <div className="detail-section">
                      <h4>Bio</h4>
                      <p>{selectedProvider.bio}</p>
                    </div>
                  )}
                </div>
              )}
              
              {(actionType === 'rejected' || actionType === 'suspended') && (
                <div className="reason-section">
                  <label>Reason:</label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder={`Enter reason for ${actionType}...`}
                    rows="4"
                    required
                  />
                </div>
              )}
              
              {actionType === 'approved' && (
                <div className="confirmation-section">
                  <p>Are you sure you want to approve this vehicle provider?</p>
                  {selectedProvider && (
                    <p><strong>Provider:</strong> {selectedProvider.firstName} {selectedProvider.lastName}</p>
                  )}
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeModal}>
                Cancel
              </button>
              {actionType !== 'view' && (
                <button 
                  className={`btn ${actionType === 'approved' ? 'btn-success' : actionType === 'rejected' ? 'btn-danger' : 'btn-warning'}`}
                  onClick={confirmAction}
                >
                  {actionType === 'approved' ? 'Approve' : 
                   actionType === 'rejected' ? 'Reject' : 
                   actionType === 'suspended' ? 'Suspend' : 'Confirm'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};

export default VehicleProviderManagement;
