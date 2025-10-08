import React, { useState } from 'react';
import axios from 'axios';
import './FinancialManagement.css';
import './AdminFormStyles.css';

const FinancialManagement = ({ 
  financialData, 
  financialEntries, 
  loading, 
  onRefreshData, 
  onAddFinancialEntry, 
  onUpdateFinancialEntry,
  onDeleteFinancialEntry 
}) => {
  const [showFinancialModal, setShowFinancialModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [financialFormData, setFinancialFormData] = useState({
    type: 'expense',
    category: 'driver_salary',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    reference: ''
  });

  // Validation function
  const validateFinancialData = (data) => {
    const errors = {};
    const today = new Date().toISOString().split('T')[0];

    // Validate amount (must be greater than 0)
    if (!data.amount || parseFloat(data.amount) <= 0) {
      errors.amount = 'Amount must be greater than 0';
    }

    // Validate description (required and not empty)
    if (!data.description || data.description.trim() === '') {
      errors.description = 'Description is required';
    }

    // Validate date (cannot be in the future)
    if (data.date > today) {
      errors.date = 'Date cannot be in the future';
    }

    // Validate category (required)
    if (!data.category) {
      errors.category = 'Category is required';
    }

    return errors;
  };

  const handleFinancialSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous validation errors
    setValidationErrors({});
    
    // Validate the form data
    const errors = validateFinancialData(financialFormData);
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    try {
      if (editingEntry) {
        await onUpdateFinancialEntry(editingEntry._id, financialFormData);
      } else {
        await onAddFinancialEntry(financialFormData);
      }
      setShowFinancialModal(false);
      setEditingEntry(null);
      setValidationErrors({});
      setFinancialFormData({
        type: 'expense',
        category: 'driver_salary',
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        reference: ''
      });
    } catch (error) {
      console.error('Error saving financial entry:', error);
    }
  };

  const handleRefresh = () => {
    console.log('🔄 Manual refresh triggered');
    onRefreshData();
  };

  const handleEditEntry = (entry) => {
    setEditingEntry(entry);
    setFinancialFormData({
      type: entry.type,
      category: entry.category,
      description: entry.description,
      amount: entry.amount.toString(),
      date: new Date(entry.date).toISOString().split('T')[0],
      reference: entry.reference || ''
    });
    setShowFinancialModal(true);
  };

  const handleCancelEdit = () => {
    setShowFinancialModal(false);
    setEditingEntry(null);
    setValidationErrors({});
    setFinancialFormData({
      type: 'expense',
      category: 'driver_salary',
      description: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      reference: ''
    });
  };

  const handleGenerateMonthlyReport = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const currentDate = new Date();
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      
      const response = await axios.get(`/api/financial/reports/monthly?month=${month}&year=${year}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Monthly_Financial_Report_${month}_${year}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Failed to generate monthly report: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleGenerateExpenseReport = async () => {
    try {
      const token = localStorage.getItem('authToken');
      
      const response = await axios.get('/api/financial/reports/expense', {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'expense_report.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Failed to generate expense report: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleGenerateIncomeReport = async () => {
    try {
      const token = localStorage.getItem('authToken');
      
      const response = await axios.get('/api/financial/reports/income', {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'income_report.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Failed to generate income report: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className="financial-management">
      <div className="content-header">
        <h2><i className="fas fa-chart-line"></i> Financial Management</h2>
        <div className="header-actions">
          <button 
            className="btn btn-info"
            onClick={handleRefresh}
            title="Refresh Financial Data"
          >
            <i className="fas fa-sync-alt"></i> Refresh
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => {
              setFinancialFormData({...financialFormData, type: 'income'});
              setShowFinancialModal(true);
            }}
          >
            <i className="fas fa-plus"></i> Add Income
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => {
              setFinancialFormData({...financialFormData, type: 'expense'});
              setShowFinancialModal(true);
            }}
          >
            <i className="fas fa-minus"></i> Add Expense
          </button>
        </div>
      </div>
      
      {/* Financial Overview Cards */}
      <div className="financial-overview">
        <div className="stat-card income">
          <div className="stat-icon">
            <i className="fas fa-arrow-up"></i>
          </div>
          <div className="stat-info">
            <h3>LKR {financialData.totalIncome?.toLocaleString() || '0'}</h3>
            <p>Total Income</p>
            <div className="income-breakdown">
              <div className="breakdown-item">
                <span className="label">From Financial Entries:</span>
                <span className="amount">LKR {financialData.manualIncome?.toLocaleString() || '0'}</span>
              </div>
              <div className="breakdown-item">
                <span className="label">From Payments:</span>
                <span className="amount">LKR {financialData.bookingIncome?.toLocaleString() || '0'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="stat-card expense">
          <div className="stat-icon">
            <i className="fas fa-arrow-down"></i>
          </div>
          <div className="stat-info">
            <h3>LKR {financialData.totalExpenses?.toLocaleString() || '0'}</h3>
            <p>Total Expenses</p>
            <div className="expense-breakdown">
              <div className="breakdown-item">
                <span className="label">From Financial Entries:</span>
                <span className="amount">LKR {financialData.manualExpenses?.toLocaleString() || '0'}</span>
              </div>
              <div className="breakdown-item">
                <span className="label">From Services:</span>
                <span className="amount">LKR {financialData.serviceExpenses?.toLocaleString() || '0'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="stat-card profit">
          <div className="stat-icon">
            <i className="fas fa-chart-line"></i>
          </div>
          <div className="stat-info">
            <h3 className={financialData.netProfit >= 0 ? 'positive' : 'negative'}>
              LKR {financialData.netProfit?.toLocaleString() || '0'}
            </h3>
            <p>Net Profit</p>
            <div className="profit-calculation">
              <div className="calculation-formula">
                <span className="formula-text">Total Income - Total Expenses</span>
              </div>
              <div className="calculation-details">
                <span className="detail">LKR {financialData.totalIncome?.toLocaleString() || '0'} - LKR {financialData.totalExpenses?.toLocaleString() || '0'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Financial Summary */}
      <div className="quick-summary">
        <div className="summary-card">
          <h3><i className="fas fa-calculator"></i> Financial Summary</h3>
          <div className="summary-calculation">
            <div className="calculation-row">
              <span className="label">Total Income:</span>
              <span className="amount income-amount">LKR {financialData.totalIncome?.toLocaleString() || '0'}</span>
            </div>
            <div className="calculation-row">
              <span className="label">Total Expenses:</span>
              <span className="amount expense-amount">LKR {financialData.totalExpenses?.toLocaleString() || '0'}</span>
            </div>
            <div className="calculation-divider"></div>
            <div className="calculation-row total">
              <span className="label">Net Profit:</span>
              <span className={`amount ${financialData.netProfit >= 0 ? 'profit-amount' : 'loss-amount'}`}>
                LKR {financialData.netProfit?.toLocaleString() || '0'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Financial Breakdown */}
      <div className="financial-breakdown">
        <h3><i className="fas fa-chart-pie"></i> Financial Breakdown</h3>
        <div className="breakdown-grid">
          <div className="breakdown-card income-breakdown">
            <h4><i className="fas fa-arrow-up text-success"></i> Income Sources</h4>
            <div className="breakdown-item">
              <span className="label">From Financial Entries:</span>
              <span className="amount">LKR {financialData.manualIncome?.toLocaleString() || '0'}</span>
            </div>
            <div className="breakdown-item">
              <span className="label">From Payments:</span>
              <span className="amount">LKR {financialData.bookingIncome?.toLocaleString() || '0'}</span>
            </div>
            <div className="breakdown-total">
              <span className="label">Total Income:</span>
              <span className="amount">LKR {financialData.totalIncome?.toLocaleString() || '0'}</span>
            </div>
          </div>

          <div className="breakdown-card expense-breakdown">
            <h4><i className="fas fa-arrow-down text-danger"></i> Expense Sources</h4>
            <div className="breakdown-item">
              <span className="label">From Financial Entries:</span>
              <span className="amount">LKR {financialData.manualExpenses?.toLocaleString() || '0'}</span>
            </div>
            <div className="breakdown-item">
              <span className="label">From Services:</span>
              <span className="amount">LKR {financialData.serviceExpenses?.toLocaleString() || '0'}</span>
            </div>
            <div className="breakdown-total">
              <span className="label">Total Expenses:</span>
              <span className="amount">LKR {financialData.totalExpenses?.toLocaleString() || '0'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Entries Table */}
      <div className="financial-entries">
        <h3><i className="fas fa-list"></i> Recent Financial Entries</h3>
        <div className="entries-table">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Category</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Reference</th>
                <th>Created By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {financialEntries.slice(0, 10).map(entry => (
                <tr key={entry._id}>
                  <td>{new Date(entry.date).toLocaleDateString()}</td>
                  <td>
                    <span className={`status status-${entry.type}`}>
                      {entry.type}
                    </span>
                  </td>
                  <td>{entry.category.replace('_', ' ')}</td>
                  <td>{entry.description}</td>
                  <td className={entry.type === 'income' ? 'amount-income' : 'amount-expense'}>
                    LKR {entry.amount.toLocaleString()}
                  </td>
                  <td>{entry.reference || '-'}</td>
                  <td>{entry.createdBy?.firstName} {entry.createdBy?.lastName}</td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn btn-sm btn-primary"
                        onClick={() => handleEditEntry(entry)}
                        title="Edit Entry"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button 
                        className="btn btn-sm btn-danger"
                        onClick={() => onDeleteFinancialEntry(entry._id)}
                        title="Delete Entry"
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

      {/* Financial Charts */}
      <div className="financial-charts">
        <div className="chart-card">
          <h3>Monthly Income vs Expenses</h3>
          <div className="chart-wrapper">
            <canvas id="financialChart"></canvas>
          </div>
        </div>
      </div>

      {/* Financial Reports */}
      <div className="financial-reports">
        <h3>Financial Reports</h3>
        <div className="reports-grid">
          <div className="report-card">
            <i className="fas fa-file-pdf"></i>
            <h4>Monthly Report</h4>
            <p>Generate monthly financial report (PDF)</p>
            <button 
              className="btn btn-primary" 
              onClick={handleGenerateMonthlyReport}
              disabled={loading}
            >
              {loading ? 'Generating...' : 'Generate PDF'}
            </button>
          </div>
          <div className="report-card">
            <i className="fas fa-file-excel"></i>
            <h4>Expense Report</h4>
            <p>Export expense details (CSV)</p>
            <button 
              className="btn btn-secondary" 
              onClick={handleGenerateExpenseReport}
              disabled={loading}
            >
              {loading ? 'Exporting...' : 'Export CSV'}
            </button>
          </div>
          <div className="report-card">
            <i className="fas fa-file-csv"></i>
            <h4>Income Report</h4>
            <p>Export income details (CSV)</p>
            <button 
              className="btn btn-success" 
              onClick={handleGenerateIncomeReport}
              disabled={loading}
            >
              {loading ? 'Exporting...' : 'Export CSV'}
            </button>
          </div>
        </div>
      </div>

      {/* Financial Entry Modal */}
      {showFinancialModal && (
        <div className="modal-overlay" onClick={handleCancelEdit}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={handleCancelEdit}>&times;</button>
            <h2>{editingEntry ? 'Edit' : 'Add'} {financialFormData.type === 'income' ? 'Income' : 'Expense'}</h2>

            <form onSubmit={handleFinancialSubmit}>
              <div className="form-group">
                <label htmlFor="type">Type <span className="required">*</span></label>
                <select
                  id="type"
                  value={financialFormData.type}
                  onChange={(e) => setFinancialFormData({...financialFormData, type: e.target.value})}
                  className={validationErrors.type ? 'error' : ''}
                  required
                >
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
                {validationErrors.type && (
                  <div className="error-message">{validationErrors.type}</div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="category">Category <span className="required">*</span></label>
                <select
                  id="category"
                  value={financialFormData.category}
                  onChange={(e) => setFinancialFormData({...financialFormData, category: e.target.value})}
                  className={validationErrors.category ? 'error' : ''}
                  required
                >
                  {financialFormData.type === 'income' ? (
                    <>
                      <option value="booking_fees">Booking Fees</option>
                      <option value="rental_income">Rental Income</option>
                      <option value="service_fees">Service Fees</option>
                      <option value="other_income">Other Income</option>
                    </>
                  ) : (
                    <>
                      <option value="driver_salary">Driver Salary</option>
                      <option value="fuel">Fuel</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="insurance">Insurance</option>
                      <option value="office_rent">Office Rent</option>
                      <option value="utilities">Utilities</option>
                      <option value="marketing">Marketing</option>
                      <option value="other_expense">Other Expense</option>
                    </>
                  )}
                </select>
                {validationErrors.category && (
                  <div className="error-message">{validationErrors.category}</div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="description">Description <span className="required">*</span></label>
                <input
                  type="text"
                  id="description"
                  value={financialFormData.description}
                  onChange={(e) => setFinancialFormData({...financialFormData, description: e.target.value})}
                  placeholder="Enter description..."
                  className={validationErrors.description ? 'error' : ''}
                  required
                />
                {validationErrors.description && (
                  <div className="error-message">{validationErrors.description}</div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="amount">Amount (LKR) <span className="required">*</span></label>
                <input
                  type="number"
                  id="amount"
                  value={financialFormData.amount}
                  onChange={(e) => setFinancialFormData({...financialFormData, amount: e.target.value})}
                  placeholder="Enter amount..."
                  min="0.01"
                  step="0.01"
                  className={validationErrors.amount ? 'error' : ''}
                  required
                />
                {validationErrors.amount && (
                  <div className="error-message">{validationErrors.amount}</div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="date">Date <span className="required">*</span></label>
                <input
                  type="date"
                  id="date"
                  value={financialFormData.date}
                  onChange={(e) => setFinancialFormData({...financialFormData, date: e.target.value})}
                  max={new Date().toISOString().split('T')[0]}
                  className={validationErrors.date ? 'error' : ''}
                  required
                />
                {validationErrors.date && (
                  <div className="error-message">{validationErrors.date}</div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="reference">Reference (Optional)</label>
                <input
                  type="text"
                  id="reference"
                  value={financialFormData.reference}
                  onChange={(e) => setFinancialFormData({...financialFormData, reference: e.target.value})}
                  placeholder="Enter reference number or note..."
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={handleCancelEdit}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? (editingEntry ? 'Updating...' : 'Adding...') : (editingEntry ? 'Update Entry' : 'Add Entry')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialManagement;







