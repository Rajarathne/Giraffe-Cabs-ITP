import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './LandingPage.css';

const LandingPage = () => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '', role: 'customer' });
  const [signupData, setSignupData] = useState({
    firstName: '', lastName: '', email: '', phone: '', address: '', password: '', role: 'customer',
    businessName: '', businessRegistrationNumber: '', businessType: 'Individual', bankName: '', accountNumber: ''
  });
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [generatedOTP, setGeneratedOTP] = useState('');
  const [loading, setLoading] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const navigate = useNavigate();

  // Handle scroll effects
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
      
      // Update active section based on scroll position
      const sections = ['home', 'services', 'about', 'fleet', 'contact'];
      const scrollPosition = window.scrollY + 100;
      
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let response;
      
      if (loginData.role === 'vehicle_provider') {
        // Login to vehicle provider system
        response = await axios.post('/api/vehicle-provider/auth/login', {
          email: loginData.email,
          password: loginData.password
        });
        localStorage.setItem('vehicleProviderToken', response.data.token);
        localStorage.setItem('currentVehicleProvider', JSON.stringify(response.data.vehicleProvider));
        navigate('/vehicle-provider-dashboard');
      } else {
        // Login to customer system
        response = await axios.post('/api/auth/login', {
          email: loginData.email,
          password: loginData.password
        });
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('currentUser', JSON.stringify(response.data));
        
        if (response.data.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/home');
        }
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let response;
      
      if (signupData.role === 'vehicle_provider') {
        // Register as vehicle provider
        const vehicleProviderData = {
          firstName: signupData.firstName,
          lastName: signupData.lastName,
          email: signupData.email,
          phone: signupData.phone,
          password: signupData.password,
          address: {
            street: signupData.address,
            city: 'Colombo', // Default values - can be enhanced later
            district: 'Colombo',
            postalCode: '10000'
          },
          businessName: signupData.businessName,
          businessRegistrationNumber: signupData.businessRegistrationNumber,
          businessType: signupData.businessType,
          bankDetails: {
            bankName: signupData.bankName,
            accountNumber: signupData.accountNumber,
            accountHolderName: `${signupData.firstName} ${signupData.lastName}`,
            branch: 'Main Branch' // Default value
          }
        };
        response = await axios.post('/api/vehicle-provider/auth/register', vehicleProviderData);
        localStorage.setItem('vehicleProviderToken', response.data.token);
        localStorage.setItem('currentVehicleProvider', JSON.stringify(response.data.vehicleProvider));
        navigate('/vehicle-provider-dashboard');
      } else {
        // Register as customer
        response = await axios.post('/api/auth/register', {
          ...signupData,
          role: 'customer'
        });
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('currentUser', JSON.stringify(response.data));
        navigate('/home');
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Call backend API to send OTP
      const response = await axios.post('/api/auth/forgot-password', {
        email: forgotPasswordEmail
      });
      
      // Show success
      setOtpSent(true);
      
      // If development mode, show OTP in alert
      if (response.data.devOTP) {
        console.log('==================================');
        console.log('📧 PASSWORD RESET OTP');
        console.log('==================================');
        console.log(`Email: ${forgotPasswordEmail}`);
        console.log(`OTP Code: ${response.data.devOTP}`);
        console.log(`Generated at: ${new Date().toLocaleString()}`);
        console.log('==================================');
        
        alert(`OTP sent to your email!\n\nFor testing, OTP: ${response.data.devOTP}\n\nCheck your email: ${forgotPasswordEmail}`);
      } else {
        alert(`OTP sent successfully to ${forgotPasswordEmail}!\n\nPlease check your email inbox.`);
      }
      
    } catch (error) {
      console.error('Error sending OTP:', error);
      alert(error.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">
          <div className="nav-logo">
            <div className="logo-icon">
              <i className="fas fa-taxi"></i>
            </div>
            <span className="logo-text">Giraffe Cabs</span>
          </div>
          <div className="nav-menu">
            <a href="#home" className={`nav-link ${activeSection === 'home' ? 'active' : ''}`}>
              <i className="fas fa-home"></i>
              <span>Home</span>
            </a>
            <a href="#services" className={`nav-link ${activeSection === 'services' ? 'active' : ''}`}>
              <i className="fas fa-concierge-bell"></i>
              <span>Services</span>
            </a>
            <a href="#about" className={`nav-link ${activeSection === 'about' ? 'active' : ''}`}>
              <i className="fas fa-info-circle"></i>
              <span>About</span>
            </a>
            <a href="#fleet" className={`nav-link ${activeSection === 'fleet' ? 'active' : ''}`}>
              <i className="fas fa-car"></i>
              <span>Fleet</span>
            </a>
            <a href="#contact" className={`nav-link ${activeSection === 'contact' ? 'active' : ''}`}>
              <i className="fas fa-phone"></i>
              <span>Contact</span>
            </a>
          </div>
          <div className="nav-buttons">
            <button className="btn btn-ghost" onClick={() => setShowLoginModal(true)}>
              <i className="fas fa-sign-in-alt"></i>
              Login
            </button>
            <button className="btn btn-primary" onClick={() => setShowSignupModal(true)}>
              <i className="fas fa-rocket"></i>
              Get Started
            </button>
          </div>
          <div className="mobile-menu-toggle">
            <i className="fas fa-bars"></i>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="hero">
        <div className="hero-background">
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
              <span className="title-line">Drive Smarter</span>
              <span className="title-line">Book Faster</span>
              <span className="title-line highlight">Travel Safer</span>
            </h1>
            <p className="hero-subtitle">with Giraffe Cabs</p>
            <p className="hero-description">
              Experience premium transportation across Sri Lanka with our modern fleet, 
              professional drivers, and 24/7 customer support. Your journey, our priority.
            </p>
            <div className="hero-stats">
              <div className="stat">
                <div className="stat-number">10K+</div>
                <div className="stat-label">Happy Customers</div>
              </div>
              <div className="stat">
                <div className="stat-number">500+</div>
                <div className="stat-label">Vehicles</div>
              </div>
              <div className="stat">
                <div className="stat-number">25</div>
                <div className="stat-label">Cities</div>
              </div>
            </div>
            <div className="hero-buttons">
              <button className="btn btn-primary btn-large" onClick={() => setShowSignupModal(true)}>
                <i className="fas fa-rocket"></i>
                <span>Get Started Free</span>
                <div className="btn-shine"></div>
              </button>
              <button className="btn btn-outline btn-large" onClick={() => setShowLoginModal(true)}>
                <i className="fas fa-sign-in-alt"></i>
                <span>Login</span>
              </button>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-phone">
              <div className="phone-screen">
                <div className="app-interface">
                  <div className="app-header">
                    <div className="app-logo">
                      <i className="fas fa-taxi"></i>
                    </div>
                    <span>Giraffe Cabs</span>
                  </div>
                  <div className="app-content">
                    <div className="booking-card">
                      <h4>Book Your Ride</h4>
                      <div className="location-input">
                        <i className="fas fa-map-marker-alt"></i>
                        <span>Pickup Location</span>
                      </div>
                      <div className="location-input">
                        <i className="fas fa-flag"></i>
                        <span>Destination</span>
                      </div>
                      <button className="book-btn">Book Now</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="floating-elements">
              <div className="floating-car">
                <i className="fas fa-car"></i>
              </div>
              <div className="floating-star">
                <i className="fas fa-star"></i>
              </div>
              <div className="floating-heart">
                <i className="fas fa-heart"></i>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="services">
        <div className="container">
          <div className="section-header">
            <div className="section-badge">
              <i className="fas fa-concierge-bell"></i>
              <span>Our Services</span>
            </div>
            <h2 className="section-title">Premium Transportation Solutions</h2>
            <p className="section-description">
              From luxury weddings to daily commutes, we provide comprehensive transportation services across Sri Lanka
            </p>
          </div>
          <div className="services-grid">
            <div className="service-card">
              <div className="service-icon">
                <i className="fas fa-heart"></i>
              </div>
              <div className="service-content">
                <h3>Wedding Hires</h3>
                <p>Luxury cars with full decoration and professional chauffeur service for your special day</p>
                <div className="service-features">
                  <span className="feature-tag">Luxury Cars</span>
                  <span className="feature-tag">Full Decoration</span>
                  <span className="feature-tag">Professional Driver</span>
                </div>
              </div>
              <div className="service-overlay">
                <button className="btn btn-outline">Learn More</button>
              </div>
            </div>
            <div className="service-card">
              <div className="service-icon">
                <i className="fas fa-plane"></i>
              </div>
              <div className="service-content">
                <h3>Airport Transfers</h3>
                <p>Timely airport pickups and drop-offs with real-time flight tracking and coordination</p>
                <div className="service-features">
                  <span className="feature-tag">Flight Tracking</span>
                  <span className="feature-tag">24/7 Service</span>
                  <span className="feature-tag">Meet & Greet</span>
                </div>
              </div>
              <div className="service-overlay">
                <button className="btn btn-outline">Learn More</button>
              </div>
            </div>
            <div className="service-card">
              <div className="service-icon">
                <i className="fas fa-box"></i>
              </div>
              <div className="service-content">
                <h3>Cargo Transport</h3>
                <p>Secure transport of goods island-wide with specialized vehicles and tracking</p>
                <div className="service-features">
                  <span className="feature-tag">Secure Transport</span>
                  <span className="feature-tag">Island-wide</span>
                  <span className="feature-tag">Tracking</span>
                </div>
              </div>
              <div className="service-overlay">
                <button className="btn btn-outline">Learn More</button>
              </div>
            </div>
            <div className="service-card">
              <div className="service-icon">
                <i className="fas fa-map-marked-alt"></i>
              </div>
              <div className="service-content">
                <h3>Holiday Packages</h3>
                <p>Custom tour packages with vehicle, driver, and complete itinerary planning</p>
                <div className="service-features">
                  <span className="feature-tag">Custom Tours</span>
                  <span className="feature-tag">Itinerary Planning</span>
                  <span className="feature-tag">Guide Service</span>
                </div>
              </div>
              <div className="service-overlay">
                <button className="btn btn-outline">Learn More</button>
              </div>
            </div>
            <div className="service-card">
              <div className="service-icon">
                <i className="fas fa-calendar-day"></i>
              </div>
              <div className="service-content">
                <h3>Daily Hires</h3>
                <p>Flexible daily vehicle rentals for all your short-term transportation needs</p>
                <div className="service-features">
                  <span className="feature-tag">Flexible</span>
                  <span className="feature-tag">Daily Rates</span>
                  <span className="feature-tag">All Vehicles</span>
                </div>
              </div>
              <div className="service-overlay">
                <button className="btn btn-outline">Learn More</button>
              </div>
            </div>
            <div className="service-card">
              <div className="service-icon">
                <i className="fas fa-handshake"></i>
              </div>
              <div className="service-content">
                <h3>Vehicle Rental</h3>
                <p>Earn monthly income by renting your vehicle through our platform</p>
                <div className="service-features">
                  <span className="feature-tag">Monthly Income</span>
                  <span className="feature-tag">Easy Process</span>
                  <span className="feature-tag">Secure</span>
                </div>
              </div>
              <div className="service-overlay">
                <button className="btn btn-outline">Learn More</button>
              </div>
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
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Fleet Section */}
      <section id="fleet" className="fleet">
        <div className="container">
          <h2>Our Vehicle Fleet</h2>
          <div className="fleet-grid">
            <div className="fleet-category">
              <h3>🚐 Vans</h3>
              <p>KDH, Dolphin, Caravan, Buddy Vans</p>
            </div>
            <div className="fleet-category">
              <h3>🚌 Buses</h3>
              <p>Semi-Luxury, Luxury, Super Luxury (24–59 seats)</p>
            </div>
            <div className="fleet-category">
              <h3>💍 Wedding Cars</h3>
              <p>Audi, BMW, Benz, Premio, Allion (fully decorated)</p>
            </div>
            <div className="fleet-category">
              <h3>🚗 Cars</h3>
              <p>Wagon R, Prius, Axio, Alto, Nano</p>
            </div>
            <div className="fleet-category">
              <h3>🚚 Goods Vehicles</h3>
              <p>Lorries, drum trucks, full-body trucks</p>
            </div>
            <div className="fleet-category">
              <h3>🏍️ Bikes</h3>
              <p>Scooters and motorbikes for fast travel</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="contact">
        <div className="container">
          <h2>Contact Us</h2>
          <div className="contact-content">
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
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p>&copy; 2024 Giraffe Cabs. All rights reserved.</p>
        </div>
      </footer>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="modal-overlay" onClick={() => setShowLoginModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowLoginModal(false)}>&times;</button>
            <h2>Welcome Back</h2>
            <p className="login-subtitle">Sign in to continue your journey</p>
            
            {/* Role Selection */}
            <div className="role-selection">
              <h3>I am a:</h3>
              <div className="role-buttons">
                <button
                  type="button"
                  className={`role-btn ${loginData.role === 'customer' ? 'active' : ''}`}
                  onClick={() => setLoginData({...loginData, role: 'customer'})}
                >
                  <i className="fas fa-user"></i>
                  <span>Customer</span>
                </button>
                <button
                  type="button"
                  className={`role-btn ${loginData.role === 'vehicle_provider' ? 'active' : ''}`}
                  onClick={() => setLoginData({...loginData, role: 'vehicle_provider'})}
                >
                  <i className="fas fa-handshake"></i>
                  <span>Provider</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label htmlFor="loginEmail">
                  <i className="fas fa-envelope"></i> Email Address
                </label>
                <input
                  type="email"
                  id="loginEmail"
                  value={loginData.email}
                  onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                  placeholder="your@email.com"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="loginPassword">
                  <i className="fas fa-lock"></i> Password
                </label>
                <input
                  type="password"
                  id="loginPassword"
                  value={loginData.password}
                  onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                  placeholder="••••••••"
                  required
                />
              </div>
              <div className="form-extras">
                <button 
                  type="button" 
                  className="forgot-password-btn"
                  onClick={() => {
                    setShowLoginModal(false);
                    setShowForgotPasswordModal(true);
                  }}
                >
                  Forgot Password?
                </button>
              </div>

              <button type="submit" className="btn btn-primary btn-full btn-large" disabled={loading}>
                {loading ? (
                  <><i className="fas fa-spinner fa-spin"></i> Logging in...</>
                ) : (
                  <><i className="fas fa-sign-in-alt"></i> Login</>
                )}
              </button>
              
              <p className="form-footer">
                Don't have an account? 
                <button 
                  type="button" 
                  className="link-btn"
                  onClick={() => {
                    setShowLoginModal(false);
                    setShowSignupModal(true);
                  }}
                >
                  Sign up here
                </button>
              </p>
            </form>
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {showForgotPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowForgotPasswordModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowForgotPasswordModal(false)}>&times;</button>
            <h2>Reset Password</h2>
            <p className="login-subtitle">
              {otpSent ? 'OTP sent to your email!' : 'Enter your email to receive OTP'}
            </p>
            
            {!otpSent ? (
              <form onSubmit={handleForgotPassword}>
                <div className="form-group">
                  <label htmlFor="forgotEmail">
                    <i className="fas fa-envelope"></i> Email Address
                  </label>
                  <input
                    type="email"
                    id="forgotEmail"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                  />
                </div>
                
                <button type="submit" className="btn btn-primary btn-full btn-large" disabled={loading}>
                  {loading ? (
                    <><i className="fas fa-spinner fa-spin"></i> Sending...</>
                  ) : (
                    <><i className="fas fa-paper-plane"></i> Send OTP</>
                  )}
                </button>
                
                <p className="form-footer">
                  Remember your password? 
                  <button 
                    type="button" 
                    className="link-btn"
                    onClick={() => {
                      setShowForgotPasswordModal(false);
                      setShowLoginModal(true);
                    }}
                  >
                    Login here
                  </button>
                </p>
              </form>
            ) : (
              <div className="otp-success">
                <div className="success-icon">
                  <i className="fas fa-check-circle"></i>
                </div>
                <p className="success-message">
                  OTP has been sent to:<br />
                  <strong>{forgotPasswordEmail}</strong>
                </p>
                <div className="otp-info">
                  <i className="fas fa-envelope"></i>
                  <p>Please check your email inbox for the OTP code. Also check spam folder if you don't see it.</p>
                </div>
                <div className="otp-info" style={{ background: '#fef3c7', borderColor: '#fbbf24' }}>
                  <i className="fas fa-info-circle" style={{ color: '#f59e0b' }}></i>
                  <p style={{ color: '#92400e' }}>For testing: OTP is also shown in the server console and browser alert</p>
                </div>
                <button 
                  className="btn btn-primary btn-full btn-large"
                  onClick={() => {
                    setShowForgotPasswordModal(false);
                    setShowLoginModal(true);
                    setOtpSent(false);
                  }}
                >
                  <i className="fas fa-arrow-left"></i> Back to Login
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Signup Modal */}
      {showSignupModal && (
        <div className="modal-overlay" onClick={() => setShowSignupModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowSignupModal(false)}>&times;</button>
            <h2>Create Account</h2>
            <p className="login-subtitle">Join OUR Vehicle System today</p>
            
            {/* Role Selection */}
            <div className="role-selection">
              <h3>I want to sign up as:</h3>
              <div className="role-buttons">
                <button
                  type="button"
                  className={`role-btn ${signupData.role === 'customer' ? 'active' : ''}`}
                  onClick={() => setSignupData({...signupData, role: 'customer'})}
                >
                  <i className="fas fa-user"></i>
                  <span>Customer</span>
                </button>
                <button
                  type="button"
                  className={`role-btn ${signupData.role === 'vehicle_provider' ? 'active' : ''}`}
                  onClick={() => setSignupData({...signupData, role: 'vehicle_provider'})}
                >
                  <i className="fas fa-handshake"></i>
                  <span>Provider</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleSignup}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="signupFirstName"><i className="fas fa-user"></i> First Name</label>
                  <input
                    type="text"
                    id="signupFirstName"
                    value={signupData.firstName}
                    onChange={(e) => setSignupData({...signupData, firstName: e.target.value})}
                    placeholder="John"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="signupLastName"><i className="fas fa-user"></i> Last Name</label>
                  <input
                    type="text"
                    id="signupLastName"
                    value={signupData.lastName}
                    onChange={(e) => setSignupData({...signupData, lastName: e.target.value})}
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="signupEmail"><i className="fas fa-envelope"></i> Email Address</label>
                <input
                  type="email"
                  id="signupEmail"
                  value={signupData.email}
                  onChange={(e) => setSignupData({...signupData, email: e.target.value})}
                  placeholder="john@example.com"
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="signupPhone"><i className="fas fa-phone"></i> Phone</label>
                  <input
                    type="tel"
                    id="signupPhone"
                    value={signupData.phone}
                    onChange={(e) => setSignupData({...signupData, phone: e.target.value})}
                    placeholder="+94 77 123 4567"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="signupPassword"><i className="fas fa-lock"></i> Password</label>
                  <input
                    type="password"
                    id="signupPassword"
                    value={signupData.password}
                    onChange={(e) => setSignupData({...signupData, password: e.target.value})}
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="signupAddress"><i className="fas fa-map-marker-alt"></i> Address</label>
                <input
                  type="text"
                  id="signupAddress"
                  value={signupData.address}
                  onChange={(e) => setSignupData({...signupData, address: e.target.value})}
                  placeholder="Your address"
                  required
                />
              </div>
              
              {/* Vehicle Provider Fields - Collapsible */}
              {signupData.role === 'vehicle_provider' && (
                <div className="provider-fields">
                  <div className="form-group">
                    <label htmlFor="businessName"><i className="fas fa-building"></i> Business Name</label>
                    <input
                      type="text"
                      id="businessName"
                      value={signupData.businessName || ''}
                      onChange={(e) => setSignupData({...signupData, businessName: e.target.value})}
                      placeholder="Your business name"
                      required
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="businessRegistrationNumber"><i className="fas fa-id-card"></i> Reg. Number</label>
                      <input
                        type="text"
                        id="businessRegistrationNumber"
                        value={signupData.businessRegistrationNumber || ''}
                        onChange={(e) => setSignupData({...signupData, businessRegistrationNumber: e.target.value})}
                        placeholder="BR123456"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="businessType"><i className="fas fa-briefcase"></i> Type</label>
                      <select
                        id="businessType"
                        value={signupData.businessType || 'Individual'}
                        onChange={(e) => setSignupData({...signupData, businessType: e.target.value})}
                      >
                        <option value="Individual">Individual</option>
                        <option value="Company">Company</option>
                        <option value="Partnership">Partnership</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="bankName"><i className="fas fa-university"></i> Bank</label>
                      <input
                        type="text"
                        id="bankName"
                        value={signupData.bankName || ''}
                        onChange={(e) => setSignupData({...signupData, bankName: e.target.value})}
                        placeholder="Bank of Ceylon"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="accountNumber"><i className="fas fa-credit-card"></i> Account</label>
                      <input
                        type="text"
                        id="accountNumber"
                        value={signupData.accountNumber || ''}
                        onChange={(e) => setSignupData({...signupData, accountNumber: e.target.value})}
                        placeholder="1234567890"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}
              
              <button type="submit" className="btn btn-primary btn-full btn-large" disabled={loading}>
                {loading ? (
                  <><i className="fas fa-spinner fa-spin"></i> Creating Account...</>
                ) : (
                  <><i className="fas fa-user-plus"></i> Create Account</>
                )}
              </button>
              
              <p className="form-footer">
                Already have an account? 
                <button 
                  type="button" 
                  className="link-btn"
                  onClick={() => {
                    setShowSignupModal(false);
                    setShowLoginModal(true);
                  }}
                >
                  Login here
                </button>
              </p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;







