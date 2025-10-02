import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './VehicleProviderAuth.css';

const VehicleProviderAuth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  const [signupData, setSignupData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    address: '',
    businessName: '',
    businessRegistrationNumber: '',
    bankName: '',
    accountNumber: ''
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/vehicle-provider/auth/login', loginData);
      
      // Store token and user data
      localStorage.setItem('vehicleProviderToken', response.data.token);
      localStorage.setItem('currentVehicleProvider', JSON.stringify(response.data.vehicleProvider));
      
      // Redirect to vehicle provider dashboard
      navigate('/vehicle-provider-dashboard');
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate passwords match
    if (signupData.password !== signupData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      // Prepare data for API with default values for required fields
      const vehicleProviderData = {
        firstName: signupData.firstName,
        lastName: signupData.lastName,
        email: signupData.email,
        phone: signupData.phone,
        password: signupData.password,
        address: {
          street: signupData.address,
          city: 'Colombo', // Default values
          district: 'Colombo',
          postalCode: '10000'
        },
        businessName: signupData.businessName,
        businessRegistrationNumber: signupData.businessRegistrationNumber,
        businessType: 'Individual', // Default value
        bankDetails: {
          bankName: signupData.bankName,
          accountNumber: signupData.accountNumber,
          accountHolderName: `${signupData.firstName} ${signupData.lastName}`,
          branch: 'Main Branch' // Default value
        },
        bio: '' // Optional field
      };

      const response = await axios.post('/api/vehicle-provider/auth/register', vehicleProviderData);
      
      // Store token and user data
      localStorage.setItem('vehicleProviderToken', response.data.token);
      localStorage.setItem('currentVehicleProvider', JSON.stringify(response.data.vehicleProvider));
      
      // Redirect to vehicle provider dashboard
      navigate('/vehicle-provider-dashboard');
    } catch (error) {
      setError(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (isLogin) {
      setLoginData(prev => ({ ...prev, [name]: value }));
    } else {
      setSignupData(prev => ({ ...prev, [name]: value }));
    }
  };

  return (
    <div className="vehicle-provider-auth">
      <div className="auth-container">
        <div className="auth-header">
          <div className="logo">
            <i className="fas fa-car"></i>
            <span>Giraffe Cabs</span>
          </div>
          <h1>Vehicle Provider Portal</h1>
          <p>Join our network and start earning with your vehicles</p>
        </div>

        <div className="auth-tabs">
          <button 
            className={`tab ${isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(true)}
          >
            <i className="fas fa-sign-in-alt"></i>
            Login
          </button>
          <button 
            className={`tab ${!isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(false)}
          >
            <i className="fas fa-user-plus"></i>
            Sign Up
          </button>
        </div>

        {error && (
          <div className="error-message">
            <i className="fas fa-exclamation-triangle"></i>
            {error}
          </div>
        )}

        {isLogin ? (
          <form onSubmit={handleLogin} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">
                <i className="fas fa-envelope"></i>
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={loginData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">
                <i className="fas fa-lock"></i>
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={loginData.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Logging in...
                </>
              ) : (
                <>
                  <i className="fas fa-sign-in-alt"></i>
                  Login
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignup} className="auth-form signup-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">
                  <i className="fas fa-user"></i>
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={signupData.firstName}
                  onChange={handleInputChange}
                  placeholder="Enter first name"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="lastName">
                  <i className="fas fa-user"></i>
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={signupData.lastName}
                  onChange={handleInputChange}
                  placeholder="Enter last name"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">
                <i className="fas fa-envelope"></i>
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={signupData.email}
                onChange={handleInputChange}
                placeholder="Enter email address"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">
                <i className="fas fa-phone"></i>
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={signupData.phone}
                onChange={handleInputChange}
                placeholder="Enter phone number"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="address">
                <i className="fas fa-map-marker-alt"></i>
                Address
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={signupData.address}
                onChange={handleInputChange}
                placeholder="Enter your address"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="businessName">
                <i className="fas fa-building"></i>
                Business Name
              </label>
              <input
                type="text"
                id="businessName"
                name="businessName"
                value={signupData.businessName}
                onChange={handleInputChange}
                placeholder="Enter business name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="businessRegistrationNumber">
                <i className="fas fa-certificate"></i>
                Business Registration Number
              </label>
              <input
                type="text"
                id="businessRegistrationNumber"
                name="businessRegistrationNumber"
                value={signupData.businessRegistrationNumber}
                onChange={handleInputChange}
                placeholder="Enter registration number"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="bankName">
                <i className="fas fa-university"></i>
                Bank Name
              </label>
              <input
                type="text"
                id="bankName"
                name="bankName"
                value={signupData.bankName}
                onChange={handleInputChange}
                placeholder="Enter bank name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="accountNumber">
                <i className="fas fa-credit-card"></i>
                Account Number
              </label>
              <input
                type="text"
                id="accountNumber"
                name="accountNumber"
                value={signupData.accountNumber}
                onChange={handleInputChange}
                placeholder="Enter account number"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="password">
                  <i className="fas fa-lock"></i>
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={signupData.password}
                  onChange={handleInputChange}
                  placeholder="Enter password"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="confirmPassword">
                  <i className="fas fa-lock"></i>
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={signupData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm password"
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Creating Account...
                </>
              ) : (
                <>
                  <i className="fas fa-user-plus"></i>
                  Create Account
                </>
              )}
            </button>
          </form>
        )}

        <div className="auth-footer">
          <p>
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button 
              className="link-btn"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? 'Sign Up' : 'Login'}
            </button>
          </p>
          <p>
            <button 
              className="link-btn"
              onClick={() => navigate('/')}
            >
              <i className="fas fa-arrow-left"></i>
              Back to Main Site
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VehicleProviderAuth;



