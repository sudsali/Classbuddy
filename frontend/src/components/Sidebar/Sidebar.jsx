// src/components/Sidebar/Sidebar.jsx
import React from 'react';

const Sidebar = () => {
  const navItems = [
    "Home",
    "Meeting Planner",
    "Notifications",
    "Groups",
    "Bookmarks",
    "Task Tracker",
    "Direct Messages"
  ];

  return (
    <div style={{
      width: '200px',
      height: '100vh',
      backgroundColor: '#f4f4f4',
      padding: '20px',
      position: 'fixed',
      left: 0,
      top: 0
    }}>
      <h3>ClassBuddy</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {navItems.map((item, index) => (
          <li key={index} style={{ margin: '20px 0', cursor: 'pointer' }}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
