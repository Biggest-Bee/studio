'use client';

import React from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { FileProvider } from '@/context/FileContext';
import { Sidebar } from '@/components/Sidebar';
import { Editor } from '@/components/Editor';
import { AIAssistant } from '@/components/AIAssistant';
import { AuthScreen } from '@/components/AuthScreen';
import { Loader2 } from 'lucide-react';

const Dashboard: React.FC = () => {
  return (
    <FileProvider>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0">
          <Editor />
        </main>
        <AIAssistant />
      </div>
    </FileProvider>
  );
};

const AppShell: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return user ? <Dashboard /> : <AuthScreen />;
};

export default function Home() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
