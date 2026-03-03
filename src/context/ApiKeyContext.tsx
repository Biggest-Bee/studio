'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface ApiKeyContextType {
  apiKey: string | null;
  setApiKey: (key: string) => void;
  clearApiKey: () => void;
  isLoaded: boolean;
}

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

export const ApiKeyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('gemini_api_key');
      if (saved) {
        setApiKeyState(saved);
      }
    } catch (e) {
      console.error('Failed to load API key from storage:', e);
    }
    setIsLoaded(true);
  }, []);

  const setApiKey = (key: string) => {
    const trimmed = key.trim();
    setApiKeyState(trimmed);
    try {
      localStorage.setItem('gemini_api_key', trimmed);
    } catch (e) {
      console.error('Failed to save API key to storage:', e);
    }
  };

  const clearApiKey = () => {
    setApiKeyState(null);
    try {
      localStorage.removeItem('gemini_api_key');
    } catch (e) {
      console.error('Failed to clear API key from storage:', e);
    }
  };

  return (
    <ApiKeyContext.Provider value={{ apiKey, setApiKey, clearApiKey, isLoaded }}>
      {children}
    </ApiKeyContext.Provider>
  );
};

export const useApiKey = () => {
  const context = useContext(ApiKeyContext);
  if (!context) throw new Error('useApiKey must be used within ApiKeyProvider');
  return context;
};
