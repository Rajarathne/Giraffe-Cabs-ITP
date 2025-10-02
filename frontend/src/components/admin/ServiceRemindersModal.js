import React from 'react';
import './ServiceRemindersModal.css';

const ServiceRemindersModal = ({ showModal, onClose, serviceReminders }) => {
  if (!showModal) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h2><i className="fas fa-bell"></i> Service Reminders</h2>
        
        {serviceReminders.total === 0 ? (
          <div className="no-reminders">
            <i className="fas fa-check-circle"></i>
            <h3>No Upcoming Services</h3>
            <p>All vehicles are up to date with their service schedules.</p>
          </div>
        ) : (
          <div className="reminders-content">
            {serviceReminders.today.length > 0 && (
              <div className="reminder-section urgent">
                <div className="reminder-section-header">
                  <h3><i className="fas fa-exclamation-triangle"></i> Today's Services ({serviceReminders.today.length})</h3>
                  <span className="urgent-badge">URGENT</span>
                </div>
                <div className="reminder-list">
                  {serviceReminders.today.map(service => (
                    <div key={service._id} className="reminder-item urgent">
                      <div className="vehicle-info">
                        <div className="vehicle-number">{service.vehicle?.vehicleNumber}</div>
                        <div className="vehicle-details">{service.vehicle?.brand} {service.vehicle?.model} ({service.vehicle?.year})</div>
                      </div>
                      <div className="service-info">
                        <div className="service-type urgent">{service.serviceType}</div>
                        <div className="service-date">Due: {new Date(service.nextServiceDue).toLocaleDateString()}</div>
                        <div className="service-description">{service.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {serviceReminders.tomorrow.length > 0 && (
              <div className="reminder-section warning">
                <div className="reminder-section-header">
                  <h3><i className="fas fa-clock"></i> Tomorrow's Services ({serviceReminders.tomorrow.length})</h3>
                  <span className="warning-badge">UPCOMING</span>
                </div>
                <div className="reminder-list">
                  {serviceReminders.tomorrow.map(service => (
                    <div key={service._id} className="reminder-item warning">
                      <div className="vehicle-info">
                        <div className="vehicle-number">{service.vehicle?.vehicleNumber}</div>
                        <div className="vehicle-details">{service.vehicle?.brand} {service.vehicle?.model} ({service.vehicle?.year})</div>
                      </div>
                      <div className="service-info">
                        <div className="service-type warning">{service.serviceType}</div>
                        <div className="service-date">Due: {new Date(service.nextServiceDue).toLocaleDateString()}</div>
                        <div className="service-description">{service.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceRemindersModal;
