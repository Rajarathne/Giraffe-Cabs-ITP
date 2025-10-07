import React, { useMemo, useState } from 'react';
import axios from 'axios';
import './RentalManagement.css';

const RentalManagement = ({ 
  rentals, 
  vehicles,
  rentalData, 
  setRentalData,
  showRentalModal, 
  setShowRentalModal, 
  editingRental, 
  setEditingRental,
  loading,
  onRentalSubmit,
  onDeleteRental,
  onUpdateRentalStatus
}) => {

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const generateRentalReport = async (reportType) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      const headers = { Authorization: `Bearer ${token}` };
      let endpoint = '';
      let filename = '';
      let responseType = 'blob';

      if (reportType === 'excel') {
        endpoint = '/api/rentals/reports/excel';
        filename = `Rental_Contracts_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
        responseType = 'blob';
      } else if (reportType === 'pdf') {
        endpoint = '/api/rentals/reports/pdf';
        filename = `Rental_Contracts_Report_${new Date().toISOString().split('T')[0]}.pdf`;
        responseType = 'blob';
      }

      const response = await axios.get(endpoint, {
        headers,
        responseType
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      alert(`${reportType.toUpperCase()} report generated successfully!`);
    } catch (error) {
      console.error(`Error generating ${reportType} report:`, error);
      alert(`Failed to generate ${reportType.toUpperCase()} report: ${error.response?.data?.message || error.message}`);
    }
  };
  const filteredRentals = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return rentals.filter(r => {
      const matchesSearch = !term ||
        (r.contractId || '').toLowerCase().includes(term) ||
        (r.vehicle?.vehicleNumber || '').toLowerCase().includes(term) ||
        (`${r.user?.firstName || ''} ${r.user?.lastName || ''}`.trim().toLowerCase().includes(term));
      const matchesType = typeFilter === 'all' || r.rentalType === typeFilter;
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [rentals, searchTerm, typeFilter, statusFilter]);

  return (
    <div className="rentals-content">
      <div className="content-header">
        <h2>Rental Contract Management</h2>
        <div className="header-actions">
          <div className="report-buttons">
            <button 
              className="btn btn-success" 
              onClick={() => generateRentalReport('excel')}
              title="Export to Excel"
            >
              <i className="fas fa-file-excel"></i> Excel Report
            </button>
            <button 
              className="btn btn-danger" 
              onClick={() => generateRentalReport('pdf')}
              title="Export to PDF"
            >
              <i className="fas fa-file-pdf"></i> PDF Report
            </button>
          </div>
          <button className="btn btn-primary" onClick={() => {
            setEditingRental(null);
            setRentalData({
              vehicleId: '', rentalType: '', startDate: '', endDate: '',
              duration: '', purpose: '', specialRequirements: '', monthlyFee: '', dailyFee: '',
              totalAmount: '', conditions: '', contractTerms: '', adminGuidelines: ''
            });
            setShowRentalModal(true);
          }}>
            <i className="fas fa-plus"></i> Create New Contract
          </button>
        </div>
      </div>

      {/* Compact Search & Filter */}
      <div className="compact-search-filter">
        <div className="search-input-wrapper">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search by contract, vehicle, or user..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-btn" onClick={() => setSearchTerm('')} title="Clear">
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
        <div className="filter-dropdowns">
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="all">All Types</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="long-term">Long Term</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="results-info">{filteredRentals.length} result{filteredRentals.length !== 1 ? 's' : ''}</div>
      </div>

      <div className="rentals-table">
        <table>
          <thead>
            <tr>
              <th>Contract ID</th>
              <th>Vehicle</th>
              <th>User</th>
              <th>Type</th>
              <th>Duration</th>
              <th>Status</th>
              <th>Fee</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRentals.map(rental => (
              <tr key={rental._id}>
                <td>{rental.contractId || 'N/A'}</td>
                <td>{rental.vehicle?.vehicleNumber}</td>
                <td>{rental.user?.firstName} {rental.user?.lastName}</td>
                <td>{rental.rentalType}</td>
                <td>{rental.duration}</td>
                <td>
                  <span className={`status status-${rental.status}`}>
                    {rental.status}
                  </span>
                </td>
                <td>
                  {rental.rentalType === 'daily' ? (
                    <>LKR {rental.dailyFee?.toLocaleString() || '0'}/day</>
                  ) : (
                    <>LKR {rental.monthlyFee?.toLocaleString() || '0'}/month</>
                  )}
                </td>
                <td>
                  <div className="action-buttons">
                    <button 
                      className="btn btn-sm btn-outline"
                      onClick={() => {
                        setEditingRental(rental);
                        setRentalData({
                          vehicleId: rental.vehicle._id,
                          rentalType: rental.rentalType,
                          startDate: rental.startDate ? new Date(rental.startDate).toISOString().split('T')[0] : '',
                          endDate: rental.endDate ? new Date(rental.endDate).toISOString().split('T')[0] : '',
                          duration: rental.duration,
                          purpose: rental.purpose,
                          specialRequirements: rental.specialRequirements,
                          monthlyFee: rental.monthlyFee,
                          dailyFee: rental.dailyFee,
                          totalAmount: rental.totalAmount,
                          conditions: rental.conditions,
                          contractTerms: rental.contractTerms,
                          adminGuidelines: rental.adminGuidelines
                        });
                        setShowRentalModal(true);
                      }}
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    {rental.status === 'pending' && (
                      <button 
                        className="btn btn-sm btn-success"
                        onClick={() => onUpdateRentalStatus(rental._id, 'approved')}
                      >
                        <i className="fas fa-check"></i> Approve
                      </button>
                    )}
                    {rental.status === 'approved' && (
                      <button 
                        className="btn btn-sm btn-info"
                        onClick={() => onUpdateRentalStatus(rental._id, 'active')}
                      >
                        <i className="fas fa-play"></i> Activate
                      </button>
                    )}
                    <button 
                      className="btn btn-sm btn-danger"
                      onClick={() => onDeleteRental(rental._id)}
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

      {/* Rental Modal */}
      {showRentalModal && (
        <div className="modal-overlay" onClick={() => setShowRentalModal(false)}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowRentalModal(false)}>&times;</button>
            <h2>
              {editingRental ? 'Edit Rental Contract' : 'Create New Rental Contract'}
            </h2>
            <form onSubmit={onRentalSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="vehicleId">Vehicle</label>
                  <select
                    id="vehicleId"
                    value={rentalData.vehicleId}
                    onChange={(e) => setRentalData({...rentalData, vehicleId: e.target.value})}
                    required
                  >
                    <option value="">Select Vehicle</option>
                    {vehicles.map(vehicle => (
                      <option key={vehicle._id} value={vehicle._id}>
                        {vehicle.vehicleNumber} - {vehicle.brand} {vehicle.model}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="rentalType">Rental Type</label>
                  <select
                    id="rentalType"
                    value={rentalData.rentalType}
                    onChange={(e) => setRentalData({...rentalData, rentalType: e.target.value})}
                    required
                  >
                    <option value="">Select Type</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="long-term">Long Term</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="startDate">Start Date</label>
                  <input
                    type="date"
                    id="startDate"
                    value={rentalData.startDate}
                    onChange={(e) => setRentalData({...rentalData, startDate: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="endDate">End Date</label>
                  <input
                    type="date"
                    id="endDate"
                    value={rentalData.endDate}
                    onChange={(e) => setRentalData({...rentalData, endDate: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="duration">Duration</label>
                  <input
                    type="text"
                    id="duration"
                    value={rentalData.duration}
                    onChange={(e) => setRentalData({...rentalData, duration: e.target.value})}
                    placeholder="e.g., 6 months"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="purpose">Purpose</label>
                <input
                  type="text"
                  id="purpose"
                  value={rentalData.purpose}
                  onChange={(e) => setRentalData({...rentalData, purpose: e.target.value})}
                  placeholder="e.g., Business use, Personal use"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="specialRequirements">Special Requirements</label>
                <textarea
                  id="specialRequirements"
                  rows="3"
                  value={rentalData.specialRequirements}
                  onChange={(e) => setRentalData({...rentalData, specialRequirements: e.target.value})}
                  placeholder="Any special requirements or conditions..."
                ></textarea>
              </div>

              <div className="form-row">
                {rentalData.rentalType === 'daily' ? (
                  <div className="form-group">
                    <label htmlFor="dailyFee">Daily Fee (LKR)</label>
                    <input
                      type="number"
                      id="dailyFee"
                      value={rentalData.dailyFee || ''}
                      onChange={(e) => setRentalData({...rentalData, dailyFee: parseInt(e.target.value)})}
                      required
                    />
                  </div>
                ) : (
                  <div className="form-group">
                    <label htmlFor="monthlyFee">Monthly Fee (LKR)</label>
                    <input
                      type="number"
                      id="monthlyFee"
                      value={rentalData.monthlyFee || ''}
                      onChange={(e) => setRentalData({...rentalData, monthlyFee: parseInt(e.target.value)})}
                      required
                    />
                  </div>
                )}
                <div className="form-group">
                  <label htmlFor="totalAmount">Total Amount (LKR)</label>
                  <input
                    type="number"
                    id="totalAmount"
                    value={rentalData.totalAmount || ''}
                    onChange={(e) => setRentalData({...rentalData, totalAmount: parseInt(e.target.value)})}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="conditions">General Conditions</label>
                <textarea
                  id="conditions"
                  rows="4"
                  value={rentalData.conditions}
                  onChange={(e) => setRentalData({...rentalData, conditions: e.target.value})}
                  placeholder="Enter general rental conditions..."
                ></textarea>
              </div>

              <div className="form-group">
                <label htmlFor="contractTerms">Detailed Contract Terms</label>
                <textarea
                  id="contractTerms"
                  rows="4"
                  value={rentalData.contractTerms}
                  onChange={(e) => setRentalData({...rentalData, contractTerms: e.target.value})}
                  placeholder="Enter detailed contract terms and conditions..."
                ></textarea>
              </div>

              <div className="form-group">
                <label htmlFor="adminGuidelines">Admin Guidelines & Instructions</label>
                <textarea
                  id="adminGuidelines"
                  rows="4"
                  value={rentalData.adminGuidelines}
                  onChange={(e) => setRentalData({...rentalData, adminGuidelines: e.target.value})}
                  placeholder="Enter admin guidelines and special instructions..."
                ></textarea>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowRentalModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : (editingRental?.status === 'pending' ? 'Create Contract & Approve' : 'Update Contract')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RentalManagement;
