import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Payment.css';

// Initialize Stripe
const stripePromise = loadStripe('pk_test_51S8bzS4wZaTWdecpBdOxfgUye7PNbwc2k9tFWO5A2lqWZ6rgBkv4fG4FYBKL3wfOSuQe9ki6ANNbExYyUXyR6mFU00wfxWw7rB');

const PaymentForm = ({ bookingData, amount, onPaymentSuccess, updateBookingPaymentMethod }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState('');

  const createPaymentIntent = useCallback(async () => {
    try {
      const token = localStorage.getItem('authToken');
      const amountInCents = Math.round(amount * 100);
      
      console.log('Creating Payment Intent:', {
        amount: amount,
        amountInCents: amountInCents,
        bookingId: bookingData._id
      });
      
      const response = await axios.post('/api/payments/create-payment-intent', {
        bookingId: bookingData._id,
        amount: amountInCents, // Convert to cents
        currency: 'lkr'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setClientSecret(response.data.clientSecret);
    } catch (error) {
      console.error('Error creating payment intent:', error);
      toast.error('Failed to initialize payment. Please try again.');
    }
  }, [bookingData, amount]);

  useEffect(() => {
    // Create payment intent when component mounts
    if (bookingData && amount) {
      createPaymentIntent();
    }
  }, [bookingData, amount, createPaymentIntent]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setLoading(true);

    const cardElement = elements.getElement(CardElement);

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: bookingData.contactPerson?.name || 'Customer',
            email: bookingData.contactPerson?.email || 'customer@example.com',
          },
        }
      });

      if (error) {
        console.error('Payment failed:', error);
        toast.error(`Payment failed: ${error.message}`);
      } else if (paymentIntent.status === 'succeeded') {
        // Payment succeeded, create payment record and update booking
        await createPaymentRecord(paymentIntent.id);
        await updateBookingPaymentMethod('stripe');
        toast.success('Payment successful!');
        onPaymentSuccess(paymentIntent);
      }
    } catch (err) {
      console.error('Payment error:', err);
      toast.error('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const createPaymentRecord = async (stripePaymentIntentId) => {
    try {
      const token = localStorage.getItem('authToken');
      
      console.log('Creating Payment Record:', {
        amount: amount,
        bookingId: bookingData._id,
        stripePaymentIntentId: stripePaymentIntentId
      });
      
      await axios.post('/api/payments', {
        bookingId: bookingData._id,
        amount: amount, // Amount is already in LKR, no conversion needed
        paymentMethod: 'stripe',
        status: 'completed',
        stripePaymentIntentId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Error creating payment record:', error);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
        padding: '12px',
      },
      invalid: {
        color: '#9e2146',
      },
    },
    hidePostalCode: true,
  };

  return (
    <form onSubmit={handleSubmit} className="payment-form">
      <div className="payment-section">
        <h3>💳 Payment Details</h3>
        <div className="card-element-container">
          <CardElement options={cardElementOptions} />
        </div>
      </div>

      <div className="payment-info">
        <h4>🧪 Test Card Information</h4>
        <div className="test-cards">
          <div className="test-card">
            <strong>Visa (Success):</strong> 4242 4242 4242 4242
          </div>
          <div className="test-card">
            <strong>Mastercard (Success):</strong> 5555 5555 5555 4444
          </div>
          <div className="test-card">
            <strong>Declined Card:</strong> 4000 0000 0000 0002
          </div>
          <div className="test-card">
            <strong>Any future date:</strong> 12/34, Any 3 digits: 123
          </div>
        </div>
      </div>

      <button 
        type="submit" 
        disabled={!stripe || loading || !clientSecret}
        className="pay-button"
      >
        {loading ? 'Processing...' : `Pay LKR ${amount.toLocaleString()}`}
      </button>
    </form>
  );
};

const Payment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [bookingData, setBookingData] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('stripe');

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (!currentUser) {
      navigate('/');
      return;
    }

    // Get booking data from location state or fetch from API
    if (location.state?.bookingData) {
      setBookingData(location.state.bookingData);
    } else {
      // If no booking data in state, redirect to booking page
      navigate('/booking');
    }
  }, [navigate, location.state]);

  const updateBookingPaymentMethod = async (paymentMethod) => {
    try {
      const token = localStorage.getItem('authToken');
      await axios.put(`/api/bookings/${bookingData._id}`, {
        paymentMethod: paymentMethod,
        paymentStatus: paymentMethod === 'stripe' ? 'paid' : 'pending'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Error updating booking payment method:', error);
    }
  };

  const handlePaymentSuccess = (paymentIntent) => {
    // For card payments, redirect to success page
    if (paymentMethod === 'stripe') {
      navigate('/booking-success', {
        state: {
          bookingData,
          paymentIntent,
          message: 'Your payment was successful! Your booking is confirmed.'
        }
      });
    } else {
      // For cash payments, redirect to success page with different message
      navigate('/booking-success', {
        state: {
          bookingData,
          paymentIntent,
          message: 'Your cash payment booking is confirmed! Admin will set the final price and confirm your booking.'
        }
      });
    }
  };

  const handleBackToBooking = () => {
    navigate('/booking');
  };

  if (!bookingData) {
    return (
      <div className="payment-container">
        <div className="loading">Loading payment details...</div>
      </div>
    );
  }

  const amount = bookingData.totalPrice || 0;
  
  // Debug logging
  console.log('Payment Debug:', {
    bookingData: bookingData,
    totalPrice: bookingData.totalPrice,
    amount: amount
  });

  return (
    <div className="payment-container">
      <ToastContainer />
      
      <div className="payment-header">
        <h1>💳 Payment</h1>
        <button onClick={handleBackToBooking} className="back-button">
          ← Back to Booking
        </button>
      </div>

      <div className="payment-content">
        <div className="booking-summary">
          <h2>📋 Booking Summary</h2>
          <div className="summary-details">
            <div className="summary-row">
              <span>Service:</span>
              <span>{bookingData.serviceType || 'Transport Service'}</span>
            </div>
            <div className="summary-row">
              <span>From:</span>
              <span>{bookingData.pickupLocation}</span>
            </div>
            <div className="summary-row">
              <span>To:</span>
              <span>{bookingData.dropoffLocation}</span>
            </div>
            <div className="summary-row">
              <span>Date:</span>
              <span>{new Date(bookingData.pickupDate).toLocaleDateString()}</span>
            </div>
            <div className="summary-row">
              <span>Time:</span>
              <span>{bookingData.pickupTime}</span>
            </div>
            <div className="summary-row">
              <span>Passengers:</span>
              <span>{bookingData.passengers}</span>
            </div>
            <div className="summary-row total">
              <span>Total Amount:</span>
              <span>LKR {amount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="payment-methods">
          <h2>💳 Choose Payment Method</h2>
          <div className="payment-method-options">
            <label className={`payment-method ${paymentMethod === 'stripe' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="paymentMethod"
                value="stripe"
                checked={paymentMethod === 'stripe'}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              <div className="method-info">
                <span className="method-name">💳 Credit/Debit Card</span>
                <span className="method-desc">Pay securely with Stripe</span>
              </div>
            </label>

            <label className={`payment-method ${paymentMethod === 'cash' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="paymentMethod"
                value="cash"
                checked={paymentMethod === 'cash'}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              <div className="method-info">
                <span className="method-name">💵 Cash Payment</span>
                <span className="method-desc">Pay when service is provided</span>
              </div>
            </label>
          </div>
        </div>

        {paymentMethod === 'stripe' ? (
          <Elements stripe={stripePromise}>
            <PaymentForm 
              bookingData={bookingData} 
              amount={amount}
              onPaymentSuccess={handlePaymentSuccess}
              updateBookingPaymentMethod={updateBookingPaymentMethod}
            />
          </Elements>
        ) : (
          <div className="cash-payment">
            <h3>💵 Cash Payment</h3>
            <p>You have selected cash payment. The driver will collect the payment when the service is provided.</p>
            <p><strong>Amount to pay:</strong> LKR {amount.toLocaleString()}</p>
            
            <button 
              onClick={async () => {
                await updateBookingPaymentMethod('cash');
                handlePaymentSuccess({ status: 'cash_pending' });
              }}
              className="confirm-cash-button"
            >
              Confirm Cash Payment
            </button>
          </div>
        )}
      </div>

      <div className="payment-footer">
        <p>🔒 Your payment information is secure and encrypted</p>
        <p>Powered by Stripe • SSL Secured</p>
      </div>
    </div>
  );
};

export default Payment;