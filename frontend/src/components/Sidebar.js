import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
import { NavLink } from 'react-router-dom';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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
        <NavLink to="/groups" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <FaUsers className="nav-icon" />
          <span>Groups</span>
        </NavLink>
        <NavLink to="/meetings" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <FaCalendarAlt className="nav-icon" />
          <span>Meeting Planner</span>
        </NavLink>
        <NavLink to="/messages" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <FaComments className="nav-icon" />
          <span>Direct Messages</span>
        </NavLink>
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