'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserSession } from '@/lib/types';

interface AuthContextType {
  user: UserSession | null;
  login: (email: string, password: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('syntaxforge_user');
    if (saved) {
      setUser(JSON.parse(saved));
    }
    setIsLoading(false);
  }, []);

  const login = (email: string, password: string) => {
    // In a real app, you would validate the password here.
    // For this prototype, we'll accept any password.
    const newUser = {
      id: Math.random().toString(36).substr(2, 9),
      email,
      username: email.split('@')[0]
    };
    setUser(newUser);
    localStorage.setItem('syntaxforge_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('syntaxforge_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
