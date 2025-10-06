import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  // Removed inline auth modals; using dedicated pages now
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

  // All auth handled in /login and /signup now

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
            <button className="btn btn-ghost" onClick={() => navigate('/login')}>
              <i className="fas fa-sign-in-alt"></i>
              Login
            </button>
            <button className="btn btn-primary" onClick={() => navigate('/signup')}>
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
              <button className="btn btn-primary btn-large" onClick={() => navigate('/signup')}>
                <i className="fas fa-rocket"></i>
                <span>Get Started Free</span>
                <div className="btn-shine"></div>
              </button>
              <button className="btn btn-outline btn-large" onClick={() => navigate('/login')}>
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

      {/* Standalone auth pages are used; modals removed */}
    </div>
  );
};

export default LandingPage;







