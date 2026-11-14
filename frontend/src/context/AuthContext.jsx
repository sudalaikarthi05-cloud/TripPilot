import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser, getCurrentUser, logoutUser } from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => {
    return (
      localStorage.getItem('trippilot_token') ||
      sessionStorage.getItem('trippilot_token') ||
      null
    );
  });
  const [loading, setLoading] = useState(true);
  const [journeyPlaying, setJourneyPlaying] = useState(false);

  // Restore authenticated session on mount by checking with backend
  useEffect(() => {
    let isMounted = true;

    const verifySession = async () => {
      const savedToken =
        localStorage.getItem('trippilot_token') ||
        sessionStorage.getItem('trippilot_token');

      if (!savedToken) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const res = await getCurrentUser();
        if (isMounted) {
          setUser(res.data);
          setToken(savedToken);
        }
      } catch (err) {
        console.warn('Session verification failed, logging out:', err.message);
        localStorage.removeItem('trippilot_token');
        localStorage.removeItem('trippilot_user');
        sessionStorage.removeItem('trippilot_token');
        sessionStorage.removeItem('trippilot_user');
        if (isMounted) {
          setUser(null);
          setToken(null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    verifySession();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = async ({ email, password, rememberMe = false }) => {
    // Optional dev-only mock behind explicit env flag (OFF by default)
    if (import.meta.env.VITE_USE_MOCK_AUTH === 'true') {
      if (password === 'wrongpassword') {
        throw new Error('Invalid email or password.');
      }
      const mockUser = { id: 'mock-user-1', name: email.split('@')[0] || 'Traveler', email };
      const mockToken = 'mock-jwt-token-dev-only';
      if (rememberMe) {
        localStorage.setItem('trippilot_token', mockToken);
        localStorage.setItem('trippilot_user', JSON.stringify(mockUser));
      } else {
        sessionStorage.setItem('trippilot_token', mockToken);
        sessionStorage.setItem('trippilot_user', JSON.stringify(mockUser));
      }
      setJourneyPlaying(true);
      setToken(mockToken);
      setUser(mockUser);
      return { token: mockToken, user: mockUser };
    }

    // Real backend authentication (/api/auth/login)
    try {
      const res = await loginUser({ email, password, rememberMe });
      const { token: receivedToken, user: receivedUser } = res.data;

      // Clear any prior tokens
      localStorage.removeItem('trippilot_token');
      localStorage.removeItem('trippilot_user');
      sessionStorage.removeItem('trippilot_token');
      sessionStorage.removeItem('trippilot_user');

      if (rememberMe) {
        localStorage.setItem('trippilot_token', receivedToken);
        localStorage.setItem('trippilot_user', JSON.stringify(receivedUser));
      } else {
        sessionStorage.setItem('trippilot_token', receivedToken);
        sessionStorage.setItem('trippilot_user', JSON.stringify(receivedUser));
      }

      setJourneyPlaying(true);
      setToken(receivedToken);
      setUser(receivedUser);
      return res.data;
    } catch (err) {
      setJourneyPlaying(false);
      // Clean up any stale state
      setUser(null);
      setToken(null);
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        (err.code === 'ERR_NETWORK' || !err.response
          ? 'Unable to connect to TripPilot authentication server. Please ensure the backend is running.'
          : err.message || 'Invalid credentials. Please try again.');
      const customErr = new Error(message);
      customErr.response = err.response;
      throw customErr;
    }
  };

  const register = async ({ name, email, password }) => {
    // Optional dev-only mock behind explicit env flag (OFF by default)
    if (import.meta.env.VITE_USE_MOCK_AUTH === 'true') {
      const mockUser = { id: 'mock-user-new', name, email };
      const mockToken = 'mock-jwt-token-dev-only';
      localStorage.setItem('trippilot_token', mockToken);
      localStorage.setItem('trippilot_user', JSON.stringify(mockUser));
      setJourneyPlaying(true);
      setToken(mockToken);
      setUser(mockUser);
      return { token: mockToken, user: mockUser };
    }

    // Real backend registration (/api/auth/register)
    try {
      const res = await registerUser({ name, email, password });
      const { token: receivedToken, user: receivedUser } = res.data;

      localStorage.setItem('trippilot_token', receivedToken);
      localStorage.setItem('trippilot_user', JSON.stringify(receivedUser));

      setJourneyPlaying(true);
      setToken(receivedToken);
      setUser(receivedUser);
      return res.data;
    } catch (err) {
      setJourneyPlaying(false);
      setUser(null);
      setToken(null);
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        (err.code === 'ERR_NETWORK' || !err.response
          ? 'Unable to connect to TripPilot registration server. Please ensure the backend is running.'
          : err.message || 'Registration failed. Please try again.');
      const customErr = new Error(message);
      customErr.response = err.response;
      throw customErr;
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch {
      // Ignore network errors on logout
    }
    localStorage.removeItem('trippilot_token');
    localStorage.removeItem('trippilot_user');
    sessionStorage.removeItem('trippilot_token');
    sessionStorage.removeItem('trippilot_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        loading,
        journeyPlaying,
        setJourneyPlaying,
        login,
        register,
        logout,
      }}
    >
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
