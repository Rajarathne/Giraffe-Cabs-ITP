import React from 'react';
import './ServiceRemindersModal.css';

const BookingRemindersModal = ({ show, onClose, today, tomorrow, loading }) => {
  if (!show) return null;

  const renderList = (list) => (
    <div className="reminder-list">
      {list.length === 0 ? (
        <div className="reminder-item">
          <div className="vehicle-info">
            <strong>No bookings</strong>
            <span>Nothing scheduled</span>
          </div>
        </div>
      ) : (
        list.map((b) => (
          <div key={b._id} className="reminder-item">
            <div className="vehicle-info">
              <strong>Booking #{(b._id || '').toString().slice(-6)}</strong>
              <span>{(b.user?.firstName || '')} {(b.user?.lastName || '')}</span>
              <span>{b.pickupLocation} → {b.dropoffLocation}</span>
            </div>
            <div className="service-info" style={{ alignItems: 'flex-end' }}>
              <span className="service-type">{(b.serviceType || '').toString()}</span>
              <small>{new Date(b.pickupDate).toLocaleDateString()} {b.pickupTime}</small>
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h2><i className="fas fa-bell"></i> Booking Reminders</h2>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <div className="reminders-grid">
            <div className="reminder-card urgent">
              <div className="reminder-header">
                <h3><i className="fas fa-calendar-day"></i> Today</h3>
                <span className="reminder-count">{today.length}</span>
              </div>
              {renderList(today)}
            </div>
            <div className="reminder-card warning">
              <div className="reminder-header">
                <h3><i className="fas fa-calendar"></i> Tomorrow</h3>
                <span className="reminder-count">{tomorrow.length}</span>
              </div>
              {renderList(tomorrow)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingRemindersModal;


