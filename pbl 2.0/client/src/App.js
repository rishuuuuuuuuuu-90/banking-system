import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import EventsListing from './pages/EventsListing';
import MyTickets from './pages/MyTickets';
import OrganizerDashboard from './pages/OrganizerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import './App.css';

// Route guard
const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="app-loading">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/events" replace />;
  }
  return children;
};

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) return <div className="app-loading">Loading...</div>;

  return (
    <>
      <Navbar />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Navigate to="/events" replace />} />
          <Route
            path="/login"
            element={user ? <Navigate to="/events" replace /> : <Login />}
          />
          <Route
            path="/register"
            element={user ? <Navigate to="/events" replace /> : <Register />}
          />
          <Route path="/events" element={<EventsListing />} />
          <Route
            path="/my-tickets"
            element={
              <ProtectedRoute roles={['student']}>
                <MyTickets />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organizer"
            element={
              <ProtectedRoute roles={['organizer']}>
                <OrganizerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/events" replace />} />
        </Routes>
      </main>
    </>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
