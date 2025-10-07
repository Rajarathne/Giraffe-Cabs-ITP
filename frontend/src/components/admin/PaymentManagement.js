import React, { useState, useEffect } from 'react';
import './PaymentManagement.css';

const PaymentManagement = ({ 
  payments, 
  loading,
  onUpdatePaymentStatus,
  onDeletePayment,
  onEditPayment,
  onUpdateBookingStatus
}) => {
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  // Filter payments based on search and filters
  useEffect(() => {
    let allPayments = payments.filter(payment => 
      payment.booking // Only show payments that have booking details
    );

    // Apply search filter
    if (searchTerm) {
      allPayments = allPayments.filter(payment => {
        const searchLower = searchTerm.toLowerCase();
        return (
          payment._id.toLowerCase().includes(searchLower) ||
          `${payment.user?.firstName} ${payment.user?.lastName}`.toLowerCase().includes(searchLower) ||
          payment.booking?.serviceType?.toLowerCase().includes(searchLower) ||
          payment.booking?.pickupLocation?.toLowerCase().includes(searchLower) ||
          payment.booking?.dropoffLocation?.toLowerCase().includes(searchLower) ||
          payment.amount?.toString().includes(searchTerm)
        );
      });
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      allPayments = allPayments.filter(payment => payment.status === statusFilter);
    }

    // Apply method filter
    if (methodFilter !== 'all') {
      allPayments = allPayments.filter(payment => payment.paymentMethod === methodFilter);
    }

    // Apply date filter
    if (dateFilter !== 'all') {
      const today = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          allPayments = allPayments.filter(payment => {
            const paymentDate = new Date(payment.processedAt || payment.createdAt);
            return paymentDate.toDateString() === today.toDateString();
          });
          break;
        case 'week':
          filterDate.setDate(today.getDate() - 7);
          allPayments = allPayments.filter(payment => {
            const paymentDate = new Date(payment.processedAt || payment.createdAt);
            return paymentDate >= filterDate;
          });
          break;
        case 'month':
          filterDate.setMonth(today.getMonth() - 1);
          allPayments = allPayments.filter(payment => {
            const paymentDate = new Date(payment.processedAt || payment.createdAt);
            return paymentDate >= filterDate;
          });
          break;
        default:
          break;
      }
    }

    setFilteredPayments(allPayments);
  }, [payments, searchTerm, statusFilter, methodFilter, dateFilter]);
  // Helper function to format date
  const formatDate = (payment) => {
    // Try different date fields in order of preference
    const dateFields = ['processedAt', 'createdAt', 'updatedAt'];
    
    for (const field of dateFields) {
      if (payment[field]) {
        const date = new Date(payment[field]);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });
        }
      }
    }
    
    return 'N/A';
  };
  return (
    <div className="payments-content">
      <div className="content-header">
        <h2>💳 Payment Management</h2>
        <p className="payment-note">Manage all payment transactions (card and cash). View payment details, update status, and handle refunds.</p>
      </div>

      {/* Compact Search and Filter Bar */}
      <div className="compact-search-filter">
        <div className="search-input-wrapper">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search payments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="clear-btn">
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
        
        <div className="filter-dropdowns">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
          
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
          >
            <option value="all">All Methods</option>
            <option value="stripe">Card</option>
            <option value="cash">Cash</option>
          </select>
          
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">7 Days</option>
            <option value="month">30 Days</option>
          </select>
        </div>
        
        <div className="results-info">
          {filteredPayments.length} payment{filteredPayments.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="payments-table">
        <table>
          <thead>
            <tr>
              <th>Payment ID</th>
              <th>User</th>
              <th>Booking Details</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Date</th>
              <th>Payment Status</th>
              <th>Booking Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.map(payment => (
              <tr key={payment._id}>
                <td>{payment._id.slice(-8)}</td>
                <td>{payment.user?.firstName} {payment.user?.lastName}</td>
                <td>
                  <div className="booking-details">
                    <div><strong>Service:</strong> {payment.booking?.serviceType || 'N/A'}</div>
                    <div><strong>From:</strong> {payment.booking?.pickupLocation || 'N/A'}</div>
                    <div><strong>To:</strong> {payment.booking?.dropoffLocation || 'N/A'}</div>
                    <div><strong>Date:</strong> {payment.booking?.pickupDate ? new Date(payment.booking.pickupDate).toLocaleDateString() : 'N/A'}</div>
                    <div><strong>Time:</strong> {payment.booking?.pickupTime || 'N/A'}</div>
                  </div>
                </td>
                <td>LKR {payment.amount ? payment.amount.toLocaleString() : '0'}</td>
                <td>{payment.paymentMethod}</td>
                <td>{formatDate(payment)}</td>
                <td>
                  <select 
                    className={`status-dropdown status-${payment.status}`}
                    value={payment.status}
                    onChange={(e) => onUpdatePaymentStatus(payment._id, e.target.value)}
                  >
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </td>
                <td>
                  <span className={`status status-${payment.booking?.status || 'unknown'}`}>
                    {payment.booking?.status || 'N/A'}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    {/* Confirm Booking Button */}
                    {payment.booking?.status === 'pending' && (
                      <button 
                        className="btn btn-sm btn-success"
                        onClick={() => onUpdateBookingStatus && onUpdateBookingStatus(payment.booking._id, 'confirmed')}
                        title="Confirm Booking"
                      >
                        <i className="fas fa-check"></i>
                      </button>
                    )}
                    
                    {/* Edit Button removed per request */}
                    
                    {/* Delete Button */}
                    <button 
                      className="btn btn-sm btn-danger"
                      onClick={() => onDeletePayment(payment._id)}
                      title="Delete Payment"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PaymentManagement;
