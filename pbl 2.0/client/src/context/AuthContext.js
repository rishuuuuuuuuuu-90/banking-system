import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getMe } from '../api/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // Verify token and fetch fresh user data on mount
  useEffect(() => {
    const verifyAuth = async () => {
      if (token) {
        try {
          const res = await getMe();
          const freshUser = res.data.data.user;
          setUser(freshUser);
          localStorage.setItem('user', JSON.stringify(freshUser));
        } catch {
          logout();
        }
      }
      setLoading(false);
    };
    verifyAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback((tokenValue, userData) => {
    localStorage.setItem('token', tokenValue);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(tokenValue);
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((userData) => {
    const updated = { ...user, ...userData };
    localStorage.setItem('user', JSON.stringify(updated));
    setUser(updated);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export default AuthContext;
