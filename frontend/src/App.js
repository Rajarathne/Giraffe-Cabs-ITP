import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Components
import LandingPage from './components/LandingPage';
import Home from './components/Home';
import AdminDashboard from './components/AdminDashboard';
import VehicleList from './components/VehicleList';
import Profile from './components/Profile';
import Booking from './components/Booking';
import Payment from './components/Payment';
import TourPackages from './components/TourPackages';
import VehicleProviderAuth from './components/VehicleProviderAuth';
import VehicleProviderDashboard from './components/VehicleProviderDashboard';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vehicles"
            element={
              <ProtectedRoute>
                <VehicleList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/booking"
            element={
              <ProtectedRoute>
                <Booking />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payment"
            element={
              <ProtectedRoute>
                <Payment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tour-packages"
            element={
              <ProtectedRoute>
                <TourPackages />
              </ProtectedRoute>
            }
          />
          <Route path="/vehicle-provider-auth" element={<VehicleProviderAuth />} />
          <Route
            path="/vehicle-provider-dashboard"
            element={<VehicleProviderDashboard />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </div>
    </Router>
  );
}

export default App;
