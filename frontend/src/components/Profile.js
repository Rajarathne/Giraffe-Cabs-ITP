import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Profile.css';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [rentals, setRentals] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [tourBookings, setTourBookings] = useState([]);
  const [editingBooking, setEditingBooking] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingData, setBookingData] = useState({
    pickupLocation: '',
    dropoffLocation: '',
    pickupDate: '',
    pickupTime: '',
    passengers: '',
    additionalNotes: ''
  });
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    confirmPassword: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (!currentUser) {
      navigate('/');
      return;
    }
    setUser(currentUser);
    setProfileData({
      firstName: currentUser.firstName || '',
      lastName: currentUser.lastName || '',
      email: currentUser.email || '',
      phone: currentUser.phone || '',
      address: currentUser.address || '',
      password: '',
      confirmPassword: ''
    });
    
    // Load user rentals and bookings if not admin
    if (currentUser.role !== 'admin') {
      loadUserRentals();
      loadUserBookings();
      loadUserTourBookings();
    }
  }, [navigate]);

  const loadUserRentals = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get('/api/rentals/my-rentals', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRentals(response.data);
    } catch (error) {
      console.error('Error loading rentals:', error);
    }
  };

  const loadUserBookings = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get('/api/bookings/user', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(response.data);
    } catch (error) {
      console.error('Error loading bookings:', error);
    }
  };

  const loadUserTourBookings = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get('/api/tour-bookings/my-bookings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTourBookings(response.data);
    } catch (error) {
      console.error('Error loading tour bookings:', error);
    }
  };

  const handleViewInvoice = async (bookingId) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`/api/tour-bookings/${bookingId}/invoice`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error viewing invoice:', error);
      alert('Error loading invoice. Please try again.');
    }
  };

  const handleDownloadInvoice = async (bookingId) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`/api/tour-bookings/${bookingId}/invoice/download`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Giraffe_Cabs_Tour_Invoice_${bookingId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading invoice:', error);
      alert('Error downloading invoice. Please try again.');
    }
  };


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (profileData.password && profileData.password !== profileData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const headers = { Authorization: `Bearer ${token}` };

      // Remove confirmPassword from data
      const { confirmPassword, ...updateData } = profileData;
      
      // If password is empty, don't include it in the update
      if (!updateData.password) {
        delete updateData.password;
      }

      const response = await axios.put('/api/auth/profile', updateData, { headers });
      
      // Update localStorage with new user data
      const updatedUser = { ...user, ...response.data };
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      alert('Profile updated successfully!');
      setEditing(false);
      setProfileData(prev => ({
        ...prev,
        password: '',
        confirmPassword: ''
      }));
    } catch (error) {
      alert(error.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };


  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    navigate('/');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const downloadContractPDF = async (rentalId) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`/api/rentals/${rentalId}/contract-pdf`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Rental_Contract_${rentalId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading contract:', error);
      alert('Error downloading contract. Please try again.');
    }
  };

  const handleEditBooking = (booking) => {
    setEditingBooking(booking);
    setBookingData({
      pickupLocation: booking.pickupLocation || '',
      dropoffLocation: booking.dropoffLocation || '',
      pickupDate: booking.pickupDate ? new Date(booking.pickupDate).toISOString().split('T')[0] : '',
      pickupTime: booking.pickupTime || '',
      passengers: booking.passengers || '',
      additionalNotes: booking.additionalNotes || ''
    });
    setShowBookingModal(true);
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem('authToken');
      await axios.put(`/api/bookings/${editingBooking._id}/user`, bookingData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('Booking updated successfully!');
      setShowBookingModal(false);
      setEditingBooking(null);
      loadUserBookings();
    } catch (error) {
      alert(error.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to delete this booking?')) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      await axios.delete(`/api/bookings/${bookingId}/user`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('Booking deleted successfully!');
      loadUserBookings();
    } catch (error) {
      alert(error.response?.data?.message || 'Delete failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseBookingModal = () => {
    setShowBookingModal(false);
    setEditingBooking(null);
    setBookingData({
      pickupLocation: '',
      dropoffLocation: '',
      pickupDate: '',
      pickupTime: '',
      passengers: '',
      additionalNotes: ''
    });
  };

  const getServiceIcon = (serviceType) => {
    const icons = {
      'wedding': 'heart',
      'airport': 'plane',
      'cargo': 'truck',
      'daily': 'car'
    };
    return icons[serviceType] || 'car';
  };

  const getServiceTypeLabel = (serviceType) => {
    const labels = {
      'wedding': 'Wedding Hire',
      'airport': 'Airport Transfer',
      'cargo': 'Cargo Transport',
      'daily': 'Daily Hire'
    };
    return labels[serviceType] || serviceType;
  };

  if (!user) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <h1>My Profile</h1>
          <div className="profile-actions">
            <button 
              className="btn btn-secondary"
              onClick={() => navigate(user.role === 'admin' ? '/admin' : '/home')}
            >
              <i className="fas fa-arrow-left"></i> Back to Dashboard
            </button>
            {activeTab === 'profile' && (
              <button 
                className="btn btn-primary"
                onClick={() => setEditing(!editing)}
              >
                <i className="fas fa-edit"></i> {editing ? 'Cancel' : 'Edit Profile'}
              </button>
            )}
          </div>
        </div>

        {/* Profile Tabs */}
        {user.role !== 'admin' && (
          <div className="profile-tabs">
            <button 
              className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <i className="fas fa-user"></i> Profile Information
            </button>
            <button 
              className={`tab-button ${activeTab === 'rentals' ? 'active' : ''}`}
              onClick={() => setActiveTab('rentals')}
            >
              <i className="fas fa-handshake"></i> My Rentals
            </button>
            <button 
              className={`tab-button ${activeTab === 'bookings' ? 'active' : ''}`}
              onClick={() => setActiveTab('bookings')}
            >
              <i className="fas fa-calendar-check"></i> Booking History
            </button>
            <button 
              className={`tab-button ${activeTab === 'tour-history' ? 'active' : ''}`}
              onClick={() => setActiveTab('tour-history')}
            >
              <i className="fas fa-map-marked-alt"></i> Tour History
            </button>
          </div>
        )}

        <div className="profile-content">
          {activeTab === 'profile' && (
            <div className="profile-card">
              <div className="profile-avatar">
                <div className="avatar-circle">
                  <i className="fas fa-user"></i>
                </div>
                <h2>{user.firstName} {user.lastName}</h2>
                <p className="user-role">{user.role === 'admin' ? 'Administrator' : 'Customer'}</p>
              </div>

            <div className="profile-details">
              <form onSubmit={handleSubmit}>
                <div className="form-section">
                  <h3>Personal Information</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="firstName">First Name</label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={profileData.firstName}
                        onChange={handleInputChange}
                        disabled={!editing}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="lastName">Last Name</label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={profileData.lastName}
                        onChange={handleInputChange}
                        disabled={!editing}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="email">Email Address</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={profileData.email}
                      onChange={handleInputChange}
                      disabled={!editing}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="phone">Phone Number</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={profileData.phone}
                      onChange={handleInputChange}
                      disabled={!editing}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="address">Address</label>
                    <textarea
                      id="address"
                      name="address"
                      value={profileData.address}
                      onChange={handleInputChange}
                      disabled={!editing}
                      rows="3"
                      required
                    />
                  </div>
                </div>

                {editing && (
                  <div className="form-section">
                    <h3>Change Password</h3>
                    <p className="password-note">Leave blank to keep current password</p>
                    
                    <div className="form-group">
                      <label htmlFor="password">New Password</label>
                      <input
                        type="password"
                        id="password"
                        name="password"
                        value={profileData.password}
                        onChange={handleInputChange}
                        placeholder="Enter new password"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="confirmPassword">Confirm New Password</label>
                      <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={profileData.confirmPassword}
                        onChange={handleInputChange}
                        placeholder="Confirm new password"
                      />
                    </div>
                  </div>
                )}

                <div className="form-section">
                  <h3>Account Information</h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <label>User ID</label>
                      <span>{user._id}</span>
                    </div>
                    <div className="info-item">
                      <label>Account Type</label>
                      <span className={`role-badge ${user.role}`}>
                        {user.role === 'admin' ? 'Administrator' : 'Customer'}
                      </span>
                    </div>
                    <div className="info-item">
                      <label>Member Since</label>
                      <span>{formatDate(user.createdAt)}</span>
                    </div>
                    <div className="info-item">
                      <label>Account Status</label>
                      <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>

                {editing && (
                  <div className="form-actions">
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      {loading ? 'Updating...' : 'Update Profile'}
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-secondary"
                      onClick={() => setEditing(false)}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </form>
            </div>
            </div>
          )}

          {activeTab === 'rentals' && (
            <div className="rentals-section">
              <div className="rentals-header">
                <h2>My Rental Contracts</h2>
                <p>View and download your rental contracts and invoices</p>
              </div>

              {rentals.length === 0 ? (
                <div className="no-rentals">
                  <div className="no-rentals-icon">
                    <i className="fas fa-handshake"></i>
                  </div>
                  <h3>No Rental Contracts</h3>
                  <p>You haven't made any rental requests yet.</p>
                  <button 
                    className="btn btn-primary"
                    onClick={() => navigate('/home')}
                  >
                    <i className="fas fa-plus"></i> Request a Rental
                  </button>
                </div>
              ) : (
                <div className="rentals-grid">
                  {rentals.map(rental => (
                    <div key={rental._id} className="rental-card">
                      <div className="rental-header">
                        <div className="rental-status">
                          <span className={`status-badge ${rental.status}`}>
                            {rental.status.toUpperCase()}
                          </span>
                        </div>
                        <div className="rental-contract-id">
                          {rental.contractId && (
                            <small>Contract: {rental.contractId}</small>
                          )}
                        </div>
                      </div>

                      <div className="rental-details">
                        <div className="rental-vehicle">
                          <h3>
                            {rental.vehicleDetails?.brand || 'N/A'} {rental.vehicleDetails?.model || 'N/A'}
                          </h3>
                          <p>{rental.vehicleDetails?.vehicleNumber || 'N/A'}</p>
                        </div>

                        <div className="rental-info">
                          <div className="info-row">
                            <span className="label">Type:</span>
                            <span className="value">{rental.rentalType}</span>
                          </div>
                          <div className="info-row">
                            <span className="label">Duration:</span>
                            <span className="value">{rental.duration} days</span>
                          </div>
                          <div className="info-row">
                            <span className="label">Start Date:</span>
                            <span className="value">{formatDate(rental.startDate)}</span>
                          </div>
                          <div className="info-row">
                            <span className="label">End Date:</span>
                            <span className="value">{formatDate(rental.endDate)}</span>
                          </div>
                          <div className="info-row">
                            <span className="label">Total Amount:</span>
                            <span className="value amount">LKR {rental.totalAmount?.toLocaleString() || '0'}</span>
                          </div>
                        </div>

                        <div className="rental-purpose">
                          <h4>Purpose:</h4>
                          <p>{rental.purpose}</p>
                        </div>

                        {rental.specialRequirements && (
                          <div className="rental-requirements">
                            <h4>Special Requirements:</h4>
                            <p>{rental.specialRequirements}</p>
                          </div>
                        )}

                        {rental.contractTerms && (
                          <div className="rental-terms">
                            <h4>Contract Terms:</h4>
                            <p>{rental.contractTerms}</p>
                          </div>
                        )}

                        {rental.adminGuidelines && (
                          <div className="rental-guidelines">
                            <h4>Admin Guidelines:</h4>
                            <p>{rental.adminGuidelines}</p>
                          </div>
                        )}
                      </div>

                      <div className="rental-actions">
                        {(rental.status === 'approved' || rental.status === 'active' || rental.status === 'completed') && (
                          <button 
                            className="btn btn-primary"
                            onClick={() => downloadContractPDF(rental._id)}
                          >
                            <i className="fas fa-download"></i> Download Contract
                          </button>
                        )}
                        
                        {rental.status === 'pending' && (
                          <div className="pending-notice">
                            <i className="fas fa-clock"></i>
                            <span>Your rental request is being reviewed by our team.</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'bookings' && (
            <div className="bookings-section">
              <div className="bookings-header">
                <h2>My Booking History</h2>
                <p>View and manage your booking requests</p>
              </div>

              {bookings.length === 0 ? (
                <div className="no-bookings">
                  <div className="no-bookings-icon">
                    <i className="fas fa-calendar-check"></i>
                  </div>
                  <h3>No Bookings Yet</h3>
                  <p>You haven't made any booking requests yet.</p>
                  <button 
                    className="btn btn-primary"
                    onClick={() => navigate('/home')}
                  >
                    <i className="fas fa-plus"></i> Make a Booking
                  </button>
                </div>
              ) : (
                <div className="bookings-grid">
                  {bookings.map(booking => (
                    <div key={booking._id} className="booking-card">
                      <div className="booking-header">
                        <div className="booking-status">
                          <span className={`status-badge ${booking.status}`}>
                            {booking.status.toUpperCase()}
                          </span>
                        </div>
                        <div className="booking-id">
                          <small>Booking ID: {booking._id.slice(-8)}</small>
                        </div>
                      </div>

                      <div className="booking-details">
                        <div className="booking-service">
                          <h3>
                            <i className={`fas fa-${getServiceIcon(booking.serviceType)}`}></i>
                            {getServiceTypeLabel(booking.serviceType)}
                          </h3>
                          <div className="booking-price">
                            {booking.isPriceConfirmed ? (
                              <div className="confirmed-price">
                                <p className="price-amount">LKR {booking.totalPrice?.toLocaleString() || '0'}</p>
                                <small className="price-status confirmed">
                                  <i className="fas fa-check-circle"></i> Price Confirmed
                                </small>
                              </div>
                            ) : (
                              <div className="pending-price">
                                <p className="price-amount">Price Pending</p>
                                <small className="price-status pending">
                                  <i className="fas fa-clock"></i> Admin will set price
                                </small>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="booking-info">
                          <div className="info-row">
                            <span className="label">Pickup:</span>
                            <span className="value">{booking.pickupLocation}</span>
                          </div>
                          <div className="info-row">
                            <span className="label">Dropoff:</span>
                            <span className="value">{booking.dropoffLocation}</span>
                          </div>
                          <div className="info-row">
                            <span className="label">Date:</span>
                            <span className="value">{formatDate(booking.pickupDate)}</span>
                          </div>
                          <div className="info-row">
                            <span className="label">Time:</span>
                            <span className="value">{booking.pickupTime}</span>
                          </div>
                          <div className="info-row">
                            <span className="label">Passengers:</span>
                            <span className="value">{booking.passengers}</span>
                          </div>
                          {booking.isPriceConfirmed && booking.adminCalculatedDistance && (
                            <>
                              <div className="info-row">
                                <span className="label">Distance:</span>
                                <span className="value">{booking.adminCalculatedDistance} km</span>
                              </div>
                              <div className="info-row">
                                <span className="label">Rate:</span>
                                <span className="value">LKR {booking.pricePerKm}/km</span>
                              </div>
                            </>
                          )}
                        </div>

                        {booking.additionalNotes && (
                          <div className="booking-notes">
                            <h4>Additional Notes:</h4>
                            <p>{booking.additionalNotes}</p>
                          </div>
                        )}
                      </div>

                      <div className="booking-actions">
                        {booking.status === 'pending' && (
                          <>
                            <button 
                              className="btn btn-outline"
                              onClick={() => handleEditBooking(booking)}
                            >
                              <i className="fas fa-edit"></i> Edit
                            </button>
                            <button 
                              className="btn btn-danger"
                              onClick={() => handleDeleteBooking(booking._id)}
                            >
                              <i className="fas fa-trash"></i> Delete
                            </button>
                          </>
                        )}
                        
                        {booking.status !== 'pending' && (
                          <div className="non-pending-notice">
                            <i className="fas fa-info-circle"></i>
                            <span>This booking cannot be modified as it's {booking.status}.</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'tour-history' && (
            <div className="tour-history-section">
              <div className="tour-history-header">
                <h2>My Tour History</h2>
                <p>View your tour bookings and download invoices</p>
              </div>
              
              {tourBookings.length === 0 ? (
                <div className="no-tour-bookings">
                  <i className="fas fa-map-marked-alt"></i>
                  <h3>No tour bookings yet</h3>
                  <p>You haven't booked any tours yet. <a href="/tour-packages">Browse our tour packages</a> to get started!</p>
                </div>
              ) : (
                <div className="tour-bookings-list">
                  {tourBookings.map(booking => (
                    <div key={booking._id} className="tour-booking-card">
                      <div className="booking-header">
                        <div className="booking-info">
                          <h3>{booking.tourPackage?.packageName}</h3>
                          <p className="destination">
                            <i className="fas fa-map-marker-alt"></i>
                            {booking.tourPackage?.destination}
                          </p>
                        </div>
                        <div className="booking-status">
                          <span className={`status-badge status-${booking.status}`}>
                            {booking.status.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <div className="booking-details">
                        <div className="detail-row">
                          <div className="detail-item">
                            <i className="fas fa-calendar"></i>
                            <span>Booking Date: {new Date(booking.bookingDate).toLocaleDateString()}</span>
                          </div>
                          <div className="detail-item">
                            <i className="fas fa-users"></i>
                            <span>{booking.numberOfPassengers} Passengers</span>
                          </div>
                        </div>
                        <div className="detail-row">
                          <div className="detail-item">
                            <i className="fas fa-clock"></i>
                            <span>{booking.tourPackage?.tourDays} Days</span>
                          </div>
                          <div className="detail-item">
                            <i className="fas fa-tag"></i>
                            <span>{booking.tourPackage?.tourCategory}</span>
                          </div>
                        </div>
                      </div>

                      <div className="booking-pricing">
                        <div className="pricing-item">
                          <span>Base Price:</span>
                          <span>LKR {booking.pricing?.basePrice?.toLocaleString()}</span>
                        </div>
                        {booking.pricing?.discountApplied > 0 && (
                          <div className="pricing-item discount">
                            <span>Discount:</span>
                            <span>-LKR {booking.pricing.discountApplied.toLocaleString()}</span>
                          </div>
                        )}
                        <div className="pricing-item final">
                          <span>Final Price:</span>
                          <span>LKR {booking.pricing?.finalPrice?.toLocaleString()}</span>
                        </div>
                      </div>

                      {booking.specialRequests && (
                        <div className="special-requests">
                          <h4>Special Requests:</h4>
                          <p>{booking.specialRequests}</p>
                        </div>
                      )}

                      {booking.adminNotes && (
                        <div className="admin-notes">
                          <h4>Admin Notes:</h4>
                          <p>{booking.adminNotes}</p>
                        </div>
                      )}

                      <div className="booking-actions">
                        {booking.status === 'confirmed' && (
                          <button 
                            className="btn btn-primary"
                            onClick={() => handleViewInvoice(booking._id)}
                          >
                            <i className="fas fa-file-pdf"></i> View Invoice
                          </button>
                        )}
                        
                        <button 
                          className="btn btn-outline"
                          onClick={() => handleDownloadInvoice(booking._id)}
                        >
                          <i className="fas fa-download"></i> Download Invoice
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {user.role === 'admin' && (
            <div className="profile-actions-card">
              <h3>Account Actions</h3>
              <div className="action-buttons">
                <button className="btn btn-outline" onClick={() => setEditing(true)}>
                  <i className="fas fa-edit"></i> Edit Profile
                </button>
                <button className="btn btn-outline" onClick={handleLogout}>
                  <i className="fas fa-sign-out-alt"></i> Logout
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Modern Footer */}
      <footer className="modern-footer">
        <div className="footer-container">
          <div className="footer-main">
            <div className="footer-brand">
              <div className="footer-logo">
                <i className="fas fa-car-side"></i>
                <h3>Giraffe Cabs</h3>
              </div>
              <p>Your trusted transportation partner in Sri Lanka. We provide safe, reliable, and comfortable transportation services across all cities.</p>
              <div className="social-links">
                <button className="social-link"><i className="fab fa-facebook"></i></button>
                <button className="social-link"><i className="fab fa-twitter"></i></button>
                <button className="social-link"><i className="fab fa-instagram"></i></button>
                <button className="social-link"><i className="fab fa-linkedin"></i></button>
              </div>
            </div>
            
            <div className="footer-links">
              <div className="footer-column">
                <h4>Services</h4>
                <ul>
                  <li><a href="#services">Airport Transfers</a></li>
                  <li><a href="#services">Wedding Hires</a></li>
                  <li><a href="#services">Daily Hires</a></li>
                  <li><a href="#services">Cargo Transport</a></li>
                  <li><a href="#services">Tour Packages</a></li>
                </ul>
              </div>
              
              <div className="footer-column">
                <h4>Company</h4>
                <ul>
                  <li><a href="#about">About Us</a></li>
                  <li><a href="#fleet">Our Fleet</a></li>
                  <li><a href="#contact">Contact</a></li>
                  <li><a href="#careers">Careers</a></li>
                  <li><a href="#news">News</a></li>
                </ul>
              </div>
              
              <div className="footer-column">
                <h4>Support</h4>
                <ul>
                  <li><a href="#help">Help Center</a></li>
                  <li><a href="#faq">FAQ</a></li>
                  <li><a href="#terms">Terms of Service</a></li>
                  <li><a href="#privacy">Privacy Policy</a></li>
                  <li><a href="#safety">Safety</a></li>
                </ul>
              </div>
              
              <div className="footer-column">
                <h4>Contact Info</h4>
                <div className="contact-info">
                  <div className="contact-item">
                    <i className="fas fa-phone"></i>
                    <span>+94 11 234 5678</span>
                  </div>
                  <div className="contact-item">
                    <i className="fas fa-envelope"></i>
                    <span>info@giraffecabs.lk</span>
                  </div>
                  <div className="contact-item">
                    <i className="fas fa-map-marker-alt"></i>
                    <span>Colombo, Sri Lanka</span>
                  </div>
                  <div className="contact-item">
                    <i className="fas fa-clock"></i>
                    <span>24/7 Service Available</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="footer-bottom">
            <div className="footer-bottom-content">
              <p>&copy; 2024 Giraffe Cabs. All rights reserved.</p>
              <div className="footer-bottom-links">
                <a href="#terms">Terms</a>
                <a href="#privacy">Privacy</a>
                <a href="#cookies">Cookies</a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Booking Edit Modal */}
      {showBookingModal && (
        <div className="modal-overlay" onClick={handleCloseBookingModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={handleCloseBookingModal}>&times;</button>
            <h2>Edit Booking</h2>
            
            <form onSubmit={handleBookingSubmit}>
              <div className="form-group">
                <label htmlFor="pickupLocation">Pickup Location</label>
                <input
                  type="text"
                  id="pickupLocation"
                  value={bookingData.pickupLocation}
                  onChange={(e) => setBookingData({...bookingData, pickupLocation: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="dropoffLocation">Dropoff Location</label>
                <input
                  type="text"
                  id="dropoffLocation"
                  value={bookingData.dropoffLocation}
                  onChange={(e) => setBookingData({...bookingData, dropoffLocation: e.target.value})}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="pickupDate">Pickup Date</label>
                  <input
                    type="date"
                    id="pickupDate"
                    value={bookingData.pickupDate}
                    onChange={(e) => setBookingData({...bookingData, pickupDate: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="pickupTime">Pickup Time</label>
                  <input
                    type="time"
                    id="pickupTime"
                    value={bookingData.pickupTime}
                    onChange={(e) => setBookingData({...bookingData, pickupTime: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="passengers">Number of Passengers</label>
                <input
                  type="number"
                  id="passengers"
                  min="1"
                  value={bookingData.passengers}
                  onChange={(e) => setBookingData({...bookingData, passengers: parseInt(e.target.value)})}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="additionalNotes">Additional Notes</label>
                <textarea
                  id="additionalNotes"
                  rows="3"
                  value={bookingData.additionalNotes}
                  onChange={(e) => setBookingData({...bookingData, additionalNotes: e.target.value})}
                  placeholder="Any special requirements or notes..."
                ></textarea>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={handleCloseBookingModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;

