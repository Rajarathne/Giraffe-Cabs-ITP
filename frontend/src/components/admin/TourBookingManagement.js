import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TourBookingManagement.css';

const TourBookingManagement = ({ 
  tourBookings, 
  loading,
  onRefreshData
}) => {
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionData, setActionData] = useState({
    status: '',
    finalPrice: '',
    adminNotes: ''
  });

  const handleBookingSelect = (booking) => {
    setSelectedBooking(booking);
    setActionData({
      status: booking.status,
      finalPrice: booking.pricing.finalPrice,
      adminNotes: booking.adminNotes || ''
    });
    setShowModal(true);
  };

  const handleActionSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('authToken');
      const headers = { Authorization: `Bearer ${token}` };

      const updateData = {
        status: actionData.status,
        adminNotes: actionData.adminNotes
      };

      if (actionData.finalPrice && actionData.finalPrice !== selectedBooking.pricing.finalPrice) {
        updateData.finalPrice = parseFloat(actionData.finalPrice);
      }

      await axios.put(`/api/tour-bookings/${selectedBooking._id}/status`, updateData, { headers });
      
      alert('Booking updated successfully!');
      setShowModal(false);
      setSelectedBooking(null);
      onRefreshData();
    } catch (error) {
      console.error('Error updating booking:', error);
      alert(error.response?.data?.message || 'Failed to update booking');
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      pending: 'status-pending',
      confirmed: 'status-confirmed',
      rejected: 'status-rejected',
      cancelled: 'status-cancelled',
      completed: 'status-completed'
    };
    
    return (
      <span className={`status-badge ${statusClasses[status] || 'status-pending'}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount) => {
    return `LKR ${amount?.toLocaleString() || '0'}`;
  };

  return (
    <div className="tour-booking-management">
      <div className="content-header">
        <h2>Tour Booking Management</h2>
        <button 
          className="btn btn-secondary"
          onClick={onRefreshData}
          disabled={loading}
        >
          <i className="fas fa-sync-alt"></i> Refresh
        </button>
      </div>

      <div className="bookings-table">
        <table>
          <thead>
            <tr>
              <th>Booking ID</th>
              <th>Customer</th>
              <th>Package</th>
              <th>Destination</th>
              <th>Passengers</th>
              <th>Booking Date</th>
              <th>Base Price</th>
              <th>Final Price</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tourBookings.map(booking => (
              <tr key={booking._id}>
                <td>
                  <span className="booking-id">
                    {booking._id.substring(0, 8)}...
                  </span>
                </td>
                <td>
                  <div className="customer-info">
                    <div className="customer-name">{booking.contactPerson?.name}</div>
                    <div className="customer-email">{booking.contactPerson?.email}</div>
                    <div className="customer-phone">{booking.contactPerson?.phone}</div>
                  </div>
                </td>
                <td>
                  <div className="package-info">
                    <div className="package-name">{booking.tourPackage?.packageName}</div>
                    <div className="package-category">
                      <span className={`category-badge category-${booking.tourPackage?.tourCategory?.toLowerCase()}`}>
                        {booking.tourPackage?.tourCategory}
                      </span>
                    </div>
                  </div>
                </td>
                <td>{booking.tourPackage?.destination}</td>
                <td>
                  <div className="passenger-info">
                    <span className="passenger-count">{booking.numberOfPassengers}</span>
                    <small>passengers</small>
                  </div>
                </td>
                <td>{formatDate(booking.bookingDate)}</td>
                <td>{formatCurrency(booking.pricing?.basePrice)}</td>
                <td>
                  <div className="pricing-info">
                    <span className="final-price">{formatCurrency(booking.pricing?.finalPrice)}</span>
                    {booking.pricing?.isPriceConfirmed && (
                      <small className="price-confirmed">✓ Confirmed</small>
                    )}
                  </div>
                </td>
                <td>{getStatusBadge(booking.status)}</td>
                <td>
                  <div className="action-buttons">
                    <button 
                      className="btn btn-sm btn-primary"
                      onClick={() => handleBookingSelect(booking)}
                    >
                      <i className="fas fa-edit"></i> Manage
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Booking Management Modal */}
      {showModal && selectedBooking && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            <h2>Manage Tour Booking</h2>
            
            <div className="booking-details">
              <div className="booking-info-section">
                <h3>Booking Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Booking ID:</label>
                    <span>{selectedBooking._id}</span>
                  </div>
                  <div className="info-item">
                    <label>Package:</label>
                    <span>{selectedBooking.tourPackage?.packageName}</span>
                  </div>
                  <div className="info-item">
                    <label>Destination:</label>
                    <span>{selectedBooking.tourPackage?.destination}</span>
                  </div>
                  <div className="info-item">
                    <label>Duration:</label>
                    <span>{selectedBooking.tourPackage?.tourDays} days</span>
                  </div>
                  <div className="info-item">
                    <label>Booking Date:</label>
                    <span>{formatDate(selectedBooking.bookingDate)}</span>
                  </div>
                  <div className="info-item">
                    <label>Number of Passengers:</label>
                    <span>{selectedBooking.numberOfPassengers}</span>
                  </div>
                </div>
              </div>

              <div className="customer-info-section">
                <h3>Customer Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Name:</label>
                    <span>{selectedBooking.contactPerson?.name}</span>
                  </div>
                  <div className="info-item">
                    <label>Email:</label>
                    <span>{selectedBooking.contactPerson?.email}</span>
                  </div>
                  <div className="info-item">
                    <label>Phone:</label>
                    <span>{selectedBooking.contactPerson?.phone}</span>
                  </div>
                  <div className="info-item">
                    <label>Address:</label>
                    <span>{selectedBooking.contactPerson?.address}</span>
                  </div>
                </div>
              </div>

              <div className="passengers-section">
                <h3>Passenger Details</h3>
                <div className="passengers-list">
                  {selectedBooking.passengers?.map((passenger, index) => (
                    <div key={index} className="passenger-item">
                      <h4>Passenger {index + 1}</h4>
                      <div className="passenger-details">
                        <span><strong>Name:</strong> {passenger.firstName} {passenger.lastName}</span>
                        <span><strong>Age:</strong> {passenger.age}</span>
                        {passenger.passportNumber && <span><strong>Passport:</strong> {passenger.passportNumber}</span>}
                        <span><strong>Emergency Contact:</strong> {passenger.emergencyContact}</span>
                        {passenger.specialRequirements && (
                          <span><strong>Special Requirements:</strong> {passenger.specialRequirements}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedBooking.specialRequests && (
                <div className="special-requests-section">
                  <h3>Special Requests</h3>
                  <p>{selectedBooking.specialRequests}</p>
                </div>
              )}

              <div className="pricing-section">
                <h3>Pricing Information</h3>
                <div className="pricing-details">
                  <div className="pricing-item">
                    <label>Base Price:</label>
                    <span>{formatCurrency(selectedBooking.pricing?.basePrice)}</span>
                  </div>
                  <div className="pricing-item">
                    <label>Discount Applied:</label>
                    <span>{formatCurrency(selectedBooking.pricing?.discountApplied || 0)}</span>
                  </div>
                  <div className="pricing-item">
                    <label>Final Price:</label>
                    <span className="final-price">{formatCurrency(selectedBooking.pricing?.finalPrice)}</span>
                  </div>
                </div>
              </div>

              {selectedBooking.adminNotes && (
                <div className="admin-notes-section">
                  <h3>Admin Notes</h3>
                  <p>{selectedBooking.adminNotes}</p>
                </div>
              )}

              {selectedBooking.adminActions && selectedBooking.adminActions.length > 0 && (
                <div className="admin-actions-section">
                  <h3>Admin Actions History</h3>
                  <div className="actions-list">
                    {selectedBooking.adminActions.map((action, index) => (
                      <div key={index} className="action-item">
                        <div className="action-header">
                          <span className="action-type">{action.action}</span>
                          <span className="action-date">{formatDate(action.timestamp)}</span>
                        </div>
                        {action.note && <p className="action-note">{action.note}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleActionSubmit} className="booking-action-form">
              <h3>Update Booking</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="status">Status</label>
                  <select
                    id="status"
                    value={actionData.status}
                    onChange={(e) => setActionData(prev => ({ ...prev, status: e.target.value }))}
                    required
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="rejected">Rejected</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="finalPrice">Final Price (LKR)</label>
                  <input
                    type="number"
                    id="finalPrice"
                    value={actionData.finalPrice}
                    onChange={(e) => setActionData(prev => ({ ...prev, finalPrice: e.target.value }))}
                    min="0"
                    step="0.01"
                    placeholder="Enter final price"
                  />
                  <small>Leave empty to keep current price</small>
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="adminNotes">Admin Notes</label>
                <textarea
                  id="adminNotes"
                  value={actionData.adminNotes}
                  onChange={(e) => setActionData(prev => ({ ...prev, adminNotes: e.target.value }))}
                  rows="4"
                  placeholder="Add notes about this booking..."
                />
              </div>
              
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Update Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TourBookingManagement;




















