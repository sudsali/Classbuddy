import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FaCalendarAlt, 
  FaUsers, 
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
      
      <div className="user-profile">
        <Link to="/profile" className="profile-link">
          <FaUser className="profile-icon" />
          <div className="user-info">
            <span className="user-name">{user?.first_name} {user?.last_name}</span>
            <span className="user-email">{user?.email}</span>
          </div>
        </Link>
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

      <div className="logout-container">
        <button onClick={handleLogout} className="logout-button">
          <FaSignOutAlt className="logout-icon" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar; 