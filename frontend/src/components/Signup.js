import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './Signup.css';

const Signup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [role, setRole] = useState('customer');

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', address: '',
    password: '', confirmPassword: '',
    businessName: '', businessRegistrationNumber: '', businessType: 'Individual', bankName: '', accountNumber: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      if (role === 'vehicle_provider') {
        const vehicleProviderData = {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          password: form.password,
          address: {
            street: form.address,
            city: 'Colombo',
            district: 'Colombo',
            postalCode: '10000'
          },
          businessName: form.businessName,
          businessRegistrationNumber: form.businessRegistrationNumber,
          businessType: form.businessType,
          bankDetails: {
            bankName: form.bankName,
            accountNumber: form.accountNumber,
            accountHolderName: `${form.firstName} ${form.lastName}`,
            branch: 'Main Branch'
          }
        };
        const response = await axios.post('/api/vehicle-provider/auth/register', vehicleProviderData);
        localStorage.setItem('vehicleProviderToken', response.data.token);
        localStorage.setItem('currentVehicleProvider', JSON.stringify(response.data.vehicleProvider));
        navigate('/vehicle-provider-dashboard');
      } else {
        const response = await axios.post('/api/auth/register', {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          address: form.address,
          password: form.password,
          role: 'customer'
        });
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('currentUser', JSON.stringify(response.data));
        navigate('/home');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="logo">
            <i className="fas fa-taxi"></i>
            <span>Giraffe Cabs</span>
          </div>
          <h1>Create your account</h1>
          <p className="subtitle">Join OUR Vehicle System today.</p>
        </div>

        <div className="role-switch">
          <button
            type="button"
            className={`role-btn ${role === 'customer' ? 'active' : ''}`}
            onClick={() => setRole('customer')}
          >
            <i className="fas fa-user"></i>
            Customer
          </button>
          <button
            type="button"
            className={`role-btn ${role === 'vehicle_provider' ? 'active' : ''}`}
            onClick={() => setRole('vehicle_provider')}
          >
            <i className="fas fa-handshake"></i>
            Provider
          </button>
        </div>

        {error && (
          <div className="error-banner">
            <i className="fas fa-exclamation-triangle"></i>
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="auth-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName"><i className="fas fa-user"></i> First Name</label>
              <input id="firstName" name="firstName" value={form.firstName} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="lastName"><i className="fas fa-user"></i> Last Name</label>
              <input id="lastName" name="lastName" value={form.lastName} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email"><i className="fas fa-envelope"></i> Email</label>
            <input id="email" name="email" type="email" value={form.email} onChange={handleChange} required />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="phone"><i className="fas fa-phone"></i> Phone</label>
              <input id="phone" name="phone" value={form.phone} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="password"><i className="fas fa-lock"></i> Password</label>
              <input id="password" name="password" type="password" value={form.password} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="confirmPassword"><i className="fas fa-lock"></i> Confirm Password</label>
              <input id="confirmPassword" name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="address"><i className="fas fa-map-marker-alt"></i> Address</label>
              <input id="address" name="address" value={form.address} onChange={handleChange} required />
            </div>
          </div>

          {role === 'vehicle_provider' && (
            <div className="provider-fields">
              <div className="form-group">
                <label htmlFor="businessName"><i className="fas fa-building"></i> Business Name</label>
                <input id="businessName" name="businessName" value={form.businessName} onChange={handleChange} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="businessRegistrationNumber"><i className="fas fa-id-card"></i> Reg. Number</label>
                  <input id="businessRegistrationNumber" name="businessRegistrationNumber" value={form.businessRegistrationNumber} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label htmlFor="businessType"><i className="fas fa-briefcase"></i> Type</label>
                  <select id="businessType" name="businessType" value={form.businessType} onChange={handleChange}>
                    <option value="Individual">Individual</option>
                    <option value="Company">Company</option>
                    <option value="Partnership">Partnership</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="bankName"><i className="fas fa-university"></i> Bank</label>
                  <input id="bankName" name="bankName" value={form.bankName} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label htmlFor="accountNumber"><i className="fas fa-credit-card"></i> Account</label>
                  <input id="accountNumber" name="accountNumber" value={form.accountNumber} onChange={handleChange} required />
                </div>
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? <><i className="fas fa-spinner fa-spin"></i> Creating...</> : <><i className="fas fa-user-plus"></i> Create Account</>}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account? <Link to="/login" className="link">Login</Link>
          </p>
          <p>
            <Link to="/" className="link"><i className="fas fa-arrow-left"></i> Back to landing</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;


















