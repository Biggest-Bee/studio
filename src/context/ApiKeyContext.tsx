'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface ApiKeyContextType {
  apiKey: string | null;
  setApiKey: (key: string) => void;
  clearApiKey: () => void;
  isLoaded: boolean;
}

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);
const API_KEY_STORAGE_KEY = 'gemini_api_key';

const normalizeApiKey = (value: string) => value.trim();

export const ApiKeyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const sessionKey = sessionStorage.getItem(API_KEY_STORAGE_KEY);
      if (sessionKey) {
        setApiKeyState(normalizeApiKey(sessionKey));
      }
      // Defense-in-depth: remove any legacy localStorage copy without reading it into memory.
      localStorage.removeItem(API_KEY_STORAGE_KEY);
    } catch (e) {
      console.error('Failed to load API key from storage:', e);
    }
    setIsLoaded(true);
  }, []);

  const setApiKey = (key: string) => {
    const trimmed = normalizeApiKey(key);
    setApiKeyState(trimmed);
    try {
      sessionStorage.setItem(API_KEY_STORAGE_KEY, trimmed);
      localStorage.removeItem(API_KEY_STORAGE_KEY);
    } catch (e) {
      console.error('Failed to save API key to storage:', e);
    }
  };

  const clearApiKey = () => {
    setApiKeyState(null);
    try {
      sessionStorage.removeItem(API_KEY_STORAGE_KEY);
      localStorage.removeItem(API_KEY_STORAGE_KEY);
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
