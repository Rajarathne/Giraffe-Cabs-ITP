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
  return (
    <div className="charts-section">
      <div className="chart-container">
        <div className="chart-card">
          <h3>Vehicle Registration Trends (2024)</h3>
          <div className="chart-wrapper">
            <Line data={getMonthlyRegistrationChartData()} options={chartOptions} />
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
