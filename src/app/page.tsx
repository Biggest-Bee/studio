'use client';

import React, { useState } from 'react';
import { FileProvider } from '@/context/FileContext';
import { ApiKeyProvider } from '@/context/ApiKeyContext';
import { Sidebar } from '@/components/Sidebar';
import { Editor } from '@/components/Editor';
import { AIAssistant } from '@/components/AIAssistant';
import { Toaster } from '@/components/ui/toaster';
import { Menu, PanelRightOpen, PanelRightClose, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ApiKeySettings } from '@/components/ApiKeySettings';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

const Dashboard: React.FC = () => {
  const [isAiOpen, setIsAiOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFilesOpen, setIsFilesOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <ApiKeyProvider>
      <FileProvider>
        <div className="flex h-screen bg-background overflow-hidden relative">
          {!isMobile && <Sidebar />}
          <main className="flex-1 flex flex-col min-w-0 bg-background relative overflow-hidden h-full">
            <div className="border-b bg-background/95 px-3 py-2 sm:px-4">
              <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
                {isMobile && (
                  <Sheet open={isFilesOpen} onOpenChange={setIsFilesOpen}>
                    <SheetTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary transition-all duration-300"
                        title="Open Files"
                      >
                        <Menu size={18} />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-[90vw] max-w-xs p-0">
                      <SheetHeader className="sr-only">
                        <SheetTitle>Files</SheetTitle>
                        <SheetDescription>Browse workspaces and files</SheetDescription>
                      </SheetHeader>
                      <Sidebar className="w-full border-r-0" onFileOpen={() => setIsFilesOpen(false)} />
                    </SheetContent>
                  </Sheet>
                )}
                <Sheet open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                  <SheetTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-primary transition-all duration-300"
                      title="Settings"
                    >
                      <Settings size={18} />
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="w-full sm:w-96">
                    <SheetHeader>
                      <SheetTitle>Settings</SheetTitle>
                      <SheetDescription>
                        Configure your API keys and preferences
                      </SheetDescription>
                    </SheetHeader>
                    <div className="mt-6">
                      <ApiKeySettings />
                    </div>
                  </SheetContent>
                </Sheet>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-8 w-8 text-muted-foreground hover:text-primary transition-all duration-300"
                  )}
                  onClick={() => setIsAiOpen(!isAiOpen)}
                  title={isAiOpen ? "Close AI Assistant" : "Open AI Assistant"}
                >
                  {isAiOpen ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <Editor />
            </div>
          </main>
          <div 
            className={cn(
              "transition-all duration-300 ease-in-out border-l bg-sidebar overflow-hidden shrink-0",
              isAiOpen ? (isMobile ? "w-[85vw] max-w-80 opacity-100" : "w-80 opacity-100") : "w-0 opacity-0 pointer-events-none"
            )}
          >
            <AIAssistant />
          </div>
        </div>
      </FileProvider>
    </ApiKeyProvider>
  );
};

export default function Home() {
  return (
    <div className="min-h-screen overflow-y-auto bg-background selection:bg-primary/30">
      <Dashboard />
      <Toaster />
    </div>
  );
}
