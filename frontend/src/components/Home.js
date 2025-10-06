import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Home.css';

const Home = () => {
  const [user, setUser] = useState(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showRentalModal, setShowRentalModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showRentalsModal, setShowRentalsModal] = useState(false);
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bookingErrors, setBookingErrors] = useState({});
  const [rentalErrors, setRentalErrors] = useState({});
  const navigate = useNavigate();

  const [bookingData, setBookingData] = useState({
    bookingType: '', pickupLocation: '', dropoffLocation: '', pickupDate: '',
    pickupTime: '', returnDate: '', returnTime: '', passengers: 1,
    driverRequired: true, specialRequirements: ''
  });

  const [rentalData, setRentalData] = useState({
    vehicleId: '', rentalType: '', startDate: '', endDate: '',
    purpose: '', specialRequirements: ''
  });

  const [profileData, setProfileData] = useState({
    firstName: '', lastName: '', email: '', phone: '', address: '', password: ''
  });

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (!currentUser) {
      navigate('/');
      return;
    }
    setUser(currentUser);
    setProfileData({
      firstName: currentUser.firstName,
      lastName: currentUser.lastName,
      email: currentUser.email,
      phone: currentUser.phone,
      address: currentUser.address,
      password: ''
    });
  }, [navigate]);

  const loadVehicles = async () => {
    try {
      await axios.get('/api/vehicles');
    } catch (error) {
      console.error('Error loading vehicles:', error);
    }
  };

  const loadAvailableVehicles = async () => {
    try {
      const response = await axios.get('/api/rentals/available-vehicles');
      return response.data;
    } catch (error) {
      console.error('Error loading available vehicles:', error);
      return [];
    }
  };

  const loadAvailableVehiclesForRental = useCallback(async () => {
    try {
      const availableVehiclesData = await loadAvailableVehicles();
      setAvailableVehicles(availableVehiclesData);
    } catch (error) {
      console.error('Error loading available vehicles for rental:', error);
    }
  }, []);

  useEffect(() => {
    loadVehicles();
    loadRentals();
    loadAvailableVehiclesForRental();
  }, [navigate, loadAvailableVehiclesForRental]);

  const loadRentals = async () => {
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

  // Validation functions
  const validateBookingForm = (data) => {
    const errors = {};

    // Required field validations
    if (!data.bookingType) {
      errors.bookingType = 'Please select a service type';
    }

    if (!data.pickupLocation || data.pickupLocation.trim().length < 3) {
      errors.pickupLocation = 'Please enter a valid pickup location (minimum 3 characters)';
    }

    if (!data.dropoffLocation || data.dropoffLocation.trim().length < 3) {
      errors.dropoffLocation = 'Please enter a valid dropoff location (minimum 3 characters)';
    }

    if (!data.pickupDate) {
      errors.pickupDate = 'Please select a pickup date';
    } else {
      const selectedDate = new Date(data.pickupDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        errors.pickupDate = 'Pickup date cannot be in the past';
      }
    }

    if (!data.pickupTime) {
      errors.pickupTime = 'Please select a pickup time';
    } else if (data.pickupDate) {
      const selectedDateTime = new Date(`${data.pickupDate}T${data.pickupTime}`);
      const now = new Date();
      
      if (selectedDateTime <= now) {
        errors.pickupTime = 'Pickup time cannot be in the past';
      }
    }

    // Return date validation (if provided)
    if (data.returnDate) {
      const returnDate = new Date(data.returnDate);
      const pickupDate = new Date(data.pickupDate);
      
      if (returnDate <= pickupDate) {
        errors.returnDate = 'Return date must be after pickup date';
      }
    }

    // Return time validation (if return date is provided)
    if (data.returnDate && data.returnTime && data.pickupDate && data.pickupTime) {
      const returnDateTime = new Date(`${data.returnDate}T${data.returnTime}`);
      const pickupDateTime = new Date(`${data.pickupDate}T${data.pickupTime}`);
      
      if (returnDateTime <= pickupDateTime) {
        errors.returnTime = 'Return time must be after pickup time';
      }
    }

    // Passengers validation
    if (!data.passengers || data.passengers < 1 || data.passengers > 50) {
      errors.passengers = 'Number of passengers must be between 1 and 50';
    }

    // Special requirements length validation
    if (data.specialRequirements && data.specialRequirements.length > 500) {
      errors.specialRequirements = 'Special requirements cannot exceed 500 characters';
    }

    return errors;
  };

  const validateRentalForm = (data) => {
    const errors = {};

    // Required field validations
    if (!data.vehicleId) {
      errors.vehicleId = 'Please select a vehicle';
    }

    if (!data.rentalType) {
      errors.rentalType = 'Please select a rental type';
    }

    if (!data.startDate) {
      errors.startDate = 'Please select a start date';
    } else {
      const selectedDate = new Date(data.startDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        errors.startDate = 'Start date cannot be in the past';
      }
    }

    if (!data.endDate) {
      errors.endDate = 'Please select an end date';
    } else if (data.startDate) {
      const endDate = new Date(data.endDate);
      const startDate = new Date(data.startDate);
      
      if (endDate <= startDate) {
        errors.endDate = 'End date must be after start date';
      }

      // Check if rental period is reasonable (not more than 2 years)
      const diffTime = endDate - startDate;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 730) {
        errors.endDate = 'Rental period cannot exceed 2 years';
      }
    }

    if (!data.duration || data.duration < 1) {
      errors.duration = 'Duration must be at least 1 day';
    }

    if (!data.purpose || data.purpose.trim().length < 10) {
      errors.purpose = 'Please provide a detailed purpose (minimum 10 characters)';
    }

    // Special requirements length validation
    if (data.specialRequirements && data.specialRequirements.length > 500) {
      errors.specialRequirements = 'Special requirements cannot exceed 500 characters';
    }

    return errors;
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setBookingErrors({});
    
    // Validate form
    const errors = validateBookingForm(bookingData);
    if (Object.keys(errors).length > 0) {
      setBookingErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      await axios.post('/api/bookings', bookingData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Booking created successfully!');
      setShowBookingModal(false);
      setBookingData({
        bookingType: '', pickupLocation: '', dropoffLocation: '', pickupDate: '',
        pickupTime: '', returnDate: '', returnTime: '', passengers: 1,
        driverRequired: true, specialRequirements: ''
      });
    } catch (error) {
      alert(error.response?.data?.message || 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRentalRequest = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setRentalErrors({});
    
    // Validate form
    const errors = validateRentalForm(rentalData);
    if (Object.keys(errors).length > 0) {
      setRentalErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      await axios.post('/api/rentals', rentalData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Rental request submitted successfully!');
      setShowRentalModal(false);
      loadRentals();
      loadAvailableVehiclesForRental(); // Refresh available vehicles
      setRentalData({
        vehicleId: '', rentalType: '', startDate: '', endDate: '',
        purpose: '', specialRequirements: ''
      });
    } catch (error) {
      alert(error.response?.data?.message || 'Rental request failed');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const updateData = { ...profileData };
      if (!updateData.password) {
        delete updateData.password;
      }
      
      const response = await axios.put('/api/auth/profile', updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      localStorage.setItem('currentUser', JSON.stringify(response.data));
      setUser(response.data);
      setShowProfileModal(false);
      alert('Profile updated successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Profile update failed');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    navigate('/');
  };

  const toggleProfileDropdown = () => {
    setShowProfileDropdown(!showProfileDropdown);
  };

  return (
    <div className="home-page">
      {/* Navigation */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-logo">
            <i className="fas fa-taxi"></i>
            <span>Giraffe Cabs</span>
          </div>
          <div className="nav-menu">
            <a href="#home" className="nav-link">Home</a>
            <a href="#services" className="nav-link">Services</a>
            <a href="#about" className="nav-link">About Us</a>
            <a href="#fleet" className="nav-link">Our Fleet</a>
            <a href="#contact" className="nav-link">Contact Us</a>
            <button 
              className="btn btn-primary nav-book-btn"
              onClick={() => navigate('/tour-packages')}
            >
              <i className="fas fa-map-marked-alt"></i> Tour Packages
            </button>
            <button 
              className="btn btn-primary nav-book-btn"
              onClick={() => navigate('/booking')}
            >
              <i className="fas fa-calendar-plus"></i> Book Now
            </button>
          </div>
          <div className="nav-profile">
            <div className="profile-dropdown">
              <button className="profile-btn" onClick={toggleProfileDropdown}>
                <i className="fas fa-user"></i>
                <span>{user?.firstName || 'Profile'}</span>
                <i className="fas fa-chevron-down"></i>
              </button>
              {showProfileDropdown && (
                <div className="profile-menu">
                  <button className="profile-menu-item" onClick={() => navigate('/profile')}>
                    <i className="fas fa-user-edit"></i> My Profile
                  </button>
                  <button className="profile-menu-item" onClick={() => {
                    loadAvailableVehiclesForRental();
                    setShowRentalModal(true);
                  }}>
                    <i className="fas fa-car"></i> Request Vehicle Rental
                  </button>
                  <button className="profile-menu-item" onClick={() => setShowRentalsModal(true)}>
                    <i className="fas fa-list"></i> My Rentals
                  </button>
                  <button className="profile-menu-item" onClick={logout}>
                    <i className="fas fa-sign-out-alt"></i> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Modern Hero Section */}
      <section id="home" className="modern-hero">
        <div className="hero-background">
          <div className="hero-pattern"></div>
          <div className="hero-shapes">
            <div className="shape shape-1"></div>
            <div className="shape shape-2"></div>
            <div className="shape shape-3"></div>
          </div>
        </div>
        
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-badge">
              <i className="fas fa-star"></i>
              <span>Trusted by 10,000+ Customers</span>
            </div>
            
            <h1 className="hero-title">
              <span className="title-line-1">Premium</span>
              <span className="title-line-2">Transportation</span>
              <span className="title-line-3">Services</span>
            </h1>
            
            <p className="hero-subtitle">
              Experience luxury, safety, and reliability with Sri Lanka's leading 
              transportation service provider
            </p>
            
            <div className="hero-features">
              <div className="feature-item">
                <i className="fas fa-shield-alt"></i>
                <span>100% Safe & Secure</span>
              </div>
              <div className="feature-item">
                <i className="fas fa-clock"></i>
                <span>24/7 Available</span>
              </div>
              <div className="feature-item">
                <i className="fas fa-star"></i>
                <span>5-Star Rated</span>
              </div>
            </div>
            
            <div className="hero-buttons">
              <button className="btn btn-primary btn-large hero-btn-primary" onClick={() => navigate('/booking')}>
                <i className="fas fa-calendar-plus"></i>
                <span>Book Your Ride</span>
                <div className="btn-shine"></div>
              </button>
              <button className="btn btn-primary btn-large hero-btn-primary" onClick={() => {
                loadAvailableVehiclesForRental();
                setShowRentalModal(true);
              }}>
                <i className="fas fa-handshake"></i>
                <span>Request Vehicle Rental</span>
                <div className="btn-shine"></div>
              </button>
            </div>
            
            <div className="hero-stats">
              <div className="stat-item">
                <div className="stat-number">500+</div>
                <div className="stat-label">Vehicles</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">50+</div>
                <div className="stat-label">Cities</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">10K+</div>
                <div className="stat-label">Happy Customers</div>
              </div>
            </div>
          </div>
          
          <div className="hero-visual">
            <div className="hero-car-container">
              <div className="hero-car">
                <i className="fas fa-car-side"></i>
              </div>
              <div className="car-glow"></div>
            </div>
            
            {/* Progressive Snake Arrow Animation */}
            <div className="dropoff-arrow-container">
              <svg className="dropoff-arrow" viewBox="0 -30 700 300" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <marker id="arrowhead" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto" markerUnits="strokeWidth">
                    <polygon points="0 0, 10 4, 0 8" fill="#F7AA00" stroke="#F7AA00" strokeWidth="1" />
                  </marker>
                </defs>
                <path
                  d="M 391 100 Q 431 80 471 60 Q 511 40 551 20 Q 571 0 591 -20"
                  stroke="#F7AA00"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray="15,8"
                  markerEnd="url(#arrowhead)"
                  className="progressive-arrow-path"
                />
              </svg>
              <div className="dropoff-label">
                <div className="dropoff-text">drop off</div>
                <div className="dropoff-pulse"></div>
              </div>
            </div>
            
            <div className="floating-elements">
              <div className="floating-icon icon-1">
                <i className="fas fa-plane"></i>
              </div>
              <div className="floating-icon icon-2">
                <i className="fas fa-heart"></i>
              </div>
              <div className="floating-icon icon-3">
                <i className="fas fa-map-marker-alt"></i>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="services">
        <div className="container">
          <h2>Our Services</h2>
          <div className="services-grid">
            <div className="service-card">
              <i className="fas fa-heart"></i>
              <h3>Wedding Hires</h3>
              <p>Luxury cars with full decoration and professional chauffeur service</p>
            </div>
            <div className="service-card">
              <i className="fas fa-plane"></i>
              <h3>Airport Transfers</h3>
              <p>Timely airport pickups/drop-offs with flight-time coordination</p>
            </div>
            <div className="service-card">
              <i className="fas fa-box"></i>
              <h3>Cargo Transport</h3>
              <p>Rent lorries/trucks for secure transport of goods island-wide</p>
            </div>
            <div className="service-card">
              <i className="fas fa-map-marked-alt"></i>
              <h3>Holiday Packages</h3>
              <p>Custom or pre-set tour packages with vehicle, driver, and itinerary options</p>
            </div>
            <div className="service-card">
              <i className="fas fa-calendar-day"></i>
              <h3>Daily Hires</h3>
              <p>Book any vehicle for short day-to-day travel needs</p>
            </div>
            <div className="service-card">
              <i className="fas fa-handshake"></i>
              <h3>Vehicle Rental</h3>
              <p>Offer your own vehicle for monthly rental income</p>
            </div>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="about">
        <div className="container">
          <h2>About Giraffe Cabs</h2>
          <div className="about-content">
            <div className="about-text">
              <p>
                At Giraffe Cabs, we combine <strong>reliability, comfort, and affordability</strong>. 
                From business transport to family getaways, we provide the best cab services across Sri Lanka 
                — including rural and urban regions.
              </p>
              <p>
                Unlike other apps where vehicles and drivers are freelance, 
                <strong>Giraffe Cabs uses only company-owned vehicles and verified drivers.</strong> 
                This ensures safety, quality, and consistent service.
              </p>
              <div className="features">
                <div className="feature">
                  <i className="fas fa-shield-alt"></i>
                  <span>Safe & Secure</span>
                </div>
                <div className="feature">
                  <i className="fas fa-clock"></i>
                  <span>On-Time Service</span>
                </div>
                <div className="feature">
                  <i className="fas fa-star"></i>
                  <span>Quality Assured</span>
                </div>
                <div className="feature">
                  <i className="fas fa-map-marker-alt"></i>
                  <span>All Cities Covered</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Fleet Section */}
      <section id="fleet" className="fleet">
        <div className="container">
          <h2>Our Vehicle Fleet</h2>
          <div className="fleet-preview">
            <div className="fleet-category">
              <i className="fas fa-van-shuttle"></i>
              <h3>Vans</h3>
              <p>KDH, Dolphin, Caravan, Buddy Vans</p>
            </div>
            <div className="fleet-category">
              <i className="fas fa-bus"></i>
              <h3>Buses</h3>
              <p>Semi-Luxury, Luxury, Super Luxury (24–59 seats)</p>
            </div>
            <div className="fleet-category">
              <i className="fas fa-car"></i>
              <h3>Wedding Cars</h3>
              <p>Audi, BMW, Benz, Premio, Allion (fully decorated)</p>
            </div>
            <div className="fleet-category">
              <i className="fas fa-car-side"></i>
              <h3>Cars</h3>
              <p>Wagon R, Prius, Axio, Alto, Nano</p>
            </div>
          </div>
          <div className="fleet-button">
            <button className="btn btn-primary" onClick={() => navigate('/vehicles')}>
              View All Vehicles
            </button>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="contact">
        <div className="contact-background">
          <div className="contact-pattern"></div>
          <div className="contact-shapes">
            <div className="contact-shape contact-shape-1"></div>
            <div className="contact-shape contact-shape-2"></div>
            <div className="contact-shape contact-shape-3"></div>
          </div>
        </div>
        
        <div className="container">
          <div className="contact-header">
            <div className="contact-badge">
              <i className="fas fa-comments"></i>
              <span>Get in Touch</span>
            </div>
            <h2 className="contact-title">
              <span className="contact-title-line-1">Contact</span>
              <span className="contact-title-line-2">Us</span>
            </h2>
            <p className="contact-subtitle">
              Ready to book your next journey? We're here to help you with all your transportation needs.
            </p>
          </div>

          <div className="contact-content">
            <div className="contact-cards">
              <div className="contact-card">
                <div className="contact-card-icon">
                  <i className="fas fa-phone"></i>
                </div>
                <div className="contact-card-content">
                  <h3>Phone</h3>
                  <p>Call us for immediate assistance</p>
                  <a href="tel:+94112345678" className="contact-link">
                    +94 11 234 5678
                  </a>
                </div>
                <div className="contact-card-decoration"></div>
              </div>

              <div className="contact-card">
                <div className="contact-card-icon">
                  <i className="fas fa-envelope"></i>
                </div>
                <div className="contact-card-content">
                  <h3>Email</h3>
                  <p>Send us your inquiries</p>
                  <a href="mailto:info@giraffecabs.lk" className="contact-link">
                    info@giraffecabs.lk
                  </a>
                </div>
                <div className="contact-card-decoration"></div>
              </div>

              <div className="contact-card">
                <div className="contact-card-icon">
                  <i className="fas fa-map-marker-alt"></i>
                </div>
                <div className="contact-card-content">
                  <h3>Address</h3>
                  <p>Visit our main office</p>
                  <span className="contact-address">
                    Colombo, Sri Lanka
                  </span>
                </div>
                <div className="contact-card-decoration"></div>
              </div>
            </div>

            <div className="contact-cta">
              <div className="cta-content">
                <h3>Ready to Book?</h3>
                <p>Experience premium transportation services with just one click</p>
                <button 
                  className="btn btn-primary cta-button"
                  onClick={() => navigate('/booking')}
                >
                  <i className="fas fa-calendar-plus"></i>
                  Book Your Service Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="modal-overlay" onClick={() => setShowBookingModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowBookingModal(false)}>&times;</button>
            <h2>Book Your Ride</h2>
            <form onSubmit={handleBooking}>
              <div className="form-group">
                <label htmlFor="bookingType">Service Type</label>
                <select
                  id="bookingType"
                  value={bookingData.bookingType}
                  onChange={(e) => setBookingData({...bookingData, bookingType: e.target.value})}
                  required
                  className={bookingErrors.bookingType ? 'error' : ''}
                >
                  <option value="">Select Service</option>
                  <option value="wedding">Wedding Hire</option>
                  <option value="airport">Airport Transfer</option>
                  <option value="cargo">Cargo Transport</option>
                  <option value="holiday">Holiday Package</option>
                  <option value="daily">Daily Hire</option>
                </select>
                {bookingErrors.bookingType && (
                  <span className="error-message">{bookingErrors.bookingType}</span>
                )}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="pickupLocation">Pickup Location</label>
                  <input
                    type="text"
                    id="pickupLocation"
                    value={bookingData.pickupLocation}
                    onChange={(e) => setBookingData({...bookingData, pickupLocation: e.target.value})}
                    required
                    className={bookingErrors.pickupLocation ? 'error' : ''}
                    placeholder="Enter pickup address"
                  />
                  {bookingErrors.pickupLocation && (
                    <span className="error-message">{bookingErrors.pickupLocation}</span>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="dropoffLocation">Dropoff Location</label>
                  <input
                    type="text"
                    id="dropoffLocation"
                    value={bookingData.dropoffLocation}
                    onChange={(e) => setBookingData({...bookingData, dropoffLocation: e.target.value})}
                    required
                    className={bookingErrors.dropoffLocation ? 'error' : ''}
                    placeholder="Enter dropoff address"
                  />
                  {bookingErrors.dropoffLocation && (
                    <span className="error-message">{bookingErrors.dropoffLocation}</span>
                  )}
                </div>
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
                    className={bookingErrors.pickupDate ? 'error' : ''}
                    min={new Date().toISOString().split('T')[0]}
                  />
                  {bookingErrors.pickupDate && (
                    <span className="error-message">{bookingErrors.pickupDate}</span>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="pickupTime">Pickup Time</label>
                  <input
                    type="time"
                    id="pickupTime"
                    value={bookingData.pickupTime}
                    onChange={(e) => setBookingData({...bookingData, pickupTime: e.target.value})}
                    required
                    className={bookingErrors.pickupTime ? 'error' : ''}
                  />
                  {bookingErrors.pickupTime && (
                    <span className="error-message">{bookingErrors.pickupTime}</span>
                  )}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="returnDate">Return Date (Optional)</label>
                  <input
                    type="date"
                    id="returnDate"
                    value={bookingData.returnDate}
                    onChange={(e) => setBookingData({...bookingData, returnDate: e.target.value})}
                    className={bookingErrors.returnDate ? 'error' : ''}
                    min={bookingData.pickupDate || new Date().toISOString().split('T')[0]}
                  />
                  {bookingErrors.returnDate && (
                    <span className="error-message">{bookingErrors.returnDate}</span>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="returnTime">Return Time (Optional)</label>
                  <input
                    type="time"
                    id="returnTime"
                    value={bookingData.returnTime}
                    onChange={(e) => setBookingData({...bookingData, returnTime: e.target.value})}
                    className={bookingErrors.returnTime ? 'error' : ''}
                  />
                  {bookingErrors.returnTime && (
                    <span className="error-message">{bookingErrors.returnTime}</span>
                  )}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="passengers">Number of Passengers</label>
                  <input
                    type="number"
                    id="passengers"
                    min="1"
                    max="50"
                    value={bookingData.passengers}
                    onChange={(e) => setBookingData({...bookingData, passengers: parseInt(e.target.value)})}
                    required
                    className={bookingErrors.passengers ? 'error' : ''}
                  />
                  {bookingErrors.passengers && (
                    <span className="error-message">{bookingErrors.passengers}</span>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="driverRequired">Driver Required</label>
                  <select
                    id="driverRequired"
                    value={bookingData.driverRequired}
                    onChange={(e) => setBookingData({...bookingData, driverRequired: e.target.value === 'true'})}
                  >
                    <option value="true">Yes</option>
                    <option value="false">No (Self-drive)</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="specialRequirements">Special Requirements</label>
                <textarea
                  id="specialRequirements"
                  rows="3"
                  value={bookingData.specialRequirements}
                  onChange={(e) => setBookingData({...bookingData, specialRequirements: e.target.value})}
                  className={bookingErrors.specialRequirements ? 'error' : ''}
                  placeholder="Any special requirements or requests (optional)"
                  maxLength="500"
                ></textarea>
                {bookingErrors.specialRequirements && (
                  <span className="error-message">{bookingErrors.specialRequirements}</span>
                )}
                <div className="character-count">
                  {bookingData.specialRequirements.length}/500 characters
                </div>
              </div>
              <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                {loading ? 'Booking...' : 'Book Now'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Vehicle Rental Request Modal */}
      {showRentalModal && (
        <div className="modal-overlay" onClick={() => setShowRentalModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowRentalModal(false)}>&times;</button>
            <h2>Request Vehicle Rental</h2>
            <form onSubmit={handleRentalRequest}>
              <div className="form-group">
                <label htmlFor="rentalVehicle">Select Vehicle Type</label>
                <select
                  id="rentalVehicle"
                  value={rentalData.vehicleId}
                  onChange={(e) => setRentalData({...rentalData, vehicleId: e.target.value})}
                  required
                  className={rentalErrors.vehicleId ? 'error' : ''}
                >
                  <option value="">Select Available Vehicle</option>
                  {availableVehicles.length === 0 ? (
                    <option value="" disabled>No vehicles available for rental</option>
                  ) : (
                    availableVehicles.map(vehicle => (
                      <option key={vehicle._id} value={vehicle._id}>
                        {vehicle.brand} {vehicle.model} - {vehicle.vehicleType} (LKR {vehicle.dailyRate}/day)
                      </option>
                    ))
                  )}
                </select>
                {rentalErrors.vehicleId && (
                  <span className="error-message">{rentalErrors.vehicleId}</span>
                )}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="rentalType">Rental Type</label>
                  <select
                    id="rentalType"
                    value={rentalData.rentalType}
                    onChange={(e) => setRentalData({...rentalData, rentalType: e.target.value})}
                    required
                    className={rentalErrors.rentalType ? 'error' : ''}
                  >
                    <option value="">Select Type</option>
                    <option value="daily">Daily</option>
                    <option value="monthly">Monthly</option>
                  </select>
                  {rentalErrors.rentalType && (
                    <span className="error-message">{rentalErrors.rentalType}</span>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="rentalDuration">Duration (Days)</label>
                  <input
                    type="number"
                    id="rentalDuration"
                    min="1"
                    value={rentalData.duration}
                    onChange={(e) => setRentalData({...rentalData, duration: parseInt(e.target.value)})}
                    required
                    className={rentalErrors.duration ? 'error' : ''}
                  />
                  {rentalErrors.duration && (
                    <span className="error-message">{rentalErrors.duration}</span>
                  )}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="rentalStartDate">Start Date</label>
                  <input
                    type="date"
                    id="rentalStartDate"
                    value={rentalData.startDate}
                    onChange={(e) => setRentalData({...rentalData, startDate: e.target.value})}
                    required
                    className={rentalErrors.startDate ? 'error' : ''}
                    min={new Date().toISOString().split('T')[0]}
                  />
                  {rentalErrors.startDate && (
                    <span className="error-message">{rentalErrors.startDate}</span>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="rentalEndDate">End Date</label>
                  <input
                    type="date"
                    id="rentalEndDate"
                    value={rentalData.endDate}
                    onChange={(e) => setRentalData({...rentalData, endDate: e.target.value})}
                    required
                    className={rentalErrors.endDate ? 'error' : ''}
                    min={rentalData.startDate || new Date().toISOString().split('T')[0]}
                  />
                  {rentalErrors.endDate && (
                    <span className="error-message">{rentalErrors.endDate}</span>
                  )}
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="rentalPurpose">Purpose of Rental</label>
                <textarea
                  id="rentalPurpose"
                  rows="3"
                  value={rentalData.purpose}
                  onChange={(e) => setRentalData({...rentalData, purpose: e.target.value})}
                  required
                  className={rentalErrors.purpose ? 'error' : ''}
                  placeholder="Please provide detailed purpose for vehicle rental (minimum 10 characters)"
                ></textarea>
                {rentalErrors.purpose && (
                  <span className="error-message">{rentalErrors.purpose}</span>
                )}
                <div className="character-count">
                  {rentalData.purpose.length} characters (minimum 10 required)
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="rentalRequirements">Special Requirements</label>
                <textarea
                  id="rentalRequirements"
                  rows="3"
                  value={rentalData.specialRequirements}
                  onChange={(e) => setRentalData({...rentalData, specialRequirements: e.target.value})}
                  className={rentalErrors.specialRequirements ? 'error' : ''}
                  placeholder="Any special requirements or conditions (optional)"
                  maxLength="500"
                ></textarea>
                {rentalErrors.specialRequirements && (
                  <span className="error-message">{rentalErrors.specialRequirements}</span>
                )}
                <div className="character-count">
                  {rentalData.specialRequirements.length}/500 characters
                </div>
              </div>
              <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="modal-overlay" onClick={() => setShowProfileModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowProfileModal(false)}>&times;</button>
            <h2>Edit Profile</h2>
            <form onSubmit={handleProfileUpdate}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="profileFirstName">First Name</label>
                  <input
                    type="text"
                    id="profileFirstName"
                    value={profileData.firstName}
                    onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="profileLastName">Last Name</label>
                  <input
                    type="text"
                    id="profileLastName"
                    value={profileData.lastName}
                    onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="profileEmail">Email</label>
                <input
                  type="email"
                  id="profileEmail"
                  value={profileData.email}
                  onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="profilePhone">Phone</label>
                <input
                  type="tel"
                  id="profilePhone"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="profileAddress">Address</label>
                <input
                  type="text"
                  id="profileAddress"
                  value={profileData.address}
                  onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="profilePassword">New Password (Optional)</label>
                <input
                  type="password"
                  id="profilePassword"
                  value={profileData.password}
                  onChange={(e) => setProfileData({...profileData, password: e.target.value})}
                />
              </div>
              <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                {loading ? 'Updating...' : 'Update Profile'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* My Rentals Modal */}
      {showRentalsModal && (
        <div className="modal-overlay" onClick={() => setShowRentalsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowRentalsModal(false)}>&times;</button>
            <h2>My Rental Requests</h2>
            <div className="rentals-list">
              {rentals.length === 0 ? (
                <p>No rental requests found.</p>
              ) : (
                rentals.map(rental => (
                  <div key={rental._id} className="rental-item">
                    <div className="rental-info">
                      <h4>{rental.vehicleDetails?.brand} {rental.vehicleDetails?.model}</h4>
                      <p><strong>Type:</strong> {rental.rentalType}</p>
                      <p><strong>Duration:</strong> {rental.duration} days</p>
                      <p><strong>Purpose:</strong> {rental.purpose}</p>
                      <p><strong>Status:</strong> 
                        <span className={`status status-${rental.status}`}>
                          {rental.status}
                        </span>
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
};

export default Home;
