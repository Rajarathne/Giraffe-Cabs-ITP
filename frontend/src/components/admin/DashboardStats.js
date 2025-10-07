import React from 'react';
import './DashboardStats.css';

const DashboardStats = ({ stats, serviceReminders, onRemindersClick, onBookingRemindersClick, bookingReminders }) => {
  return (
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-icon">
          <i className="fas fa-car"></i>
        </div>
        <div className="stat-info">
          <h3>{stats.vehicles.total}</h3>
          <p>Total Vehicles</p>
          <small>{stats.vehicles.available} Available</small>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon">
          <i className="fas fa-handshake"></i>
        </div>
        <div className="stat-info">
          <h3>{stats.rentals.total}</h3>
          <p>Total Rentals</p>
          <small>{stats.rentals.pending} Pending</small>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon">
          <i className="fas fa-calendar-check"></i>
        </div>
        <div className="stat-info">
          <h3>{stats.bookings.total}</h3>
          <p>Total Bookings</p>
          <small>{stats.bookings.pending} Pending</small>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon">
          <i className="fas fa-tools"></i>
        </div>
        <div className="stat-info">
          <h3>{stats.services.total}</h3>
          <p>Service Records</p>
          <small>LKR {stats.services.totalCost.toLocaleString()}</small>
        </div>
      </div>

      <div className="stat-card reminders clickable" onClick={onRemindersClick}>
        <div className="stat-icon">
          <i className="fas fa-bell"></i>
        </div>
        <div className="stat-info">
          <h3>{serviceReminders.total}</h3>
          <p>Service Reminders</p>
          <small>
            {serviceReminders.today.length > 0 && `${serviceReminders.today.length} Today`}
            {serviceReminders.today.length > 0 && serviceReminders.tomorrow.length > 0 && ', '}
            {serviceReminders.tomorrow.length > 0 && `${serviceReminders.tomorrow.length} Tomorrow`}
            {serviceReminders.total === 0 && 'No upcoming services'}
          </small>
        </div>
      </div>

      <div className="stat-card reminders clickable" onClick={onBookingRemindersClick}>
        <div className="stat-icon">
          <i className="fas fa-calendar-check"></i>
        </div>
        <div className="stat-info">
          <h3>{(bookingReminders?.today?.length || 0) + (bookingReminders?.tomorrow?.length || 0)}</h3>
          <p>Booking Reminders</p>
          <small>
            {(bookingReminders?.today?.length || 0) > 0 && `${bookingReminders.today.length} Today`}
            {(bookingReminders?.today?.length || 0) > 0 && (bookingReminders?.tomorrow?.length || 0) > 0 && ', '}
            {(bookingReminders?.tomorrow?.length || 0) > 0 && `${bookingReminders.tomorrow.length} Tomorrow`}
            {((bookingReminders?.today?.length || 0) + (bookingReminders?.tomorrow?.length || 0)) === 0 && 'No upcoming bookings'}
          </small>
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;
