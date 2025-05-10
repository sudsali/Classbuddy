
// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Sidebar from './components/Sidebar';
import Groups from './pages/Groups';
import MeetingPlanner from './pages/MeetingPlanner';
import './styles/theme.css';
import './App.css';

// Import your other page components here
const Meetings = () => <div>Meeting Planner</div>;
const Notifications = () => <div>Notifications</div>;
const Bookmarks = () => <div>Bookmarks</div>;
const Tasks = () => <div>Task Tracker</div>;
const Messages = () => <div>Direct Messages</div>;

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
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Navigate to="/groups" replace />} />
          <Route path="/meetings" element={<PrivateRoute><MeetingPlanner /></PrivateRoute>} />
          <Route path="/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />
          <Route path="/groups" element={<PrivateRoute><Groups /></PrivateRoute>} />
          <Route path="/bookmarks" element={<PrivateRoute><Bookmarks /></PrivateRoute>} />
          <Route path="/tasks" element={<PrivateRoute><Tasks /></PrivateRoute>} />
          <Route path="/messages" element={<PrivateRoute><Messages /></PrivateRoute>} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
