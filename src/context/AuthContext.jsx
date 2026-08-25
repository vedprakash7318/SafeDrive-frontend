import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('safe_drive_user_token') || '');
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('safe_drive_user_data') || 'null');
    } catch {
      return null;
    }
  });

  const login = (newToken, newUser) => {
    localStorage.setItem('safe_drive_user_token', newToken);
    localStorage.setItem('safe_drive_user_data', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('safe_drive_user_token');
    localStorage.removeItem('safe_drive_user_data');
    setToken('');
    setUser(null);
  };

  useEffect(() => {
    const syncAuth = () => {
      const storedToken = localStorage.getItem('safe_drive_user_token') || '';
      setToken(storedToken);
      try {
        setUser(JSON.parse(localStorage.getItem('safe_drive_user_data') || 'null'));
      } catch {
        setUser(null);
      }
    };

    window.addEventListener('storage', syncAuth);
    return () => window.removeEventListener('storage', syncAuth);
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isLoggedIn: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
