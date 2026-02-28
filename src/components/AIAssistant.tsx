'use client';

import React, { useState, useEffect } from 'react';
import { useFiles } from '@/context/FileContext';
import { generateCode } from '@/ai/flows/ai-code-generation-flow';
import { aiCodeExplanationAndDebugging } from '@/ai/flows/ai-code-explanation-debugging-flow';
import { 
  Sparkles, 
  Bug, 
  History,
  AlertCircle,
  FileCheck,
  FolderOpen,
  Zap,
  Loader2,
  Clock,
  Wand2,
  FilePlus,
  FolderPlus,
  Move
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { COMPLEXITY_LEVELS } from '@/lib/types';
import { getCurrentApiKeyIndex, getApiKeyDisplayName, getTimeUntilNextRotation } from '@/lib/api-rotation';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

export const AIAssistant: React.FC = () => {
  const { 
    nodes, 
    activeWorkspaceId, 
    workspaces, 
    activeFileId, 
    createNode, 
    updateNode, 
    deleteNode, 
    renameNode, 
    moveNode,
    getNodePath 
  } = useFiles();
  
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

  const findNodeByPath = (path: string) => {
    if (path === '/' || path === '') return null;
    const normalizedPath = path.replace(/^\//, '');
    return Object.values(nodes).find(n => getNodePath(n.id) === normalizedPath);
  };

  const handleGenerate = async () => {
    if (!genPrompt.trim()) return;
    if (!activeWorkspaceId) {
      toast({ title: "No Workspace", description: "Select a workspace first.", variant: "destructive" });
      return;
    }
    
    setIsGenerating(true);
    try {
      const level = COMPLEXITY_LEVELS[complexity[0]].id;
      
      // Build full hierarchical workspace context for AI
      const currentWorkspace = workspaces.find(w => w.id === activeWorkspaceId);
      const buildContext = (nodeIds: string[]): any[] => {
        let ctx: any[] = [];
        nodeIds.forEach(id => {
          const node = nodes[id];
          if (!node) return;
          ctx.push({
            path: getNodePath(id),
            type: node.type,
            content: node.content || '',
            children: node.children ? node.children.map(cid => getNodePath(cid)) : []
          });
          if (node.children) {
            ctx = [...ctx, ...buildContext(node.children)];
          }
        });
        return ctx;
      };

      const workspaceContext = buildContext(currentWorkspace?.rootFileIds || []);

      const result = await generateCode({
        userPrompt: genPrompt,
        complexityLevel: level,
        programmingLanguage: activeFileId && nodes[activeFileId] ? nodes[activeFileId].language || 'javascript' : 'javascript',
        workspaceContext
      });
      
      // Apply operations returned by AI
      if (result.operations && result.operations.length > 0) {
        for (const op of result.operations) {
          const pathParts = op.path.split('/');
          const name = pathParts.pop() || '';
          const parentPath = pathParts.join('/');
          const parentNode = findNodeByPath(parentPath);
          const parentId = parentNode?.id || null;

          if (op.type === 'createFile') {
            const id = createNode(parentId, name, 'file');
            if (op.content) updateNode(id, { content: op.content });
          } else if (op.type === 'createFolder') {
            createNode(parentId, name, 'folder');
          } else if (op.type === 'updateFile') {
            const node = findNodeByPath(op.path);
            if (node) updateNode(node.id, { content: op.content });
          } else if (op.type === 'deleteFile') {
            const node = findNodeByPath(op.path);
            if (node) deleteNode(node.id);
          } else if (op.type === 'renameFile') {
            const node = findNodeByPath(op.path);
            if (node && op.newName) renameNode(node.id, op.newName);
          } else if (op.type === 'moveNode') {
            const node = findNodeByPath(op.path);
            const destNode = findNodeByPath(op.destinationPath || '');
            if (node) moveNode(node.id, destNode?.id || null);
          }
        }
        toast({ title: "AI Operations Complete", description: result.explanation });
      } else if (result.generatedCode) {
        // Fallback for simple code generation
        const id = createNode(null, `ai_generated_${Date.now().toString().slice(-4)}.js`, 'file');
        updateNode(id, { content: result.generatedCode });
        toast({ title: "Code Generated", description: result.explanation });
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
        fileName: nodes[id]?.name || 'unknown',
        fileContent: nodes[id]?.content || `(Folder: ${nodes[id]?.name})`
      }));
      
      const result = await aiCodeExplanationAndDebugging({ filesToAnalyze });
      setAnalysisResult(result);
    } catch (e) {
      console.error(e);
      toast({ title: "Analysis Failed", description: "Could not analyze the selected context.", variant: "destructive" });
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
    <div className="flex flex-col h-full w-full">
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

        <ScrollArea className="flex-1">
          <div className="p-4">
            <TabsContent value="generate" className="mt-0 space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">AI Workflow Engine</label>
                <Textarea 
                  value={genPrompt}
                  onChange={(e) => setGenPrompt(e.target.value)}
                  placeholder="e.g. Move the 'auth' folder into 'src' and create a 'utils' folder next to it..."
                  className="min-h-[120px] text-xs resize-none bg-background/50 border-border"
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
                Execute Workspace Ops
              </Button>

              <div className="pt-4 border-t border-border space-y-2">
                 <h3 className="text-[10px] font-bold uppercase text-muted-foreground">Advanced Capabilities</h3>
                 <div className="grid grid-cols-2 gap-2 mt-2">
                   <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground bg-secondary/30 p-1.5 rounded">
                     <FolderPlus size={10} className="text-primary" /> Nested Creation
                   </div>
                   <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground bg-secondary/30 p-1.5 rounded">
                     <Move size={10} className="text-primary" /> Bulk Move
                   </div>
                   <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground bg-secondary/30 p-1.5 rounded">
                     <Zap size={10} className="text-primary" /> Workspace Tree Sync
                   </div>
                   <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground bg-secondary/30 p-1.5 rounded">
                     <History size={10} className="text-primary" /> Batch Refactor
                   </div>
                 </div>
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
                         <li key={idx} className="text-[10px] bg-destructive/10 text-destructive-foreground p-2 rounded flex gap-2 border border-destructive/20">
                           <span className="font-bold shrink-0">{idx + 1}.</span>
                           <span>{issue}</span>
                         </li>
                       ))}
                     </ul>
                  </div>
                </div>
              )}
            </TabsContent>
          </div>
        </ScrollArea>
      </Tabs>
    </div>
  );
};
