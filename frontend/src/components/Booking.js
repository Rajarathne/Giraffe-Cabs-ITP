import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Booking.css';

const Booking = () => {
  const [user, setUser] = useState(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [selectedService, setSelectedService] = useState('');
  const [bookingData, setBookingData] = useState({
    serviceType: '',
    pickupLocation: '',
    dropoffLocation: '',
    pickupDate: '',
    pickupTime: '',
    returnDate: '',
    returnTime: '',
    passengers: 1,
    distance: 0,
    totalPrice: 0,
    additionalNotes: '',
    serviceDetails: {}
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [priceFilter, setPriceFilter] = useState('all');
  const [filteredServices, setFilteredServices] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (!currentUser) {
      navigate('/');
      return;
    }
    setUser(currentUser);
  }, [navigate]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showProfileDropdown && !event.target.closest('.profile-dropdown')) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileDropdown]);

  const toggleProfileDropdown = () => {
    setShowProfileDropdown(!showProfileDropdown);
  };

  // Validation function for booking form
  const validateBookingForm = (data) => {
    const errors = {};

    // Required field validations
    if (!data.serviceType) {
      errors.serviceType = 'Please select a service type';
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

    // Additional notes length validation
    if (data.additionalNotes && data.additionalNotes.length > 500) {
      errors.additionalNotes = 'Additional notes cannot exceed 500 characters';
    }

    return errors;
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    navigate('/');
  };

  const services = useMemo(() => [
    {
      id: 'wedding',
      name: 'Wedding Service',
      icon: '💒',
      description: 'Elegant wedding transportation with decoration and flower arrangements',
      basePrice: 25000,
      vehicleRates: [
        { vehicle: 'Luxury Car', rate: 'Fixed LKR 25,000' },
        { vehicle: 'Premium Car', rate: 'Fixed LKR 23,000' },
        { vehicle: 'Standard Car', rate: 'Fixed LKR 20,000' }
      ]
    },
    {
      id: 'airport',
      name: 'Airport Transfer',
      icon: '✈️',
      description: 'Reliable airport pickup and drop-off service',
      basePrice: 2000,
      vehicleRates: [
        { vehicle: 'Van', rate: 'LKR 120/km' },
        { vehicle: 'Car', rate: 'LKR 100/km' }
      ]
    },
    {
      id: 'cargo',
      name: 'Cargo Transport',
      icon: '📦',
      description: 'Safe and secure cargo transportation service',
      basePrice: 1500,
      vehicleRates: [
        { vehicle: 'All Vehicles', rate: 'LKR 150/km' }
      ]
    },
    {
      id: 'daily',
      name: 'Daily Rental',
      icon: '🚗',
      description: 'Flexible daily vehicle rental service',
      basePrice: 3000,
      vehicleRates: [
        { vehicle: 'Van', rate: 'LKR 120/km' },
        { vehicle: 'Car', rate: 'LKR 90/km' },
        { vehicle: 'Bike', rate: 'LKR 50/km' }
      ]
    }
  ], []);

  // Filter services based on search term and price filter
  useEffect(() => {
    let filtered = services.filter(service => {
      const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            service.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchesPrice = true;
      if (priceFilter === 'low') {
        matchesPrice = service.basePrice <= 2000;
      } else if (priceFilter === 'medium') {
        matchesPrice = service.basePrice > 2000 && service.basePrice <= 5000;
      } else if (priceFilter === 'high') {
        matchesPrice = service.basePrice > 5000;
      }
      
      return matchesSearch && matchesPrice;
    });
    
    setFilteredServices(filtered);
  }, [searchTerm, priceFilter, services]);

  const vehicleTypes = {
    wedding: [
      { value: 'luxury', label: 'Luxury Car (Audi, BMW, Benz)', price: 0 },
      { value: 'premium', label: 'Premium Car (Premio, Allion)', price: -2000 }
    ],
    airport: [
      { value: 'van', label: 'Van (8 passengers)', price: 0 },
      { value: 'car', label: 'Car (4 passengers)', price: 0 }
    ],
    cargo: [
      { value: 'van', label: 'Van', price: 0 },
      { value: 'lorry', label: 'Lorry', price: 0 }
    ],
    daily: [
      { value: 'bike', label: 'Bike (Motorcycle)', price: 0 },
      { value: 'economy', label: 'Economy Car (Wagon R, Alto)', price: 0 },
      { value: 'comfort', label: 'Comfort Car (Axio, Prius)', price: 0 },
      { value: 'luxury', label: 'Luxury Car (Premio, Allion)', price: 0 },
      { value: 'van', label: 'Van (8 passengers)', price: 0 }
    ]
  };

  useEffect(() => {
    // Price calculation is handled by admin, so this effect is simplified.
    // Calculate estimated price based on service and distance
    const calculateEstimatedPrice = () => {
      if (!selectedService || !bookingData.distance || bookingData.distance <= 0) {
        setBookingData(prev => ({
          ...prev,
          totalPrice: 0
        }));
        return;
      }

      let estimatedPrice = 0;
      const distance = bookingData.distance;
      const service = services.find(s => s.id === selectedService);

      if (!service) return;

      switch (selectedService) {
        case 'wedding':
          // Wedding service - fixed price regardless of distance
          estimatedPrice = service.basePrice;
          break;
          
        case 'airport':
          // Airport transfer - fixed price
          estimatedPrice = service.basePrice;
          break;
          
        case 'cargo':
          // Cargo service - per km pricing
          estimatedPrice = distance * 120; // LKR 120 per km for cargo
          break;
          
        case 'daily':
          // Daily rental - per km pricing based on vehicle type
          const vehicleType = bookingData.serviceDetails.vehicleType;
          let ratePerKm = 90; // Default rate
          
          if (vehicleType === 'bike') ratePerKm = 50;
          else if (vehicleType === 'economy') ratePerKm = 90;
          else if (vehicleType === 'comfort') ratePerKm = 120;
          else if (vehicleType === 'luxury') ratePerKm = 150;
          else if (vehicleType === 'van') ratePerKm = 120;
          
          estimatedPrice = distance * ratePerKm;
          break;
          
        default:
          estimatedPrice = service.basePrice;
      }

      setBookingData(prev => ({
        ...prev,
        totalPrice: estimatedPrice
      }));
    };

    calculateEstimatedPrice();
  }, [selectedService, bookingData.serviceDetails, bookingData.passengers, bookingData.distance, services]);


  // Estimate distance using known routes in Sri Lanka
  const estimateDistance = (pickup, dropoff) => {
    const routes = {
      'colombo-kandy': 115, 'colombo-malabe': 15, 'colombo-negombo': 35,
      'colombo-gampaha': 25, 'colombo-kelaniya': 12, 'colombo-kaduwela': 18,
      'colombo-avissawella': 45, 'colombo-katunayake': 30, 'colombo-bandaranaike': 30,
      'colombo-mount-lavinia': 8, 'colombo-dehiwala': 10, 'colombo-moratuwa': 15,
      'colombo-panadura': 25, 'colombo-kalutara': 45, 'colombo-galle': 115,
      'colombo-matara': 160, 'colombo-anuradhapura': 200, 'colombo-jaffna': 400,
      'colombo-trincomalee': 250, 'colombo-batticaloa': 300, 'colombo-kurunegala': 100,
      'colombo-kegalle': 80, 'colombo-ratnapura': 100, 'colombo-badulla': 200,
      'colombo-nuwara-eliya': 180, 'kandy-malabe': 100, 'kandy-negombo': 80,
      'kandy-gampaha': 90, 'kandy-anuradhapura': 150, 'kandy-jaffna': 350,
      'malabe-negombo': 20, 'malabe-gampaha': 10, 'malabe-kelaniya': 3,
      'malabe-kaduwela': 3, 'malabe-avissawella': 30, 'malabe-anuradhapura': 185,
      'negombo-anuradhapura': 170, 'gampaha-anuradhapura': 175
    };

    const normalizeLocation = (location) => location.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z-]/g, '');
    const pickupNorm = normalizeLocation(pickup);
    const dropoffNorm = normalizeLocation(dropoff);
    
    const directRoute = `${pickupNorm}-${dropoffNorm}`;
    if (routes[directRoute]) return routes[directRoute];

    const reverseRoute = `${dropoffNorm}-${pickupNorm}`;
    if (routes[reverseRoute]) return routes[reverseRoute];

    const majorCities = ['colombo', 'kandy', 'malabe', 'negombo', 'gampaha'];
    for (const city of majorCities) {
      const route1 = `${pickupNorm}-${city}`;
      const route2 = `${city}-${dropoffNorm}`;
      if (routes[route1] && routes[route2]) {
        return routes[route1] + routes[route2];
      }
    }
    return 0;
  };
  
  const estimateDistanceForUser = (pickupLocation, dropoffLocation) => {
    if (!pickupLocation || !dropoffLocation) return 0;
    return estimateDistance(pickupLocation, dropoffLocation);
  };
  
  const handleServiceSelect = (serviceId) => {
    setSelectedService(serviceId);
    setBookingData(prev => ({
      ...prev,
      serviceType: serviceId,
      serviceDetails: {}
    }));
    setError('');
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setBookingData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setError('');
  };
  
  const handleLocationChange = (e) => {
    const { name, value } = e.target;
    setBookingData(prev => ({
      ...prev,
      [name]: value,
      distance: 0 // Reset distance on location change
    }));
    setError('');
  };

  const handleServiceDetailChange = (field, value) => {
    setBookingData(prev => ({
      ...prev,
      serviceDetails: {
        ...prev.serviceDetails,
        [field]: value
      }
    }));
    setError('');
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setFormErrors({});
    setError('');
    
    // Validate form
    const bookingPayload = { ...bookingData, serviceType: selectedService, status: 'pending' };
    const errors = validateBookingForm(bookingPayload);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setLoading(true);
    
    try {
      const token = localStorage.getItem('authToken');

      const response = await axios.post('/api/bookings', bookingPayload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const newBooking = response.data;
      
      try {
        const invoiceResponse = await axios.get(`/api/bookings/${newBooking._id}/invoice`, {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        });
        const url = window.URL.createObjectURL(new Blob([invoiceResponse.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Booking_Invoice_${newBooking._id}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } catch (invoiceError) {
        console.error('Failed to download invoice:', invoiceError);
      }

      // Navigate to payment page with booking data
      navigate('/payment', {
        state: {
          bookingData: newBooking
        }
      });

    } catch (error) {
      setError(error.response?.data?.message || 'Failed to submit booking request');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="booking-page">
      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-logo" onClick={() => navigate('/home')}>
            <i className="fas fa-car"></i>
            Giraffe Cabs
          </div>
          <div className="nav-menu">
            <button className="nav-link" onClick={() => navigate('/home')}>Home</button>
            <button className="nav-link" onClick={() => navigate('/vehicles')}>Our Fleet</button>
            <button className="nav-link" onClick={() => navigate('/tour-packages')}>Tour Packages</button>
            <button className="nav-link active" onClick={() => navigate('/booking')}>Book Service</button>
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
                  <button className="profile-menu-item" onClick={() => navigate('/profile')}>
                    <i className="fas fa-map-marked-alt"></i> Tour History
                  </button>
                  <button className="profile-menu-item" onClick={() => navigate('/profile')}>
                    <i className="fas fa-list"></i> My Bookings
                  </button>
                  {user?.role === 'admin' && (
                    <button className="profile-menu-item" onClick={() => navigate('/admin')}>
                      <i className="fas fa-cog"></i> Admin Panel
                    </button>
                  )}
                  <button className="profile-menu-item" onClick={logout}>
                    <i className="fas fa-sign-out-alt"></i> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="booking-container">
        <div className="booking-header">
          <h1>Book Your Service</h1>
          <p>Choose from our professional transportation services</p>
        </div>

        <div className="booking-content">
          <div className="search-filter-section">
            <div className="search-container">
              <div className="search-box">
                <i className="fas fa-search"></i>
                <input
                  type="text"
                  placeholder="Search services..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>
            
            <div className="filter-container">
              <div className="filter-group">
                <label htmlFor="priceFilter">Price Range:</label>
                <select
                  id="priceFilter"
                  value={priceFilter}
                  onChange={(e) => setPriceFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Prices</option>
                  <option value="low">Low (≤ LKR 2,000)</option>
                  <option value="medium">Medium (LKR 2,001 - 5,000)</option>
                  <option value="high">High (> LKR 5,000)</option>
                </select>
              </div>
              
              <div className="filter-results">
                <span className="results-count">
                  {filteredServices.length} service{filteredServices.length !== 1 ? 's' : ''} found
                </span>
              </div>
            </div>
          </div>

          <div className="service-selection">
            <h2>Select Your Service</h2>
            <div className="service-grid">
              {filteredServices.length > 0 ? (
                filteredServices.map(service => (
                <div 
                  key={service.id}
                  className={`service-card ${selectedService === service.id ? 'selected' : ''}`}
                  onClick={() => handleServiceSelect(service.id)}
                >
                  <div className="service-icon">{service.icon}</div>
                  <h3>{service.name}</h3>
                  <p>{service.description}</p>
                  
                  <div className="service-pricing">
                    <div className="base-price">
                      {service.id === 'wedding' ? 'From' : 'Base'} LKR {service.basePrice.toLocaleString()}
                    </div>
                    
                    <div className="vehicle-rates-list">
                      {service.vehicleRates.map((item, index) => (
                        <div key={index} className="rate-row">
                          <span className="vehicle-name">{item.vehicle}:</span>
                          <span className="rate-value">{item.rate}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                ))
              ) : (
                <div className="no-services-found">
                  <i className="fas fa-search"></i>
                  <h3>No services found</h3>
                  <p>Try adjusting your search terms or filters</p>
                </div>
              )}
            </div>
          </div>

          {selectedService && (
            <div className="booking-form-section">
              <h2>Complete Your Booking</h2>
              
              {error && (
                <div className="error-message-general">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="form-section">
                  <h3>Basic Information</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="pickupLocation">Pickup Location</label>
                      <input
                        type="text"
                        id="pickupLocation"
                        name="pickupLocation"
                        value={bookingData.pickupLocation}
                        onChange={handleLocationChange}
                        placeholder="Enter pickup address"
                        required
                        className={formErrors.pickupLocation ? 'error' : ''}
                      />
                      {formErrors.pickupLocation && (
                        <span className="error-message">{formErrors.pickupLocation}</span>
                      )}
                    </div>
                    <div className="form-group">
                      <label htmlFor="dropoffLocation">Dropoff Location</label>
                      <input
                        type="text"
                        id="dropoffLocation"
                        name="dropoffLocation"
                        value={bookingData.dropoffLocation}
                        onChange={handleLocationChange}
                        placeholder="Enter dropoff address"
                        required
                        className={formErrors.dropoffLocation ? 'error' : ''}
                      />
                      {formErrors.dropoffLocation && (
                        <span className="error-message">{formErrors.dropoffLocation}</span>
                      )}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="pickupDate">Pickup Date</label>
                      <input
                        type="date"
                        id="pickupDate"
                        name="pickupDate"
                        value={bookingData.pickupDate}
                        onChange={handleInputChange}
                        min={new Date().toISOString().split('T')[0]}
                        required
                        className={formErrors.pickupDate ? 'error' : ''}
                      />
                      {formErrors.pickupDate && (
                        <span className="error-message">{formErrors.pickupDate}</span>
                      )}
                    </div>
                    <div className="form-group">
                      <label htmlFor="pickupTime">Pickup Time</label>
                      <input
                        type="time"
                        id="pickupTime"
                        name="pickupTime"
                        value={bookingData.pickupTime}
                        onChange={handleInputChange}
                        required
                        className={formErrors.pickupTime ? 'error' : ''}
                      />
                      {formErrors.pickupTime && (
                        <span className="error-message">{formErrors.pickupTime}</span>
                      )}
                    </div>
                  </div>

                  {selectedService === 'daily' && (
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="returnDate">Return Date</label>
                        <input
                          type="date"
                          id="returnDate"
                          name="returnDate"
                          value={bookingData.returnDate}
                          onChange={handleInputChange}
                          min={bookingData.pickupDate || new Date().toISOString().split('T')[0]}
                          className={formErrors.returnDate ? 'error' : ''}
                        />
                        {formErrors.returnDate && (
                          <span className="error-message">{formErrors.returnDate}</span>
                        )}
                      </div>
                      <div className="form-group">
                        <label htmlFor="returnTime">Return Time</label>
                        <input
                          type="time"
                          id="returnTime"
                          name="returnTime"
                          value={bookingData.returnTime}
                          onChange={handleInputChange}
                          className={formErrors.returnTime ? 'error' : ''}
                        />
                        {formErrors.returnTime && (
                          <span className="error-message">{formErrors.returnTime}</span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="passengers">Number of Passengers</label>
                      <input
                        type="number"
                        id="passengers"
                        name="passengers"
                        value={bookingData.passengers}
                        onChange={handleInputChange}
                        min="1"
                        max="50"
                        required
                        className={formErrors.passengers ? 'error' : ''}
                      />
                      {formErrors.passengers && (
                        <span className="error-message">{formErrors.passengers}</span>
                      )}
                    </div>
                      <div className="form-group">
                        <label htmlFor="distance">Distance (km)</label>
                        <small className="distance-instruction">
                          <i className="fas fa-info-circle"></i> Please enter the approximate distance for your journey. Admin will verify and calculate the final price.
                        </small>
                        <input
                          type="number"
                          id="distance"
                          name="distance"
                          value={bookingData.distance}
                          onChange={(e) => {
                            const manualDistance = parseFloat(e.target.value) || 0;
                            setBookingData(prev => ({
                              ...prev,
                              distance: manualDistance
                            }));
                          }}
                          min="0"
                          step="0.1"
                          placeholder="Enter distance in km (e.g., 15.5)"
                          className="distance-input"
                        />
                        {bookingData.pickupLocation && bookingData.dropoffLocation && (
                          <div className="distance-estimate">
                            <small className="distance-help">
                              <i className="fas fa-route"></i>
                              <strong>Estimated distance:</strong> {estimateDistanceForUser(bookingData.pickupLocation, bookingData.dropoffLocation) || 'Unknown'} km
                              <br />
                              <em>This is an estimate for reference only. Admin will calculate the exact distance and price.</em>
                            </small>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="form-section">
                  <h3>Service Details</h3>
                  
                  {selectedService === 'wedding' && (
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="vehicleType">Vehicle Type</label>
                        <select
                          id="vehicleType"
                          value={bookingData.serviceDetails.vehicleType || ''}
                          onChange={(e) => handleServiceDetailChange('vehicleType', e.target.value)}
                          required
                        >
                          <option value="">Select Vehicle Type</option>
                          {vehicleTypes.wedding.map(type => (
                            <option key={type.value} value={type.value}>
                              {type.label} {type.price !== 0 && `(${type.price > 0 ? '+' : ''}LKR ${type.price.toLocaleString()})`}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label htmlFor="days">Number of Days</label>
                        <input
                          type="number"
                          id="days"
                          value={bookingData.serviceDetails.days || ''}
                          onChange={(e) => handleServiceDetailChange('days', parseInt(e.target.value))}
                          min="1"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {selectedService === 'airport' && (
                    <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="vehicleType">Vehicle Type</label>
                      <select
                        id="vehicleType"
                          value={bookingData.serviceDetails.vehicleType || ''}
                          onChange={(e) => handleServiceDetailChange('vehicleType', e.target.value)}
                        required
                      >
                        <option value="">Select Vehicle Type</option>
                        {vehicleTypes.airport.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label} {type.price > 0 && `(+LKR ${type.price.toLocaleString()})`}
                          </option>
                        ))}
                      </select>
                    </div>
                      <div className="form-group">
                        <label htmlFor="flightTime">Flight Time</label>
                        <input
                          type="time"
                          id="flightTime"
                          value={bookingData.serviceDetails.flightTime || ''}
                          onChange={(e) => handleServiceDetailChange('flightTime', e.target.value)}
                        />
                    </div>
                  </div>
                )}

                  {selectedService === 'cargo' && (
                    <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="vehicleType">Vehicle Type</label>
                      <select
                        id="vehicleType"
                          value={bookingData.serviceDetails.vehicleType || ''}
                          onChange={(e) => handleServiceDetailChange('vehicleType', e.target.value)}
                        required
                      >
                        <option value="">Select Vehicle Type</option>
                        {vehicleTypes.cargo.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label} {type.price > 0 && `(+LKR ${type.price.toLocaleString()})`}
                          </option>
                        ))}
                      </select>
                    </div>
                      <div className="form-group">
                        <label htmlFor="cargoWeight">Cargo Weight (kg)</label>
                        <input
                          type="number"
                          id="cargoWeight"
                          value={bookingData.serviceDetails.cargoWeight || ''}
                          onChange={(e) => handleServiceDetailChange('cargoWeight', parseInt(e.target.value))}
                          min="1"
                          required
                        />
                    </div>
                  </div>
                )}

                  {selectedService === 'daily' && (
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="vehicleType">Vehicle Type</label>
                        <select
                          id="vehicleType"
                          value={bookingData.serviceDetails.vehicleType || ''}
                          onChange={(e) => handleServiceDetailChange('vehicleType', e.target.value)}
                          required
                        >
                          <option value="">Select Vehicle Type</option>
                          {vehicleTypes.daily.map(type => (
                            <option key={type.value} value={type.value}>
                              {type.label} {type.price > 0 && `(+LKR ${type.price.toLocaleString()})`}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label htmlFor="hours">Number of Hours</label>
                        <input
                          type="number"
                          id="hours"
                          value={bookingData.serviceDetails.hours || ''}
                          onChange={(e) => handleServiceDetailChange('hours', parseInt(e.target.value))}
                          min="1"
                          required
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="form-section">
                  <h3>Additional Information</h3>
                  <div className="form-group">
                    <label htmlFor="additionalNotes">Additional Notes</label>
                    <textarea
                      id="additionalNotes"
                      name="additionalNotes"
                      value={bookingData.additionalNotes}
                      onChange={handleInputChange}
                      placeholder="Any special requirements or requests..."
                      rows="4"
                      className={formErrors.additionalNotes ? 'error' : ''}
                      maxLength="500"
                    />
                    {formErrors.additionalNotes && (
                      <span className="error-message">{formErrors.additionalNotes}</span>
                    )}
                    <div className="character-count">
                      {bookingData.additionalNotes.length}/500 characters
                    </div>
                  </div>
                </div>

                <div className="rate-information">
                  <h3>💰 Price Estimation</h3>
                  
                  {selectedService && (
                    <div className="price-estimation">
                      <div className="estimated-price-display">
                        <div className="price-breakdown">
                          {selectedService === 'wedding' ? (
                            <div className="rate-item">
                              <span>Wedding Service</span>
                              <span>Fixed Price: LKR {bookingData.totalPrice.toLocaleString()}</span>
                            </div>
                          ) : selectedService === 'airport' ? (
                            <div className="rate-item">
                              <span>Airport Transfer</span>
                              <span>Fixed Price: LKR {bookingData.totalPrice.toLocaleString()}</span>
                            </div>
                          ) : (
                            <div className="rate-item">
                              <span>
                                {selectedService === 'cargo' && 'Cargo Transport: 120 LKR/km'}
                                {selectedService === 'daily' && bookingData.serviceDetails.vehicleType === 'van' && 'Daily Rental (Van): 120 LKR/km'}
                                {selectedService === 'daily' && bookingData.serviceDetails.vehicleType === 'bike' && 'Daily Rental (Bike): 50 LKR/km'}
                                {selectedService === 'daily' && bookingData.serviceDetails.vehicleType === 'economy' && 'Daily Rental (Economy): 90 LKR/km'}
                                {selectedService === 'daily' && bookingData.serviceDetails.vehicleType === 'comfort' && 'Daily Rental (Comfort): 120 LKR/km'}
                                {selectedService === 'daily' && bookingData.serviceDetails.vehicleType === 'luxury' && 'Daily Rental (Luxury): 150 LKR/km'}
                              </span>
                              <span>
                                {bookingData.distance > 0 ? (
                                  <>
                                    {bookingData.distance} km × {selectedService === 'cargo' ? '120' : 
                                      selectedService === 'daily' && bookingData.serviceDetails.vehicleType === 'bike' ? '50' :
                                      selectedService === 'daily' && bookingData.serviceDetails.vehicleType === 'economy' ? '90' :
                                      selectedService === 'daily' && bookingData.serviceDetails.vehicleType === 'comfort' ? '120' :
                                      selectedService === 'daily' && bookingData.serviceDetails.vehicleType === 'luxury' ? '150' :
                                      selectedService === 'daily' && bookingData.serviceDetails.vehicleType === 'van' ? '120' : '90'} = LKR {bookingData.totalPrice.toLocaleString()}
                                  </>
                                ) : (
                                  'Enter distance to see price'
                                )}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {bookingData.totalPrice > 0 && (
                          <div className="total-price-highlight">
                            <div className="total-price">
                              <span className="total-label">Estimated Total:</span>
                              <span className="total-amount">LKR {bookingData.totalPrice.toLocaleString()}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="pricing-note">
                    <i className="fas fa-info-circle"></i>
                    <span>This is an estimated price based on your inputs. Admin will verify the distance and confirm the final price after booking submission.</span>
                  </div>
                </div>

                <div className="form-actions">
                  <button 
                    type="submit" 
                    className="btn btn-primary btn-large"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i>
                        Processing...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-paper-plane"></i>
                        Submit Booking Request
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Booking;

