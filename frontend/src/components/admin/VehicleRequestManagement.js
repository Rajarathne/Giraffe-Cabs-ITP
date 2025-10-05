import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './VehicleRequestManagement.css';

const VehicleRequestManagement = () => {
  const [vehicleRequests, setVehicleRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });
  const [selectedRequests, setSelectedRequests] = useState([]);
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
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionType, setActionType] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [editData, setEditData] = useState({
    dailyRate: '',
    monthlyRate: '',
    description: ''
  });

  const loadVehicleRequests = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const params = new URLSearchParams({
        page: pagination.currentPage,
        limit: pagination.itemsPerPage,
        ...filters
      });

      const response = await axios.get(`/api/admin/vehicle-requests/admin/all?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setVehicleRequests(response.data.vehicleRequests);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error loading vehicle requests:', error);
      alert('Failed to load vehicle requests');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.currentPage, pagination.itemsPerPage]);

  useEffect(() => {
    loadVehicleRequests();
    loadStats();
  }, [filters, pagination.currentPage, loadVehicleRequests]);

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get('/api/admin/vehicle-requests/admin/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setStats(response.data.statusCounts);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleStatusUpdate = async (requestId, status, notes = '') => {
    try {
      const token = localStorage.getItem('authToken');
      await axios.put(`/api/admin/vehicle-requests/admin/${requestId}/status`, {
        status,
        adminNotes: notes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert(`Vehicle request ${status} successfully`);
      loadVehicleRequests();
      loadStats();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const handleDeleteRequest = async (requestId) => {
    if (window.confirm('Are you sure you want to delete this vehicle request?')) {
      try {
        const token = localStorage.getItem('authToken');
        await axios.delete(`/api/admin/vehicle-requests/${requestId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        alert('Vehicle request deleted successfully');
        loadVehicleRequests();
        loadStats();
      } catch (error) {
        console.error('Error deleting request:', error);
        alert('Failed to delete vehicle request');
      }
    }
  };

  const handleEditRequest = async () => {
    try {
      const token = localStorage.getItem('authToken');
      await axios.put(`/api/admin/vehicle-requests/admin/${selectedRequest._id}/edit`, {
        dailyRate: editData.dailyRate,
        monthlyRate: editData.monthlyRate,
        description: editData.description
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Vehicle request updated successfully');
      loadVehicleRequests();
      closeModal();
    } catch (error) {
      console.error('Error updating request:', error);
      alert('Failed to update vehicle request');
    }
  };

  const handleSelectRequest = (requestId) => {
    setSelectedRequests(prev => 
      prev.includes(requestId) 
        ? prev.filter(id => id !== requestId)
        : [...prev, requestId]
    );
  };

  const handleSelectAll = () => {
    if (selectedRequests.length === vehicleRequests.length) {
      setSelectedRequests([]);
    } else {
      setSelectedRequests(vehicleRequests.map(r => r._id));
    }
  };

  const openModal = (request, action) => {
    setSelectedRequest(request);
    setActionType(action);
    setAdminNotes('');
    if (action === 'edit') {
      setEditData({
        dailyRate: request.dailyRate,
        monthlyRate: request.monthlyRate,
        description: request.description || ''
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedRequest(null);
    setActionType('');
    setAdminNotes('');
    setEditData({
      dailyRate: '',
      monthlyRate: '',
      description: ''
    });
  };

  const confirmAction = () => {
    if (actionType === 'rejected' && !adminNotes.trim()) {
      alert('Please provide notes for rejection');
      return;
    }

    if (selectedRequest) {
      handleStatusUpdate(selectedRequest._id, actionType, adminNotes);
    }
    closeModal();
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      pending: 'status-pending',
      approved: 'status-approved',
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

  const formatCurrency = (amount) => {
    return `Rs. ${amount.toLocaleString()}`;
  };

  return (
    <div className="vehicle-request-management">
      <div className="page-header">
        <h1>Vehicle Request Management</h1>
        <p>Manage vehicle rental requests from providers</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon total">
            <i className="fas fa-car"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.total}</h3>
            <p>Total Requests</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon pending">
            <i className="fas fa-clock"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.pending}</h3>
            <p>Pending Review</p>
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

      {/* Filters */}
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
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Search:</label>
            <input
              type="text"
              placeholder="Search by vehicle number, brand, model..."
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
            />
          </div>
        </div>
      </div>

      {/* Vehicle Requests Table */}
      <div className="table-container">
        <table className="requests-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selectedRequests.length === vehicleRequests.length && vehicleRequests.length > 0}
                  onChange={handleSelectAll}
                />
              </th>
              <th>Vehicle Details</th>
              <th>Provider</th>
              <th>Rates</th>
              <th>Status</th>
              <th>Submitted</th>
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
            ) : vehicleRequests.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty-cell">
                  No vehicle requests found
                </td>
              </tr>
            ) : (
              vehicleRequests.map((request) => (
                <tr key={request._id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedRequests.includes(request._id)}
                      onChange={() => handleSelectRequest(request._id)}
                    />
                  </td>
                  <td>
                    <div className="vehicle-info">
                      <strong>{request.fullVehicleName}</strong>
                      <small>{request.vehicleNumber}</small>
                      <small>{request.vehicleType.replace('_', ' ').toUpperCase()}</small>
                    </div>
                  </td>
                  <td>
                    <div className="provider-info">
                      <strong>{request.vehicleProvider?.firstName} {request.vehicleProvider?.lastName}</strong>
                      <small>{request.vehicleProvider?.businessName}</small>
                      <small>{request.vehicleProvider?.email}</small>
                    </div>
                  </td>
                  <td>
                    <div className="rates-info">
                      <div>Daily: {formatCurrency(request.dailyRate)}</div>
                      <div>Monthly: {formatCurrency(request.monthlyRate)}</div>
                    </div>
                  </td>
                  <td>{getStatusBadge(request.status)}</td>
                  <td>{formatDate(request.createdAt)}</td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn btn-sm btn-info"
                        onClick={() => openModal(request, 'view')}
                        title="View Details"
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                      <button 
                        className="btn btn-sm btn-warning"
                        onClick={() => openModal(request, 'edit')}
                        title="Edit Request"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      {request.status === 'pending' && (
                        <>
                          <button 
                            className="btn btn-sm btn-success"
                            onClick={() => openModal(request, 'approved')}
                          >
                            <i className="fas fa-check"></i>
                          </button>
                          <button 
                            className="btn btn-sm btn-danger"
                            onClick={() => openModal(request, 'rejected')}
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </>
                      )}
                      <button 
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDeleteRequest(request._id)}
                        title="Delete Request"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
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
                {actionType === 'view' ? 'View Vehicle Request' : 
                 actionType === 'edit' ? 'Edit Vehicle Request' :
                 actionType === 'approved' ? 'Approve Vehicle Request' :
                 actionType === 'rejected' ? 'Reject Vehicle Request' : 'Action'}
              </h3>
              <button className="close-btn" onClick={closeModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-body">
              {actionType === 'view' && selectedRequest && (
                <div className="request-details">
                  <div className="detail-section">
                    <h4>Vehicle Information</h4>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <label>Vehicle Number:</label>
                        <span>{selectedRequest.vehicleNumber}</span>
                      </div>
                      <div className="detail-item">
                        <label>Vehicle Type:</label>
                        <span>{selectedRequest.vehicleType.replace('_', ' ').toUpperCase()}</span>
                      </div>
                      <div className="detail-item">
                        <label>Brand & Model:</label>
                        <span>{selectedRequest.brand} {selectedRequest.model}</span>
                      </div>
                      <div className="detail-item">
                        <label>Year:</label>
                        <span>{selectedRequest.year}</span>
                      </div>
                      <div className="detail-item">
                        <label>Color:</label>
                        <span>{selectedRequest.color}</span>
                      </div>
                      <div className="detail-item">
                        <label>Capacity:</label>
                        <span>{selectedRequest.capacity} passengers</span>
                      </div>
                      <div className="detail-item">
                        <label>Fuel Type:</label>
                        <span>{selectedRequest.fuelType}</span>
                      </div>
                      <div className="detail-item">
                        <label>Transmission:</label>
                        <span>{selectedRequest.transmission}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="detail-section">
                    <h4>Pricing</h4>
                    <div className="pricing-info">
                      <div className="price-item">
                        <span className="price-label">Daily Rate:</span>
                        <span className="price-value">{formatCurrency(selectedRequest.dailyRate)}</span>
                      </div>
                      <div className="price-item">
                        <span className="price-label">Monthly Rate:</span>
                        <span className="price-value">{formatCurrency(selectedRequest.monthlyRate)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h4>Provider Information</h4>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <label>Name:</label>
                        <span>{selectedRequest.vehicleProvider?.firstName} {selectedRequest.vehicleProvider?.lastName}</span>
                      </div>
                      <div className="detail-item">
                        <label>Business:</label>
                        <span>{selectedRequest.vehicleProvider?.businessName}</span>
                      </div>
                      <div className="detail-item">
                        <label>Email:</label>
                        <span>{selectedRequest.vehicleProvider?.email}</span>
                      </div>
                      <div className="detail-item">
                        <label>Phone:</label>
                        <span>{selectedRequest.vehicleProvider?.phone}</span>
                      </div>
                    </div>
                  </div>
                  
                  {selectedRequest.description && (
                    <div className="detail-section">
                      <h4>Description</h4>
                      <p>{selectedRequest.description}</p>
                    </div>
                  )}

                  {selectedRequest.features && selectedRequest.features.length > 0 && (
                    <div className="detail-section">
                      <h4>Features</h4>
                      <ul>
                        {selectedRequest.features.map((feature, index) => (
                          <li key={index}>{feature}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              
              {(actionType === 'rejected') && (
                <div className="notes-section">
                  <label>Rejection Notes:</label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Enter reason for rejection..."
                    rows="4"
                    required
                  />
                </div>
              )}
              
              {actionType === 'edit' && selectedRequest && (
                <div className="edit-form">
                  <div className="form-group">
                    <label>Daily Rate (Rs.):</label>
                    <input
                      type="number"
                      value={editData.dailyRate}
                      onChange={(e) => setEditData({...editData, dailyRate: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Monthly Rate (Rs.):</label>
                    <input
                      type="number"
                      value={editData.monthlyRate}
                      onChange={(e) => setEditData({...editData, monthlyRate: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Description:</label>
                    <textarea
                      value={editData.description}
                      onChange={(e) => setEditData({...editData, description: e.target.value})}
                      rows="3"
                    />
                  </div>
                </div>
              )}

              {actionType === 'approved' && (
                <div className="confirmation-section">
                  <p>Are you sure you want to approve this vehicle request?</p>
                  {selectedRequest && (
                    <div className="approval-info">
                      <p><strong>Vehicle:</strong> {selectedRequest.fullVehicleName}</p>
                      <p><strong>Provider:</strong> {selectedRequest.vehicleProvider?.firstName} {selectedRequest.vehicleProvider?.lastName}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeModal}>
                Cancel
              </button>
              {actionType === 'edit' && (
                <button 
                  className="btn btn-primary"
                  onClick={handleEditRequest}
                >
                  Update Request
                </button>
              )}
              {actionType === 'approved' && (
                <button 
                  className="btn btn-success"
                  onClick={confirmAction}
                >
                  Approve
                </button>
              )}
              {actionType === 'rejected' && (
                <button 
                  className="btn btn-danger"
                  onClick={confirmAction}
                >
                  Reject
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleRequestManagement;

