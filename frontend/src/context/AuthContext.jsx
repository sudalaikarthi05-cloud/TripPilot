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

  // Restore authenticated session on mount
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
        // If network error (backend offline locally), keep existing stored user rather than logging out
        const isNetworkErr = !err.response && (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error'));
        if (isNetworkErr) {
          const rawUser = localStorage.getItem('trippilot_user') || sessionStorage.getItem('trippilot_user');
          if (rawUser) {
            try {
              if (isMounted) {
                setUser(JSON.parse(rawUser));
                setToken(savedToken);
              }
              return;
            } catch {
              // Ignore JSON parse error
            }
          }
        }

        // Token expired or invalid
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
    try {
      const res = await loginUser({ email, password, rememberMe });
      const { token: receivedToken, user: receivedUser } = res.data;

      // Clear any previous token
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
      // If backend is offline / unreachable, provide local fallback session so animation testing works seamlessly
      const isNetworkErr =
        !err.response &&
        (err.code === 'ERR_NETWORK' ||
          err.code === 'ECONNREFUSED' ||
          err.message?.includes('Network Error') ||
          err.message?.toLowerCase().includes('network') ||
          err.message?.toLowerCase().includes('connection') ||
          err.message?.toLowerCase().includes('failed to fetch'));
      if (isNetworkErr) {
        console.warn('Backend unavailable, activating local session fallback:', err.message);
        const fallbackUser = {
          id: 'demo-user-1',
          name: email.split('@')[0] || 'Traveler',
          email: email.trim(),
        };
        const fallbackToken = 'trippilot-offline-demo-token';

        localStorage.removeItem('trippilot_token');
        localStorage.removeItem('trippilot_user');
        sessionStorage.removeItem('trippilot_token');
        sessionStorage.removeItem('trippilot_user');

        if (rememberMe) {
          localStorage.setItem('trippilot_token', fallbackToken);
          localStorage.setItem('trippilot_user', JSON.stringify(fallbackUser));
        } else {
          sessionStorage.setItem('trippilot_token', fallbackToken);
          sessionStorage.setItem('trippilot_user', JSON.stringify(fallbackUser));
        }

        setJourneyPlaying(true);
        setToken(fallbackToken);
        setUser(fallbackUser);
        return { token: fallbackToken, user: fallbackUser };
      }
      setJourneyPlaying(false);
      throw err;
    }
  };

  const register = async ({ name, email, password }) => {
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
      // If backend is offline / unreachable, provide local fallback session
      const isNetworkErr =
        !err.response &&
        (err.code === 'ERR_NETWORK' ||
          err.code === 'ECONNREFUSED' ||
          err.message?.includes('Network Error') ||
          err.message?.toLowerCase().includes('network') ||
          err.message?.toLowerCase().includes('connection') ||
          err.message?.toLowerCase().includes('failed to fetch'));
      if (isNetworkErr) {
        console.warn('Backend unavailable, activating local session fallback:', err.message);
        const fallbackUser = {
          id: 'demo-user-new',
          name: name.trim(),
          email: email.trim(),
        };
        const fallbackToken = 'trippilot-offline-demo-token';

        localStorage.setItem('trippilot_token', fallbackToken);
        localStorage.setItem('trippilot_user', JSON.stringify(fallbackUser));

        setJourneyPlaying(true);
        setToken(fallbackToken);
        setUser(fallbackUser);
        return { token: fallbackToken, user: fallbackUser };
      }
      setJourneyPlaying(false);
      throw err;
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

