import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/events">🎓 College Events</Link>
      </div>
      <div className="navbar-links">
        {!user ? (
          <>
            <Link to="/events">Events</Link>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        ) : (
          <>
            <Link to="/events">Events</Link>
            {user.role === 'student' && (
              <Link to="/my-tickets">My Tickets</Link>
            )}
            {user.role === 'organizer' && (
              <Link to="/organizer">Dashboard</Link>
            )}
            {user.role === 'admin' && (
              <Link to="/admin">Admin</Link>
            )}
            <div className="navbar-user">
              <span className="user-name">{user.name}</span>
              <span className={`role-badge role-${user.role}`}>{user.role}</span>
              <button className="btn-logout" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
