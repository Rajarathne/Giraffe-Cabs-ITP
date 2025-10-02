import React, { useState } from 'react';
import './AdminProfile.css';

const AdminProfile = ({ user, onUpdateProfile }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    city: user?.city || '',
    country: user?.country || '',
    bio: user?.bio || ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onUpdateProfile(profileData);
      setIsEditing(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setProfileData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: user?.address || '',
      city: user?.city || '',
      country: user?.country || '',
      bio: user?.bio || ''
    });
    setIsEditing(false);
  };

  return (
    <div className="admin-profile">
      <div className="profile-header">
        <div className="profile-avatar">
          <div className="avatar-circle">
            <i className="fas fa-user"></i>
          </div>
          <div className="avatar-status">
            <span className="status-dot online"></span>
            <span>Online</span>
          </div>
        </div>
        <div className="profile-info">
          <h2>{user?.firstName} {user?.lastName}</h2>
          <p className="profile-role">
            <i className="fas fa-crown"></i>
            Administrator
          </p>
          <p className="profile-email">{user?.email}</p>
          <div className="profile-stats">
            <div className="stat-item">
              <span className="stat-number">{user?.totalBookings || 0}</span>
              <span className="stat-label">Total Bookings</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{user?.totalRevenue || 0}</span>
              <span className="stat-label">Revenue Generated</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{user?.joinDate ? new Date(user.joinDate).getFullYear() : new Date().getFullYear()}</span>
              <span className="stat-label">Member Since</span>
            </div>
          </div>
        </div>
        <div className="profile-actions">
          <button 
            className="btn btn-primary"
            onClick={() => setIsEditing(!isEditing)}
          >
            <i className="fas fa-edit"></i>
            {isEditing ? 'Cancel Edit' : 'Edit Profile'}
          </button>
        </div>
      </div>

      <div className="profile-content">
        <div className="profile-section">
          <h3><i className="fas fa-user-circle"></i> Personal Information</h3>
          {isEditing ? (
            <form onSubmit={handleSubmit} className="profile-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">First Name</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={profileData.firstName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="lastName">Last Name</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={profileData.lastName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={profileData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="phone">Phone</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="address">Address</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={profileData.address}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="city">City</label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={profileData.city}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="country">Country</label>
                  <input
                    type="text"
                    id="country"
                    name="country"
                    value={profileData.country}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="bio">Bio</label>
                <textarea
                  id="bio"
                  name="bio"
                  value={profileData.bio}
                  onChange={handleInputChange}
                  rows="4"
                  placeholder="Tell us about yourself..."
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Profile'}
                </button>
              </div>
            </form>
          ) : (
            <div className="profile-details">
              <div className="detail-row">
                <div className="detail-item">
                  <label>First Name</label>
                  <span>{user?.firstName || 'Not provided'}</span>
                </div>
                <div className="detail-item">
                  <label>Last Name</label>
                  <span>{user?.lastName || 'Not provided'}</span>
                </div>
              </div>
              
              <div className="detail-row">
                <div className="detail-item">
                  <label>Email</label>
                  <span>{user?.email || 'Not provided'}</span>
                </div>
                <div className="detail-item">
                  <label>Phone</label>
                  <span>{user?.phone || 'Not provided'}</span>
                </div>
              </div>

              <div className="detail-item">
                <label>Address</label>
                <span>{user?.address || 'Not provided'}</span>
              </div>

              <div className="detail-row">
                <div className="detail-item">
                  <label>City</label>
                  <span>{user?.city || 'Not provided'}</span>
                </div>
                <div className="detail-item">
                  <label>Country</label>
                  <span>{user?.country || 'Not provided'}</span>
                </div>
              </div>

              <div className="detail-item">
                <label>Bio</label>
                <span>{user?.bio || 'No bio provided'}</span>
              </div>
            </div>
          )}
        </div>

        <div className="profile-section">
          <h3><i className="fas fa-chart-line"></i> Account Statistics</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-calendar-check"></i>
              </div>
              <div className="stat-content">
                <h4>Total Bookings</h4>
                <p>{user?.totalBookings || 0}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-dollar-sign"></i>
              </div>
              <div className="stat-content">
                <h4>Revenue Generated</h4>
                <p>LKR {user?.totalRevenue?.toLocaleString() || '0'}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-users"></i>
              </div>
              <div className="stat-content">
                <h4>Customers Served</h4>
                <p>{user?.customersServed || 0}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-star"></i>
              </div>
              <div className="stat-content">
                <h4>Rating</h4>
                <p>{user?.rating || '5.0'}/5.0</p>
              </div>
            </div>
          </div>
        </div>

        <div className="profile-section">
          <h3><i className="fas fa-cog"></i> Account Settings</h3>
          <div className="settings-grid">
            <div className="setting-item">
              <div className="setting-info">
                <h4>Change Password</h4>
                <p>Update your account password</p>
              </div>
              <button className="btn btn-outline">
                <i className="fas fa-key"></i>
                Change Password
              </button>
            </div>
            <div className="setting-item">
              <div className="setting-info">
                <h4>Notification Settings</h4>
                <p>Manage your notification preferences</p>
              </div>
              <button className="btn btn-outline">
                <i className="fas fa-bell"></i>
                Settings
              </button>
            </div>
            <div className="setting-item">
              <div className="setting-info">
                <h4>Privacy Settings</h4>
                <p>Control your privacy and data</p>
              </div>
              <button className="btn btn-outline">
                <i className="fas fa-shield-alt"></i>
                Privacy
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;
