'use client';

import React, { useState, useEffect } from 'react';
import { useFiles } from '@/context/FileContext';
import { generateCode } from '@/ai/flows/ai-code-generation-flow';
import { aiCodeExplanationAndDebugging } from '@/ai/flows/ai-code-explanation-debugging-flow';
import { 
  Sparkles, 
  Bug, 
  RefreshCw, 
  ChevronRight, 
  Send, 
  History,
  AlertCircle,
  FileCheck,
  FolderOpen,
  Zap,
  Loader2,
  Clock,
  Wand2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { COMPLEXITY_LEVELS, FileNode } from '@/lib/types';
import { getCurrentApiKeyIndex, getApiKeyDisplayName, getTimeUntilNextRotation } from '@/lib/api-rotation';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

export const AIAssistant: React.FC = () => {
  const { nodes, activeWorkspaceId, workspaces, activeFileId, createNode, updateNode, deleteNode, renameNode, getNodePath } = useFiles();
  const [activeTab, setActiveTab] = useState('generate');
  
  // Generation state
  const [genPrompt, setGenPrompt] = useState('');
  const [complexity, setComplexity] = useState([1]); 
  const [isGenerating, setIsGenerating] = useState(false);

  // Debugging state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  // API Rotation state
  const [currentKeyIndex, setCurrentKeyIndex] = useState(getCurrentApiKeyIndex());
  const [timeToRotate, setTimeToRotate] = useState(getTimeUntilNextRotation());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentKeyIndex(getCurrentApiKeyIndex());
      setTimeToRotate(getTimeUntilNextRotation());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleGenerate = async () => {
    if (!genPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const level = COMPLEXITY_LEVELS[complexity[0]].id;
      
      // Build workspace context for AI
      const currentWorkspace = workspaces.find(w => w.id === activeWorkspaceId);
      const workspaceContext = currentWorkspace?.rootFileIds.map(rid => ({
        path: nodes[rid].name,
        type: nodes[rid].type,
        content: nodes[rid].content
      })) || [];

      const result = await generateCode({
        userPrompt: genPrompt,
        complexityLevel: level,
        programmingLanguage: nodes[activeFileId!]?.language || 'javascript',
        workspaceContext
      });
      
      // Apply operations returned by AI
      if (result.operations && result.operations.length > 0) {
        for (const op of result.operations) {
          if (op.type === 'createFile') {
            const id = createNode(null, op.path, 'file');
            if (op.content) updateNode(id, { content: op.content });
          } else if (op.type === 'createFolder') {
            createNode(null, op.path, 'folder');
          } else if (op.type === 'updateFile') {
            const node = Object.values(nodes).find(n => n.name === op.path);
            if (node) updateNode(node.id, { content: op.content });
          } else if (op.type === 'deleteFile') {
            const node = Object.values(nodes).find(n => n.name === op.path);
            if (node) deleteNode(node.id);
          } else if (op.type === 'renameFile') {
            const node = Object.values(nodes).find(n => n.name === op.path);
            if (node && op.newName) renameNode(node.id, op.newName);
          }
        }
        toast({ title: "Workspace Updated", description: "AI has performed workspace operations." });
      } else if (result.generatedCode) {
        // Fallback for simple code generation
        const id = createNode(null, `ai_generated_${Date.now().toString().slice(-4)}.js`, 'file');
        updateNode(id, { content: result.generatedCode });
        toast({ title: "File Created", description: "AI has generated a new file for you." });
      }

      setGenPrompt('');
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Failed to generate AI response.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnalyze = async () => {
    if (selectedIds.length === 0) return;
    setIsAnalyzing(true);
    try {
      const filesToAnalyze = selectedIds.map(id => ({
        fileName: nodes[id].name,
        fileContent: nodes[id].content || `(Folder: ${nodes[id].name})`
      }));
      
      const result = await aiCodeExplanationAndDebugging({ filesToAnalyze });
      setAnalysisResult(result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const currentWorkspace = workspaces.find(w => w.id === activeWorkspaceId);

  return (
    <div className="w-80 border-l bg-sidebar flex flex-col h-full shrink-0">
      <div className="p-4 border-b bg-sidebar/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-primary" />
            <h2 className="font-semibold text-sm">AI Assistant</h2>
          </div>
          <Badge variant="outline" className="text-[10px] h-5 border-primary/20 bg-primary/5 text-primary">
            2.5-FLASH
          </Badge>
        </div>

        <div className="p-2 rounded-lg bg-background border border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
              {getApiKeyDisplayName(currentKeyIndex)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock size={10} />
            <span className="text-[10px] font-mono">{timeToRotate}</span>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <div className="px-4 py-2 border-b bg-sidebar/30">
          <TabsList className="grid grid-cols-2 h-8">
            <TabsTrigger value="generate" className="text-[10px] uppercase font-bold tracking-wider">Automate</TabsTrigger>
            <TabsTrigger value="debug" className="text-[10px] uppercase font-bold tracking-wider">Debug</TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="flex-1 p-4">
          <TabsContent value="generate" className="mt-0 space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Prompt AI to Work</label>
              <Textarea 
                value={genPrompt}
                onChange={(e) => setGenPrompt(e.target.value)}
                placeholder="e.g. Create a folder named 'auth' and put a login.ts file inside it..."
                className="min-h-[120px] text-xs resize-none bg-background/50"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Complexity</label>
                <Badge variant="secondary" className="text-[10px] uppercase">{COMPLEXITY_LEVELS[complexity[0]].label}</Badge>
              </div>
              <Slider 
                value={complexity} 
                onValueChange={setComplexity} 
                max={2} 
                step={1} 
                className="px-1"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground px-1">
                <span>Simple</span>
                <span>Medium</span>
                <span>Complex</span>
              </div>
            </div>

            <Button 
              className="w-full gap-2 shadow-lg shadow-primary/20" 
              onClick={handleGenerate}
              disabled={isGenerating || !genPrompt.trim()}
            >
              {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
              Execute AI Tasks
            </Button>

            <div className="pt-4 border-t space-y-2">
               <h3 className="text-[10px] font-bold uppercase text-muted-foreground">AI Capabilities</h3>
               <ul className="text-[10px] space-y-1 text-muted-foreground">
                 <li>• Create/Delete Files & Folders</li>
                 <li>• Batch Refactor Workspace</li>
                 <li>• Rename Nodes</li>
                 <li>• Generate Complex Boilerplates</li>
               </ul>
            </div>
          </TabsContent>

          <TabsContent value="debug" className="mt-0 space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Select Context</label>
              <div className="space-y-1 max-h-48 overflow-y-auto pr-2">
                {currentWorkspace?.rootFileIds.map(rid => {
                  const node = nodes[rid];
                  if (!node) return null;
                  return (
                    <div 
                      key={node.id}
                      onClick={() => toggleSelection(node.id)}
                      className={cn(
                        "flex items-center gap-2 p-1.5 rounded cursor-pointer text-xs transition-colors",
                        selectedIds.includes(node.id) ? "bg-primary/10 text-primary border border-primary/20" : "hover:bg-muted"
                      )}
                    >
                      {node.type === 'folder' ? <FolderOpen size={14} /> : <FileCheck size={14} />}
                      <span className="truncate flex-1">{node.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <Button 
              variant="outline"
              className="w-full gap-2 border-primary text-primary hover:bg-primary/5" 
              onClick={handleAnalyze}
              disabled={isAnalyzing || selectedIds.length === 0}
            >
              {isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <Bug size={16} />}
              Debug Context
            </Button>

            {analysisResult && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="space-y-2">
                   <h3 className="text-xs font-bold uppercase flex items-center gap-2 text-foreground">
                     <AlertCircle size={14} className="text-amber-500" />
                     Explanation
                   </h3>
                   <div className="text-[11px] text-muted-foreground leading-relaxed bg-background/50 p-2 rounded border border-border">
                     {analysisResult.explanation}
                   </div>
                </div>

                <div className="space-y-2">
                   <h3 className="text-xs font-bold uppercase text-foreground">Potential Issues</h3>
                   <ul className="space-y-1">
                     {analysisResult.potentialIssues.map((issue: string, idx: number) => (
                       <li key={idx} className="text-[10px] bg-destructive/10 text-destructive-foreground p-2 rounded flex gap-2">
                         <span className="font-bold shrink-0">{idx + 1}.</span>
                         <span>{issue}</span>
                       </li>
                     ))}
                   </ul>
                </div>
              </div>
            )}
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
};
