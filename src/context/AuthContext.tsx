'use client';

import React, { createContext, useContext } from 'react';
import { UserSession } from '@/lib/types';

interface AuthContextType {
  user: UserSession | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // No authentication - always provide empty context
  return (
    <AuthContext.Provider value={{ user: null, isLoading: false }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
