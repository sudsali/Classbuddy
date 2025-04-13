import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const token = sessionStorage.getItem('token');
    if (token) {
      // Verify token and get user info
      axios.get('http://127.0.0.1:8000/api/auth/user/', {
        headers: { Authorization: `Token ${token}` }
      })
      .then(response => {
        setUser(response.data);
        setLoading(false);
      })
      .catch(() => {
        sessionStorage.removeItem('token');
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post('http://127.0.0.1:8000/api/auth/login/', {
        email,
        password
      });
      const { token, user } = response.data;
      sessionStorage.setItem('token', token);
      setUser(user);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Login failed' };
    }
  };

  const register = async (userData) => {
    try {
      await axios.post('http://127.0.0.1:8000/api/auth/register/', userData);
      return { success: true };
    } catch (error) {
      // Format error messages from the backend
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

  const logout = () => {
    sessionStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
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