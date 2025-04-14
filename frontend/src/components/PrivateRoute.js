import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from './Sidebar';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="loading">Loading...</div>;
  }
  
  return user ? (
    <>
      <Sidebar />
      <div className="main-layout">
        {children}
      </div>
    </>
  ) : (
    <Navigate to="/login" />
  );
};

export default PrivateRoute; 