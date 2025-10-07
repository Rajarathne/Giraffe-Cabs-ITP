import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './VehicleList.css';

const VehicleList = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [notifications, setNotifications] = useState({ unreadCount: 0, items: [] });
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  
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

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          navigate('/');
          return;
        }

        const response = await axios.get('/api/vehicles', {
          headers: { Authorization: `Bearer ${token}` }
        });

        setVehicles(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching vehicles:', err);
        setError('Failed to load vehicles');
        setLoading(false);
      }
    };

    fetchVehicles();
  }, [navigate]);

  // Notifications: load on mount and poll to match Home experience
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    const load = async () => {
      try {
        const res = await axios.get('/api/notifications', { headers: { Authorization: `Bearer ${token}` } });
        setNotifications(res.data);
      } catch (e) {
        // silent
      }
    };
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, []);

  const toggleProfileDropdown = () => {
    setShowProfileDropdown(!showProfileDropdown);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    navigate('/');
  };

  // Helper functions
  const getVehicleIcon = (vehicleType) => {
    const iconMap = {
      'car': 'car',
      'van': 'shuttle-van',
      'bus': 'bus',
      'bike': 'motorcycle',
      'lorry': 'truck'
    };
    return iconMap[vehicleType?.toLowerCase()] || 'car';
  };

  const getVehicleImage = (vehicle) => {
    // First try to get primary photo from photos array
    if (vehicle.photos && vehicle.photos.length > 0) {
      const primaryPhoto = vehicle.photos.find(photo => photo.isPrimary);
      if (primaryPhoto && primaryPhoto.url) {
        return primaryPhoto.url;
      }
      // If no primary photo, use first photo
      if (vehicle.photos[0] && vehicle.photos[0].url) {
        return vehicle.photos[0].url;
      }
    }
    
    // Fallback to legacy images array
    if (vehicle.images && vehicle.images.length > 0) {
      return vehicle.images[0];
    }
    
    // If no images available, use placeholder based on vehicle type
    const placeholderMap = {
      'car': `https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400&h=250&fit=crop&crop=center`,
      'van': `https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=250&fit=crop&crop=center`,
      'bus': `https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&h=250&fit=crop&crop=center`,
      'bike': `https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=250&fit=crop&crop=center`,
      'lorry': `https://images.unsplash.com/photo-1561624427-4b9b7b0b8b8b?w=400&h=250&fit=crop&crop=center`,
      'wedding_car': `https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400&h=250&fit=crop&crop=center`,
      'goods_vehicle': `https://images.unsplash.com/photo-1561624427-4b9b7b0b8b8b?w=400&h=250&fit=crop&crop=center`
    };
    return placeholderMap[vehicle.vehicleType?.toLowerCase()] || placeholderMap['car'];
  };

  const getVehicleStatus = (vehicle) => {
    // Determine status based on vehicle availability and active state
    if (!vehicle.isActive) {
      return 'unavailable';
    }
    if (!vehicle.isAvailable) {
      return 'booked';
    }
    // Check if vehicle is currently rented
    if (vehicle.currentRentalId) {
      return 'booked';
    }
    return 'available';
  };

  const getStatusClass = (status) => {
    const statusMap = {
      'available': 'available',
      'booked': 'booked',
      'maintenance': 'maintenance',
      'unavailable': 'unavailable'
    };
    return statusMap[status?.toLowerCase()] || 'unavailable';
  };

  const getStatusIcon = (status) => {
    const iconMap = {
      'available': 'check-circle',
      'booked': 'calendar-check',
      'maintenance': 'wrench',
      'unavailable': 'times-circle'
    };
    return iconMap[status?.toLowerCase()] || 'times-circle';
  };

  // Filter vehicles based on search term and filters
  const filteredVehicles = vehicles.filter(vehicle => {
    const searchLower = searchTerm.toLowerCase();
    
    // Apply search filter
    const matchesSearch = !searchTerm || (
      vehicle.brand?.toLowerCase().includes(searchLower) ||
      vehicle.model?.toLowerCase().includes(searchLower) ||
      vehicle.vehicleNumber?.toLowerCase().includes(searchLower) ||
      vehicle.vehicleType?.toLowerCase().includes(searchLower) ||
      vehicle.color?.toLowerCase().includes(searchLower) ||
      vehicle.description?.toLowerCase().includes(searchLower) ||
      vehicle.dailyRate?.toString().includes(searchTerm) ||
      vehicle.capacity?.toString().includes(searchTerm) ||
      vehicle.year?.toString().includes(searchTerm)
    );

    // Apply vehicle type filter
    const matchesVehicleType = vehicleTypeFilter === 'all' || vehicle.vehicleType === vehicleTypeFilter;

    // Apply status filter
    const matchesStatus = statusFilter === 'all' || getVehicleStatus(vehicle) === statusFilter;

    // Apply price filter
    let matchesPrice = true;
    if (priceFilter !== 'all' && vehicle.dailyRate) {
      switch (priceFilter) {
        case 'low':
          matchesPrice = vehicle.dailyRate < 5000;
          break;
        case 'medium':
          matchesPrice = vehicle.dailyRate >= 5000 && vehicle.dailyRate < 15000;
          break;
        case 'high':
          matchesPrice = vehicle.dailyRate >= 15000;
          break;
        default:
          break;
      }
    }

    return matchesSearch && matchesVehicleType && matchesStatus && matchesPrice;
  });

  if (loading) {
    return (
      <div className="vehicle-list-page">
        <nav className="navbar">
          <div className="nav-container">
            <div className="nav-logo" onClick={() => navigate('/home')}>
              <i className="fas fa-car"></i>
              <span>Giraffe Cabs</span>
            </div>
            <div className="nav-actions">
              <div className="profile-dropdown">
                <button className="profile-btn" onClick={toggleProfileDropdown}>
                  <i className="fas fa-user"></i>
                  <span>{user?.firstName || 'User'}</span>
                  <i className="fas fa-chevron-down"></i>
                </button>
                {showProfileDropdown && (
                  <div className="dropdown-menu">
                    <a href="/profile" className="dropdown-item">
                      <i className="fas fa-user"></i> Profile
                    </a>
                    <a href="/booking" className="dropdown-item">
                      <i className="fas fa-calendar-plus"></i> Book Service
                    </a>
                    <a href="/tour-packages" className="dropdown-item">
                      <i className="fas fa-map-marked-alt"></i> Tour Packages
                    </a>
                    <button onClick={handleLogout} className="dropdown-item logout">
                      <i className="fas fa-sign-out-alt"></i> Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </nav>
        <div className="loading">Loading vehicles...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="vehicle-list-page">
        <nav className="navbar">
          <div className="nav-container">
            <div className="nav-logo" onClick={() => navigate('/home')}>
              <i className="fas fa-car"></i>
              <span>Giraffe Cabs</span>
            </div>
            <div className="nav-actions">
              <div className="profile-dropdown">
                <button className="profile-btn" onClick={toggleProfileDropdown}>
                  <i className="fas fa-user"></i>
                  <span>{user?.firstName || 'User'}</span>
                  <i className="fas fa-chevron-down"></i>
                </button>
                {showProfileDropdown && (
                  <div className="dropdown-menu">
                    <a href="/profile" className="dropdown-item">
                      <i className="fas fa-user"></i> Profile
                    </a>
                    <a href="/booking" className="dropdown-item">
                      <i className="fas fa-calendar-plus"></i> Book Service
                    </a>
                    <a href="/tour-packages" className="dropdown-item">
                      <i className="fas fa-map-marked-alt"></i> Tour Packages
                    </a>
                    <button onClick={handleLogout} className="dropdown-item logout">
                      <i className="fas fa-sign-out-alt"></i> Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </nav>
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="vehicle-list-page">
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-logo" onClick={() => navigate('/home')}>
            <i className="fas fa-car"></i>
            <span>Giraffe Cabs</span>
          </div>
          <div className="nav-actions">
            <div className="profile-dropdown">
              <button className="profile-btn" onClick={toggleProfileDropdown}>
                <i className="fas fa-user"></i>
                <span>{user?.firstName || 'User'}</span>
                <i className="fas fa-chevron-down"></i>
              </button>
              {showProfileDropdown && (
                <div className="dropdown-menu">
                  <button className="dropdown-item" onClick={() => { setShowNotifications(prev => !prev); if (!showNotifications) { (async()=>{ try { const token = localStorage.getItem('authToken'); const res = await axios.get('/api/notifications', { headers: { Authorization: `Bearer ${token}` } }); setNotifications(res.data);} catch(e){} })(); } }}>
                    <i className="fas fa-bell"></i> Notifications {notifications.unreadCount > 0 && (<span className="notif-inline">{notifications.unreadCount}</span>)}
                  </button>
                  <a href="/profile" className="dropdown-item">
                    <i className="fas fa-user"></i> Profile
                  </a>
                  <a href="/booking" className="dropdown-item">
                    <i className="fas fa-calendar-plus"></i> Book Service
                  </a>
                  <a href="/tour-packages" className="dropdown-item">
                    <i className="fas fa-map-marked-alt"></i> Tour Packages
                  </a>
                  <button onClick={handleLogout} className="dropdown-item logout">
                    <i className="fas fa-sign-out-alt"></i> Logout
                  </button>
                </div>
              )}
              {showNotifications && (
                <div className="notif-dropdown" style={{ right: 0 }}>
                  <div className="notif-header">
                    <span>Notifications</span>
                    <button className="mark-read" onClick={async ()=>{ try { const token = localStorage.getItem('authToken'); await axios.put('/api/notifications/read-all',{}, { headers: { Authorization: `Bearer ${token}` } }); const res = await axios.get('/api/notifications', { headers: { Authorization: `Bearer ${token}` } }); setNotifications(res.data);} catch(e){} }}>
                      Mark all read
                    </button>
                  </div>
                  <div className="notif-list">
                    {(notifications.items && notifications.items.length) === 0 ? (
                      <div className="notif-empty">No notifications</div>
                    ) : (
                      (notifications.items || []).map(n => (
                        <div key={n._id} className={`notif-item ${n.isRead ? '' : 'unread'}`} onClick={async ()=>{ try { const token = localStorage.getItem('authToken'); await axios.put(`/api/notifications/${n._id}/read`,{}, { headers: { Authorization: `Bearer ${token}` } }); const res = await axios.get('/api/notifications', { headers: { Authorization: `Bearer ${token}` } }); setNotifications(res.data);} catch(e){} }}>
                          <div className="notif-title">{n.title}</div>
                          <div className="notif-message">{n.message}</div>
                          <div className="notif-time">{new Date(n.createdAt).toLocaleString()}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="vehicle-list-container">
        <div className="page-header">
          <h1>Available Vehicles</h1>
          <p>Choose from our fleet of professional vehicles</p>
        </div>

        {/* Search and Filter Bar */}
        <div className="search-filter-bar">
          <div className="search-section">
            <div className="search-input-group">
              <i className="fas fa-search search-icon"></i>
              <input
                type="text"
                placeholder="Search vehicles by brand, model, number, type, color, or price..."
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
          
          <div className="filter-section">
            <div className="filter-group">
              <label htmlFor="vehicle-type-filter">Type:</label>
              <select
                id="vehicle-type-filter"
                value={vehicleTypeFilter}
                onChange={(e) => setVehicleTypeFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Types</option>
                <option value="car">Car</option>
                <option value="van">Van</option>
                <option value="bus">Bus</option>
                <option value="bike">Bike</option>
                <option value="lorry">Lorry</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label htmlFor="status-filter">Status:</label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Status</option>
                <option value="available">Available</option>
                <option value="booked">Booked</option>
                <option value="maintenance">Maintenance</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label htmlFor="price-filter">Price Range:</label>
              <select
                id="price-filter"
                value={priceFilter}
                onChange={(e) => setPriceFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Prices</option>
                <option value="low">Under LKR 5,000</option>
                <option value="medium">LKR 5,000 - 15,000</option>
                <option value="high">Over LKR 15,000</option>
              </select>
            </div>
            
            <div className="filter-results">
              <span className="results-count">
                {filteredVehicles.length} vehicle{filteredVehicles.length !== 1 ? 's' : ''} found
              </span>
            </div>
          </div>
        </div>
        
        {filteredVehicles.length === 0 ? (
          <div className="no-vehicles">
            <div className="no-vehicles-icon">
              <i className="fas fa-car"></i>
            </div>
            <h3>No vehicles available</h3>
            <p>We're currently updating our fleet. Please check back later.</p>
            <button className="btn btn-primary" onClick={() => navigate('/home')}>
              <i className="fas fa-home"></i> Back to Home
            </button>
          </div>
        ) : (
          <div className="vehicles-grid">
            {filteredVehicles.map(vehicle => {
              const vehicleStatus = getVehicleStatus(vehicle);
              return (
              <div key={vehicle._id} className={`vehicle-card ${vehicleStatus === 'booked' ? 'booked' : ''}`}>
                <div className="vehicle-image">
                  <img 
                    src={getVehicleImage(vehicle)} 
                    alt={`${vehicle.brand} ${vehicle.model}`}
                    className="vehicle-photo"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  />
                  <i className={`fas fa-${getVehicleIcon(vehicle.vehicleType)} vehicle-fallback-icon`} style={{display: 'none'}}></i>
                  {vehicleStatus === 'booked' && (
                    <div className="booked-overlay">
                      <i className="fas fa-calendar-check"></i>
                      <span>Booked</span>
                    </div>
                  )}
                </div>
                <div className="vehicle-info">
                  <h3>{vehicle.brand} {vehicle.model}</h3>
                  <p className="vehicle-number">{vehicle.vehicleNumber}</p>
                  <div className="vehicle-details">
                    <div className="detail-item">
                      <i className="fas fa-tag"></i>
                      <span>{vehicle.vehicleType}</span>
                    </div>
                    <div className="detail-item">
                      <i className="fas fa-users"></i>
                      <span>{vehicle.capacity} passengers</span>
                    </div>
                    <div className="detail-item">
                      <i className="fas fa-gas-pump"></i>
                      <span>{vehicle.fuelType}</span>
                    </div>
                    <div className="detail-item">
                      <i className="fas fa-cog"></i>
                      <span>{vehicle.transmission}</span>
                    </div>
                    {vehicle.year && (
                      <div className="detail-item">
                        <i className="fas fa-calendar"></i>
                        <span>{vehicle.year}</span>
                      </div>
                    )}
                  </div>
                  <div className="vehicle-rate">
                    <span className="rate-label">Daily Rate</span>
                    <span className="rate-amount">LKR {vehicle.dailyRate?.toLocaleString()}</span>
                  </div>
                <div className="vehicle-status">
                  <span className={`status-badge ${getStatusClass(vehicleStatus)}`}>
                    <i className={`fas fa-${getStatusIcon(vehicleStatus)}`}></i>
                    {vehicleStatus}
                  </span>
                </div>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};


export default VehicleList;
