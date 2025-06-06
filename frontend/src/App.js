// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Sidebar from './components/Sidebar';
import Groups from './pages/Groups';  // Import the actual Groups component
import MeetingPlanner from './pages/MeetingPlanner';
import DirectMessages from './pages/DirectMessages';
import './styles/theme.css';
import './App.css';
import ForgotPassword from './pages/ForgetPassword';

// Import your other page components here
//const Meetings = () => <div>Meeting Planner</div>;

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

const App = () => {
  const { loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Router>
      <div className="app">
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/" element={<Navigate to="/groups" replace />} />
          <Route path="/meetings" element={<PrivateRoute><MeetingPlanner /></PrivateRoute>} />
          <Route path="/groups" element={<PrivateRoute><Groups /></PrivateRoute>} />
          <Route path="/messages" element={<PrivateRoute><DirectMessages /></PrivateRoute>} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
