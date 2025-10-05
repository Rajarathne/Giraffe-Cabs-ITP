import React, { useState } from 'react';
import axios from 'axios';
import './VehicleProviderRegistration.css';

const VehicleProviderRegistration = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      district: '',
      postalCode: ''
    },
    businessName: '',
    businessRegistrationNumber: '',
    businessType: 'Individual',
    bankDetails: {
      bankName: '',
      accountNumber: '',
      accountHolderName: '',
      branch: ''
    },
    bio: ''
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields validation
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    if (!formData.address.street.trim()) newErrors['address.street'] = 'Street address is required';
    if (!formData.address.city.trim()) newErrors['address.city'] = 'City is required';
    if (!formData.address.district.trim()) newErrors['address.district'] = 'District is required';
    if (!formData.address.postalCode.trim()) newErrors['address.postalCode'] = 'Postal code is required';
    if (!formData.businessName.trim()) newErrors.businessName = 'Business name is required';
    if (!formData.businessRegistrationNumber.trim()) newErrors.businessRegistrationNumber = 'Business registration number is required';
    if (!formData.bankDetails.bankName.trim()) newErrors['bankDetails.bankName'] = 'Bank name is required';
    if (!formData.bankDetails.accountNumber.trim()) newErrors['bankDetails.accountNumber'] = 'Account number is required';
    if (!formData.bankDetails.accountHolderName.trim()) newErrors['bankDetails.accountHolderName'] = 'Account holder name is required';
    if (!formData.bankDetails.branch.trim()) newErrors['bankDetails.branch'] = 'Branch is required';

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone validation
    const phoneRegex = /^[0-9+\-\s()]+$/;
    if (formData.phone && !phoneRegex.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      
      // Generate a temporary password for the vehicle provider
      const tempPassword = Math.random().toString(36).slice(-8);
      
      const registrationData = {
        ...formData,
        password: tempPassword,
        status: 'pending' // Start with pending status
      };

      await axios.post('/api/vehicle-provider/auth/register', registrationData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert(`Vehicle provider registered successfully! Temporary password: ${tempPassword}`);
      
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: {
          street: '',
          city: '',
          district: '',
          postalCode: ''
        },
        businessName: '',
        businessRegistrationNumber: '',
        businessType: 'Individual',
        bankDetails: {
          bankName: '',
          accountNumber: '',
          accountHolderName: '',
          branch: ''
        },
        bio: ''
      });

    } catch (error) {
      console.error('Registration error:', error);
      alert(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="vehicle-provider-registration">
      <div className="page-header">
        <h1>Register Vehicle Provider</h1>
        <p>Register a new vehicle provider on behalf of an applicant</p>
      </div>

      <form onSubmit={handleSubmit} className="registration-form">
        {/* Personal Information */}
        <div className="form-section">
          <h3>Personal Information</h3>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">First Name *</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                className={errors.firstName ? 'error' : ''}
              />
              {errors.firstName && <span className="error-message">{errors.firstName}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="lastName">Last Name *</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                className={errors.lastName ? 'error' : ''}
              />
              {errors.lastName && <span className="error-message">{errors.lastName}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={errors.email ? 'error' : ''}
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="phone">Phone Number *</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className={errors.phone ? 'error' : ''}
              />
              {errors.phone && <span className="error-message">{errors.phone}</span>}
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className="form-section">
          <h3>Address Information</h3>
          <div className="form-group">
            <label htmlFor="address.street">Street Address *</label>
            <input
              type="text"
              id="address.street"
              name="address.street"
              value={formData.address.street}
              onChange={handleInputChange}
              className={errors['address.street'] ? 'error' : ''}
            />
            {errors['address.street'] && <span className="error-message">{errors['address.street']}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="address.city">City *</label>
              <input
                type="text"
                id="address.city"
                name="address.city"
                value={formData.address.city}
                onChange={handleInputChange}
                className={errors['address.city'] ? 'error' : ''}
              />
              {errors['address.city'] && <span className="error-message">{errors['address.city']}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="address.district">District *</label>
              <input
                type="text"
                id="address.district"
                name="address.district"
                value={formData.address.district}
                onChange={handleInputChange}
                className={errors['address.district'] ? 'error' : ''}
              />
              {errors['address.district'] && <span className="error-message">{errors['address.district']}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="address.postalCode">Postal Code *</label>
              <input
                type="text"
                id="address.postalCode"
                name="address.postalCode"
                value={formData.address.postalCode}
                onChange={handleInputChange}
                className={errors['address.postalCode'] ? 'error' : ''}
              />
              {errors['address.postalCode'] && <span className="error-message">{errors['address.postalCode']}</span>}
            </div>
          </div>
        </div>

        {/* Business Information */}
        <div className="form-section">
          <h3>Business Information</h3>
          <div className="form-group">
            <label htmlFor="businessName">Business Name *</label>
            <input
              type="text"
              id="businessName"
              name="businessName"
              value={formData.businessName}
              onChange={handleInputChange}
              className={errors.businessName ? 'error' : ''}
            />
            {errors.businessName && <span className="error-message">{errors.businessName}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="businessRegistrationNumber">Business Registration Number *</label>
              <input
                type="text"
                id="businessRegistrationNumber"
                name="businessRegistrationNumber"
                value={formData.businessRegistrationNumber}
                onChange={handleInputChange}
                className={errors.businessRegistrationNumber ? 'error' : ''}
              />
              {errors.businessRegistrationNumber && <span className="error-message">{errors.businessRegistrationNumber}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="businessType">Business Type</label>
              <select
                id="businessType"
                name="businessType"
                value={formData.businessType}
                onChange={handleInputChange}
              >
                <option value="Individual">Individual</option>
                <option value="Company">Company</option>
                <option value="Partnership">Partnership</option>
              </select>
            </div>
          </div>
        </div>

        {/* Banking Information */}
        <div className="form-section">
          <h3>Banking Information</h3>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="bankDetails.bankName">Bank Name *</label>
              <input
                type="text"
                id="bankDetails.bankName"
                name="bankDetails.bankName"
                value={formData.bankDetails.bankName}
                onChange={handleInputChange}
                className={errors['bankDetails.bankName'] ? 'error' : ''}
              />
              {errors['bankDetails.bankName'] && <span className="error-message">{errors['bankDetails.bankName']}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="bankDetails.accountNumber">Account Number *</label>
              <input
                type="text"
                id="bankDetails.accountNumber"
                name="bankDetails.accountNumber"
                value={formData.bankDetails.accountNumber}
                onChange={handleInputChange}
                className={errors['bankDetails.accountNumber'] ? 'error' : ''}
              />
              {errors['bankDetails.accountNumber'] && <span className="error-message">{errors['bankDetails.accountNumber']}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="bankDetails.accountHolderName">Account Holder Name *</label>
              <input
                type="text"
                id="bankDetails.accountHolderName"
                name="bankDetails.accountHolderName"
                value={formData.bankDetails.accountHolderName}
                onChange={handleInputChange}
                className={errors['bankDetails.accountHolderName'] ? 'error' : ''}
              />
              {errors['bankDetails.accountHolderName'] && <span className="error-message">{errors['bankDetails.accountHolderName']}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="bankDetails.branch">Branch *</label>
              <input
                type="text"
                id="bankDetails.branch"
                name="bankDetails.branch"
                value={formData.bankDetails.branch}
                onChange={handleInputChange}
                className={errors['bankDetails.branch'] ? 'error' : ''}
              />
              {errors['bankDetails.branch'] && <span className="error-message">{errors['bankDetails.branch']}</span>}
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="form-section">
          <h3>Additional Information</h3>
          <div className="form-group">
            <label htmlFor="bio">Bio/Description</label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              rows="4"
              placeholder="Tell us about the vehicle provider..."
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Registering...
              </>
            ) : (
              <>
                <i className="fas fa-user-plus"></i>
                Register Vehicle Provider
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VehicleProviderRegistration;




















