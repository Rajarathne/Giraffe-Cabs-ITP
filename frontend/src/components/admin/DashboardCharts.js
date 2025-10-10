import React from 'react';
import { Line, Doughnut } from 'react-chartjs-2';
import './DashboardCharts.css';

const DashboardCharts = ({ 
  chartData, 
  getMonthlyRegistrationChartData, 
  getVehicleTypeChartData, 
  getBookingTypeChartData,
  getMonthlyBookingChartData,
  getRentalStatusChartData,
  chartOptions,
  doughnutOptions
}) => {
  // Debug logging
  console.log('DashboardCharts rendered with:', {
    chartData,
    chartOptions,
    doughnutOptions,
    hasRegistrationData: !!getMonthlyRegistrationChartData
  });

  return (
    <div className="charts-section">
      <div className="chart-container">
        <div className="chart-card">
          <h3>Vehicle Registration Trends (2025)</h3>
          <div className="chart-wrapper">
            {getMonthlyRegistrationChartData ? (
              <Line data={getMonthlyRegistrationChartData()} options={chartOptions} />
            ) : (
              <div style={{ color: '#666', textAlign: 'center' }}>
                No chart data available
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="chart-container">
        <div className="chart-card">
          <h3>Vehicles by Type</h3>
          <div className="chart-wrapper">
            <Doughnut data={getVehicleTypeChartData()} options={doughnutOptions} />
          </div>
        </div>
      </div>

      <div className="chart-container">
        <div className="chart-card">
          <h3>Monthly Booking Trends</h3>
          <div className="chart-wrapper">
            <Line data={getMonthlyBookingChartData()} options={chartOptions} />
          </div>
        </div>
      </div>

      <div className="chart-container">
        <div className="chart-card">
          <h3>Bookings by Service Type</h3>
          <div className="chart-wrapper">
            <Doughnut data={getBookingTypeChartData()} options={doughnutOptions} />
          </div>
        </div>
      </div>

      <div className="chart-container">
        <div className="chart-card">
          <h3>Rental Status Distribution</h3>
          <div className="chart-wrapper">
            <Doughnut data={getRentalStatusChartData()} options={doughnutOptions} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardCharts;
