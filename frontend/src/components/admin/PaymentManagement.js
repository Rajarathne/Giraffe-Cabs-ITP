import React from 'react';
import './PaymentManagement.css';

const PaymentManagement = ({ 
  payments, 
  loading,
  onUpdatePaymentStatus,
  onDeletePayment,
  onEditPayment
}) => {
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
        <h2>Payment Management</h2>
      </div>

      <div className="payments-table">
        <table>
          <thead>
            <tr>
              <th>Payment ID</th>
              <th>User</th>
              <th>Amount</th>
              <th>Type</th>
              <th>Method</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.map(payment => (
              <tr key={payment._id}>
                <td>{payment._id.slice(-8)}</td>
                <td>{payment.user?.firstName} {payment.user?.lastName}</td>
                <td>LKR {payment.amount ? payment.amount.toLocaleString() : '0'}</td>
                <td>
                  <span className={`status status-${payment.booking?.serviceType || 'unknown'}`}>
                    {payment.booking?.serviceType || 'N/A'}
                  </span>
                </td>
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
                  <div className="action-buttons">
                    {/* Edit Button */}
                    <button 
                      className="btn btn-sm btn-primary"
                      onClick={() => onEditPayment(payment._id)}
                      title="Edit Payment"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    
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
