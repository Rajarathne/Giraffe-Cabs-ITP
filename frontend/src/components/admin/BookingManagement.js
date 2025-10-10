import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './BookingManagement.css';
import './AdminFormStyles.css';

const BookingManagement = ({ 
  bookings, 
  loading,
  onUpdateBookingStatus,
  onDeleteBooking,
  onGenerateBookingReport,
  onRefreshData
}) => {
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [pricingData, setPricingData] = useState({
    adminCalculatedDistance: '',
    pricePerKm: '',
    adminSetPrice: '',
    weddingDays: '',
    isPriceConfirmed: false
  });

  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    pickupLocation: '',
    dropoffLocation: '',
    pickupDate: '',
    pickupTime: '',
    returnDate: '',
    returnTime: '',
    passengers: 1,
    additionalNotes: ''
  });

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [serviceTypeFilter, setServiceTypeFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [filteredBookings, setFilteredBookings] = useState(bookings);

  // Filter bookings based on search term and filters
  useEffect(() => {
    let filtered = bookings;

    // Search term filter
    if (searchTerm) {
      filtered = filtered.filter(booking => {
        const searchLower = searchTerm.toLowerCase();
        return (
          booking._id.toLowerCase().includes(searchLower) ||
          `${booking.user?.firstName} ${booking.user?.lastName}`.toLowerCase().includes(searchLower) ||
          booking.serviceType.toLowerCase().includes(searchLower) ||
          booking.pickupLocation.toLowerCase().includes(searchLower) ||
          booking.dropoffLocation?.toLowerCase().includes(searchLower) ||
          booking.additionalNotes?.toLowerCase().includes(searchLower)
        );
      });
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    // Service type filter
    if (serviceTypeFilter !== 'all') {
      filtered = filtered.filter(booking => booking.serviceType === serviceTypeFilter);
    }

    // Payment status filter
    if (paymentStatusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.paymentStatus === paymentStatusFilter);
    }

    // Show all bookings in Booking Management (both cash and card)
    // filtered = filtered.filter(booking => booking.paymentMethod === 'cash');

    // Date filter
    if (dateFilter !== 'all') {
      const today = new Date();
      
      switch (dateFilter) {
        case 'today':
          filtered = filtered.filter(booking => {
            const bookingDate = new Date(booking.pickupDate);
            return bookingDate.toDateString() === today.toDateString();
          });
          break;
        case 'this_week':
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(booking => {
            const bookingDate = new Date(booking.pickupDate);
            return bookingDate >= weekAgo;
          });
          break;
        case 'this_month':
          const monthAgo = new Date(today.getFullYear(), today.getMonth(), 1);
          filtered = filtered.filter(booking => {
            const bookingDate = new Date(booking.pickupDate);
            return bookingDate >= monthAgo;
          });
          break;
        case 'pending':
          filtered = filtered.filter(booking => {
            const bookingDate = new Date(booking.pickupDate);
            return bookingDate > today;
          });
          break;
        default:
          break;
      }
    }

    setFilteredBookings(filtered);
  }, [bookings, searchTerm, statusFilter, serviceTypeFilter, paymentStatusFilter, dateFilter]);

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setServiceTypeFilter('all');
    setPaymentStatusFilter('all');
    setDateFilter('all');
  };


  const handlePricingUpdate = async () => {
    // Check if it's wedding service
    if (selectedBooking?.serviceType === 'wedding') {
      if (!pricingData.weddingDays || !pricingData.adminSetPrice) {
        alert('Please fill in all pricing fields');
        return;
      }
    } else {
      if (!pricingData.adminCalculatedDistance || !pricingData.pricePerKm || !pricingData.adminSetPrice) {
        alert('Please fill in all pricing fields');
        return;
      }
    }

    try {
      const token = localStorage.getItem('authToken');
      const url = `/api/bookings/${selectedBooking._id}/pricing`;
      
      console.log('Pricing update request details:', {
        url: url,
        bookingId: selectedBooking._id,
        serviceType: selectedBooking?.serviceType,
        pricingData: pricingData
      });
      
      let payload;
      if (selectedBooking?.serviceType === 'wedding') {
        payload = {
          weddingDays: parseInt(pricingData.weddingDays),
          adminSetPrice: parseFloat(pricingData.adminSetPrice),
          isPriceConfirmed: true
        };
      } else {
        payload = {
          adminCalculatedDistance: parseFloat(pricingData.adminCalculatedDistance),
          pricePerKm: parseFloat(pricingData.pricePerKm),
          adminSetPrice: parseFloat(pricingData.adminSetPrice),
          isPriceConfirmed: true
        };
      }
      
      console.log('Making pricing update request to:', url);
      console.log('Payload:', payload);
      
      const pricingResponse = await axios.put(url, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Pricing update response:', pricingResponse.data);

      // Update booking status to confirmed
      const statusResponse = await axios.put(`/api/bookings/${selectedBooking._id}/status`, {
        status: 'confirmed'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Status update response:', statusResponse.data);

      // Create payment record for cash payments when admin confirms price
      if (selectedBooking.paymentMethod === 'cash') {
        try {
          await axios.post('/api/payments', {
            bookingId: selectedBooking._id,
            amount: parseFloat(pricingData.adminSetPrice),
            paymentMethod: 'cash',
            status: 'completed', // Completed when admin confirms price
            customerName: selectedBooking.user?.firstName + ' ' + selectedBooking.user?.lastName,
            customerEmail: selectedBooking.user?.email,
            customerPhone: selectedBooking.user?.phone
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
        } catch (paymentError) {
          console.error('Error creating payment record:', paymentError);
          // Don't fail the entire operation if payment record creation fails
        }
      }

      alert('Pricing updated and booking confirmed successfully!');
      setShowPricingModal(false);
      setSelectedBooking(null);
      setPricingData({
        adminCalculatedDistance: '',
        pricePerKm: '',
        adminSetPrice: '',
        weddingDays: '',
        isPriceConfirmed: false
      });
      
      // Refresh the data to show updated information
      if (onRefreshData) {
        onRefreshData();
      }
    } catch (error) {
      console.error('Pricing update error:', error);
      console.error('Error response:', error.response);
      
      let errorMessage = 'Failed to update pricing: ';
      if (error.response) {
        errorMessage += error.response.data?.message || `HTTP ${error.response.status}`;
      } else if (error.request) {
        errorMessage += 'Network error - please check your connection';
      } else {
        errorMessage += error.message;
      }
      
      alert(errorMessage);
    }
  };

  const calculatePriceFromDistance = () => {
    if (pricingData.adminCalculatedDistance && pricingData.pricePerKm) {
      const calculatedPrice = parseFloat(pricingData.adminCalculatedDistance) * parseFloat(pricingData.pricePerKm);
      setPricingData(prev => ({
        ...prev,
        adminSetPrice: calculatedPrice.toFixed(2)
      }));
    }
  };

  const getPricePerKm = (serviceType, vehicleType) => {
    switch (serviceType) {
      case 'wedding':
        return 0; // Fixed price
      case 'cargo':
        return 150;
      case 'airport':
        return vehicleType === 'van' ? 120 : 100;
      case 'daily':
        if (vehicleType === 'van') return 120;
        if (vehicleType === 'bike') return 50;
        return 90; // Default for cars
      default:
        return 100;
    }
  };
  return (
    <div className="bookings-content">
      <div className="content-header">
        <h2>📋 All Booking Management</h2>
        <p className="booking-note">Manage all bookings (cash and card payments). Set prices, confirm, edit, or delete bookings.</p>
      </div>

      {/* Search and Filter Section */}
      <div className="search-filter-section">
        <div className="search-bar">
          <div className="search-input-group">
            <i className="fas fa-search search-icon"></i>
            <input
              type="text"
              placeholder="Search by booking ID, customer name, service type, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button
                className="clear-search-btn"
                onClick={() => setSearchTerm('')}
                title="Clear search"
              >
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>
        </div>

        <div className="filter-controls">
          <div className="filter-group">
            <label htmlFor="statusFilter">Status</label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="serviceTypeFilter">Service Type</label>
            <select
              id="serviceTypeFilter"
              value={serviceTypeFilter}
              onChange={(e) => setServiceTypeFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Services</option>
              <option value="wedding">Wedding</option>
              <option value="airport">Airport</option>
              <option value="cargo">Cargo</option>
              <option value="daily">Daily</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="paymentStatusFilter">Payment Status</label>
            <select
              id="paymentStatusFilter"
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Payments</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="dateFilter">Date Range</label>
            <select
              id="dateFilter"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
              <option value="pending">Future Bookings</option>
            </select>
          </div>

          <div className="filter-actions">
            <button
              className="btn btn-secondary filter-btn"
              onClick={clearFilters}
              title="Clear all filters"
            >
              <i className="fas fa-times"></i> Clear
            </button>
          </div>
        </div>

        <div className="search-results-info">
          <span className="results-count">
            Showing {filteredBookings.length} of {bookings.length} bookings
          </span>
          {searchTerm && (
            <span className="search-term">
              for "{searchTerm}"
            </span>
          )}
        </div>
      </div>

      <div className="bookings-table">
        <table>
          <thead>
            <tr>
              <th>Booking ID</th>
              <th>User</th>
              <th>Service Type</th>
              <th>Pickup Location</th>
              <th>Pickup Date</th>
              <th>Pickup Time</th>
              <th>Passengers</th>
              <th>Amount</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.map(booking => (
              <tr key={booking._id}>
                <td>{booking._id.slice(-8)}</td>
                <td>{booking.user?.firstName} {booking.user?.lastName}</td>
                <td>
                  <span className={`status status-${booking.serviceType}`}>
                    {booking.serviceType}
                  </span>
                </td>
                <td>{booking.pickupLocation}</td>
                <td>{new Date(booking.pickupDate).toLocaleDateString()}</td>
                <td>{booking.pickupTime}</td>
                <td>{booking.passengers}</td>
                <td>LKR {booking.totalPrice?.toLocaleString() || '0'}</td>
                <td>
                  <div className="payment-info">
                    <span className={`payment-status payment-${booking.paymentStatus}`}>
                      {booking.paymentStatus}
                    </span>
                    {booking.paymentMethod && (
                      <span className={`payment-method method-${booking.paymentMethod}`}>
                        {booking.paymentMethod}
                      </span>
                    )}
                  </div>
                </td>
                <td>
                  <span className={`status status-${booking.status}`}>
                    {booking.status}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    {booking.status === 'pending' && (
                      <>
                        <button 
                          className="btn btn-sm btn-success"
                          onClick={() => onUpdateBookingStatus(booking._id, 'confirmed')}
                        >
                          <i className="fas fa-check"></i> Confirm
                        </button>
                        <button 
                          className="btn btn-sm btn-danger"
                          onClick={() => onUpdateBookingStatus(booking._id, 'cancelled')}
                        >
                          <i className="fas fa-times"></i> Cancel
                        </button>
                      </>
                    )}
                    {booking.status === 'confirmed' && (
                      <button 
                        className="btn btn-sm btn-info"
                        onClick={() => onUpdateBookingStatus(booking._id, 'completed')}
                      >
                        <i className="fas fa-check-circle"></i> Complete
                      </button>
                    )}
                    {booking.status === 'pending' && !booking.isPriceConfirmed && (
                      <button 
                        className="btn btn-sm btn-primary"
                        onClick={() => {
                          setSelectedBooking(booking);
                          setPricingData({
                            adminCalculatedDistance: booking.distance || '',
                            pricePerKm: getPricePerKm(booking.serviceType, booking.serviceDetails?.vehicleType),
                            adminSetPrice: '',
                            isPriceConfirmed: false
                          });
                          setShowPricingModal(true);
                        }}
                      >
                        <i className="fas fa-calculator"></i> Set Price
                      </button>
                    )}
                    <button 
                      className="btn btn-sm btn-outline"
                      onClick={() => {
                        setSelectedBooking(booking);
                        setEditForm({
                          pickupLocation: booking.pickupLocation || '',
                          dropoffLocation: booking.dropoffLocation || '',
                          pickupDate: booking.pickupDate ? new Date(booking.pickupDate).toISOString().slice(0,10) : '',
                          pickupTime: booking.pickupTime || '',
                          returnDate: booking.returnDate ? new Date(booking.returnDate).toISOString().slice(0,10) : '',
                          returnTime: booking.returnTime || '',
                          passengers: booking.passengers || 1,
                          additionalNotes: booking.additionalNotes || ''
                        });
                        setShowEditModal(true);
                      }}
                      title="Edit Booking"
                    >
                      <i className="fas fa-edit"></i> Edit
                    </button>
                    <button 
                      className="btn btn-sm btn-danger"
                      onClick={() => onDeleteBooking(booking._id)}
                      title="Delete Booking"
                    >
                      <i className="fas fa-trash"></i> Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Booking Reports Section */}
      <div className="booking-reports">
        <h3><i className="fas fa-calendar-check"></i> Booking Reports</h3>
        <div className="reports-grid">
          <div className="report-card">
            <i className="fas fa-file-excel"></i>
            <h4>Monthly Bookings</h4>
            <p>Export monthly booking data</p>
            <button 
              className="btn btn-secondary" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Monthly report button clicked');
                if (onGenerateBookingReport) {
                  onGenerateBookingReport('monthly');
                } else {
                  console.error('onGenerateBookingReport function is not defined');
                }
              }}
              disabled={loading}
            >
              {loading ? 'Generating...' : 'Export Excel'}
            </button>
          </div>
          <div className="report-card">
            <i className="fas fa-file-csv"></i>
            <h4>Booking Analytics</h4>
            <p>Export booking statistics</p>
            <button 
              className="btn btn-success" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Analytics report button clicked');
                if (onGenerateBookingReport) {
                  onGenerateBookingReport('analytics');
                } else {
                  console.error('onGenerateBookingReport function is not defined');
                }
              }}
              disabled={loading}
            >
              {loading ? 'Generating...' : 'Export CSV'}
            </button>
          </div>
          <div className="report-card">
            <i className="fas fa-chart-bar"></i>
            <h4>Revenue Report</h4>
            <p>Generate revenue from bookings</p>
            <button 
              className="btn btn-warning" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Revenue report button clicked');
                if (onGenerateBookingReport) {
                  onGenerateBookingReport('revenue');
                } else {
                  console.error('onGenerateBookingReport function is not defined');
                }
              }}
              disabled={loading}
            >
              {loading ? 'Generating...' : 'Generate Report'}
            </button>
          </div>
          <div className="report-card">
            <i className="fas fa-users"></i>
            <h4>Customer Report</h4>
            <p>Export customer booking history</p>
            <button 
              className="btn btn-info" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Customer report button clicked');
                if (onGenerateBookingReport) {
                  onGenerateBookingReport('customers');
                } else {
                  console.error('onGenerateBookingReport function is not defined');
                }
              }}
              disabled={loading}
            >
              {loading ? 'Generating...' : 'Export Data'}
            </button>
          </div>
          <div className="report-card">
            <i className="fas fa-car"></i>
            <h4>Vehicle Utilization</h4>
            <p>Export vehicle booking statistics</p>
            <button 
              className="btn btn-dark" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Vehicle report button clicked');
                if (onGenerateBookingReport) {
                  onGenerateBookingReport('vehicles');
                } else {
                  console.error('onGenerateBookingReport function is not defined');
                }
              }}
              disabled={loading}
            >
              {loading ? 'Generating...' : 'Export Report'}
            </button>
          </div>
        </div>
      </div>


      {/* Pricing Modal */}
      {showPricingModal && (
        <div className="modal-overlay" onClick={() => setShowPricingModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowPricingModal(false)}>&times;</button>
            <h2>Set Booking Price</h2>
            
            {selectedBooking && (
              <div className="booking-details">
                <h3>Booking Details</h3>
                <p><strong>Customer:</strong> {selectedBooking.user?.firstName} {selectedBooking.user?.lastName}</p>
                <p><strong>Service:</strong> {selectedBooking.serviceType}</p>
                <p><strong>Pickup:</strong> {selectedBooking.pickupLocation}</p>
                <p><strong>Dropoff:</strong> {selectedBooking.dropoffLocation}</p>
                <p><strong>Date:</strong> {new Date(selectedBooking.pickupDate).toLocaleDateString()}</p>
                <p><strong>Time:</strong> {selectedBooking.pickupTime}</p>
                <p><strong>User Entered Distance:</strong> {selectedBooking.distance} km</p>
              </div>
            )}

            <form onSubmit={(e) => { e.preventDefault(); handlePricingUpdate(); }}>
              {selectedBooking?.serviceType === 'wedding' ? (
                // Wedding service - only ask for days and total price
                <>
                  <div className="form-group">
                    <label htmlFor="weddingDays">Number of Days</label>
                    <input
                      type="number"
                      id="weddingDays"
                      value={pricingData.weddingDays || selectedBooking.serviceDetails?.days || ''}
                      onChange={(e) => {
                        const days = parseInt(e.target.value) || 0;
                        const totalPrice = days * 50000;
                        setPricingData(prev => ({
                          ...prev,
                          weddingDays: days,
                          adminSetPrice: totalPrice
                        }));
                      }}
                      min="1"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="adminSetPrice">Total Price (LKR)</label>
                    <input
                      type="number"
                      id="adminSetPrice"
                      value={pricingData.adminSetPrice}
                      onChange={(e) => setPricingData(prev => ({
                        ...prev,
                        adminSetPrice: e.target.value
                      }))}
                      placeholder="Enter total price..."
                      min="0"
                      step="0.01"
                      required
                    />
                    <small className="form-text">Wedding service: LKR 50,000 per day</small>
                  </div>
                </>
              ) : (
                // Other services - distance based pricing
                <>
                  <div className="form-group">
                    <label htmlFor="adminCalculatedDistance">Admin Calculated Distance (km)</label>
                    <input
                      type="number"
                      id="adminCalculatedDistance"
                      value={pricingData.adminCalculatedDistance}
                      onChange={(e) => setPricingData(prev => ({
                        ...prev,
                        adminCalculatedDistance: e.target.value
                      }))}
                      placeholder="Enter actual distance..."
                      min="0"
                      step="0.1"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="pricePerKm">Price per KM (LKR)</label>
                    <input
                      type="number"
                      id="pricePerKm"
                      value={pricingData.pricePerKm}
                      onChange={(e) => setPricingData(prev => ({
                        ...prev,
                        pricePerKm: e.target.value
                      }))}
                      placeholder="Enter rate per km..."
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="adminSetPrice">Total Price (LKR)</label>
                    <div className="price-input-group">
                      <input
                        type="number"
                        id="adminSetPrice"
                        value={pricingData.adminSetPrice}
                        onChange={(e) => setPricingData(prev => ({
                          ...prev,
                          adminSetPrice: e.target.value
                        }))}
                        placeholder="Enter total price..."
                        min="0"
                        step="0.01"
                        required
                      />
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={calculatePriceFromDistance}
                        disabled={!pricingData.adminCalculatedDistance || !pricingData.pricePerKm}
                      >
                        <i className="fas fa-calculator"></i> Calculate
                      </button>
                    </div>
                  </div>
                </>
              )}

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPricingModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <i className="fas fa-check"></i> Confirm Price
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Booking Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowEditModal(false)}>&times;</button>
            <h2>Edit Booking</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                const token = localStorage.getItem('authToken');
                await axios.put(`/api/bookings/${selectedBooking._id}`, {
                  ...editForm,
                  passengers: parseInt(editForm.passengers) || 1
                }, { headers: { Authorization: `Bearer ${token}` } });
                alert('Booking updated successfully!');
                setShowEditModal(false);
                setSelectedBooking(null);
                if (onRefreshData) onRefreshData();
              } catch (err) {
                alert('Failed to update booking: ' + (err.response?.data?.message || err.message));
              }
            }}>
              <div className="form-row">
                <div className="form-group">
                  <label>Pickup Location</label>
                  <input value={editForm.pickupLocation} onChange={e=>setEditForm({...editForm,pickupLocation:e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Dropoff Location</label>
                  <input value={editForm.dropoffLocation} onChange={e=>setEditForm({...editForm,dropoffLocation:e.target.value})} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Pickup Date</label>
                  <input type="date" value={editForm.pickupDate} onChange={e=>setEditForm({...editForm,pickupDate:e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Pickup Time</label>
                  <input type="time" value={editForm.pickupTime} onChange={e=>setEditForm({...editForm,pickupTime:e.target.value})} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Return Date</label>
                  <input type="date" value={editForm.returnDate} onChange={e=>setEditForm({...editForm,returnDate:e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Return Time</label>
                  <input type="time" value={editForm.returnTime} onChange={e=>setEditForm({...editForm,returnTime:e.target.value})} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Passengers</label>
                  <input type="number" min="1" value={editForm.passengers} onChange={e=>setEditForm({...editForm,passengers:e.target.value})} required />
                </div>
              </div>
              <div className="form-group">
                <label>Additional Notes</label>
                <textarea rows="3" value={editForm.additionalNotes} onChange={e=>setEditForm({...editForm,additionalNotes:e.target.value})} />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary"><i className="fas fa-save"></i> Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingManagement;


