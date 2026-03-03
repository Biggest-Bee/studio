'use client';

import React, { useState } from 'react';
import { useApiKey } from '@/context/ApiKeyContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Check, Copy } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export const ApiKeySettings: React.FC = () => {
  const { apiKey, setApiKey, clearApiKey } = useApiKey();
  const [inputValue, setInputValue] = useState(apiKey || '');
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    if (!inputValue.trim()) {
      toast({ title: 'Error', description: 'Please enter an API key', variant: 'destructive' });
      return;
    }
    setApiKey(inputValue);
    setIsSaved(true);
    toast({ title: 'Success', description: 'API key saved successfully' });
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleClear = () => {
    clearApiKey();
    setInputValue('');
    toast({ title: 'Cleared', description: 'API key removed' });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inputValue);
    toast({ title: 'Copied', description: 'API key copied to clipboard' });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle size={18} className="text-primary" />
          Gemini API Key
        </CardTitle>
        <CardDescription>
          Enter your API key from{' '}
          <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            Google AI Studio
          </a>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="api-key" className="text-xs font-bold uppercase text-muted-foreground">
            API Key
          </Label>
          <div className="flex gap-2">
            <Input
              id="api-key"
              type="password"
              placeholder="Enter your Gemini API key..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="flex-1 bg-background/50 border-border focus:ring-primary"
            />
            <Button
              size="icon"
              variant="outline"
              onClick={copyToClipboard}
              className="shrink-0"
              title="Copy to clipboard"
            >
              <Copy size={16} />
            </Button>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleSave}
            className={isSaved ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
            disabled={!inputValue.trim()}
          >
            {isSaved ? (
              <>
                <Check size={16} className="mr-2" />
                Saved
              </>
            ) : (
              'Save Key'
            )}
          </Button>
          {apiKey && (
            <Button variant="destructive" onClick={handleClear}>
              Clear
            </Button>
          )}
        </div>

        {apiKey && (
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded text-xs text-emerald-700 flex items-center gap-2">
            <Check size={14} />
            API key configured
          </div>
        )}
      </CardContent>
    </Card>
  );
};
