import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FaCalendarAlt, 
  FaBell, 
  FaUsers, 
  FaBookmark, 
  FaTasks, 
  FaComments,
  FaGraduationCap,
  FaUser,
  FaSignOutAlt
} from 'react-icons/fa';
import './Sidebar.css';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { icon: <FaUsers />, text: 'Groups', path: '/groups' },
    { icon: <FaCalendarAlt />, text: 'Meeting Planner', path: '/meetings' },
    { icon: <FaBell />, text: 'Notifications', path: '/notifications' },
    { icon: <FaBookmark />, text: 'Bookmarks', path: '/bookmarks' },
    { icon: <FaTasks />, text: 'Task Tracker', path: '/tasks' },
    { icon: <FaComments />, text: 'Direct Messages', path: '/messages' },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="logo-container">
          <FaGraduationCap className="logo" />
          <span className="logo-text">ClassBuddy</span>
        </div>
      </div>
      
      <nav className="sidebar-nav">
        {menuItems.map((item, index) => (
          <Link 
            to={item.path} 
            key={index} 
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-text">{item.text}</span>
          </Link>
        ))}
      </nav>

      <div className="user-section">
        <div className="user-profile">
          <FaUser className="user-icon" />
          {user && (
            <span className="user-name">
              {user.first_name} {user.last_name}
            </span>
          )}
        </div>
        <button onClick={handleLogout} className="logout-button">
          <FaSignOutAlt className="logout-icon" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar; 