import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loginData, setLoginData] = useState({ email: '', password: '', role: 'customer' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLoginData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      let response;

      if (loginData.role === 'vehicle_provider') {
        response = await axios.post('/api/vehicle-provider/auth/login', {
          email: loginData.email,
          password: loginData.password
        });
        localStorage.setItem('vehicleProviderToken', response.data.token);
        localStorage.setItem('currentVehicleProvider', JSON.stringify(response.data.vehicleProvider));
        navigate('/vehicle-provider-dashboard');
      } else {
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
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
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
          <h1>Sign in to your account</h1>
          <p className="subtitle">Welcome back! Please enter your details.</p>
        </div>

        <div className="role-switch">
          <button
            type="button"
            className={`role-btn ${loginData.role === 'customer' ? 'active' : ''}`}
            onClick={() => setLoginData(prev => ({ ...prev, role: 'customer' }))}
          >
            <i className="fas fa-user"></i>
            Customer
          </button>
          <button
            type="button"
            className={`role-btn ${loginData.role === 'vehicle_provider' ? 'active' : ''}`}
            onClick={() => setLoginData(prev => ({ ...prev, role: 'vehicle_provider' }))}
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

        <form onSubmit={handleLogin} className="auth-form">
          <div className="form-group">
            <label htmlFor="email"><i className="fas fa-envelope"></i> Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={loginData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password"><i className="fas fa-lock"></i> Password</label>
            <input
              id="password"
              name="password"
              type="password"
              value={loginData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? <><i className="fas fa-spinner fa-spin"></i> Logging in...</> : <><i className="fas fa-sign-in-alt"></i> Login</>}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account? <Link to="/signup" className="link">Create one</Link>
          </p>
          <p>
            <Link to="/" className="link"><i className="fas fa-arrow-left"></i> Back to landing</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
























