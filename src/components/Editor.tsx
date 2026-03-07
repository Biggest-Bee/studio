'use client';

import React from 'react';
import { useFiles } from '@/context/FileContext';
import { FileCode, Save, Terminal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LANGUAGES } from '@/lib/types';
import { cn } from '@/lib/utils';
import { updateFileNameExtension } from '@/lib/language-file';

export const Editor: React.FC = () => {
  const { activeFileId, openFileIds, nodes, updateNode, setActiveFile, closeFile } = useFiles();
  const file = activeFileId ? nodes[activeFileId] : null;

  const handleLanguageChange = (language: string) => {
    if (!file) return;
    updateNode(file.id, {
      language,
      name: updateFileNameExtension(file.name, language),
    });
  };

  if (!file) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground bg-background">
        <Terminal size={48} className="mb-4 opacity-20" />
        <p className="text-sm">Select a file from the explorer to begin</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background h-full overflow-hidden">
      {/* File Header */}
      <div className="border-b px-3 py-2 sm:px-4 sm:py-0 sm:h-10 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between bg-sidebar/30">
        <div className="flex items-center gap-2 min-w-0">
          <FileCode size={16} className="text-primary" />
          <span className="text-sm font-medium truncate">{file.name}</span>
          <Badge variant="secondary" className="text-[10px] h-4 px-1 ml-2 font-mono uppercase">
            {file.language || 'text'}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground font-bold uppercase">Language</span>
            <Select 
              value={file.language} 
              onValueChange={handleLanguageChange}
            >
              <SelectTrigger className="h-7 text-xs w-28 sm:w-32 bg-background border-none ring-1 ring-border">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {LANGUAGES.map(lang => (
                  <SelectItem key={lang} value={lang} className="text-xs">
                    {lang.charAt(0).toUpperCase() + lang.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10 shrink-0">
            <Save size={16} />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="h-10 border-b bg-sidebar/20 px-2 flex items-center gap-1 overflow-x-auto">
        {openFileIds.filter((id) => nodes[id]?.type === 'file').map((id) => {
          const openFile = nodes[id];
          if (!openFile) return null;
          const isActiveTab = id === activeFileId;

          return (
            <div
              key={id}
              className={cn(
                "h-7 max-w-[220px] shrink-0 rounded-md border px-2 flex items-center gap-2 text-xs",
                isActiveTab
                  ? "bg-background border-primary/40 text-primary"
                  : "bg-background/70 border-border text-muted-foreground"
              )}
            >
              <button
                type="button"
                className="truncate text-left flex-1"
                onClick={() => setActiveFile(id)}
                title={openFile.name}
              >
                {openFile.name}
              </button>
              <button
                type="button"
                className="opacity-70 hover:opacity-100"
                onClick={() => closeFile(id)}
                aria-label={`Close ${openFile.name}`}
              >
                <X size={12} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Editor Body */}
      <div className="flex-1 flex overflow-hidden">
        <div className="hidden sm:flex w-12 border-r bg-sidebar/20 flex-col items-center py-4 text-muted-foreground text-[10px] font-mono select-none">
          {Array.from({ length: 40 }).map((_, i) => (
            <div key={i} className="h-6 flex items-center">{i + 1}</div>
          ))}
        </div>
        <div className="flex-1 h-full relative">
          <Textarea 
            className="w-full h-full p-4 font-code text-sm bg-transparent border-none focus-visible:ring-0 resize-none leading-relaxed"
            value={file.content}
            onChange={(e) => updateNode(file.id, { content: e.target.value })}
            placeholder="// Start writing your code here..."
            spellCheck={false}
          />
        </div>
      </div>

      {/* Footer Info */}
      <div className="h-6 border-t px-4 flex items-center justify-between bg-sidebar/50 text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
        <div className="flex items-center gap-4">
          <span>LF</span>
          <span>UTF-8</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Ln 1, Col 1</span>
          <span>Spaces: 2</span>
        </div>
      </div>
    </div>
  );
};
