import React from 'react';
import '../styles/Navbar.css';

interface NavbarProps {
  user?: {
    id: string;
    username: string;
  } | null;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, onLogout }) => {
  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <h1>GoatVision</h1>
      </div>
      
      <div className="navbar-links">
        <button className="navbar-link active">Dashboard</button>
        <button className="navbar-link">Metrics</button>
        <button className="navbar-link">Alerts</button>
        <button className="navbar-link">Settings</button>
      </div>
      
      <div className="navbar-user">
        <span className="user-name">{user?.username || 'User'}</span>
        <button className="logout-button" onClick={onLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar; 