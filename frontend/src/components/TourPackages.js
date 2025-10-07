import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './TourPackages.css';

const TourPackages = () => {
  const navigate = useNavigate();
  const [tourPackages, setTourPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    type: '',
    destination: '',
    minPrice: '',
    maxPrice: '',
    days: ''
  });
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingData, setBookingData] = useState({
    bookingDate: '',
    numberOfPassengers: 1,
    passengers: [],
    contactPerson: {
      name: '',
      email: '',
      phone: '',
      address: ''
    },
    paymentMethod: 'full_upfront',
    specialRequests: '',
    dietaryRequirements: [],
    accessibilityNeeds: []
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  useEffect(() => {
    loadTourPackages();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownOpen && !event.target.closest('.profile-dropdown')) {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileDropdownOpen]);

  const loadTourPackages = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/tour-packages/available');
      setTourPackages(response.data);
    } catch (error) {
      console.error('Error loading tour packages:', error);
      setError('Failed to load tour packages');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const filteredPackages = tourPackages.filter(pkg => {
    if (filters.category && pkg.tourCategory !== filters.category) return false;
    if (filters.type && pkg.tourType !== filters.type) return false;
    if (filters.destination && !pkg.destination.toLowerCase().includes(filters.destination.toLowerCase())) return false;
    if (filters.minPrice && pkg.pricePerPerson < parseInt(filters.minPrice)) return false;
    if (filters.maxPrice && pkg.pricePerPerson > parseInt(filters.maxPrice)) return false;
    if (filters.days && pkg.tourDays !== parseInt(filters.days)) return false;
    return true;
  });

  const handlePackageSelect = (tourPackage) => {
    setSelectedPackage(tourPackage);
    setShowBookingModal(true);
    
    // Initialize passengers array
    const passengers = Array.from({ length: 1 }, () => ({
      firstName: '',
      lastName: '',
      age: '',
      passportNumber: '',
      emergencyContact: '',
      specialRequirements: ''
    }));
    
    setBookingData(prev => ({
      ...prev,
      passengers,
      numberOfPassengers: 1
    }));
  };

  const handleBookingInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setBookingData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setBookingData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handlePassengerChange = (index, field, value) => {
    setBookingData(prev => ({
      ...prev,
      passengers: prev.passengers.map((passenger, i) => 
        i === index ? { ...passenger, [field]: value } : passenger
      )
    }));
  };

  const updatePassengerCount = (count) => {
    const newCount = Math.max(1, Math.min(selectedPackage?.maxPassengers || 20, count));
    setBookingData(prev => ({
      ...prev,
      numberOfPassengers: newCount,
      passengers: Array.from({ length: newCount }, (_, index) => 
        prev.passengers[index] || {
          firstName: '',
          lastName: '',
          age: '',
          passportNumber: '',
          emergencyContact: '',
          specialRequirements: ''
        }
      )
    }));
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      
      const bookingPayload = {
        tourPackageId: selectedPackage._id,
        ...bookingData,
        passengers: bookingData.passengers.slice(0, bookingData.numberOfPassengers)
      };
      
      await axios.post('/api/tour-bookings', bookingPayload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('Tour booking request submitted successfully! You will be notified once the admin reviews your request.');
      setShowBookingModal(false);
      setSelectedPackage(null);
      
    } catch (error) {
      console.error('Error submitting tour booking:', error);
      setError(error.response?.data?.message || 'Failed to submit booking request');
    } finally {
      setLoading(false);
    }
  };

  if (loading && tourPackages.length === 0) {
    return (
      <div className="tour-packages-page">
        <div className="loading">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading tour packages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tour-packages-page">
      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-logo">
            <i className="fas fa-mountain"></i>
            <span>Giraffe Cabs</span>
          </div>
          
          <div className={`nav-menu ${mobileMenuOpen ? 'active' : ''}`}>
            <button className="nav-link" onClick={() => { setMobileMenuOpen(false); navigate('/home#home'); }}>Home</button>
            <button className="nav-link" onClick={() => { setMobileMenuOpen(false); navigate('/home#services'); }}>Services</button>
            <button className="nav-link" onClick={() => { setMobileMenuOpen(false); navigate('/home#about'); }}>About Us</button>
            <button className="nav-link" onClick={() => { setMobileMenuOpen(false); navigate('/vehicles'); }}>Our Fleet</button>
            <button className="nav-link" onClick={() => { setMobileMenuOpen(false); navigate('/home#contact'); }}>Contact Us</button>
            <button className="nav-link active" onClick={() => { setMobileMenuOpen(false); navigate('/tour-packages'); }}>Tour Packages</button>
            <button className="btn btn-primary nav-book-btn" onClick={() => { setMobileMenuOpen(false); navigate('/booking'); }}>
              <i className="fas fa-calendar-plus"></i> Book Now
            </button>
          </div>
          
          <div className="nav-profile">
            <div className="profile-dropdown">
              <button 
                className="profile-btn"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              >
                <i className="fas fa-user"></i>
                <span>Profile</span>
                <i className={`fas fa-chevron-down ${profileDropdownOpen ? 'rotated' : ''}`}></i>
              </button>
              {profileDropdownOpen && (
                <div className="profile-menu">
                  <button className="profile-menu-item" onClick={() => setProfileDropdownOpen(false)}>
                    <i className="fas fa-user-circle"></i>
                    My Profile
                  </button>
                  <button className="profile-menu-item" onClick={() => setProfileDropdownOpen(false)}>
                    <i className="fas fa-calendar-check"></i>
                    My Bookings
                  </button>
                  <button className="profile-menu-item" onClick={() => setProfileDropdownOpen(false)}>
                    <i className="fas fa-cog"></i>
                    Settings
                  </button>
                  <button className="profile-menu-item" onClick={() => setProfileDropdownOpen(false)}>
                    <i className="fas fa-sign-out-alt"></i>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <button 
            className="nav-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <i className={mobileMenuOpen ? "fas fa-times" : "fas fa-bars"}></i>
          </button>
        </div>
      </nav>

      {/* Header */}
      <div className="tour-packages-header">
        <div className="container">
          <h1>Tour Packages</h1>
          <p>Discover amazing destinations with our carefully crafted tour packages</p>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="container">
          <div className="filters-grid">
            <div className="filter-group">
              <label htmlFor="category">Category</label>
              <select
                id="category"
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
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
            
            <div className="filter-group">
              <label htmlFor="type">Type</label>
              <select
                id="type"
                name="type"
                value={filters.type}
                onChange={handleFilterChange}
              >
                <option value="">All Types</option>
                <option value="One-day">One-day</option>
                <option value="Multi-day">Multi-day</option>
                <option value="Seasonal">Seasonal</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label htmlFor="destination">Destination</label>
              <input
                type="text"
                id="destination"
                name="destination"
                value={filters.destination}
                onChange={handleFilterChange}
                placeholder="Search destination..."
              />
            </div>
            
            <div className="filter-group">
              <label htmlFor="minPrice">Min Price (LKR)</label>
              <input
                type="number"
                id="minPrice"
                name="minPrice"
                value={filters.minPrice}
                onChange={handleFilterChange}
                placeholder="Min price"
              />
            </div>
            
            <div className="filter-group">
              <label htmlFor="maxPrice">Max Price (LKR)</label>
              <input
                type="number"
                id="maxPrice"
                name="maxPrice"
                value={filters.maxPrice}
                onChange={handleFilterChange}
                placeholder="Max price"
              />
            </div>
            
            <div className="filter-group">
              <label htmlFor="days">Days</label>
              <select
                id="days"
                name="days"
                value={filters.days}
                onChange={handleFilterChange}
              >
                <option value="">All Days</option>
                <option value="1">1 Day</option>
                <option value="2">2 Days</option>
                <option value="3">3 Days</option>
                <option value="4">4 Days</option>
                <option value="5">5+ Days</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Tour Packages Grid */}
      <div className="tour-packages-grid">
        <div className="container">
          {error && (
            <div className="error-message">
              <i className="fas fa-exclamation-triangle"></i>
              {error}
            </div>
          )}
          
          {filteredPackages.length === 0 ? (
            <div className="no-packages">
              <i className="fas fa-search"></i>
              <h3>No tour packages found</h3>
              <p>Try adjusting your filters to find more packages</p>
            </div>
          ) : (
            <div className="packages-grid">
              {filteredPackages.map(pkg => (
                <div key={pkg._id} className="package-card">
                  <div className="package-image">
                    {pkg.images && pkg.images.length > 0 ? (
                      <img 
                        src={typeof pkg.images[0] === 'string' ? pkg.images[0] : (pkg.images[0].url || pkg.images[0])} 
                        alt={pkg.packageName}
                        onError={(e) => {
                          console.log('Image failed to load:', e.target.src);
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                        onLoad={() => {
                          console.log('Image loaded successfully');
                        }}
                      />
                    ) : null}
                    <div className="placeholder-image" style={{ display: pkg.images && pkg.images.length > 0 ? 'none' : 'flex' }}>
                      <i className="fas fa-mountain"></i>
                    </div>
                    <div className="package-badge">
                      <span className={`category-badge category-${pkg.tourCategory.toLowerCase()}`}>
                        {pkg.tourCategory}
                      </span>
                    </div>
                  </div>
                  
                  <div className="package-content">
                    <h3>{pkg.packageName}</h3>
                    <p className="destination">
                      <i className="fas fa-map-marker-alt"></i>
                      {pkg.destination}
                    </p>
                    <p className="description">{pkg.description}</p>
                    
                    <div className="package-details">
                      <div className="detail-item">
                        <i className="fas fa-calendar"></i>
                        <span>{pkg.tourDays} {pkg.tourDays === 1 ? 'Day' : 'Days'}</span>
                      </div>
                      <div className="detail-item">
                        <i className="fas fa-users"></i>
                        <span>{pkg.minPassengers}-{pkg.maxPassengers} People</span>
                      </div>
                      <div className="detail-item">
                        <i className="fas fa-route"></i>
                        <span>{pkg.fullDistance} km</span>
                      </div>
                    </div>
                    
                    <div className="package-footer">
                      <div className="price">
                        <span className="price-label">From</span>
                        <span className="price-amount">LKR {pkg.pricePerPerson?.toLocaleString()}</span>
                        <span className="price-per">per person</span>
                      </div>
                      <button 
                        className="btn btn-primary"
                        onClick={() => handlePackageSelect(pkg)}
                      >
                        <i className="fas fa-calendar-plus"></i>
                        Book Now
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && selectedPackage && (
        <div className="modal-overlay" onClick={() => setShowBookingModal(false)}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowBookingModal(false)}>&times;</button>
            <h2>Book Tour Package</h2>
            
            <div className="selected-package-info">
              <h3>{selectedPackage.packageName}</h3>
              <p><i className="fas fa-map-marker-alt"></i> {selectedPackage.destination}</p>
              <p><i className="fas fa-calendar"></i> {selectedPackage.tourDays} {selectedPackage.tourDays === 1 ? 'Day' : 'Days'}</p>
              <p><i className="fas fa-tag"></i> LKR {selectedPackage.pricePerPerson?.toLocaleString()} per person</p>
            </div>
            
            <form onSubmit={handleBookingSubmit} className="booking-form">
              {/* Booking Date */}
              <div className="form-group">
                <label htmlFor="bookingDate">Preferred Booking Date</label>
                <input
                  type="date"
                  id="bookingDate"
                  name="bookingDate"
                  value={bookingData.bookingDate}
                  onChange={handleBookingInputChange}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              
              {/* Number of Passengers */}
              <div className="form-group">
                <label htmlFor="numberOfPassengers">Number of Passengers</label>
                <input
                  type="number"
                  id="numberOfPassengers"
                  name="numberOfPassengers"
                  value={bookingData.numberOfPassengers}
                  onChange={(e) => updatePassengerCount(parseInt(e.target.value))}
                  min={selectedPackage.minPassengers}
                  max={selectedPackage.maxPassengers}
                  required
                />
                <small>Minimum: {selectedPackage.minPassengers}, Maximum: {selectedPackage.maxPassengers}</small>
              </div>
              
              {/* Passenger Details */}
              <div className="passengers-section">
                <h3>Passenger Details</h3>
                {bookingData.passengers.slice(0, bookingData.numberOfPassengers).map((passenger, index) => (
                  <div key={index} className="passenger-form">
                    <h4>Passenger {index + 1}</h4>
                    <div className="form-row">
                      <div className="form-group">
                        <label>First Name</label>
                        <input
                          type="text"
                          value={passenger.firstName}
                          onChange={(e) => handlePassengerChange(index, 'firstName', e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Last Name</label>
                        <input
                          type="text"
                          value={passenger.lastName}
                          onChange={(e) => handlePassengerChange(index, 'lastName', e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Age</label>
                        <input
                          type="number"
                          value={passenger.age}
                          onChange={(e) => handlePassengerChange(index, 'age', e.target.value)}
                          min="0"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Passport Number (Optional)</label>
                        <input
                          type="text"
                          value={passenger.passportNumber}
                          onChange={(e) => handlePassengerChange(index, 'passportNumber', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Emergency Contact</label>
                      <input
                        type="text"
                        value={passenger.emergencyContact}
                        onChange={(e) => handlePassengerChange(index, 'emergencyContact', e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Special Requirements (Optional)</label>
                      <textarea
                        value={passenger.specialRequirements}
                        onChange={(e) => handlePassengerChange(index, 'specialRequirements', e.target.value)}
                        rows="2"
                      />
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Contact Person */}
              <div className="contact-section">
                <h3>Contact Information</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Contact Person Name</label>
                    <input
                      type="text"
                      name="contactPerson.name"
                      value={bookingData.contactPerson.name}
                      onChange={handleBookingInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      name="contactPerson.email"
                      value={bookingData.contactPerson.email}
                      onChange={handleBookingInputChange}
                      required
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      type="tel"
                      name="contactPerson.phone"
                      value={bookingData.contactPerson.phone}
                      onChange={handleBookingInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Address</label>
                    <input
                      type="text"
                      name="contactPerson.address"
                      value={bookingData.contactPerson.address}
                      onChange={handleBookingInputChange}
                      required
                    />
                  </div>
                </div>
              </div>
              
              {/* Payment Method */}
              <div className="form-group">
                <label htmlFor="paymentMethod">Payment Method</label>
                <select
                  id="paymentMethod"
                  name="paymentMethod"
                  value={bookingData.paymentMethod}
                  onChange={handleBookingInputChange}
                  required
                >
                  <option value="full_upfront">Full Payment Upfront</option>
                  <option value="installment">Installment Payment</option>
                </select>
              </div>
              
              {/* Special Requests */}
              <div className="form-group">
                <label htmlFor="specialRequests">Special Requests (Optional)</label>
                <textarea
                  id="specialRequests"
                  name="specialRequests"
                  value={bookingData.specialRequests}
                  onChange={handleBookingInputChange}
                  rows="3"
                  placeholder="Any special requirements or requests..."
                />
              </div>
              
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowBookingModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Submitting...' : 'Submit Booking Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TourPackages;









