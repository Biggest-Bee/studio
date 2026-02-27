'use client';

import React, { useState } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { FileProvider } from '@/context/FileContext';
import { Sidebar } from '@/components/Sidebar';
import { Editor } from '@/components/Editor';
import { AIAssistant } from '@/components/AIAssistant';
import { AuthScreen } from '@/components/AuthScreen';
import { Toaster } from '@/components/ui/toaster';
import { Loader2, PanelRightOpen, PanelRightClose } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const Dashboard: React.FC = () => {
  const [isAiOpen, setIsAiOpen] = useState(true);

  return (
    <FileProvider>
      <div className="flex h-screen bg-background overflow-hidden relative">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0 bg-background relative overflow-hidden h-full">
          <Editor />
          {/* AI Toggle Button */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "absolute top-1 right-2 z-50 h-8 w-8 text-muted-foreground hover:text-primary transition-all duration-300",
              isAiOpen ? "mr-0" : "mr-0"
            )}
            onClick={() => setIsAiOpen(!isAiOpen)}
          >
            {isAiOpen ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
          </Button>
        </main>
        <div 
          className={cn(
            "transition-all duration-300 ease-in-out border-l bg-sidebar overflow-hidden shrink-0",
            isAiOpen ? "w-80 opacity-100" : "w-0 opacity-0 pointer-events-none"
          )}
        >
          <AIAssistant />
        </div>
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

  return (
    <div className="min-h-screen overflow-y-auto bg-background selection:bg-primary/30">
      {user ? <Dashboard /> : <AuthScreen />}
      <Toaster />
    </div>
  );
};

export default function Home() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
