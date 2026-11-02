import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('chatboat_token') || null);
  const [loading, setLoading] = useState(true);

  // Set default axios headers whenever token changes
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('chatboat_token', token);
      fetchCurrentUser();
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('chatboat_token');
      setUser(null);
      setLoading(false);
    }
  }, [token]);

  const fetchCurrentUser = async () => {
    try {
      const res = await axios.get('/api/auth/me');
      if (res.data?.success) {
        setUser(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch user session:', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (loginIdentifier, password) => {
    try {
      const res = await axios.post('/api/auth/login', {
        login: loginIdentifier,
        password
      });

      if (res.data?.success) {
        setToken(res.data.data.token);
        setUser(res.data.data.user);
        return { success: true, user: res.data.data.user };
      }
      throw new Error(res.data?.message || 'Login failed');
    } catch (error) {
      // If email is not verified, pass requireVerification to UI
      if (error.response?.data?.requireVerification) {
        return {
          requireVerification: true,
          email: error.response.data.email,
          devOtp: error.response.data.devOtp,
          message: error.response.data.message
        };
      }
      throw error;
    }
  };

  const register = async (userData) => {
    const res = await axios.post('/api/auth/register', userData);
    if (res.data?.success) {
      if (res.data.requireVerification) {
        return {
          requireVerification: true,
          email: res.data.email,
          devOtp: res.data.devOtp,
          message: res.data.message
        };
      }
      if (res.data.data?.token) {
        setToken(res.data.data.token);
        setUser(res.data.data.user);
        return { success: true, user: res.data.data.user };
      }
    }
    throw new Error(res.data?.message || 'Registration failed');
  };

  const verifyEmail = async ({ email, otp }) => {
    const res = await axios.post('/api/auth/verify-email', { email, otp });
    if (res.data?.success && res.data.data?.token) {
      setToken(res.data.data.token);
      setUser(res.data.data.user);
      return res.data.data.user;
    }
    throw new Error(res.data?.message || 'Verification failed');
  };

  const resendOtp = async ({ email }) => {
    const res = await axios.post('/api/auth/resend-otp', { email });
    return res.data;
  };

  const logout = async () => {
    try {
      if (token) {
        await axios.post('/api/auth/logout');
      }
    } catch (err) {
      console.warn('Logout API error:', err.message);
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem('chatboat_token');
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  const updateProfile = async (updatedData) => {
    const res = await axios.put('/api/auth/profile', updatedData);
    if (res.data?.success) {
      setUser(res.data.data);
      return res.data.data;
    }
    throw new Error(res.data?.message || 'Update failed');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        verifyEmail,
        resendOtp,
        logout,
        updateProfile,
        refreshUser: fetchCurrentUser,
        isAuthenticated: !!token && !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
