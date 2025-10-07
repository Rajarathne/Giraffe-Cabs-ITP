import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const token = localStorage.getItem('authToken');
  const user = JSON.parse(localStorage.getItem('currentUser') || 'null');

  if (!token || !user) {
    return <Navigate to="/" replace />;
  }

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/home" replace />;
  }

  return children;
};

export default ProtectedRoute;
























































































