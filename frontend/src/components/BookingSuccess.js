import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './BookingSuccess.css';

const BookingSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const { bookingData, paymentIntent, message } = location.state || {};

  const handleGoHome = () => {
    navigate('/home');
  };

  const handleNewBooking = () => {
    navigate('/booking');
  };

  return (
    <div className="success-container">
      <div className="success-card">
        <div className="success-icon">
          ✅
        </div>
        
        <h1>Payment Successful!</h1>
        
        <p className="success-message">
          {message || 'Your payment has been processed successfully and your booking is confirmed!'}
        </p>

        {paymentIntent && (
          <div className="payment-details">
            <h3>Payment Details</h3>
            <div className="detail-row">
              <span>Payment ID:</span>
              <span>{paymentIntent.id}</span>
            </div>
            <div className="detail-row">
              <span>Status:</span>
              <span className="status-success">{paymentIntent.status}</span>
            </div>
            {paymentIntent.amount && (
              <div className="detail-row">
                <span>Amount:</span>
                <span>LKR {(paymentIntent.amount / 100).toLocaleString()}</span>
              </div>
            )}
          </div>
        )}

        {bookingData && (
          <div className="booking-details">
            <h3>Booking Details</h3>
            <div className="detail-row">
              <span>Service:</span>
              <span>{bookingData.serviceType || 'Transport Service'}</span>
            </div>
            <div className="detail-row">
              <span>From:</span>
              <span>{bookingData.pickupLocation}</span>
            </div>
            <div className="detail-row">
              <span>To:</span>
              <span>{bookingData.dropoffLocation}</span>
            </div>
            <div className="detail-row">
              <span>Date:</span>
              <span>{new Date(bookingData.pickupDate).toLocaleDateString()}</span>
            </div>
            <div className="detail-row">
              <span>Time:</span>
              <span>{bookingData.pickupTime}</span>
            </div>
          </div>
        )}

        <div className="success-actions">
          <button onClick={handleNewBooking} className="btn-secondary">
            Book Another Service
          </button>
          <button onClick={handleGoHome} className="btn-primary">
            Go to Dashboard
          </button>
        </div>

        <div className="success-footer">
          <p>📧 A confirmation email has been sent to your registered email address.</p>
          <p>📱 You will receive SMS updates about your booking status.</p>
        </div>
      </div>
    </div>
  );
};

export default BookingSuccess;

