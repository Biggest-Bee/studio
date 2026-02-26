'use client';

import React from 'react';
import { useFiles } from '@/context/FileContext';
import { FileCode, Save, Terminal } from 'lucide-react';
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

export const Editor: React.FC = () => {
  const { activeFileId, nodes, updateNode } = useFiles();
  const file = activeFileId ? nodes[activeFileId] : null;

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
      {/* Tab Header */}
      <div className="h-10 border-b flex items-center px-4 justify-between bg-sidebar/30">
        <div className="flex items-center gap-2">
          <FileCode size={16} className="text-primary" />
          <span className="text-sm font-medium">{file.name}</span>
          <Badge variant="secondary" className="text-[10px] h-4 px-1 ml-2 font-mono uppercase">
            {file.language || 'text'}
          </Badge>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground font-bold uppercase">Language</span>
            <Select 
              value={file.language} 
              onValueChange={(val) => updateNode(file.id, { language: val })}
            >
              <SelectTrigger className="h-7 text-xs w-28 bg-background border-none ring-1 ring-border">
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
          <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10">
            <Save size={16} />
          </Button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex-1 flex overflow-hidden">
        <div className="w-12 border-r bg-sidebar/20 flex flex-col items-center py-4 text-muted-foreground text-[10px] font-mono select-none">
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
