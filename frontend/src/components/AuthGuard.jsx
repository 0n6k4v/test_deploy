import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const AuthGuard = ({ children }) => {
  const location = useLocation();
  const isAuthenticated = localStorage.getItem('token') !== null;

  useEffect(() => {
    // You could also verify token validity here if needed
    // For example, by making an API call to validate the token
  }, []);

  if (!isAuthenticated) {
    // Redirect to login page if not authenticated
    // Pass the current location they were trying to access to redirect later
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If authenticated, render the children components
  return children;
};

export default AuthGuard;