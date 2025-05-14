import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
axios.defaults.baseURL = API_URL;

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Set up axios defaults
  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Token ${token}`;
    }
  }, []);

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (token) {
      axios.get('/api/users/profile/')
        .then(response => {
          setUser(response.data);
          setLoading(false);
        })
        .catch(() => {
          sessionStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/users/login/', {
        email,
        password
      });
      const { token, user } = response.data;
      sessionStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Token ${token}`;
      setUser(user);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Login failed' };
    }
  };

  const register = async (userData) => {
    try {
      await axios.post('/api/users/register/', userData);
      return { success: true };
    } catch (error) {
      const errorData = error.response?.data;
      let errorMessage = 'Registration failed';
      
      if (errorData) {
        const messages = [];
        Object.entries(errorData).forEach(([field, errors]) => {
          if (Array.isArray(errors)) {
            messages.push(...errors);
          } else if (typeof errors === 'string') {
            messages.push(errors);
          }
        });
        if (messages.length > 0) {
          errorMessage = messages.join('\n');
        }
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const updateUser = (userData) => {
    setUser(userData);
  };

  const logout = () => {
    sessionStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
